const { v4: uuidv4 } = require('uuid');
const { SECTOR_TEMPLATES, VN_110_FACILITIES_LIST } = require('./sectors');
const { OrderBook } = require('./orderBook');

class Simulation {
  constructor() {
    this.id = 'default_sim';
    this.name = 'Vietnam ETS Simulation Exchange (110 Facilities)';
    this.createdAt = Date.now();

    // Simulation Clock & Phase
    this.phase = 'SETUP'; // 'SETUP' | 'TRADING' | 'COMPLIANCE' | 'COMPLETED'
    this.isPaused = false;
    this.currentPeriod = 1;
    this.totalPeriods = 3; // 2025-2026, 2027-2028, 2029-2030 (Pilot Phase 2025-2030)
    this.periodDuration = 600; // Default 10 minutes (600 seconds) per compliance period (configurable)
    this.timeRemaining = 600;
    this.timerInterval = null;

    // Period specific live tracking buffers & reports
    this.periodTradingStats = { allowanceTrades: [], offsetTrades: [] };
    this.periodAbatementStats = { implementedProjects: [] };
    this.lastPeriodSettlement = null;
    this.grandPilotSummary = null;

    // Parameters calibrated for Vietnam ETS Pilot:
    // 110 Covered Facilities, ~10M tCO2e Cap, Allowance Price ~$5.00 USD
    this.parameters = {
      presetName: 'vietnam_ets_110',
      startYear: 2025,
      periodLengthYears: 2, // 2-year compliance cycle
      
      // Dynamic Facility Sizing & Cap Stringency
      activeFacilityCount: 110,
      capStringencyRatio: 98, // Cap as % of Actual Emissions (e.g. 98% = slight scarcity)
      capCalculationMode: 'PERCENT_OF_EMISSIONS', // 'PERCENT_OF_EMISSIONS' | 'PERCENT_OF_BASELINE' | 'CUSTOM'
      totalCap: 10500000, // Total cap for covered facilities
      
      // Correction Factor K (+4.0% per 2-year cycle for economic growth)
      correctionFactor: 4.0,

      // Enterprise Emissions Growth Factor (Reflecting Vietnam as a Developing Nation)
      enterpriseEmissionGrowthEnabled: true,
      enterpriseEmissionGrowthRate: 3.5, // % per compliance period (~1.7%/year)
      enterpriseEmissionGrowthMode: 'SECTOR_BASED', // 'SECTOR_BASED' | 'UNIFORM'
      
      // 100% Free Allocation
      freeAllocationRate: 100,
      
      // 0% Auction in pilot
      auctionShare: 0,
      auctionReservePrice: 4.00,
      
      // 30% Domestic Carbon Offset Limit (Decree 06)
      offsetUsageLimit: 30,
      offsetMarketSupply: 500000,
      offsetPrice: 3.00, // Baseline domestic offset price ($/tCO2e)
      
      // Flexibility
      bankingAllowed: true,
      bankingLimit: 100,
      borrowingAllowed: true,
      borrowingLimit: 15,
      borrowingInterestRate: 1.00, // Default 1.0 (hệ số lãi phạt khi vay = 1.0, không tính thêm lãi)
      
      // Enforcement & Price Corridor (~$5 Allowance Regime)
      penaltyRate: 12.00, // Shortfall penalty fine ($12/tCO2e)
      marketPriceFloor: 1.50, // Floor collar
      marketPriceCeiling: 15.00, // Ceiling collar
      
      // Simulated Market Liquidity Bots & Market Making (targeting ~95% compliance)
      botsEnabled: true,
      botCount: 8,
      botComplianceTarget: 95,
      botPriceTrend: 'NEUTRAL', // 'NEUTRAL' | 'BULLISH' | 'BEARISH'
      botPriceIntensity: 50, // 10 to 100 (%)
      botEndPeriodScarcity: true, // Simulate late-period scarcity squeeze
      botStrategyMix: 'DIVERSE' // 'DIVERSE' | 'ABATEMENT' | 'ALLOWANCE' | 'OFFSET'
    };

    // Market Exchanges (Allowances ~$5.00, Offsets ~$3.00)
    this.allowanceBook = new OrderBook('ALLOWANCE');
    this.offsetBook = new OrderBook('OFFSET');

    // Covered Facilities
    this.facilities = {};
    
    // Primary Auction State
    this.auction = {
      active: false,
      period: 1,
      totalOffered: 0,
      reservePrice: 4.00,
      timeRemaining: 0,
      bids: [],
      results: null
    };

    this.logs = [];
    this.history = [];
    this.otcProposals = [];

    // Initialize facilities with diverse compliance situations
    this.initializeFacilities(this.parameters.activeFacilityCount);
    // Seed markets
    this.seedAllowanceMarket();
    this.seedOffsetMarket();
  }

  getPeriodYears(period = this.currentPeriod) {
    const start = (this.parameters.startYear || 2025) + (period - 1) * (this.parameters.periodLengthYears || 2);
    const end = start + (this.parameters.periodLengthYears || 2) - 1;
    return `${start}–${end}`;
  }

  log(category, message, details = {}) {
    const entry = {
      id: uuidv4(),
      timestamp: Date.now(),
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod),
      category,
      message,
      details
    };
    this.logs.unshift(entry);
    if (this.logs.length > 250) this.logs.pop();
    return entry;
  }

  // Select a balanced cohort of facilities across Power, Cement, Steel
  // and across ADVANCED (Surplus), LEGACY (Deficit), and STANDARD (Parity)
  getBalancedFacilitiesSubset(targetCount = 110) {
    const totalAvailable = VN_110_FACILITIES_LIST.length; // 110
    const count = Math.max(5, Math.min(totalAvailable, Number(targetCount) || 110));

    if (count >= totalAvailable) {
      return [...VN_110_FACILITIES_LIST];
    }

    // Interleave each sector's plants by alternating [ADVANCED, LEGACY, STANDARD...]
    const interleaveSector = (sectorKey) => {
      const allSector = VN_110_FACILITIES_LIST.filter(f => f.sector === sectorKey);
      const adv = allSector.filter(f => f.techTier === 'ADVANCED');
      const leg = allSector.filter(f => f.techTier === 'LEGACY');
      const std = allSector.filter(f => f.techTier === 'STANDARD');
      const result = [];
      const maxLen = Math.max(adv.length, leg.length, std.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < leg.length) result.push(leg[i]);
        if (i < adv.length) result.push(adv[i]);
        if (i < std.length) result.push(std[i]);
      }
      return result;
    };

    const powerList = interleaveSector('power');
    const cementList = interleaveSector('cement');
    const steelList = interleaveSector('steel');

    const numPower = Math.max(1, Math.round(count * 0.35));
    const numSteel = Math.max(1, Math.round(count * 0.25));
    const numCement = count - numPower - numSteel;

    const selected = [
      ...powerList.slice(0, numPower),
      ...cementList.slice(0, numCement),
      ...steelList.slice(0, numSteel)
    ];

    // Ensure vn_pow_01 (player default) is included
    if (!selected.some(f => f.id === 'vn_pow_01') && VN_110_FACILITIES_LIST[0]) {
      selected[0] = VN_110_FACILITIES_LIST[0];
    }

    return selected;
  }

  // Pre-populate designated Vietnamese pilot facilities with diverse compliance situations
  initializeFacilities(targetCount = 110) {
    const selectedList = this.getBalancedFacilitiesSubset(targetCount);
    this.facilities = {};
    this.parameters.activeFacilityCount = selectedList.length;

    let totalBaseline = 0;
    let totalActual = 0;

    // First pass: compute baselines and actual emissions with tech diversity
    selectedList.forEach((item) => {
      const template = SECTOR_TEMPLATES[item.sector] || SECTOR_TEMPLATES.power;
      const baseline = item.baseline || template.defaultBaseline;
      const ratio = item.emissionRatio || (item.techTier === 'ADVANCED' ? 0.70 : item.techTier === 'LEGACY' ? 1.40 : 1.0);
      const actual = Math.round(baseline * ratio);

      totalBaseline += baseline;
      totalActual += actual;
    });

    // Determine system cap according to actual emission setting
    const stringency = (this.parameters.capStringencyRatio || 98) / 100;
    const computedCap = Math.round(totalActual * stringency);
    this.parameters.totalCap = computedCap;
    this.parameters.isImported = false;
    this.parameters.importedBaseCap = null;
    this.parameters.capCalculationMode = 'PERCENT_OF_EMISSIONS';

    const freeAllocationPool = Math.round(computedCap * (this.parameters.freeAllocationRate / 100));

    // Second pass: allocate free allowances and create facility state
    selectedList.forEach((item, index) => {
      const template = SECTOR_TEMPLATES[item.sector] || SECTOR_TEMPLATES.power;
      const baseline = item.baseline || template.defaultBaseline;
      const ratio = item.emissionRatio || (item.techTier === 'ADVANCED' ? 0.70 : item.techTier === 'LEGACY' ? 1.40 : 1.0);
      const actual = Math.round(baseline * ratio);

      // Facility share of total free allocation
      const facilityShare = totalBaseline > 0 ? baseline / totalBaseline : 1 / selectedList.length;
      const allocatedAllowances = Math.round(freeAllocationPool * facilityShare);

      const netBalance = allocatedAllowances - actual;
      const complianceStatus = netBalance > 1500 ? 'SURPLUS' : netBalance < -1500 ? 'DEFICIT' : 'BALANCED';

      const techList = template.technologies.map(t => ({
        ...t,
        implemented: false,
        implementedPeriod: null
      }));

      // Player defaults to first facility ('vn_pow_01'), all others can act as AI market makers or be claimed
      const isBot = index !== 0;

      // Multi-Pathway Compliance Strategy Archetypes for AI Bots
      // 1. ABATEMENT_FOCUS: Tuân thủ bằng áp dụng biện pháp giảm phát thải nội bộ (công nghệ MAC)
      // 2. OFFSET_FOCUS: Tuân thủ bằng mua tín chỉ các-bon bù trừ tối đa trần 30%
      // 3. ALLOWANCE_FOCUS: Tuân thủ bằng mua bán hạn ngạch tập trung trên sàn ETS
      // 4. HYBRID_BALANCED: Chiến lược kết hợp đa phương thức tối ưu hóa chi phí
      const strategyTypes = ['ABATEMENT_FOCUS', 'OFFSET_FOCUS', 'ALLOWANCE_FOCUS', 'HYBRID_BALANCED'];
      let complianceStrategy;
      if (item.techTier === 'ADVANCED') {
        complianceStrategy = index % 2 === 0 ? 'ABATEMENT_FOCUS' : 'HYBRID_BALANCED';
      } else if (item.techTier === 'LEGACY') {
        complianceStrategy = index % 3 === 0 ? 'OFFSET_FOCUS' : (index % 3 === 1 ? 'ALLOWANCE_FOCUS' : 'HYBRID_BALANCED');
      } else {
        complianceStrategy = strategyTypes[index % strategyTypes.length];
      }

      const strategyMeta = {
        ABATEMENT_FOCUS: { vi: 'Giảm phát thải', en: 'Abatement Focus' },
        OFFSET_FOCUS: { vi: 'Tín chỉ bù trừ', en: 'Offset Focus' },
        ALLOWANCE_FOCUS: { vi: 'Hạn ngạch ETS', en: 'Allowance Focus' },
        HYBRID_BALANCED: { vi: 'Kết hợp đa dạng', en: 'Hybrid Balanced' }
      }[complianceStrategy];

      this.facilities[item.id] = {
        id: item.id,
        name: item.name,
        sectorId: item.sector,
        sectorName: template.sectorType,
        sectorType: template.sectorType,
        icon: template.icon,
        isBot: isBot,
        socketId: null,
        online: true,

        // Compliance Strategy Archetype
        complianceStrategy: complianceStrategy,
        strategyLabelVi: strategyMeta.vi,
        strategyLabelEn: strategyMeta.en,

        // Technology & Compliance Characteristics
        techTier: item.techTier || 'STANDARD',
        techDesc: item.techDesc || 'Thiết bị tiêu chuẩn ngành',
        emissionRatio: item.emissionRatio || (item.techTier === 'ADVANCED' ? 0.70 : item.techTier === 'LEGACY' ? 1.40 : 1.0),
        complianceStatus: complianceStatus,
        initialNetBalance: netBalance,

        // Financials calibrated to $5 carbon price
        cash: template.startingCash,
        annualRevenue: template.annualRevenue,
        cumulativeProfit: 0,
        complianceCost: 0,
        cumulativeComplianceCost: 0,

        // Emissions & Allowances
        baselineEmissions: baseline,
        implementedAbatement: 0,
        actualEmissions: actual,
        allowances: allocatedAllowances,
        offsets: 0,
        allocatedAllowances: allocatedAllowances,

        // Banking & Borrowing & Deficit Debt
        bankedUnits: 0,
        borrowedUnits: 0,
        unpaidDeficitDebt: 0,
        currentBorrowingRequest: 0,

        // Decarbonization techs
        abatementTechnologies: techList,

        // Compliance Surrender
        surrender: {
          submitted: false,
          allowancesToSurrender: Math.min(allocatedAllowances, actual),
          offsetsToSurrender: 0,
          borrowingRequested: 0,
          deficit: Math.max(0, actual - allocatedAllowances),
          penaltyPaid: 0
        },

        complianceHistory: [],
        orders: [],
        trades: []
      };
    });
  }

  // Alias for backward compatibility
  initialize110Facilities() {
    this.initializeFacilities(110);
  }

  // Admin recalculates cap as a percentage of total actual emissions or imported allowances
  recalculateCapFromEmissions(stringencyRatio, redistribute = true) {
    const ratio = Math.max(50, Math.min(200, Number(stringencyRatio) || 100));
    const activeFacilities = Object.values(this.facilities);
    const totalActual = activeFacilities.reduce((sum, f) => sum + f.actualEmissions, 0);
    const totalBaseline = activeFacilities.reduce((sum, f) => sum + f.baselineEmissions, 0);

    let newCap;
    if (this.parameters.isImported && this.parameters.importedBaseCap > 0) {
      newCap = Math.round(this.parameters.importedBaseCap * (ratio / 100));
      this.parameters.totalCap = newCap;
      this.parameters.capStringencyRatio = ratio;
      this.parameters.capCalculationMode = 'PERCENT_OF_IMPORTED_CAP';
    } else {
      newCap = Math.round(totalActual * (ratio / 100));
      this.parameters.totalCap = newCap;
      this.parameters.capStringencyRatio = ratio;
      this.parameters.capCalculationMode = 'PERCENT_OF_EMISSIONS';
    }

    if (redistribute) {
      const freePool = Math.round(newCap * (this.parameters.freeAllocationRate / 100));
      activeFacilities.forEach(fac => {
        let newAlloc;
        if (this.parameters.isImported && fac.importedAllowance != null) {
          // Proportionally scale to the facility's imported allowance in the file!
          newAlloc = Math.round(fac.importedAllowance * (ratio / 100) * (this.parameters.freeAllocationRate / 100));
        } else {
          const share = totalBaseline > 0 ? fac.baselineEmissions / totalBaseline : 1 / activeFacilities.length;
          newAlloc = Math.round(freePool * share);
        }
        const banked = fac.bankedUnits || 0;
        fac.allocatedAllowances = newAlloc;
        fac.allowances = newAlloc + banked;

        const net = (fac.allowances + fac.offsets) - fac.actualEmissions;
        fac.complianceStatus = net > 1500 ? 'SURPLUS' : net < -1500 ? 'DEFICIT' : 'BALANCED';

        if (!fac.surrender.submitted) {
          fac.surrender.allowancesToSurrender = Math.min(fac.allowances, fac.actualEmissions);
          fac.surrender.deficit = Math.max(0, fac.actualEmissions - (fac.allowances + fac.offsets));
        }
      });
    }

    this.log('POLICY', this.parameters.isImported
      ? `Regulator adjusted Cap based on imported file: ${newCap.toLocaleString()} tCO2e (${ratio}% of base ${this.parameters.importedBaseCap.toLocaleString()} tCO2e)`
      : `Regulator adjusted Cap based on actual emissions: ${newCap.toLocaleString()} tCO2e (${ratio}% of actual ${totalActual.toLocaleString()} tCO2e)`, {
      ratio,
      newCap,
      totalActual,
      systemGap: newCap - totalActual
    });

    return {
      success: true,
      totalCap: newCap,
      capStringencyRatio: ratio,
      totalActualEmissions: totalActual,
      systemNetPosition: newCap - totalActual,
      isImported: this.parameters.isImported,
      importedBaseCap: this.parameters.importedBaseCap
    };
  }

  // Admin sets active facility count (from 5 to 110)
  setActiveFacilityCount(count, capRatio = null) {
    const num = Math.max(5, Math.min(VN_110_FACILITIES_LIST.length, Number(count) || 110));
    if (capRatio != null) {
      this.parameters.capStringencyRatio = Number(capRatio);
    }
    this.initializeFacilities(num);
    this.seedAllowanceMarket();
    this.seedOffsetMarket();
    this.log('POLICY', `Regulator reconfigured simulation to ${num} active facilities (Cap: ${this.parameters.totalCap.toLocaleString()} tCO2e)`);
    return {
      success: true,
      activeFacilityCount: num,
      totalCap: this.parameters.totalCap,
      totalFacilities: Object.keys(this.facilities).length
    };
  }

  // Import facilities custom configuration (from Excel / CSV upload)
  importFacilities(customFacilities = []) {
    if (!Array.isArray(customFacilities) || customFacilities.length === 0) {
      throw new Error('Imported facility list must be a non-empty array');
    }

    this.facilities = {};
    let totalCap = 0;
    let totalActual = 0;
    let totalBaseline = 0;

    customFacilities.forEach((item, index) => {
      const fid = item.id || `fac_imp_${String(index + 1).padStart(2, '0')}`;
      const name = item.name || `Facility ${String(index + 1).padStart(2, '0')}`;
      
      // Determine sector template
      let secKey = 'power';
      const sectorRaw = String(item.sector || item.sectorId || item.sectorType || '').toLowerCase();
      if (sectorRaw.includes('cement') || sectorRaw.includes('xi măng') || sectorRaw.includes('khoáng')) {
        secKey = 'cement';
      } else if (sectorRaw.includes('steel') || sectorRaw.includes('thép') || sectorRaw.includes('kim')) {
        secKey = 'steel';
      }
      const template = SECTOR_TEMPLATES[secKey] || SECTOR_TEMPLATES.power;

      const actualEmissions = Math.max(0, Math.floor(Number(item.actualEmissions ?? item.actual ?? item.emissions) || 0));
      const allowances = Math.max(0, Math.floor(Number(item.allowance ?? item.allowances ?? item.allocatedAllowances) || 0));
      const baseline = Math.max(actualEmissions, Math.floor(Number(item.baselineEmissions ?? item.baseline) || (allowances > 0 ? allowances : actualEmissions)));
      const cash = Math.max(0, Math.floor(Number(item.cash ?? item.startingCash) || template.startingCash));

      totalActual += actualEmissions;
      totalCap += allowances;
      totalBaseline += baseline;

      const netBalance = allowances - actualEmissions;
      const complianceStatus = netBalance > 1500 ? 'SURPLUS' : netBalance < -1500 ? 'DEFICIT' : 'BALANCED';
      
      // Determine tech tier from emission intensity or allowance balance
      let techTier = item.techTier;
      if (!techTier) {
        if (netBalance > 1500) techTier = 'ADVANCED';
        else if (netBalance < -1500) techTier = 'LEGACY';
        else techTier = 'STANDARD';
      }

      const techDesc = item.techDesc || (techTier === 'ADVANCED' 
        ? 'Dây chuyền hiện đại đạt hiệu suất năng lượng cao' 
        : techTier === 'LEGACY' 
        ? 'Dây chuyền cũ tiêu hao năng lượng và phát thải cao' 
        : 'Thiết bị tiêu chuẩn đạt định mức ngành');

      const techList = template.technologies.map(t => ({
        ...t,
        implemented: false,
        implementedPeriod: null
      }));

      // Player defaults to first facility
      const isBot = index !== 0;

      this.facilities[fid] = {
        id: fid,
        name: name,
        sectorId: secKey,
        sectorName: template.sectorType,
        sectorType: template.sectorType,
        icon: template.icon,
        isBot: isBot,
        socketId: null,
        online: true,

        // Technology & Compliance Characteristics
        techTier: techTier,
        techDesc: techDesc,
        emissionRatio: allowances > 0 ? actualEmissions / allowances : 1.0,
        complianceStatus: complianceStatus,
        initialNetBalance: netBalance,

        // Financials
        cash: cash,
        annualRevenue: template.annualRevenue,
        cumulativeProfit: 0,
        complianceCost: 0,
        cumulativeComplianceCost: 0,

        // Emissions & Allowances
        baselineEmissions: baseline,
        implementedAbatement: 0,
        actualEmissions: actualEmissions,
        allowances: allowances,
        offsets: 0,
        allocatedAllowances: allowances,
        importedAllowance: allowances,
        baseAllowance: allowances,
        importedActualEmissions: actualEmissions,

        // Banking & Borrowing & Deficit Debt
        bankedUnits: 0,
        borrowedUnits: 0,
        unpaidDeficitDebt: 0,
        currentBorrowingRequest: 0,

        // Decarbonization techs
        abatementTechnologies: techList,

        // Compliance Surrender
        surrender: {
          submitted: false,
          allowancesToSurrender: Math.min(allowances, actualEmissions),
          offsetsToSurrender: 0,
          borrowingRequested: 0,
          deficit: Math.max(0, actualEmissions - allowances),
          penaltyPaid: 0
        },

        complianceHistory: [],
        orders: [],
        trades: []
      };
    });

    this.parameters.activeFacilityCount = customFacilities.length;
    this.parameters.totalCap = totalCap;
    this.parameters.isImported = true;
    this.parameters.importedBaseCap = totalCap;
    this.parameters.baseCap = totalCap;
    this.parameters.importedActualEmissions = totalActual;
    this.parameters.capCalculationMode = 'PERCENT_OF_IMPORTED_CAP';
    this.parameters.capStringencyRatio = 100;

    // Synchronize periodCapRatios and periodCaps proportionally to imported allowances
    const pRatios = {};
    const pCaps = {};
    const totalP = this.totalPeriods || 3;
    for (let p = 1; p <= totalP; p++) {
      const r = p === 1 ? 100 : (this.parameters.periodCapRatios?.[p] ?? 100);
      pRatios[p] = r;
      pCaps[p] = Math.round(totalCap * (r / 100));
    }
    this.parameters.periodCapRatios = pRatios;
    this.parameters.periodCaps = pCaps;

    this.seedAllowanceMarket();
    this.seedOffsetMarket();

    this.log('POLICY', `Regulator imported ${customFacilities.length} facilities from Excel configuration. Total Cap: ${totalCap.toLocaleString()} tCO2e (100% of imported allowances), Actual: ${totalActual.toLocaleString()} tCO2e`);

    return {
      success: true,
      importedCount: customFacilities.length,
      totalCap: totalCap,
      importedBaseCap: totalCap,
      isImported: true,
      totalActualEmissions: totalActual,
      systemNetPosition: totalCap - totalActual,
      capStringencyRatio: 100,
      facilities: this.facilities,
      parameters: this.parameters
    };
  }

  // Seed initial allowance liquidity around ~$5.00 USD
  seedAllowanceMarket() {
    this.allowanceBook.reset(5.00);
    const surplusBots = Object.values(this.facilities || {}).filter(f => f.isBot && f.complianceStatus === 'SURPLUS');
    const deficitBots = Object.values(this.facilities || {}).filter(f => f.isBot && f.complianceStatus === 'DEFICIT');

    const askSteps = [4.98, 5.00, 5.02, 5.05, 5.10, 5.15];
    askSteps.forEach((price, idx) => {
      const seller = surplusBots[idx % Math.max(1, surplusBots.length)] || { id: 'VN_MARKET_MAKER_SURPLUS', name: 'Nhà máy Thặng dư Hạn ngạch (Market Maker)' };
      const qty = 30000 + (idx * 20000);
      try {
        this.allowanceBook.addOrder({
          facilityId: seller.id,
          facilityName: seller.name,
          side: 'SELL',
          type: 'LIMIT',
          price,
          quantity: qty
        });
      } catch (e) {}
    });

    const bidSteps = [4.95, 4.92, 4.90, 4.85, 4.80];
    bidSteps.forEach((price, idx) => {
      const buyer = deficitBots[idx % Math.max(1, deficitBots.length)] || { id: 'VN_MARKET_MAKER_DEFICIT', name: 'Nhà máy Thiếu hụt Hạn ngạch (Market Maker)' };
      const qty = 25000 + (idx * 15000);
      try {
        this.allowanceBook.addOrder({
          facilityId: buyer.id,
          facilityName: buyer.name,
          side: 'BUY',
          type: 'LIMIT',
          price,
          quantity: qty
        });
      } catch (e) {}
    });
  }

  // Seed initial offset pool on the market around ~$3.00 USD
  seedOffsetMarket() {
    this.offsetBook.reset(3.00);
    const offsetPrices = [2.60, 2.80, 3.00, 3.20, 3.50];
    offsetPrices.forEach((price, idx) => {
      this.offsetBook.addOrder({
        facilityId: 'SYSTEM_VN_OFFSET_REGISTRY',
        facilityName: 'Vietnam Carbon Credit Registry (VCM / Article 6)',
        side: 'SELL',
        type: 'LIMIT',
        price: price,
        quantity: 40000 + idx * 25000
      });
    });
  }

  // Create or join facility
  createFacility({ id, name, sectorId, isBot = false, socketId = null }) {
    const template = SECTOR_TEMPLATES[sectorId] || SECTOR_TEMPLATES.power;
    const fid = id || `vn_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const baseline = template.defaultBaseline;
    const freeAllowances = Math.round(baseline * (this.parameters.freeAllocationRate / 100));

    const techList = template.technologies.map(t => ({
      ...t,
      implemented: false,
      implementedPeriod: null
    }));

    const facility = {
      id: fid,
      name: name || `${template.sectorType} Plant`,
      sectorId: sectorId || 'power',
      sectorName: template.sectorType,
      sectorType: template.sectorType,
      icon: template.icon,
      isBot: isBot,
      socketId: socketId,
      online: true,
      complianceStrategy: 'HYBRID_BALANCED',
      strategyLabelVi: 'Kết hợp đa dạng',
      strategyLabelEn: 'Hybrid Balanced',

      cash: template.startingCash,
      annualRevenue: template.annualRevenue,
      cumulativeProfit: 0,
      complianceCost: 0,
      cumulativeComplianceCost: 0,

      baselineEmissions: baseline,
      implementedAbatement: 0,
      actualEmissions: baseline,
      allowances: freeAllowances,
      offsets: 0,
      allocatedAllowances: freeAllowances,

      bankedUnits: 0,
      borrowedUnits: 0,
      currentBorrowingRequest: 0,
      abatementTechnologies: techList,

      surrender: {
        submitted: false,
        allowancesToSurrender: freeAllowances,
        offsetsToSurrender: 0,
        borrowingRequested: 0,
        deficit: 0,
        penaltyPaid: 0
      },

      complianceHistory: []
    };

    this.facilities[fid] = facility;
    return facility;
  }

  updateParameters(newParams) {
    const oldParams = { ...this.parameters };
    this.parameters = {
      ...this.parameters,
      ...newParams
    };

    if (newParams.totalPeriods) this.totalPeriods = Number(newParams.totalPeriods);
    if (newParams.periodDuration != null) this.periodDuration = Number(newParams.periodDuration);

    // If activeFacilityCount changed, reconfigure active facilities pool
    if (newParams.activeFacilityCount != null && Number(newParams.activeFacilityCount) !== Object.keys(this.facilities).length) {
      this.setActiveFacilityCount(newParams.activeFacilityCount, newParams.capStringencyRatio);
    } else if (newParams.syncCapWithEmissions && newParams.capStringencyRatio != null) {
      this.recalculateCapFromEmissions(newParams.capStringencyRatio, true);
    }

    this.log('POLICY', 'ETS Policy parameters updated by Regulator (MONRE / Admin)', {
      changes: Object.keys(newParams).filter(k => newParams[k] !== oldParams[k])
    });

    return this.parameters;
  }

  implementAbatement(facilityId, techId) {
    const fac = this.facilities[facilityId];
    if (!fac) throw new Error('Facility not found');

    const tech = fac.abatementTechnologies.find(t => t.id === techId);
    if (!tech) throw new Error('Abatement project not found');
    if (tech.implemented) throw new Error('Project is already implemented');

    if (fac.cash < tech.capex) {
      throw new Error(`Insufficient capital. Required: $${tech.capex.toLocaleString()}, Available: $${fac.cash.toLocaleString()}`);
    }

    fac.cash -= tech.capex;
    fac.complianceCost = (fac.complianceCost || 0) + tech.capex;
    fac.cumulativeComplianceCost = (fac.cumulativeComplianceCost || 0) + tech.capex;
    tech.implemented = true;
    tech.implementedPeriod = this.currentPeriod;

    fac.implementedAbatement = fac.abatementTechnologies
      .filter(t => t.implemented)
      .reduce((sum, t) => sum + t.abatementTons, 0);

    fac.actualEmissions = Math.max(0, fac.baselineEmissions - fac.implementedAbatement);

    if (!fac.surrender.submitted) {
      fac.surrender.allowancesToSurrender = Math.min(fac.allowances, fac.actualEmissions);
    }

    if (!this.periodAbatementStats) {
      this.periodAbatementStats = { implementedProjects: [] };
    }
    this.periodAbatementStats.implementedProjects.push({
      facilityId,
      facilityName: fac.name,
      sector: fac.sectorType,
      techId: tech.id,
      techName: tech.name,
      capex: tech.capex,
      abatementTons: tech.abatementTons,
      annualOpexSavings: tech.annualOpexSavings || 0,
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod),
      timestamp: Date.now()
    });

    const techDisplayName = tech.nameVi ? `${tech.nameVi} (${tech.name})` : tech.name;
    this.log('ABATEMENT', `${fac.name} đã triển khai: ${techDisplayName} (-${tech.abatementTons.toLocaleString()} tCO2e)`, {
      facilityId,
      techId,
      capex: tech.capex,
      newActualEmissions: fac.actualEmissions
    });

    return { facility: fac, tech };
  }

  placeOrder({ facilityId, side, instrument = 'ALLOWANCE', type = 'LIMIT', price, quantity }) {
    const fac = this.facilities[facilityId];
    if (!fac) throw new Error('Facility not found');
    if (this.phase !== 'TRADING') throw new Error(`Trading is closed during phase: ${this.phase}`);
    if (this.isPaused) throw new Error('Trading is temporarily paused by the regulator.');

    price = Number(price);
    quantity = Math.floor(Number(quantity));

    if (isNaN(quantity) || quantity <= 0) {
      throw new Error('Order quantity must be positive');
    }

    if (type === 'LIMIT') {
      if (isNaN(price) || price <= 0) {
        throw new Error('Limit price must be greater than 0');
      }
      if (price < this.parameters.marketPriceFloor) {
        throw new Error(`Price cannot be below market floor price ($${this.parameters.marketPriceFloor})`);
      }
      if (price > this.parameters.marketPriceCeiling) {
        throw new Error(`Price exceeds market ceiling price ($${this.parameters.marketPriceCeiling})`);
      }
    }

    const book = instrument === 'ALLOWANCE' ? this.allowanceBook : this.offsetBook;

    if (side === 'BUY') {
      let estimatedCost = 0;
      if (type === 'MARKET') {
        let neededQty = quantity;
        for (const ask of book.asks) {
          if (neededQty <= 0) break;
          if (ask.facilityId === facilityId) continue;
          const fill = Math.min(neededQty, ask.remainingQuantity);
          estimatedCost += fill * ask.price;
          neededQty -= fill;
        }
        if (neededQty > 0) {
          const fallbackPrice = book.asks[0]?.price || book.lastPrice || (instrument === 'ALLOWANCE' ? 5.0 : 3.0);
          estimatedCost += neededQty * fallbackPrice;
        }
      } else {
        estimatedCost = price * quantity;
      }

      if (fac.cash < estimatedCost) {
        throw new Error(`Insufficient funds: Need $${Math.round(estimatedCost).toLocaleString()} but have $${Math.round(fac.cash).toLocaleString()}`);
      }
    } else if (side === 'SELL') {
      const availableUnits = instrument === 'ALLOWANCE' ? fac.allowances : fac.offsets;
      if (availableUnits < quantity) {
        throw new Error(`Insufficient ${instrument} inventory: Available ${availableUnits.toLocaleString()}, trying to sell ${quantity.toLocaleString()}`);
      }
    }

    const effectiveBenchmarkPrice = type === 'MARKET' ? (book.lastPrice || (instrument === 'ALLOWANCE' ? 5.0 : 3.0)) : price;

    const { order, executedTrades } = book.addOrder({
      facilityId,
      facilityName: fac.name,
      side,
      type,
      price: effectiveBenchmarkPrice,
      quantity
    });

    fac.orders = fac.orders || [];
    fac.orders.unshift({ ...order });
    if (fac.orders.length > 50) fac.orders.pop();

    for (const trade of executedTrades) {
      this.settleTrade(trade);
    }

    return { order, executedTrades };
  }

  cancelOrder({ facilityId, orderId, instrument = 'ALLOWANCE' }) {
    const book = instrument === 'ALLOWANCE' ? this.allowanceBook : this.offsetBook;
    const removedOrder = book.cancelOrder(orderId, facilityId);
    if (!removedOrder) {
      throw new Error('Order not found or already filled');
    }
    const fac = this.facilities[facilityId];
    if (fac && fac.orders) {
      const o = fac.orders.find(ord => ord.id === orderId);
      if (o) {
        o.status = 'CANCELLED';
        o.cancelledAt = Date.now();
      }
    }
    return removedOrder;
  }

  settleTrade(trade) {
    const buyer = this.facilities[trade.buyerFacilityId];
    const seller = this.facilities[trade.sellerFacilityId];

    if (buyer) {
      buyer.cash -= trade.totalCost;
      buyer.complianceCost = (buyer.complianceCost || 0) + trade.totalCost;
      buyer.cumulativeComplianceCost = (buyer.cumulativeComplianceCost || 0) + trade.totalCost;
      if (trade.instrument === 'ALLOWANCE') {
        buyer.allowances += trade.quantity;
      } else {
        buyer.offsets += trade.quantity;
      }
      if (buyer.orders) {
        const o = buyer.orders.find(ord => ord.id === trade.buyOrderId);
        if (o) {
          o.filledQuantity = (o.filledQuantity || 0) + trade.quantity;
          o.remainingQuantity = Math.max(0, (o.remainingQuantity || o.originalQuantity) - trade.quantity);
          if (o.remainingQuantity === 0) o.status = 'FILLED';
          else o.status = 'PARTIALLY_FILLED';
        }
      }
      buyer.trades = buyer.trades || [];
      buyer.trades.unshift({ ...trade, role: 'BUY' });
      if (buyer.trades.length > 50) buyer.trades.pop();
    }

    if (seller) {
      seller.cash += trade.totalCost;
      seller.complianceCost = (seller.complianceCost || 0) - trade.totalCost;
      seller.cumulativeComplianceCost = (seller.cumulativeComplianceCost || 0) - trade.totalCost;
      if (trade.instrument === 'ALLOWANCE') {
        seller.allowances = Math.max(0, (seller.allowances || 0) - trade.quantity);
      } else {
        seller.offsets = Math.max(0, (seller.offsets || 0) - trade.quantity);
      }
      if (seller.orders) {
        const o = seller.orders.find(ord => ord.id === trade.sellOrderId);
        if (o) {
          o.filledQuantity = (o.filledQuantity || 0) + trade.quantity;
          o.remainingQuantity = Math.max(0, (o.remainingQuantity || o.originalQuantity) - trade.quantity);
          if (o.remainingQuantity === 0) o.status = 'FILLED';
          else o.status = 'PARTIALLY_FILLED';
        }
      }
      seller.trades = seller.trades || [];
      seller.trades.unshift({ ...trade, role: 'SELL' });
      if (seller.trades.length > 50) seller.trades.pop();
    }

    // Buffer trade for period settlement summary
    if (!this.periodTradingStats) {
      this.periodTradingStats = { allowanceTrades: [], offsetTrades: [] };
    }
    const tradeRecord = {
      id: trade.id,
      timestamp: Date.now(),
      instrument: trade.instrument,
      price: trade.price,
      quantity: trade.quantity,
      totalCost: trade.totalCost,
      buyerFacilityId: trade.buyerFacilityId,
      buyerFacilityName: trade.buyerFacilityName,
      sellerFacilityId: trade.sellerFacilityId,
      sellerFacilityName: trade.sellerFacilityName,
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod)
    };
    if (trade.instrument === 'ALLOWANCE') {
      this.periodTradingStats.allowanceTrades.push(tradeRecord);
    } else {
      this.periodTradingStats.offsetTrades.push(tradeRecord);
    }

    this.log('TRADE', `Trade executed: ${trade.quantity.toLocaleString()} ${trade.instrument} @ $${trade.price} ($${trade.totalCost.toLocaleString()})`, {
      buyer: trade.buyerFacilityName,
      seller: trade.sellerFacilityName,
      tradeId: trade.id
    });
  }

  createDirectProposal({ fromFacilityId, toFacilityId, side, instrument = 'ALLOWANCE', price, quantity }) {
    if (this.phase !== 'TRADING') throw new Error(`Giao dịch đóng trong giai đoạn: ${this.phase}`);
    if (this.isPaused) throw new Error('Thị trường đang tạm dừng bởi cơ quan quản lý.');

    const fromFac = this.facilities[fromFacilityId];
    const toFac = this.facilities[toFacilityId];

    if (!fromFac) throw new Error('Doanh nghiệp khởi tạo đề xuất không tồn tại.');
    if (!toFac) throw new Error('Doanh nghiệp đối tác không tồn tại.');
    if (fromFacilityId === toFacilityId) throw new Error('Không thể tự gửi đề nghị thỏa thuận cho chính doanh nghiệp của mình.');

    price = Number(price);
    quantity = Math.floor(Number(quantity));

    if (isNaN(quantity) || quantity <= 0) throw new Error('Số lượng chuyển nhượng phải lớn hơn 0.');
    if (isNaN(price) || price <= 0) throw new Error('Đơn giá thỏa thuận phải lớn hơn 0.');

    const totalCost = Math.round(price * quantity * 100) / 100;

    const proposal = {
      id: 'otc_prop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
      fromFacilityId: fromFac.id,
      fromFacilityName: fromFac.name,
      toFacilityId: toFac.id,
      toFacilityName: toFac.name,
      side, // 'BUY' (fromFac đề nghị MUA từ toFac) | 'SELL' (fromFac đề nghị BÁN cho toFac)
      instrument,
      price,
      quantity,
      totalCost,
      status: 'PENDING',
      respondedAt: null
    };

    this.otcProposals = this.otcProposals || [];
    this.otcProposals.unshift(proposal);
    if (this.otcProposals.length > 200) this.otcProposals.pop();

    const instLabel = instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ';
    const actionLabel = side === 'BUY' ? 'mua' : 'bán';
    this.log('OTC_PROPOSAL', `[Đề nghị thỏa thuận] ${fromFac.name} gửi đề nghị ${actionLabel} ${quantity.toLocaleString()} ${instLabel} tới ${toFac.name} @ $${price}/t (Tổng: $${totalCost.toLocaleString()})`, {
      from: fromFac.name,
      to: toFac.name,
      proposalId: proposal.id
    });

    // If recipient is a bot facility, bot automatically evaluates and confirms/declines with realistic delay
    if (toFac.isBot) {
      setTimeout(() => {
        try {
          if (proposal.status !== 'PENDING') return;
          const market = instrument === 'ALLOWANCE' ? this.allowanceBook : this.offsetBook;
          const refPrice = market.lastPrice || (instrument === 'ALLOWANCE' ? 5.0 : 3.0);
          
          // Acceptable price range ±15%
          const isFair = side === 'BUY' ? price >= refPrice * 0.85 : price <= refPrice * 1.15;
          const buyer = side === 'BUY' ? fromFac : toFac;
          const seller = side === 'BUY' ? toFac : fromFac;
          const sellerStock = instrument === 'ALLOWANCE' ? seller.allowances : seller.offsets;

          if (isFair && buyer.cash >= totalCost && sellerStock >= quantity) {
            this.acceptDirectProposal({ facilityId: toFac.id, proposalId: proposal.id });
          } else {
            this.rejectDirectProposal({ facilityId: toFac.id, proposalId: proposal.id, reason: !isFair ? 'Đơn giá không phù hợp với chiến lược thị trường' : 'Không đáp ứng điều kiện số dư' });
          }
          if (this.onStateChange) this.onStateChange();
        } catch (e) {}
      }, 1500);
    }

    return { success: true, proposal };
  }

  acceptDirectProposal({ facilityId, proposalId }) {
    if (this.phase !== 'TRADING') throw new Error(`Giao dịch đóng trong giai đoạn: ${this.phase}`);
    if (this.isPaused) throw new Error('Thị trường đang tạm dừng bởi cơ quan quản lý.');

    this.otcProposals = this.otcProposals || [];
    const proposal = this.otcProposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error('Không tìm thấy đề nghị giao dịch thỏa thuận.');
    if (proposal.status !== 'PENDING') throw new Error(`Đề nghị này không còn hiệu lực (Trạng thái: ${proposal.status}).`);

    if (proposal.toFacilityId !== facilityId) {
      throw new Error('Chỉ doanh nghiệp nhận được đề nghị mới có quyền xác nhận giao dịch.');
    }

    const fromFac = this.facilities[proposal.fromFacilityId];
    const toFac = this.facilities[proposal.toFacilityId];

    if (!fromFac || !toFac) throw new Error('Một trong hai doanh nghiệp không còn tồn tại trên hệ thống.');

    const buyer = proposal.side === 'BUY' ? fromFac : toFac;
    const seller = proposal.side === 'BUY' ? toFac : fromFac;

    const totalCost = proposal.totalCost;
    const quantity = proposal.quantity;
    const instrument = proposal.instrument;

    // Check balances on both sides
    if (buyer.cash < totalCost) {
      throw new Error(`Kiểm tra giao dịch thất bại: Bên mua (${buyer.name}) không có đủ tiền mặt thanh toán (Tổng giá trị: $${Math.round(totalCost).toLocaleString()}).`);
    }

    const availableUnits = instrument === 'ALLOWANCE' ? seller.allowances : seller.offsets;
    if (availableUnits < quantity) {
      const instName = instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ';
      throw new Error(`Kiểm tra giao dịch thất bại: Bên bán (${seller.name}) không có đủ ${instName} để chuyển nhượng (Yêu cầu: ${quantity.toLocaleString()} tCO2e).`);
    }

    // Execute transfer
    buyer.cash -= totalCost;
    seller.cash += totalCost;

    if (instrument === 'ALLOWANCE') {
      buyer.allowances = (buyer.allowances || 0) + quantity;
      seller.allowances = Math.max(0, (seller.allowances || 0) - quantity);
    } else {
      buyer.offsets = (buyer.offsets || 0) + quantity;
      seller.offsets = Math.max(0, (seller.offsets || 0) - quantity);
    }

    proposal.status = 'ACCEPTED';
    proposal.respondedAt = Date.now();

    const trade = {
      id: 'otc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      proposalId: proposal.id,
      instrument,
      price: proposal.price,
      quantity,
      totalCost,
      buyerFacilityId: buyer.id,
      buyerFacilityName: buyer.name,
      sellerFacilityId: seller.id,
      sellerFacilityName: seller.name,
      timestamp: Date.now(),
      isDirect: true,
      tradeType: 'DIRECT'
    };

    buyer.trades = buyer.trades || [];
    buyer.trades.unshift({ ...trade, role: 'BUY' });
    if (buyer.trades.length > 50) buyer.trades.pop();

    seller.trades = seller.trades || [];
    seller.trades.unshift({ ...trade, role: 'SELL' });
    if (seller.trades.length > 50) seller.trades.pop();

    const book = instrument === 'ALLOWANCE' ? this.allowanceBook : this.offsetBook;
    if (book) {
      book.trades = book.trades || [];
      book.trades.unshift(trade);
      if (book.trades.length > 200) book.trades.pop();
      book.lastPrice = proposal.price;
      book.volume = (book.volume || 0) + quantity;
      if (proposal.price > book.highPrice) book.highPrice = proposal.price;
      if (proposal.price < book.lowPrice) book.lowPrice = proposal.price;
      book.priceHistory.push({
        time: Date.now(),
        price: proposal.price,
        volume: quantity
      });
      if (book.priceHistory.length > 300) book.priceHistory.shift();
    }

    this.periodTradingStats = this.periodTradingStats || { allowanceTrades: [], offsetTrades: [] };
    const tradeRecord = {
      ...trade,
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod)
    };
    if (instrument === 'ALLOWANCE') {
      this.periodTradingStats.allowanceTrades = this.periodTradingStats.allowanceTrades || [];
      this.periodTradingStats.allowanceTrades.push(tradeRecord);
    } else {
      this.periodTradingStats.offsetTrades = this.periodTradingStats.offsetTrades || [];
      this.periodTradingStats.offsetTrades.push(tradeRecord);
    }

    const instLabel = instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ';
    this.log('DIRECT_TRADE', `[Thỏa thuận thành công] ${toFac.name} đã xác nhận giao dịch với ${fromFac.name}: Chuyển nhượng ${quantity.toLocaleString()} ${instLabel} @ $${proposal.price}/t (Tổng: $${totalCost.toLocaleString()})`, {
      buyer: buyer.name,
      seller: seller.name,
      tradeId: trade.id,
      proposalId: proposal.id
    });

    return { success: true, trade, proposal };
  }

  rejectDirectProposal({ facilityId, proposalId, reason }) {
    this.otcProposals = this.otcProposals || [];
    const proposal = this.otcProposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error('Không tìm thấy đề nghị giao dịch thỏa thuận.');
    if (proposal.status !== 'PENDING') throw new Error(`Đề nghị này không còn hiệu lực (Trạng thái: ${proposal.status}).`);

    if (proposal.toFacilityId !== facilityId) {
      throw new Error('Chỉ doanh nghiệp nhận được đề nghị mới có quyền từ chối.');
    }

    proposal.status = 'REJECTED';
    proposal.respondedAt = Date.now();
    proposal.rejectionReason = reason || 'Đối tác từ chối đề xuất giao dịch.';

    this.log('OTC_REJECT', `[Từ chối thỏa thuận] ${proposal.toFacilityName} đã từ chối đề nghị của ${proposal.fromFacilityName}`, {
      proposalId: proposal.id
    });

    return { success: true, proposal };
  }

  cancelDirectProposal({ facilityId, proposalId }) {
    this.otcProposals = this.otcProposals || [];
    const proposal = this.otcProposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error('Không tìm thấy đề nghị giao dịch thỏa thuận.');
    if (proposal.status !== 'PENDING') throw new Error(`Đề nghị này không còn hiệu lực (Trạng thái: ${proposal.status}).`);

    if (proposal.fromFacilityId !== facilityId) {
      throw new Error('Chỉ bên khởi tạo mới có quyền hủy đề nghị.');
    }

    proposal.status = 'CANCELLED';
    proposal.respondedAt = Date.now();

    return { success: true, proposal };
  }

  executeDirectTrade({ fromFacilityId, toFacilityId, side, instrument = 'ALLOWANCE', price, quantity }) {
    if (this.phase !== 'TRADING') throw new Error(`Giao dịch đóng trong giai đoạn: ${this.phase}`);
    if (this.isPaused) throw new Error('Thị trường đang tạm dừng bởi cơ quan quản lý.');

    const fromFac = this.facilities[fromFacilityId];
    const toFac = this.facilities[toFacilityId];

    if (!fromFac) throw new Error('Doanh nghiệp khởi tạo giao dịch không tồn tại.');
    if (!toFac) throw new Error('Doanh nghiệp đối tác không tồn tại.');
    if (fromFacilityId === toFacilityId) throw new Error('Không thể tự giao dịch trực tiếp với chính doanh nghiệp của mình.');

    price = Number(price);
    quantity = Math.floor(Number(quantity));

    if (isNaN(quantity) || quantity <= 0) throw new Error('Số lượng chuyển nhượng phải lớn hơn 0.');
    if (isNaN(price) || price <= 0) throw new Error('Đơn giá thỏa thuận phải lớn hơn 0.');

    const buyer = side === 'BUY' ? fromFac : toFac;
    const seller = side === 'BUY' ? toFac : fromFac;

    const totalCost = Math.round(price * quantity * 100) / 100;

    if (buyer.cash < totalCost) {
      throw new Error(`Kiểm tra giao dịch thất bại: Bên mua (${buyer.name}) không có đủ tiền mặt thanh toán (Tổng giá trị: $${Math.round(totalCost).toLocaleString()}).`);
    }

    const availableUnits = instrument === 'ALLOWANCE' ? seller.allowances : seller.offsets;
    if (availableUnits < quantity) {
      const instName = instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ';
      throw new Error(`Kiểm tra giao dịch thất bại: Bên bán (${seller.name}) không có đủ ${instName} để chuyển nhượng (Yêu cầu: ${quantity.toLocaleString()} tCO2e).`);
    }

    // Execute transfer
    buyer.cash -= totalCost;
    seller.cash += totalCost;

    if (instrument === 'ALLOWANCE') {
      buyer.allowances = (buyer.allowances || 0) + quantity;
      seller.allowances = Math.max(0, (seller.allowances || 0) - quantity);
    } else {
      buyer.offsets = (buyer.offsets || 0) + quantity;
      seller.offsets = Math.max(0, (seller.offsets || 0) - quantity);
    }

    const trade = {
      id: 'otc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      instrument,
      price,
      quantity,
      totalCost,
      buyerFacilityId: buyer.id,
      buyerFacilityName: buyer.name,
      sellerFacilityId: seller.id,
      sellerFacilityName: seller.name,
      timestamp: Date.now(),
      isDirect: true,
      tradeType: 'DIRECT'
    };

    buyer.trades = buyer.trades || [];
    buyer.trades.unshift({ ...trade, role: 'BUY' });
    if (buyer.trades.length > 50) buyer.trades.pop();

    seller.trades = seller.trades || [];
    seller.trades.unshift({ ...trade, role: 'SELL' });
    if (seller.trades.length > 50) seller.trades.pop();

    const book = instrument === 'ALLOWANCE' ? this.allowanceBook : this.offsetBook;
    if (book) {
      book.trades = book.trades || [];
      book.trades.unshift(trade);
      if (book.trades.length > 200) book.trades.pop();
      book.lastPrice = price;
      book.volume = (book.volume || 0) + quantity;
      if (price > book.highPrice) book.highPrice = price;
      if (price < book.lowPrice) book.lowPrice = price;
      book.priceHistory.push({
        time: Date.now(),
        price,
        volume: quantity
      });
      if (book.priceHistory.length > 300) book.priceHistory.shift();
    }

    this.periodTradingStats = this.periodTradingStats || { allowanceTrades: [], offsetTrades: [] };
    const tradeRecord = {
      ...trade,
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod)
    };
    if (instrument === 'ALLOWANCE') {
      this.periodTradingStats.allowanceTrades = this.periodTradingStats.allowanceTrades || [];
      this.periodTradingStats.allowanceTrades.push(tradeRecord);
    } else {
      this.periodTradingStats.offsetTrades = this.periodTradingStats.offsetTrades || [];
      this.periodTradingStats.offsetTrades.push(tradeRecord);
    }

    const instLabel = instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ';
    this.log('DIRECT_TRADE', `[Thỏa thuận trực tiếp] ${buyer.name} đã mua ${quantity.toLocaleString()} ${instLabel} từ ${seller.name} @ $${price}/t (Tổng: $${totalCost.toLocaleString()})`, {
      buyer: buyer.name,
      seller: seller.name,
      tradeId: trade.id
    });

    return { success: true, trade };
  }

  startAuction(quantity, reservePrice) {
    if (this.auction.active) throw new Error('An auction is already active');
    
    const qty = quantity || Math.round(this.parameters.totalCap * (this.parameters.auctionShare / 100));
    const rPrice = reservePrice || this.parameters.auctionReservePrice;

    if (qty <= 0) {
      throw new Error('Auction volume must be greater than 0.');
    }

    this.auction = {
      active: true,
      period: this.currentPeriod,
      totalOffered: qty,
      reservePrice: rPrice,
      timeRemaining: 60,
      bids: [],
      results: null
    };

    this.log('AUCTION', `Regulator launched Primary Allowance Auction: ${qty.toLocaleString()} units @ Reserve $${rPrice}/tCO2e`, {
      quantity: qty,
      reservePrice: rPrice
    });

    return this.auction;
  }

  submitAuctionBid({ facilityId, price, quantity }) {
    if (!this.auction.active) throw new Error('No active auction');
    const fac = this.facilities[facilityId];
    if (!fac) throw new Error('Facility not found');

    price = Number(price);
    quantity = Math.floor(Number(quantity));

    if (price < this.auction.reservePrice) {
      throw new Error(`Bid price $${price} is below reserve price $${this.auction.reservePrice}`);
    }

    const totalCost = price * quantity;
    if (fac.cash < totalCost) {
      throw new Error(`Insufficient funds: Bid requires $${totalCost.toLocaleString()}, cash is $${fac.cash.toLocaleString()}`);
    }

    this.auction.bids = this.auction.bids.filter(b => b.facilityId !== facilityId);
    
    this.auction.bids.push({
      facilityId,
      facilityName: fac.name,
      price,
      quantity,
      timestamp: Date.now()
    });

    return { success: true, bidCount: this.auction.bids.length };
  }

  resolveAuction() {
    if (!this.auction.active) return null;

    const bids = [...this.auction.bids].sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    let remainingSupply = this.auction.totalOffered;
    let clearingPrice = this.auction.reservePrice;
    const allocations = [];

    for (const bid of bids) {
      if (remainingSupply <= 0) break;
      const allocated = Math.min(bid.quantity, remainingSupply);
      if (allocated > 0) {
        allocations.push({
          facilityId: bid.facilityId,
          facilityName: bid.facilityName,
          requested: bid.quantity,
          allocated: allocated,
          bidPrice: bid.price
        });
        remainingSupply -= allocated;
        clearingPrice = bid.price;
      }
    }

    allocations.forEach(alloc => {
      const fac = this.facilities[alloc.facilityId];
      if (fac) {
        const cost = alloc.allocated * clearingPrice;
        fac.cash -= cost;
        fac.complianceCost = (fac.complianceCost || 0) + cost;
        fac.cumulativeComplianceCost = (fac.cumulativeComplianceCost || 0) + cost;
        fac.allowances += alloc.allocated;
      }
    });

    const results = {
      totalOffered: this.auction.totalOffered,
      totalAllocated: this.auction.totalOffered - remainingSupply,
      clearingPrice: clearingPrice,
      allocations: allocations,
      timestamp: Date.now()
    };

    this.auction.active = false;
    this.auction.results = results;

    this.log('AUCTION', `Auction cleared at $${clearingPrice}/tCO2e. Allocated ${results.totalAllocated.toLocaleString()} allowances.`, {
      clearingPrice,
      totalAllocated: results.totalAllocated
    });

    return results;
  }

  submitSurrender(facilityId, { allowances, offsets, requestBorrowing = 0 }) {
    const fac = this.facilities[facilityId];
    if (!fac) throw new Error('Facility not found');

    if (fac.allowances < 0) fac.allowances = 0;
    if (fac.offsets < 0) fac.offsets = 0;

    allowances = Math.max(0, Math.floor(Number(allowances) || 0));
    offsets = Math.max(0, Math.floor(Number(offsets) || 0));
    requestBorrowing = Math.max(0, Math.floor(Number(requestBorrowing) || 0));

    // Clamp to available balances to prevent unexpected overdraft errors
    allowances = Math.min(allowances, Math.max(0, fac.allowances));
    offsets = Math.min(offsets, Math.max(0, fac.offsets));

    const maxOffsetsAllowed = Math.floor(fac.actualEmissions * (this.parameters.offsetUsageLimit / 100));
    offsets = Math.min(offsets, maxOffsetsAllowed);

    if (requestBorrowing > 0) {
      if (!this.parameters.borrowingAllowed) {
        requestBorrowing = 0;
      } else {
        const currentPeriodAlloc = fac.allocatedAllowances || (
          (this.parameters.isImported && fac.importedAllowance != null)
            ? fac.importedAllowance
            : fac.baselineEmissions
        );
        const borrowLimit = this.parameters.borrowingLimit != null ? this.parameters.borrowingLimit : 15;
        const maxBorrowable = Math.floor(currentPeriodAlloc * (borrowLimit / 100));
        requestBorrowing = Math.min(requestBorrowing, maxBorrowable);
      }
    }

    const totalSurrendered = allowances + offsets + requestBorrowing;
    const deficit = Math.max(0, fac.actualEmissions - totalSurrendered);
    const projectedPenalty = deficit * this.parameters.penaltyRate;

    fac.surrender = {
      submitted: true,
      allowancesToSurrender: allowances,
      offsetsToSurrender: offsets,
      borrowingRequested: requestBorrowing,
      deficit: deficit,
      projectedPenalty: projectedPenalty
    };

    return fac.surrender;
  }

  executeBorrowing(facilityId, quantity) {
    const fac = this.facilities[facilityId];
    if (!fac) throw new Error('Facility not found');
    if (!this.parameters.borrowingAllowed) {
      throw new Error('Borrowing mechanism is currently disabled by the regulator');
    }

    const qty = Math.max(0, Math.floor(Number(quantity) || 0));
    if (qty <= 0) throw new Error('Borrowing quantity must be greater than 0');

    // Borrowing limit is calculated based on current period's allocation!
    const currentPeriodAlloc = fac.allocatedAllowances || (
      (this.parameters.isImported && fac.importedAllowance != null)
        ? fac.importedAllowance
        : fac.baselineEmissions
    );
    const borrowLimit = this.parameters.borrowingLimit != null ? this.parameters.borrowingLimit : 15;
    const maxBorrowable = Math.floor(currentPeriodAlloc * (borrowLimit / 100));

    const alreadyBorrowed = fac.borrowedThisPeriod || 0;
    const remainingBorrowable = Math.max(0, maxBorrowable - alreadyBorrowed);

    if (qty > remainingBorrowable) {
      throw new Error(`Borrowing limit exceeded: Maximum remaining borrowable is ${remainingBorrowable.toLocaleString()} tCO2e (${borrowLimit}% of current period allocation ${currentPeriodAlloc.toLocaleString()} t minus ${alreadyBorrowed.toLocaleString()} t already borrowed), requested ${qty.toLocaleString()} tCO2e`);
    }

    const interestRate = this.parameters.borrowingInterestRate != null ? Number(this.parameters.borrowingInterestRate) : 1.00;
    const debtAdded = Math.round(qty * interestRate);

    // Credit allowances immediately into facility account
    fac.allowances += qty;
    fac.borrowedThisPeriod = alreadyBorrowed + qty;
    fac.borrowedUnits = (fac.borrowedUnits || 0) + debtAdded;

    this.log('POLICY', `${fac.name} borrowed ${qty.toLocaleString()} allowances based on current period allocation (${Math.round((interestRate - 1) * 100)}% interest penalty; ${debtAdded.toLocaleString()} tCO2e to be deducted next period)`, {
      facilityId,
      borrowedQuantity: qty,
      debtAdded,
      totalDebt: fac.borrowedUnits
    });

    return {
      success: true,
      borrowedQuantity: qty,
      debtAdded,
      totalBorrowedThisPeriod: fac.borrowedThisPeriod,
      totalDebt: fac.borrowedUnits,
      currentAllowances: fac.allowances
    };
  }

  repayBorrowing(facilityId, quantity) {
    const fac = this.facilities[facilityId];
    if (!fac) throw new Error('Facility not found');
    const qty = Math.max(0, Math.floor(Number(quantity) || 0));
    if (qty <= 0) throw new Error('Repayment quantity must be greater than 0');
    if (qty > fac.allowances) {
      throw new Error(`Insufficient allowances held: Have ${fac.allowances.toLocaleString()} tCO2e, attempted to repay ${qty.toLocaleString()} tCO2e`);
    }
    if ((fac.borrowedUnits || 0) <= 0) {
      throw new Error('Facility has no outstanding borrowing debt');
    }

    const repayAmount = Math.min(qty, fac.borrowedUnits);
    fac.allowances -= repayAmount;
    fac.borrowedUnits -= repayAmount;
    if (fac.borrowedThisPeriod) {
      fac.borrowedThisPeriod = Math.max(0, fac.borrowedThisPeriod - repayAmount);
    }

    this.log('POLICY', `${fac.name} repaid ${repayAmount.toLocaleString()} tCO2e borrowed debt early from current allowance holdings`, {
      facilityId,
      repayAmount,
      remainingDebt: fac.borrowedUnits
    });

    return {
      success: true,
      repaidQuantity: repayAmount,
      remainingDebt: fac.borrowedUnits,
      currentAllowances: fac.allowances
    };
  }

  startTrading() {
    this.phase = 'TRADING';
    this.isPaused = false;
    this.timeRemaining = this.periodDuration > 0 ? this.periodDuration : 600;
    this.log('POLICY', `Compliance Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}) secondary trading market is now OPEN`);
  }

  pauseTrading() {
    if (this.phase !== 'TRADING') throw new Error('Cannot pause trading when market is not open');
    this.isPaused = true;
    this.log('POLICY', `Compliance Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}) trading is PAUSED by the regulator`);
    return { success: true, isPaused: true, timeRemaining: this.timeRemaining };
  }

  resumeTrading() {
    if (this.phase !== 'TRADING') throw new Error('Cannot resume trading when market is not open');
    this.isPaused = false;
    this.log('POLICY', `Compliance Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}) trading has RESUMED`);
    return { success: true, isPaused: false, timeRemaining: this.timeRemaining };
  }

  configurePeriodTime({ periodDuration, totalPeriods, startYear, periodLengthYears }) {
    if (periodDuration != null) {
      const dur = Math.max(10, Math.floor(Number(periodDuration)));
      this.periodDuration = dur;
      if (this.phase === 'SETUP' || (this.phase === 'TRADING' && this.timeRemaining > dur)) {
        this.timeRemaining = dur;
      }
    }
    if (totalPeriods != null) {
      this.totalPeriods = Math.max(1, Math.floor(Number(totalPeriods)));
    }
    if (startYear != null) {
      this.parameters.startYear = Math.floor(Number(startYear));
    }
    if (periodLengthYears != null) {
      this.parameters.periodLengthYears = Math.max(1, Math.floor(Number(periodLengthYears)));
    }

    const start = this.parameters.startYear || 2025;
    const end = start + this.totalPeriods * (this.parameters.periodLengthYears || 2) - 1;

    this.log('POLICY', `Regulator updated timing: Period duration ${this.periodDuration}s, Pilot Timeline ${start}–${end} (${this.totalPeriods} periods of ${this.parameters.periodLengthYears || 2} years)`);

    return {
      success: true,
      periodDuration: this.periodDuration,
      timeRemaining: this.timeRemaining,
      totalPeriods: this.totalPeriods,
      startYear: this.parameters.startYear,
      periodLengthYears: this.parameters.periodLengthYears,
      pilotYearsLabel: `${start}–${end}`
    };
  }

  openCompliance() {
    this.phase = 'COMPLIANCE';
    this.isPaused = false;
    this.log('POLICY', `Trading closed. Compliance Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}) settlement & surrender in progress`);

    // Optimal surrender calculation for ALL facilities (both player and bot) that haven't submitted manually
    Object.values(this.facilities).forEach(fac => {
      try {
        if (fac.allowances < 0) fac.allowances = 0;
        if (fac.offsets < 0) fac.offsets = 0;

        if (!fac.surrender || !fac.surrender.submitted) {
          const maxOffsets = Math.floor(fac.actualEmissions * (this.parameters.offsetUsageLimit / 100));
          const offsetsToUse = Math.max(0, Math.min(fac.offsets || 0, maxOffsets));
          const allowancesToUse = Math.max(0, Math.min(fac.allowances || 0, Math.max(0, fac.actualEmissions - offsetsToUse)));
          
          let borrowToUse = 0;
          const deficitWithoutBorrow = Math.max(0, fac.actualEmissions - (allowancesToUse + offsetsToUse));
          if (deficitWithoutBorrow > 0 && this.parameters.borrowingAllowed) {
            const currentPeriodAlloc = fac.allocatedAllowances || (
              (this.parameters.isImported && fac.importedAllowance != null)
                ? fac.importedAllowance
                : fac.baselineEmissions
            );
            const borrowLimit = this.parameters.borrowingLimit != null ? this.parameters.borrowingLimit : 15;
            const maxBorrowable = Math.floor(currentPeriodAlloc * (borrowLimit / 100));
            const alreadyBorrowed = fac.borrowedThisPeriod || 0;
            const remainingBorrowable = Math.max(0, maxBorrowable - alreadyBorrowed);
            borrowToUse = Math.min(deficitWithoutBorrow, remainingBorrowable);
          }

          this.submitSurrender(fac.id, {
            allowances: allowancesToUse,
            offsets: offsetsToUse,
            requestBorrowing: borrowToUse
          });
        }
      } catch (err) {
        console.error(`Auto-surrender error for facility ${fac?.id}:`, err);
      }
    });
  }

  settleCompliance() {
    const periodSettlement = {
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod),
      timestamp: Date.now(),
      cap: this.parameters.totalCap,
      facilities: []
    };

    let totalSystemEmissions = 0;
    let totalAllowancesSurrendered = 0;
    let totalOffsetsSurrendered = 0;
    let totalPenaltiesCollected = 0;

    Object.values(this.facilities).forEach(fac => {
      if (fac.allowances < 0) fac.allowances = 0;
      if (fac.offsets < 0) fac.offsets = 0;

      const actualEmissions = fac.actualEmissions || 0;
      totalSystemEmissions += actualEmissions;

      // --- AUTOMATIC OPTIMAL SURRENDER IF FACILITY DID NOT SUBMIT MANUALLY ---
      let surrender = fac.surrender;
      if (!surrender || !surrender.submitted) {
        // Under Decree 06/2022/NĐ-CP: offsets capped at offsetUsageLimit% (default 30%)
        const maxOffsets = Math.floor(actualEmissions * (this.parameters.offsetUsageLimit / 100));
        const autoOffsets = Math.max(0, Math.min(fac.offsets || 0, maxOffsets));
        const remEmissions = Math.max(0, actualEmissions - autoOffsets);
        const autoAllowances = Math.max(0, Math.min(fac.allowances || 0, remEmissions));

        let autoBorrow = 0;
        const deficitWithoutBorrow = Math.max(0, remEmissions - autoAllowances);
        if (deficitWithoutBorrow > 0 && this.parameters.borrowingAllowed) {
          const currentPeriodAlloc = fac.allocatedAllowances || (
            (this.parameters.isImported && fac.importedAllowance != null)
              ? fac.importedAllowance
              : fac.baselineEmissions
          );
          const borrowLimit = this.parameters.borrowingLimit != null ? this.parameters.borrowingLimit : 15;
          const maxBorrowable = Math.floor(currentPeriodAlloc * (borrowLimit / 100));
          const alreadyBorrowed = fac.borrowedThisPeriod || 0;
          const remainingBorrowable = Math.max(0, maxBorrowable - alreadyBorrowed);
          autoBorrow = Math.min(deficitWithoutBorrow, remainingBorrowable);
        }

        const autoDeficit = Math.max(0, actualEmissions - (autoAllowances + autoOffsets + autoBorrow));
        const autoPenalty = autoDeficit * this.parameters.penaltyRate;

        surrender = {
          submitted: true,
          isAutoSubmitted: true,
          allowancesToSurrender: autoAllowances,
          offsetsToSurrender: autoOffsets,
          borrowingRequested: autoBorrow,
          deficit: autoDeficit,
          projectedPenalty: autoPenalty
        };
        fac.surrender = surrender;

        if (autoAllowances > 0 || autoOffsets > 0 || autoBorrow > 0) {
          this.log('COMPLIANCE', `🤖 Tự động nộp trả cho ${fac.name}: Đã tự động nộp ${autoAllowances.toLocaleString()} hạn ngạch + ${autoOffsets.toLocaleString()} tín chỉ bù trừ${autoBorrow > 0 ? ` + ${autoBorrow.toLocaleString()} vay hạn ngạch` : ''} để tối ưu tuân thủ (cơ sở không nộp thủ công cuối kỳ).`);
        }
      }

      const allowSurr = Math.max(0, Math.min(fac.allowances || 0, surrender.allowancesToSurrender || 0));
      const offSurr = Math.max(0, Math.min(fac.offsets || 0, surrender.offsetsToSurrender || 0));

      fac.allowances = Math.max(0, (fac.allowances || 0) - allowSurr);
      fac.offsets = Math.max(0, (fac.offsets || 0) - offSurr);
      totalAllowancesSurrendered += allowSurr;
      totalOffsetsSurrendered += offSurr;

      let borrowedThisPeriod = fac.borrowedThisPeriod || 0;
      if (this.parameters.borrowingAllowed && surrender.borrowingRequested > 0) {
        borrowedThisPeriod += surrender.borrowingRequested;
        const bRate = this.parameters.borrowingInterestRate != null ? Number(this.parameters.borrowingInterestRate) : 1.00;
        fac.borrowedUnits += Math.round(surrender.borrowingRequested * bRate);
      }

      const covered = allowSurr + offSurr + (this.parameters.borrowingAllowed ? (surrender.borrowingRequested || 0) : 0);
      const deficit = Math.max(0, actualEmissions - covered);
      const penalty = deficit * this.parameters.penaltyRate;

      if (penalty > 0) {
        fac.cash -= penalty;
        fac.cumulativeComplianceCost += penalty;
        totalPenaltiesCollected += penalty;
      }

      if (deficit > 0) {
        // Record non-compliance deficit debt: Paying penalty does NOT excuse allowance surrender obligation.
        // Unsurrendered deficit is carried over and mandatorily deducted from next period's allocation (Decree 06 / EU ETS Art 16).
        fac.unpaidDeficitDebt = (fac.unpaidDeficitDebt || 0) + deficit;
      }

      // --- AUTOMATIC SURPLUS BANKING ---
      let bankedToNext = 0;
      let expiredUnits = 0;
      if (fac.allowances > 0) {
        if (this.parameters.bankingAllowed) {
          const bankLimit = this.parameters.bankingLimit != null ? this.parameters.bankingLimit : 100;
          const maxBankable = Math.floor(fac.allowances * (bankLimit / 100));
          bankedToNext = maxBankable;
          expiredUnits = fac.allowances - maxBankable;
          fac.bankedUnits = bankedToNext;
          fac.allowances = bankedToNext;
        } else {
          expiredUnits = fac.allowances;
          fac.bankedUnits = 0;
          fac.allowances = 0;
        }
      } else {
        fac.bankedUnits = 0;
        fac.allowances = 0;
      }

      const annualOpexSavings = fac.abatementTechnologies
        .filter(t => t.implemented)
        .reduce((sum, t) => sum + (t.annualOpexSavings || 0), 0);

      fac.cash += fac.annualRevenue + annualOpexSavings;

      const historyItem = {
        period: this.currentPeriod,
        periodYears: this.getPeriodYears(this.currentPeriod),
        allocatedAllowances: fac.allocatedAllowances || 0,
        actualEmissions,
        baselineEmissions: fac.baselineEmissions,
        abatedTons: fac.implementedAbatement || 0,
        surrenderedAllowances: surrender.allowancesToSurrender,
        surrenderedOffsets: surrender.offsetsToSurrender,
        borrowed: borrowedThisPeriod,
        deficit,
        penalty,
        banked: bankedToNext,
        expired: expiredUnits,
        closingCash: fac.cash,
        status: deficit === 0 ? 'COMPLIANT' : 'NON_COMPLIANT'
      };

      fac.complianceHistory.push(historyItem);
      periodSettlement.facilities.push({
        facilityId: fac.id,
        facilityName: fac.name,
        sectorType: fac.sectorType,
        complianceStrategy: fac.complianceStrategy,
        strategyLabelVi: fac.strategyLabelVi,
        strategyLabelEn: fac.strategyLabelEn,
        ...historyItem
      });
    });

    periodSettlement.totalSystemEmissions = totalSystemEmissions;
    periodSettlement.totalAllowancesSurrendered = totalAllowancesSurrendered;
    periodSettlement.totalOffsetsSurrendered = totalOffsetsSurrendered;
    periodSettlement.totalPenaltiesCollected = totalPenaltiesCollected;

    // --- AGGREGATE RICH PERIOD SUMMARY REPORT ---
    // 1. Trading stats
    const allowanceTrades = this.periodTradingStats?.allowanceTrades || [];
    const offsetTrades = this.periodTradingStats?.offsetTrades || [];

    const allowanceVolume = allowanceTrades.reduce((sum, t) => sum + t.quantity, 0);
    const allowanceTurnover = allowanceTrades.reduce((sum, t) => sum + t.totalCost, 0);
    const allowanceAvgPrice = allowanceVolume > 0 
      ? Number((allowanceTurnover / allowanceVolume).toFixed(2)) 
      : this.allowanceBook.lastPrice;
    const allowancePrices = allowanceTrades.map(t => t.price);
    const allowanceHigh = allowancePrices.length > 0 ? Math.max(...allowancePrices) : this.allowanceBook.lastPrice;
    const allowanceLow = allowancePrices.length > 0 ? Math.min(...allowancePrices) : this.allowanceBook.lastPrice;

    const offsetVolume = offsetTrades.reduce((sum, t) => sum + t.quantity, 0);
    const offsetTurnover = offsetTrades.reduce((sum, t) => sum + t.totalCost, 0);
    const offsetAvgPrice = offsetVolume > 0 
      ? Number((offsetTurnover / offsetVolume).toFixed(2)) 
      : this.offsetBook.lastPrice;
    const offsetPrices = offsetTrades.map(t => t.price);
    const offsetHigh = offsetPrices.length > 0 ? Math.max(...offsetPrices) : this.offsetBook.lastPrice;
    const offsetLow = offsetPrices.length > 0 ? Math.min(...offsetPrices) : this.offsetBook.lastPrice;

    // 2. Abatement stats
    const abatementProjects = this.periodAbatementStats?.implementedProjects || [];
    const totalAbatedTonsThisPeriod = abatementProjects.reduce((sum, p) => sum + p.abatementTons, 0);
    const totalCapexInvestedThisPeriod = abatementProjects.reduce((sum, p) => sum + p.capex, 0);
    const totalAnnualOpexSavedThisPeriod = abatementProjects.reduce((sum, p) => sum + (p.annualOpexSavings || 0), 0);

    // 3. Compliance KPIs
    const totalFacilities = Object.keys(this.facilities).length;
    const compliantCount = periodSettlement.facilities.filter(f => f.status === 'COMPLIANT').length;
    const nonCompliantCount = totalFacilities - compliantCount;
    const complianceRate = totalFacilities > 0 ? Number(((compliantCount / totalFacilities) * 100).toFixed(1)) : 100;
    const totalBanked = periodSettlement.facilities.reduce((sum, f) => sum + f.banked, 0);
    const totalBorrowed = periodSettlement.facilities.reduce((sum, f) => sum + f.borrowed, 0);

    // 4. Sector Performance breakdown
    const sectorStats = {};
    ['power', 'cement', 'steel'].forEach(s => {
      const facs = periodSettlement.facilities.filter(f => {
        const fullFac = this.facilities[f.facilityId];
        return fullFac && fullFac.sectorId === s;
      });
      const sEmissions = facs.reduce((sum, f) => sum + f.actualEmissions, 0);
      const sCompliant = facs.filter(f => f.status === 'COMPLIANT').length;
      sectorStats[s] = {
        facilityCount: facs.length,
        actualEmissions: sEmissions,
        compliantCount: sCompliant,
        complianceRate: facs.length > 0 ? Number(((sCompliant / facs.length) * 100).toFixed(1)) : 100
      };
    });

    const summary = {
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod),
      timestamp: Date.now(),
      cap: this.parameters.totalCap,
      totalFacilities,
      compliantCount,
      nonCompliantCount,
      complianceRate,
      totalSystemEmissions,
      totalAllowancesSurrendered,
      totalOffsetsSurrendered,
      totalBorrowed,
      totalBanked,
      totalPenaltiesCollected,
      allowanceTrading: {
        volume: allowanceVolume,
        turnover: allowanceTurnover,
        avgPrice: allowanceAvgPrice,
        tradeCount: allowanceTrades.length,
        highPrice: allowanceHigh,
        lowPrice: allowanceLow,
        trades: allowanceTrades.slice(0, 30)
      },
      offsetTrading: {
        volume: offsetVolume,
        turnover: offsetTurnover,
        avgPrice: offsetAvgPrice,
        tradeCount: offsetTrades.length,
        highPrice: offsetHigh,
        lowPrice: offsetLow,
        trades: offsetTrades.slice(0, 30)
      },
      abatement: {
        projectsCount: abatementProjects.length,
        abatedTons: totalAbatedTonsThisPeriod,
        capexInvested: totalCapexInvestedThisPeriod,
        annualOpexSaved: totalAnnualOpexSavedThisPeriod,
        projects: abatementProjects
      },
      sectorStats
    };

    periodSettlement.summary = summary;
    this.lastPeriodSettlement = summary;

    this.history.push(periodSettlement);

    // Check if pilot phase is completing
    if (this.currentPeriod >= this.totalPeriods) {
      this.grandPilotSummary = this.generateGrandPilotSummary();
    }

    // Reset period trade buffers for next period
    this.periodTradingStats = { allowanceTrades: [], offsetTrades: [] };
    this.periodAbatementStats = { implementedProjects: [] };

    this.log('COMPLIANCE', `Compliance Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}) Settlement Completed: ${compliantCount}/${totalFacilities} Compliant (${complianceRate}%), Emissions ${totalSystemEmissions.toLocaleString()} tCO2e, Penalties $${totalPenaltiesCollected.toLocaleString()}`, {
      period: this.currentPeriod,
      periodYears: this.getPeriodYears(this.currentPeriod),
      totalEmissions: totalSystemEmissions,
      penalties: totalPenaltiesCollected
    });

    return periodSettlement;
  }

  // Grand Pilot Phase Summary Report (2025–2030)
  generateGrandPilotSummary() {
    const periods = this.history.map(h => h.summary).filter(Boolean);
    const startYear = this.parameters.startYear || 2025;
    const endYear = startYear + this.totalPeriods * (this.parameters.periodLengthYears || 2) - 1;
    
    const totalPeriodsCount = periods.length;
    const cumulativeEmissions = periods.reduce((sum, p) => sum + p.totalSystemEmissions, 0);
    const cumulativeAllowancesSurrendered = periods.reduce((sum, p) => sum + p.totalAllowancesSurrendered, 0);
    const cumulativeOffsetsSurrendered = periods.reduce((sum, p) => sum + p.totalOffsetsSurrendered, 0);
    const cumulativePenalties = periods.reduce((sum, p) => sum + p.totalPenaltiesCollected, 0);
    
    const cumulativeAllowanceVolume = periods.reduce((sum, p) => sum + p.allowanceTrading.volume, 0);
    const cumulativeAllowanceTurnover = periods.reduce((sum, p) => sum + p.allowanceTrading.turnover, 0);
    
    const cumulativeOffsetVolume = periods.reduce((sum, p) => sum + p.offsetTrading.volume, 0);
    const cumulativeOffsetTurnover = periods.reduce((sum, p) => sum + p.offsetTrading.turnover, 0);
    const cumulativeTotalTurnover = cumulativeAllowanceTurnover + cumulativeOffsetTurnover;

    const cumulativeAbatedTons = periods.reduce((sum, p) => sum + p.abatement.abatedTons, 0);
    const cumulativeCapexInvested = periods.reduce((sum, p) => sum + p.abatement.capexInvested, 0);
    const cumulativeAbatementProjects = periods.reduce((sum, p) => sum + p.abatement.projectsCount, 0);

    const avgComplianceRate = totalPeriodsCount > 0 
      ? Number((periods.reduce((sum, p) => sum + p.complianceRate, 0) / totalPeriodsCount).toFixed(1))
      : 100;

    const allFacilities = Object.values(this.facilities);
    const topAbaters = [...allFacilities]
      .sort((a, b) => (b.implementedAbatement || 0) - (a.implementedAbatement || 0))
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.name,
        sector: f.sectorType,
        abatedTons: f.implementedAbatement || 0,
        implementedCount: f.abatementTechnologies.filter(t => t.implemented).length
      }));

    const topFinancials = [...allFacilities]
      .sort((a, b) => b.cash - a.cash)
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.name,
        sector: f.sectorType,
        closingCash: f.cash,
        cumulativeComplianceCost: f.cumulativeComplianceCost || 0
      }));

    const periodProgression = periods.map(p => ({
      period: p.period,
      periodYears: p.periodYears,
      cap: p.cap,
      emissions: p.totalSystemEmissions,
      complianceRate: p.complianceRate,
      allowanceAvgPrice: p.allowanceTrading.avgPrice,
      allowanceVolume: p.allowanceTrading.volume,
      offsetVolume: p.offsetTrading.volume,
      abatedTons: p.abatement.abatedTons,
      penalties: p.totalPenaltiesCollected
    }));

    return {
      pilotTitle: `Báo Cáo Tổng Kết Giai Đoạn Thí Điểm Sàn ETS Việt Nam (${startYear}–${endYear})`,
      startYear,
      endYear,
      totalPeriods: totalPeriodsCount,
      totalFacilities: allFacilities.length,
      avgComplianceRate,
      cumulativeEmissions,
      cumulativeAllowancesSurrendered,
      cumulativeOffsetsSurrendered,
      cumulativePenalties,
      marketLiquidity: {
        totalTurnoverUSD: cumulativeTotalTurnover,
        totalTurnoverVND: cumulativeTotalTurnover * 25400,
        allowanceVolume: cumulativeAllowanceVolume,
        allowanceTurnoverUSD: cumulativeAllowanceTurnover,
        offsetVolume: cumulativeOffsetVolume,
        offsetTurnoverUSD: cumulativeOffsetTurnover,
        totalTradesCount: periods.reduce((sum, p) => sum + p.allowanceTrading.tradeCount + p.offsetTrading.tradeCount, 0)
      },
      decarbonization: {
        totalProjects: cumulativeAbatementProjects,
        totalTonsAbated: cumulativeAbatedTons,
        totalCapexUSD: cumulativeCapexInvested,
        totalCapexVND: cumulativeCapexInvested * 25400
      },
      periodProgression,
      topAbaters,
      topFinancials,
      generatedAt: Date.now()
    };
  }

  getLiveTradingStats() {
    const aTrades = this.periodTradingStats?.allowanceTrades || [];
    const oTrades = this.periodTradingStats?.offsetTrades || [];
    const aVol = aTrades.reduce((s, t) => s + t.quantity, 0);
    const aTurnover = aTrades.reduce((s, t) => s + t.totalCost, 0);
    const oVol = oTrades.reduce((s, t) => s + t.quantity, 0);
    const oTurnover = oTrades.reduce((s, t) => s + t.totalCost, 0);
    const abProjects = this.periodAbatementStats?.implementedProjects || [];

    return {
      allowanceVolume: aVol,
      allowanceTurnover: aTurnover,
      allowanceTradeCount: aTrades.length,
      offsetVolume: oVol,
      offsetTurnover: oTurnover,
      offsetTradeCount: oTrades.length,
      abatementProjectsCount: abProjects.length,
      abatedTons: abProjects.reduce((s, p) => s + p.abatementTons, 0),
      totalCapexInvested: abProjects.reduce((s, p) => s + p.capex, 0)
    };
  }

  advanceToNextPeriod() {
    if (this.currentPeriod >= this.totalPeriods) {
      this.phase = 'COMPLETED';
      if (!this.grandPilotSummary) {
        this.grandPilotSummary = this.generateGrandPilotSummary();
      }
      this.log('POLICY', `ETS Simulation finished! All ${this.totalPeriods} compliance periods concluded (2025–${(this.parameters.startYear || 2025) + this.totalPeriods * (this.parameters.periodLengthYears || 2) - 1}).`);
      return;
    }

    // MANDATORY GUARANTEE: Settle current compliance period if not already settled!
    // A period cannot transition without formal compliance surrender, enforcement, and banking.
    const isAlreadySettled = this.history.some(h => h.period === this.currentPeriod);
    if (!isAlreadySettled) {
      this.settleCompliance();
    }

    this.currentPeriod += 1;
    this._loggedScarcity = false;
    this.phase = 'SETUP';
    this.isPaused = false;
    this.timeRemaining = this.periodDuration;

    // --- Enterprise Emissions Growth (Developing Country Context) ---
    const activeFacilities = Object.values(this.facilities);
    let totalOldEmissions = 0;
    let totalNewEmissions = 0;

    const growthEnabled = this.parameters.enterpriseEmissionGrowthEnabled ?? true;
    const baseGrowthRate = (this.parameters.enterpriseEmissionGrowthRate != null ? Number(this.parameters.enterpriseEmissionGrowthRate) : 3.5) / 100;
    const growthMode = this.parameters.enterpriseEmissionGrowthMode || 'SECTOR_BASED';

    if (growthEnabled && baseGrowthRate !== 0) {
      activeFacilities.forEach(fac => {
        totalOldEmissions += (fac.actualEmissions || 0);

        // Calculate sector-specific growth factor if SECTOR_BASED
        let facRate = baseGrowthRate;
        if (growthMode === 'SECTOR_BASED') {
          const s = (fac.sectorType || '').toLowerCase();
          if (s.includes('điện') || s.includes('power') || s.includes('nhiệt điện')) {
            facRate = baseGrowthRate * 1.30; // Ngành nhiệt điện tăng trưởng cao nhất theo Quy hoạch điện VIII
          } else if (s.includes('thép') || s.includes('steel')) {
            facRate = baseGrowthRate * 1.05; // Ngành luyện kim thép
          } else if (s.includes('xi măng') || s.includes('cement')) {
            facRate = baseGrowthRate * 0.80; // Xi măng & VLXD
          } else {
            facRate = baseGrowthRate * 0.95;
          }
        }

        // Apply growth to baseline emissions
        const grownBaseline = Math.round(fac.baselineEmissions * (1 + facRate));
        fac.baselineEmissions = grownBaseline;

        // Recalculate actual emissions: preserve technology efficiency tier and subtract ongoing abatement
        const totalAbatement = (fac.abatementTechnologies || [])
          .filter(t => t.implemented)
          .reduce((sum, t) => sum + (t.abatementTons || 0), 0);
        fac.implementedAbatement = totalAbatement;

        const oldUnmitigated = (fac.actualEmissions || 0) + (fac.implementedAbatement || 0);
        const newUnmitigated = Math.round(oldUnmitigated * (1 + facRate));
        fac.actualEmissions = Math.max(0, newUnmitigated - totalAbatement);

        totalNewEmissions += fac.actualEmissions;
      });

      const avgGrowthPct = totalOldEmissions > 0 
        ? (((totalNewEmissions - totalOldEmissions) / totalOldEmissions) * 100).toFixed(1)
        : (baseGrowthRate * 100).toFixed(1);

      this.log('POLICY', `📈 Tăng trưởng phát thải doanh nghiệp Kỳ ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}): Phát thải cơ sở tăng trung bình +${avgGrowthPct}% phản ánh tăng trưởng kinh tế & mở rộng sản xuất của Việt Nam (Tổng phát thải hệ thống: ${totalNewEmissions.toLocaleString()} tCO2e).`);
    }

    const correctionRate = (this.parameters.correctionFactor || 0) / 100;
    const periodRatio = this.parameters.periodCapRatios?.[this.currentPeriod] != null 
      ? Number(this.parameters.periodCapRatios[this.currentPeriod]) 
      : 100;
    
    // Check if custom cap for this future period was specified in periodCapRatios or periodCaps
    if (this.parameters.periodCapRatios && this.parameters.periodCapRatios[this.currentPeriod] != null) {
      if (this.parameters.isImported && this.parameters.importedBaseCap > 0) {
        this.parameters.totalCap = Math.round(this.parameters.importedBaseCap * (periodRatio / 100));
      } else {
        const totalBaseline = activeFacilities.reduce((sum, f) => sum + (f.baselineEmissions || 0), 0);
        this.parameters.totalCap = Math.round(totalBaseline * (periodRatio / 100));
      }
    } else if (this.parameters.periodCaps && this.parameters.periodCaps[this.currentPeriod]) {
      this.parameters.totalCap = Math.round(Number(this.parameters.periodCaps[this.currentPeriod]));
    } else {
      this.parameters.totalCap = Math.round(this.parameters.totalCap * (1 + correctionRate));
    }

    const totalBaseline = activeFacilities.reduce((sum, f) => sum + f.baselineEmissions, 0);
    const freePool = Math.round(this.parameters.totalCap * (this.parameters.freeAllocationRate / 100));

    activeFacilities.forEach(fac => {
      let newFreeAlloc;
      if (this.parameters.isImported && fac.importedAllowance != null) {
        // Proportionally scale to the facility's imported allowance in the file!
        newFreeAlloc = Math.round(fac.importedAllowance * (periodRatio / 100) * (this.parameters.freeAllocationRate / 100));
      } else {
        const share = totalBaseline > 0 ? fac.baselineEmissions / totalBaseline : 1 / activeFacilities.length;
        newFreeAlloc = Math.round(freePool * share);
      }

      // 1. Mandatory deduction of unpaid non-compliance deficit debt from prior period (Decree 06 / EU ETS Art 16)
      if (fac.unpaidDeficitDebt > 0) {
        const deficitDeducted = Math.min(newFreeAlloc, fac.unpaidDeficitDebt);
        newFreeAlloc -= deficitDeducted;
        fac.unpaidDeficitDebt -= deficitDeducted;
        this.log('POLICY', `⚖️ ${fac.name} bị khấu trừ cưỡng chế ${deficitDeducted.toLocaleString()} tCO2e hạn ngạch nợ vi phạm chưa nộp từ kỳ trước vào đợt cấp phát Kỳ ${this.currentPeriod}`, {
          deducted: deficitDeducted,
          remainingDeficitDebt: fac.unpaidDeficitDebt
        });
      }

      // 2. Repayment of legal borrowed allowances
      if (fac.borrowedUnits > 0) {
        const debt = fac.borrowedUnits;
        const deducted = Math.min(newFreeAlloc, debt);
        newFreeAlloc -= deducted;
        fac.borrowedUnits -= deducted;
        this.log('POLICY', `${fac.name} repaid ${deducted.toLocaleString()} borrowed allowance debt from Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}) allocation`, {
          remainingDebt: fac.borrowedUnits
        });
      }

      fac.allocatedAllowances = newFreeAlloc;
      fac.allowances += newFreeAlloc;
      fac.borrowedThisPeriod = 0;

      fac.surrender = {
        submitted: false,
        allowancesToSurrender: Math.min(fac.allowances, fac.actualEmissions),
        offsetsToSurrender: 0,
        borrowingRequested: 0,
        deficit: Math.max(0, fac.actualEmissions - fac.allowances),
        penaltyPaid: 0
      };
    });

    this.seedAllowanceMarket();
    this.seedOffsetMarket();

    this.log('POLICY', `Advanced to Compliance Period ${this.currentPeriod} (${this.getPeriodYears(this.currentPeriod)}). Adjusted Cap: ${this.parameters.totalCap.toLocaleString()} tCO2e (Correction Factor: ${this.parameters.correctionFactor >= 0 ? '+' : ''}${this.parameters.correctionFactor}%)`);
  }

  // Simulation Bot / AI Market Maker activity tick targeting ~botComplianceTarget% compliance rate
  // Ensures diverse compliance pathways (abatement, offsets, allowances, hybrid) and guaranteed active market trades
  tickBots() {
    if (!this.parameters.botsEnabled || this.phase !== 'TRADING') return;

    const botFacilities = Object.values(this.facilities).filter(f => f.isBot);
    if (botFacilities.length === 0) return;

    const totalFacilities = Object.values(this.facilities).length;
    const targetRate = this.parameters.botComplianceTarget != null ? Number(this.parameters.botComplianceTarget) : 95;
    const targetCompliantCount = Math.round(totalFacilities * (targetRate / 100));

    const currentPrice = this.allowanceBook.lastPrice || 5.00;
    const priceFloor = this.parameters.marketPriceFloor || 1.50;
    const priceCeiling = this.parameters.marketPriceCeiling || 15.00;

    // 1. Maintain robust Sell liquidity on the Allowance Order Book (~$4.95 - $5.15)
    if (this.allowanceBook.asks.length < 4) {
      const surplusBots = botFacilities.filter(f => f.allowances > f.actualEmissions);
      const askPrices = [
        Math.round((currentPrice * (0.995 + Math.random() * 0.01)) * 100) / 100,
        Math.round((currentPrice * (1.005 + Math.random() * 0.015)) * 100) / 100,
        Math.round((currentPrice * (1.02 + Math.random() * 0.02)) * 100) / 100,
        Math.round((currentPrice * (1.035 + Math.random() * 0.025)) * 100) / 100
      ];
      askPrices.forEach((askP, idx) => {
        const clampedP = Math.min(priceCeiling, Math.max(priceFloor, askP));
        const seller = (surplusBots.length > idx && surplusBots[idx].allowances > 10000)
          ? surplusBots[idx]
          : { id: `VN_MARKET_MAKER_SURPLUS_${idx + 1}`, name: 'Nhà máy Thặng dư Hạn ngạch (Market Maker)' };
        const qty = 15000 + idx * 10000;
        try {
          this.allowanceBook.addOrder({
            facilityId: seller.id,
            facilityName: seller.name,
            side: 'SELL',
            type: 'LIMIT',
            price: clampedP,
            quantity: qty
          });
        } catch (e) {}
      });
    }

    // 2. Maintain robust Ask liquidity on the Offset Market Registry (~$2.80 - $3.40)
    if (this.offsetBook.asks.length < 3) {
      const offsetPrices = [2.80, 3.00, 3.20];
      offsetPrices.forEach((price, idx) => {
        try {
          this.offsetBook.addOrder({
            facilityId: 'SYSTEM_VN_OFFSET_REGISTRY',
            facilityName: 'Vietnam Carbon Credit Registry (VCM / Article 6)',
            side: 'SELL',
            type: 'LIMIT',
            price: price,
            quantity: 35000 + idx * 20000
          });
        } catch (e) {}
      });
    }

    // 3. Monitor current real compliance across all facilities
    // In trading, compliance is determined by held allowances + eligible offsets (up to offsetUsageLimit %) vs actual emissions
    const offsetLimitRatio = (this.parameters.offsetUsageLimit || 30) / 100;
    const stats = botFacilities.map(b => {
      const maxOffsets = Math.floor(b.actualEmissions * offsetLimitRatio);
      const effOffsets = Math.min(b.offsets || 0, maxOffsets);
      const shortfall = b.actualEmissions - (b.allowances + effOffsets);
      return { bot: b, shortfall, compliant: shortfall <= 0, maxOffsets, effOffsets };
    });

    const compliantBots = stats.filter(x => x.compliant).length;
    const humanFac = Object.values(this.facilities).find(f => !f.isBot);
    let humanCompliant = true;
    if (humanFac) {
      const hMaxOffsets = Math.floor(humanFac.actualEmissions * offsetLimitRatio);
      const hEffOffsets = Math.min(humanFac.offsets || 0, hMaxOffsets);
      humanCompliant = (humanFac.allowances + hEffOffsets) >= humanFac.actualEmissions;
    }
    const totalCompliant = compliantBots + (humanCompliant ? 1 : 0);

    // 4. Drive toward target compliance rate via Diverse Pathways
    if (totalCompliant < targetCompliantCount) {
      const deficitList = stats.filter(x => !x.compliant).sort((a, b) => a.shortfall - b.shortfall);
      const needed = targetCompliantCount - totalCompliant;
      // Pick 2-4 candidate deficit bots per tick to make incremental progress
      const activeTargets = deficitList.slice(0, Math.min(needed + 2, 4));

      for (const item of activeTargets) {
        const dBot = item.bot;
        const strategy = dBot.complianceStrategy || 'HYBRID_BALANCED';

        // PATHWAY 1: ABATEMENT_FOCUS (Ưu tiên đầu tư công nghệ giảm phát thải MAC)
        if (strategy === 'ABATEMENT_FOCUS') {
          // Look for an unimplemented abatement project
          const tech = dBot.abatementTechnologies.find(t => !t.implemented && t.capex <= dBot.cash * 0.85 && t.unitCost <= 11.5);
          if (tech && Math.random() < 0.60) {
            try {
              this.implementAbatement(dBot.id, tech.id);
              this.log('ABATEMENT', `🌿 ${dBot.name} triển khai giải pháp: "${tech.nameVi || tech.name}" cắt giảm ${tech.abatementTons.toLocaleString()} tCO2e/năm.`);
            } catch(e) {}
          }

          // Trade residual deficit on allowance market
          const curShortfall = Math.max(0, dBot.actualEmissions - (dBot.allowances + Math.min(dBot.offsets || 0, Math.floor(dBot.actualEmissions * offsetLimitRatio))));
          if (curShortfall > 0 && this.allowanceBook.asks.length > 0) {
            const bestAsk = this.allowanceBook.asks[0].price;
            const affordQty = Math.floor(dBot.cash / bestAsk);
            const buyQty = Math.max(500, Math.min(curShortfall, affordQty, 5000));
            if (buyQty >= 500) {
              try {
                this.placeOrder({
                  facilityId: dBot.id,
                  side: 'BUY',
                  instrument: 'ALLOWANCE',
                  type: 'LIMIT',
                  price: bestAsk,
                  quantity: buyQty
                });
              } catch(e) {}
            }
          }
        }

        // PATHWAY 2: OFFSET_FOCUS (Tận dụng mua tín chỉ bù trừ lên đến trần 30%)
        else if (strategy === 'OFFSET_FOCUS') {
          const maxOffsets = Math.floor(dBot.actualEmissions * offsetLimitRatio);
          const offsetCapRemaining = Math.max(0, maxOffsets - (dBot.offsets || 0));

          if (offsetCapRemaining > 500 && this.offsetBook.asks.length > 0) {
            const bestOffsetAsk = this.offsetBook.asks[0].price;
            const affordOffset = Math.floor(dBot.cash / bestOffsetAsk);
            const buyOffset = Math.max(500, Math.min(item.shortfall, offsetCapRemaining, affordOffset, 6000));
            if (buyOffset >= 500) {
              try {
                this.placeOrder({
                  facilityId: dBot.id,
                  side: 'BUY',
                  instrument: 'OFFSET',
                  type: 'LIMIT',
                  price: bestOffsetAsk,
                  quantity: buyOffset
                });
              } catch(e) {}
            }
          }

          // Remainder covered by allowances
          const effOffsetsNow = Math.min(dBot.offsets || 0, maxOffsets);
          const curShortfall = Math.max(0, dBot.actualEmissions - (dBot.allowances + effOffsetsNow));
          if (curShortfall > 0 && this.allowanceBook.asks.length > 0) {
            const bestAsk = this.allowanceBook.asks[0].price;
            const affordQty = Math.floor(dBot.cash / bestAsk);
            const buyAllow = Math.max(500, Math.min(curShortfall, affordQty, 5000));
            if (buyAllow >= 500) {
              try {
                this.placeOrder({
                  facilityId: dBot.id,
                  side: 'BUY',
                  instrument: 'ALLOWANCE',
                  type: 'LIMIT',
                  price: bestAsk,
                  quantity: buyAllow
                });
              } catch(e) {}
            }
          }
        }

        // PATHWAY 3: ALLOWANCE_FOCUS (Tập trung giao dịch hạn ngạch sàn ETS)
        else if (strategy === 'ALLOWANCE_FOCUS') {
          if (this.allowanceBook.asks.length > 0) {
            const bestAsk = this.allowanceBook.asks[0].price;
            const affordQty = Math.floor(dBot.cash / bestAsk);
            const buyAllow = Math.max(500, Math.min(item.shortfall, affordQty, 6000));
            if (buyAllow >= 500) {
              try {
                this.placeOrder({
                  facilityId: dBot.id,
                  side: 'BUY',
                  instrument: 'ALLOWANCE',
                  type: 'LIMIT',
                  price: bestAsk,
                  quantity: buyAllow
                });
              } catch(e) {}
            }
          }
        }

        // PATHWAY 4: HYBRID_BALANCED (Chiến lược kết hợp đa phương thức)
        else {
          // 1. Inexpensive tech abatement (unitCost <= $4.00)
          const cheapTech = dBot.abatementTechnologies.find(t => !t.implemented && t.capex <= dBot.cash * 0.50 && t.unitCost <= 4.00);
          if (cheapTech && Math.random() < 0.40) {
            try { this.implementAbatement(dBot.id, cheapTech.id); } catch(e) {}
          }

          // 2. Modest offset allocation (~15% of emissions)
          const targetOffsets = Math.floor(dBot.actualEmissions * 0.15);
          if ((dBot.offsets || 0) < targetOffsets && this.offsetBook.asks.length > 0 && Math.random() < 0.50) {
            const bestOffsetAsk = this.offsetBook.asks[0].price;
            const buyOffset = Math.max(500, Math.min(item.shortfall, targetOffsets - (dBot.offsets || 0), Math.floor(dBot.cash / bestOffsetAsk), 3000));
            if (buyOffset >= 500) {
              try {
                this.placeOrder({
                  facilityId: dBot.id,
                  side: 'BUY',
                  instrument: 'OFFSET',
                  type: 'LIMIT',
                  price: bestOffsetAsk,
                  quantity: buyOffset
                });
              } catch(e) {}
            }
          }

          // 3. Balance with allowances
          const effOffsetsNow = Math.min(dBot.offsets || 0, Math.floor(dBot.actualEmissions * offsetLimitRatio));
          const curShortfall = Math.max(0, dBot.actualEmissions - (dBot.allowances + effOffsetsNow));
          if (curShortfall > 0 && this.allowanceBook.asks.length > 0) {
            const bestAsk = this.allowanceBook.asks[0].price;
            const affordQty = Math.floor(dBot.cash / bestAsk);
            const buyAllow = Math.max(500, Math.min(curShortfall, affordQty, 5000));
            if (buyAllow >= 500) {
              try {
                this.placeOrder({
                  facilityId: dBot.id,
                  side: 'BUY',
                  instrument: 'ALLOWANCE',
                  type: 'LIMIT',
                  price: bestAsk,
                  quantity: buyAllow
                });
              } catch(e) {}
            }
          }
        }
      }
    }

    // 5. Continuous Floor Liquidity & Active Trading
    // Guarantee that realistic executed trades continuously take place on the floor,
    // so market charts, order books, and trade history remain active and dynamic.
    if (Math.random() < 0.75) {
      if (Math.random() < 0.65 && this.allowanceBook.asks.length > 0) {
        // Active Allowance Market Trade
        const buyerBot = botFacilities[Math.floor(Math.random() * botFacilities.length)];
        const bestAsk = this.allowanceBook.asks[0].price;
        if (buyerBot && buyerBot.cash > bestAsk * 1500) {
          const qty = Math.min(Math.floor(buyerBot.cash / bestAsk), Math.floor(Math.random() * 2500 + 1000));
          if (qty >= 500) {
            try {
              this.placeOrder({
                facilityId: buyerBot.id,
                side: 'BUY',
                instrument: 'ALLOWANCE',
                type: 'LIMIT',
                price: bestAsk,
                quantity: qty
              });
            } catch(e) {}
          }
        }
      } else if (this.offsetBook.asks.length > 0) {
        // Active Offset Market Trade
        const buyerBot = botFacilities[Math.floor(Math.random() * botFacilities.length)];
        const bestOffsetAsk = this.offsetBook.asks[0].price;
        if (buyerBot && buyerBot.cash > bestOffsetAsk * 1500) {
          const qty = Math.min(Math.floor(buyerBot.cash / bestOffsetAsk), Math.floor(Math.random() * 2000 + 1000));
          if (qty >= 500) {
            try {
              this.placeOrder({
                facilityId: buyerBot.id,
                side: 'BUY',
                instrument: 'OFFSET',
                type: 'LIMIT',
                price: bestOffsetAsk,
                quantity: qty
              });
            } catch(e) {}
          }
        }
      }
    }
  }

  resetSimulation() {
    this.currentPeriod = 1;
    this._loggedScarcity = false;
    this.phase = 'SETUP';
    this.isPaused = false;
    this.timeRemaining = this.periodDuration || 600;
    this.history = [];
    this.logs = [];
    this.otcProposals = [];
    this.periodTradingStats = { allowanceTrades: [], offsetTrades: [] };
    this.periodAbatementStats = { implementedProjects: [] };
    this.lastPeriodSettlement = null;
    this.grandPilotSummary = null;
    this.initializeFacilities(this.parameters.activeFacilityCount || 110);
    this.seedAllowanceMarket();
    this.seedOffsetMarket();
    this.log('POLICY', `ETS Simulation reset to baseline Period 1 (${this.getPeriodYears(1)}) with ${this.parameters.activeFacilityCount || 110} facilities`);
  }

  injectShock(shockType) {
    let title = '';
    let description = '';

    if (shockType === 'ECONOMIC_BOOM') {
      title = 'Economic Boom & Production Surge (+15% Demand)';
      description = 'GDP growth surge boosts industrial output. Emissions rise proportionally to technology efficiency, preserving market diversity.';
      Object.values(this.facilities).forEach(fac => {
        fac.baselineEmissions = Math.round(fac.baselineEmissions * 1.15);
        // Modern efficient units absorb load surge with low incremental emissions (+8%)
        // Inefficient vintage units face severe thermal losses and heat-rate degradation (+22%)
        const loadIntensity = fac.techTier === 'ADVANCED' ? 1.08 : fac.techTier === 'LEGACY' ? 1.22 : 1.14;
        const baseActual = Math.round(fac.baselineEmissions * (fac.emissionRatio || 1.0) * (loadIntensity / 1.15));
        fac.actualEmissions = Math.max(0, baseActual - (fac.implementedAbatement || 0));
        fac.annualRevenue = Math.round(fac.annualRevenue * 1.20);

        const net = (fac.allowances + fac.offsets) - fac.actualEmissions;
        fac.complianceStatus = net > 1500 ? 'SURPLUS' : net < -1500 ? 'DEFICIT' : 'BALANCED';

        if (!fac.surrender.submitted) {
          fac.surrender.allowancesToSurrender = Math.min(fac.allowances, fac.actualEmissions);
          fac.surrender.deficit = Math.max(0, fac.actualEmissions - (fac.allowances + fac.offsets));
        }
      });
    } else if (shockType === 'CLEAN_TECH_SUBSIDY') {
      title = 'Green Technology Investment Subsidy (-25% Capex)';
      description = 'National green innovation fund subsidizes capital expenditure by 25% on all decarbonization solutions.';
      Object.values(this.facilities).forEach(fac => {
        fac.abatementTechnologies.forEach(t => {
          if (!t.implemented) {
            t.capex = Math.round(t.capex * 0.75);
            t.unitCost = Math.round((t.capex / t.abatementTons) * 100) / 100;
          }
        });
      });
    } else if (shockType === 'OFFSET_INFLUX') {
      title = 'Forestry Carbon Credit Influx (100,000 Credits @ $2.20/t)';
      description = 'National forest carbon program releases 100,000 new certified domestic credits at high discount into the exchange.';
      this.offsetBook.addOrder({
        facilityId: 'SYSTEM_VN_OFFSET_REGISTRY',
        facilityName: 'National Forest Carbon Fund (VNFF)',
        side: 'SELL',
        type: 'LIMIT',
        price: 2.20,
        quantity: 100000
      });
    } else if (shockType === 'TIGHTENING_SHOCK') {
      title = 'Regulatory Penalty Enforcement Hike ($18/t)';
      description = 'Ministry of Natural Resources & Environment increases non-compliance shortfall fines to $18.00/t.';
      this.parameters.penaltyRate = 18.00;
    }

    this.log('POLICY', `[MARKET SHOCK] ${title}: ${description}`, { shockType });
    return { success: true, shockType, title, description };
  }

  getState() {
    const facilityList = Object.values(this.facilities);
    const totalActual = facilityList.reduce((s, f) => s + f.actualEmissions, 0);
    const totalBaseline = facilityList.reduce((s, f) => s + f.baselineEmissions, 0);
    const totalAllocated = facilityList.reduce((s, f) => s + (f.allocatedAllowances || 0), 0);
    const surplusCount = facilityList.filter(f => (f.allowances + f.offsets) > f.actualEmissions + 1500).length;
    const deficitCount = facilityList.filter(f => (f.allowances + f.offsets) < f.actualEmissions - 1500).length;
    const balancedCount = facilityList.length - surplusCount - deficitCount;

    return {
      id: this.id,
      name: this.name,
      phase: this.phase,
      isPaused: this.isPaused,
      currentPeriod: this.currentPeriod,
      totalPeriods: this.totalPeriods,
      periodDuration: this.periodDuration,
      timeRemaining: this.timeRemaining,
      periodYearsLabel: this.getPeriodYears(this.currentPeriod),
      pilotPhaseConfig: {
        startYear: this.parameters.startYear || 2025,
        endYear: (this.parameters.startYear || 2025) + this.totalPeriods * (this.parameters.periodLengthYears || 2) - 1,
        totalPeriods: this.totalPeriods,
        periodLengthYears: this.parameters.periodLengthYears || 2,
        label: `${this.parameters.startYear || 2025}–${(this.parameters.startYear || 2025) + this.totalPeriods * (this.parameters.periodLengthYears || 2) - 1}`
      },
      lastPeriodSettlement: this.lastPeriodSettlement,
      grandPilotSummary: this.grandPilotSummary,
      liveTradingStats: this.getLiveTradingStats(),
      parameters: this.parameters,
      allowanceMarket: this.allowanceBook.getState(),
      offsetMarket: this.offsetBook.getState(),
      facilities: this.facilities,
      auction: this.auction,
      history: this.history,
      otcProposals: (this.otcProposals || []).slice(0, 100),
      recentLogs: this.logs.slice(0, 50),
      totalFacilitiesCount: facilityList.length,
      metrics: {
        totalActualEmissions: totalActual,
        totalBaselineEmissions: totalBaseline,
        totalAllocatedAllowances: totalAllocated,
        systemNetPosition: this.parameters.totalCap - totalActual,
        capStringencyRatio: totalActual > 0 ? Number(((this.parameters.totalCap / totalActual) * 100).toFixed(1)) : 100,
        surplusCount,
        deficitCount,
        balancedCount
      }
    };
  }
}

module.exports = { Simulation };
