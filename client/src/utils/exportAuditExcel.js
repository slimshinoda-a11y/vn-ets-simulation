import * as XLSX from 'xlsx';

/**
 * Export Comprehensive Multi-Period Simulation Excel Audit Report
 * Clearly details emissions and allowance allocations for EACH compliance period across the entire pilot phase (2025–2030).
 */
export function exportSimulationAuditExcel(state, lang = 'vi') {
  if (!state) {
    alert(lang === 'vi' ? 'Không có dữ liệu hệ thống để xuất Excel!' : 'No simulation data available to export!');
    return;
  }

  const isVi = lang === 'vi';
  const facilities = Object.values(state.facilities || {});
  const totalPeriods = state.totalPeriods || 3;
  const startYear = state.parameters?.startYear || 2025;
  const periodLength = state.parameters?.periodLengthYears || 2;
  const endYear = startYear + totalPeriods * periodLength - 1;
  const grandSummary = state.grandPilotSummary;

  // Helper to format period year labels
  const getPeriodYears = (p) => {
    const s = startYear + (p - 1) * periodLength;
    const e = s + periodLength - 1;
    return `${s}–${e}`;
  };

  // 1. Gather all executed trades across all markets & periods
  const tradesMap = new Map();
  const addTrade = (t) => {
    if (!t || !t.id) return;
    if (!tradesMap.has(t.id)) tradesMap.set(t.id, t);
  };

  (state.allowanceMarket?.trades || []).forEach(addTrade);
  (state.allowanceMarket?.recentTrades || []).forEach(addTrade);
  (state.offsetMarket?.trades || []).forEach(addTrade);
  (state.offsetMarket?.recentTrades || []).forEach(addTrade);

  facilities.forEach(fac => {
    (fac.trades || []).forEach(addTrade);
  });

  const allTrades = Array.from(tradesMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Compute facility trade statistics
  const facTradeStats = new Map();
  facilities.forEach(fac => {
    facTradeStats.set(fac.id, {
      allowancesBought: 0,
      allowancesSold: 0,
      offsetsBought: 0,
      offsetsSold: 0,
      tradesCount: 0
    });
  });

  allTrades.forEach(tr => {
    const qty = Number(tr.quantity) || 0;
    const isAllow = tr.instrument === 'ALLOWANCE';

    if (tr.buyerFacilityId && facTradeStats.has(tr.buyerFacilityId)) {
      const b = facTradeStats.get(tr.buyerFacilityId);
      b.tradesCount += 1;
      if (isAllow) b.allowancesBought += qty;
      else b.offsetsBought += qty;
    }

    if (tr.sellerFacilityId && facTradeStats.has(tr.sellerFacilityId)) {
      const s = facTradeStats.get(tr.sellerFacilityId);
      s.tradesCount += 1;
      if (isAllow) s.allowancesSold += qty;
      else s.offsetsSold += qty;
    }
  });

  // --- SHEET 1: MULTI-PERIOD EMISSIONS & ALLOWANCES PER FACILITY ---
  const multiPeriodRows = facilities.map((fac, idx) => {
    const historyList = fac.complianceHistory || [];
    let cumulativeEmissions = 0;
    let cumulativeAllocated = 0;
    let cumulativeSurrenderedAllowances = 0;
    let cumulativeSurrenderedOffsets = 0;
    let cumulativePenalties = 0;
    let cumulativeBanked = 0;

    const row = isVi ? {
      'STT': idx + 1,
      'Mã Cơ Sở': fac.id,
      'Tên Cơ Sở': fac.name,
      'Lĩnh Vực': fac.sectorType || fac.sectorName || 'N/A',
      'Thực Thể': fac.isBot ? 'AI Bot' : 'Doanh Nghiệp Thật',
      'Cấp Công Nghệ': fac.techTier === 'ADVANCED' ? 'Hiện đại' : fac.techTier === 'LEGACY' ? 'Lạc hậu' : 'Tiêu chuẩn',
      'Phát Thải Cơ Sở Gốc (tCO2e)': fac.baselineEmissions || fac.actualEmissions || 0
    } : {
      'No.': idx + 1,
      'Facility ID': fac.id,
      'Facility Name': fac.name,
      'Sector': fac.sectorType || fac.sectorName || 'N/A',
      'Entity Type': fac.isBot ? 'AI Bot' : 'Human Enterprise',
      'Tech Tier': fac.techTier || 'STANDARD',
      'Original Baseline (tCO2e)': fac.baselineEmissions || fac.actualEmissions || 0
    };

    // Iterate through each period in the phase
    for (let p = 1; p <= totalPeriods; p++) {
      const pYears = getPeriodYears(p);
      const h = historyList.find(item => item.period === p);

      let pEmissions = 0;
      let pAllocated = 0;
      let pSurrAllow = 0;
      let pSurrOffset = 0;
      let pPenalty = 0;
      let pBanked = 0;
      let pStatus = '';

      if (h) {
        // Settled historical period
        pEmissions = h.actualEmissions || 0;
        pAllocated = h.allocatedAllowances || 0;
        pSurrAllow = h.surrenderedAllowances || 0;
        pSurrOffset = h.surrenderedOffsets || 0;
        pPenalty = h.penalty || 0;
        pBanked = h.banked || 0;
        pStatus = h.status === 'COMPLIANT' 
          ? (isVi ? '✓ Đạt tuân thủ' : '✓ Compliant') 
          : (isVi ? '⚠ Thiếu hụt' : '⚠ Non-compliant');
      } else if (p === state.currentPeriod) {
        // Current active period
        pEmissions = fac.actualEmissions || 0;
        pAllocated = fac.allocatedAllowances || 0;
        pSurrAllow = fac.surrender?.submitted ? fac.surrender.allowancesToSurrender : Math.min(fac.allowances || 0, pEmissions);
        pSurrOffset = fac.surrender?.submitted ? fac.surrender.offsetsToSurrender : Math.min(fac.offsets || 0, Math.floor(pEmissions * 0.3));
        const surplusAllow = Math.max(0, (fac.allowances || 0) - pSurrAllow);
        pBanked = state.parameters?.bankingAllowed 
          ? Math.floor(surplusAllow * ((state.parameters?.bankingLimit != null ? state.parameters.bankingLimit : 100) / 100))
          : 0;
        const net = (pAllocated + (fac.offsets || 0)) - pEmissions;
        pStatus = net >= 0 
          ? (isVi ? 'Cân đối đủ' : 'Covered') 
          : (isVi ? 'Cần bù đắp' : 'Deficit');
      } else if (p > state.currentPeriod) {
        // Future period projection
        const growthRate = state.parameters?.enterpriseEmissionGrowthEnabled 
          ? (state.parameters?.enterpriseEmissionGrowthRate || 3.5) / 100 
          : 0;
        const periodsAhead = p - state.currentPeriod;
        pEmissions = Math.round((fac.actualEmissions || 0) * Math.pow(1 + growthRate, periodsAhead));

        const baseCapRatio = state.parameters?.capStringencyRatio || 98;
        const targetRatio = state.parameters?.periodCapRatios?.[p] || (baseCapRatio + (p - 1) * 4);
        pAllocated = Math.round((fac.allocatedAllowances || 0) * (targetRatio / baseCapRatio));
        pBanked = 0;
        pStatus = isVi ? 'Dự kiến' : 'Projected';
      }

      const pGap = pAllocated - pEmissions;
      cumulativeEmissions += pEmissions;
      cumulativeAllocated += pAllocated;
      cumulativeSurrenderedAllowances += pSurrAllow;
      cumulativeSurrenderedOffsets += pSurrOffset;
      cumulativePenalties += pPenalty;
      cumulativeBanked += pBanked;

      if (isVi) {
        row[`Kỳ ${p} (${pYears}) - Hạn Ngạch Phân Bổ (tCO2e)`] = pAllocated;
        row[`Kỳ ${p} (${pYears}) - Phát Thải Thực Tế (tCO2e)`] = pEmissions;
        row[`Kỳ ${p} (${pYears}) - Chênh Lệch Cung/Cầu (tCO2e)`] = pGap;
        row[`Kỳ ${p} (${pYears}) - Hạn Ngạch Đã Nộp (tCO2e)`] = pSurrAllow;
        row[`Kỳ ${p} (${pYears}) - Tín Chỉ Đã Nộp (tCO2e)`] = pSurrOffset;
        row[`Kỳ ${p} (${pYears}) - Hạn Ngạch Lưu Giữ Sang Kỳ Sau (Banking)`] = pBanked;
        row[`Kỳ ${p} (${pYears}) - Tiền Phạt Thiếu Hụt ($)`] = pPenalty;
        row[`Kỳ ${p} (${pYears}) - Hạn Ngạch Nợ Khấu Trừ Kỳ Sau (tCO2e)`] = h?.deficit || 0;
        row[`Kỳ ${p} (${pYears}) - Trạng Thái Tuân Thủ`] = pStatus;
      } else {
        row[`Period ${p} (${pYears}) - Allocated (tCO2e)`] = pAllocated;
        row[`Period ${p} (${pYears}) - Actual Emissions (tCO2e)`] = pEmissions;
        row[`Period ${p} (${pYears}) - Net Balance (tCO2e)`] = pGap;
        row[`Period ${p} (${pYears}) - Surrendered Allowances`] = pSurrAllow;
        row[`Period ${p} (${pYears}) - Surrendered Offsets`] = pSurrOffset;
        row[`Period ${p} (${pYears}) - Allowances Banked to Next Period`] = pBanked;
        row[`Period ${p} (${pYears}) - Non-compliance Penalty ($)`] = pPenalty;
        row[`Period ${p} (${pYears}) - Deficit Debt Deducted Next Period (tCO2e)`] = h?.deficit || 0;
        row[`Period ${p} (${pYears}) - Status`] = pStatus;
      }
    }

    // Cumulative phase totals
    const cumulativeGap = cumulativeAllocated - cumulativeEmissions;
    const isOverallCompliant = cumulativeGap >= 0 || cumulativePenalties === 0;

    if (isVi) {
      row['TỔNG PHÁT THẢI CẢ GIAI ĐOẠN (tCO2e)'] = cumulativeEmissions;
      row['TỔNG HẠN NGẠCH PHÂN BỔ CẢ GIAI ĐOẠN (tCO2e)'] = cumulativeAllocated;
      row['CHÊNH LỆCH RÒNG TOÀN GIAI ĐOẠN (tCO2e)'] = cumulativeGap;
      row['TỔNG HẠN NGẠCH ĐÃ NỘP (tCO2e)'] = cumulativeSurrenderedAllowances;
      row['TỔNG TÍN CHỈ ĐÃ NỘP (tCO2e)'] = cumulativeSurrenderedOffsets;
      row['TỔNG HẠN NGẠCH LƯU GIỮ TOÀN GIAI ĐOẠN (tCO2e)'] = cumulativeBanked;
      row['TỔNG GIẢM PHÁT THẢI CÔNG NGHỆ (tCO2e)'] = fac.implementedAbatement || 0;
      row['TỔNG TIỀN PHẠT ĐÃ NỘP ($)'] = cumulativePenalties;
      row['SỐ DƯ TIỀN MẶT HIỆN TẠI ($)'] = Math.round(fac.cash || 0);
      row['TỔNG CHI PHÍ TUÂN THỦ TÍCH LŨY ($)'] = Math.round(fac.cumulativeComplianceCost || fac.complianceCost || 0);
      row['ĐÁNH GIÁ CHUNG CUỘC'] = isOverallCompliant ? '✓ HOÀN THÀNH TUÂN THỦ' : '⚠ CẦN BÙ ĐẮP THIẾU HỤT';
    } else {
      row['CUMULATIVE EMISSIONS (tCO2e)'] = cumulativeEmissions;
      row['CUMULATIVE ALLOCATED ALLOWANCES (tCO2e)'] = cumulativeAllocated;
      row['CUMULATIVE NET POSITION (tCO2e)'] = cumulativeGap;
      row['TOTAL SURRENDERED ALLOWANCES (tCO2e)'] = cumulativeSurrenderedAllowances;
      row['TOTAL SURRENDERED OFFSETS (tCO2e)'] = cumulativeSurrenderedOffsets;
      row['TOTAL BANKED ALLOWANCES (tCO2e)'] = cumulativeBanked;
      row['TOTAL ABATED EMISSIONS (tCO2e)'] = fac.implementedAbatement || 0;
      row['TOTAL PENALTIES PAID ($)'] = cumulativePenalties;
      row['CURRENT CASH BALANCE ($)'] = Math.round(fac.cash || 0);
      row['CUMULATIVE COMPLIANCE COST ($)'] = Math.round(fac.cumulativeComplianceCost || fac.complianceCost || 0);
      row['OVERALL PILOT ASSESSMENT'] = isOverallCompliant ? '✓ COMPLIANT' : '⚠ DEFICIT';
    }

    return row;
  });

  // --- SHEET 2: SYSTEM TRAJECTORY ACROSS COMPLIANCE PERIODS ---
  const progressionData = grandSummary?.periodProgression || [];
  const systemPeriodsRows = [];

  for (let p = 1; p <= totalPeriods; p++) {
    const pYears = getPeriodYears(p);
    const prog = progressionData.find(item => item.period === p);
    const h = (state.history || []).find(item => item.period === p);

    const cap = prog?.cap || (state.parameters?.periodCaps?.[p]) || Math.round((state.parameters?.totalCap || 10000000) * (p === 1 ? 1 : 1.04));
    const emissions = prog?.emissions || h?.totalSystemEmissions || (state.metrics?.totalActualEmissions || 9800000);
    const compRate = prog?.complianceRate || (h?.summary?.complianceRate) || 93.5;
    const allowVol = prog?.allowanceVolume || (p === state.currentPeriod ? (state.allowanceMarket?.volume || 0) : 0);
    const allowPrice = prog?.allowanceAvgPrice || (p === state.currentPeriod ? (state.allowanceMarket?.lastPrice || 5.0) : 5.2);
    const offsetVol = prog?.offsetVolume || (p === state.currentPeriod ? (state.offsetMarket?.volume || 0) : 0);
    const offsetPrice = prog?.offsetAvgPrice || (p === state.currentPeriod ? (state.offsetMarket?.lastPrice || 3.0) : 3.0);
    const abated = prog?.abatedTons || (h?.summary?.abatement?.abatedTons) || 0;
    const penalties = prog?.penalties || (h?.totalPenaltiesCollected) || 0;

    if (isVi) {
      systemPeriodsRows.push({
        'Kỳ Tuân Thủ': `Kỳ ${p}`,
        'Khung Năm': pYears,
        'Trần Hạn Ngạch Hệ Thống (Cap tCO2e)': cap,
        'Tổng Phát Thải Thực Tế (tCO2e)': emissions,
        'Chênh Lệch Hạn Ngạch vs Phát Thải (tCO2e)': cap - emissions,
        'Tỷ Lệ Tuân Thủ Hệ Thống (%)': `${compRate}%`,
        'KL Giao Dịch Hạn Ngạch (tCO2e)': allowVol,
        'Giá Khớp Bình Quân Hạn Ngạch ($/t)': allowPrice,
        'KL Giao Dịch Tín Chỉ (tCO2e)': offsetVol,
        'Giá Khớp Bình Quân Tín Chỉ ($/t)': offsetPrice,
        'Lượng Cắt Giảm Công Nghệ (tCO2e)': abated,
        'Tổng Tiền Phạt Thu Được ($)': penalties
      });
    } else {
      systemPeriodsRows.push({
        'Period': `Period ${p}`,
        'Years': pYears,
        'System Cap (tCO2e)': cap,
        'Actual System Emissions (tCO2e)': emissions,
        'Net Cap Balance (tCO2e)': cap - emissions,
        'Compliance Rate (%)': `${compRate}%`,
        'Allowance Volume (tCO2e)': allowVol,
        'Allowance Avg Price ($/t)': allowPrice,
        'Offset Volume (tCO2e)': offsetVol,
        'Offset Avg Price ($/t)': offsetPrice,
        'Abated Emissions (tCO2e)': abated,
        'Total Penalties Collected ($)': penalties
      });
    }
  }

  // Add Grand Total Row to Sheet 2
  if (isVi) {
    systemPeriodsRows.push({
      'Kỳ Tuân Thủ': 'TỔNG KẾT TOÀN GIAI ĐOẠN',
      'Khung Năm': `${startYear}–${endYear}`,
      'Trần Hạn Ngạch Hệ Thống (Cap tCO2e)': systemPeriodsRows.reduce((s, r) => s + (Number(r['Trần Hạn Ngạch Hệ Thống (Cap tCO2e)']) || 0), 0),
      'Tổng Phát Thải Thực Tế (tCO2e)': systemPeriodsRows.reduce((s, r) => s + (Number(r['Tổng Phát Thải Thực Tế (tCO2e)']) || 0), 0),
      'Chênh Lệch Hạn Ngạch vs Phát Thải (tCO2e)': systemPeriodsRows.reduce((s, r) => s + (Number(r['Chênh Lệch Hạn Ngạch vs Phát Thải (tCO2e)']) || 0), 0),
      'Tỷ Lệ Tuân Thủ Hệ Thống (%)': `${(systemPeriodsRows.reduce((s, r) => s + parseFloat(r['Tỷ Lệ Tuân Thủ Hệ Thống (%)']), 0) / (systemPeriodsRows.length || 1)).toFixed(1)}%`,
      'KL Giao Dịch Hạn Ngạch (tCO2e)': systemPeriodsRows.reduce((s, r) => s + (Number(r['KL Giao Dịch Hạn Ngạch (tCO2e)']) || 0), 0),
      'Giá Khớp Bình Quân Hạn Ngạch ($/t)': '—',
      'KL Giao Dịch Tín Chỉ (tCO2e)': systemPeriodsRows.reduce((s, r) => s + (Number(r['KL Giao Dịch Tín Chỉ (tCO2e)']) || 0), 0),
      'Giá Khớp Bình Quân Tín Chỉ ($/t)': '—',
      'Lượng Cắt Giảm Công Nghệ (tCO2e)': systemPeriodsRows.reduce((s, r) => s + (Number(r['Lượng Cắt Giảm Công Nghệ (tCO2e)']) || 0), 0),
      'Tổng Tiền Phạt Thu Được ($)': systemPeriodsRows.reduce((s, r) => s + (Number(r['Tổng Tiền Phạt Thu Được ($)']) || 0), 0)
    });
  }

  // --- SHEET 3: ALL MARKET TRADES AUDIT ---
  const tradeRows = allTrades.map((tr, idx) => {
    const timeStr = tr.timestamp ? new Date(tr.timestamp).toLocaleString(isVi ? 'vi-VN' : 'en-US') : 'N/A';
    const isAllow = tr.instrument === 'ALLOWANCE';
    const instrumentLabel = isVi 
      ? (isAllow ? 'Hạn Ngạch Các-bon (Quota)' : 'Tín Chỉ Bù Trừ (Offset)')
      : (isAllow ? 'Carbon Allowance' : 'Carbon Offset');

    if (isVi) {
      return {
        'STT': idx + 1,
        'Mã Giao Dịch': tr.id,
        'Thời Gian Khớp': timeStr,
        'Loại Tài Sản': instrumentLabel,
        'Mã Bên Mua': tr.buyerFacilityId || 'N/A',
        'Tên Bên Mua': tr.buyerFacilityName || 'Thị Trường',
        'Mã Bên Bán': tr.sellerFacilityId || 'N/A',
        'Tên Bên Bán': tr.sellerFacilityName || 'Thị Trường',
        'Giá Khớp ($/tCO2e)': Number(tr.price || 0),
        'Khối Lượng Khớp (tCO2e)': Number(tr.quantity || 0),
        'Tổng Giá Trị Giao Dịch ($)': Number(tr.totalCost || (tr.quantity * tr.price) || 0)
      };
    } else {
      return {
        'No.': idx + 1,
        'Trade ID': tr.id,
        'Timestamp': timeStr,
        'Instrument': instrumentLabel,
        'Buyer Facility ID': tr.buyerFacilityId || 'N/A',
        'Buyer Facility Name': tr.buyerFacilityName || 'Market',
        'Seller Facility ID': tr.sellerFacilityId || 'N/A',
        'Seller Facility Name': tr.sellerFacilityName || 'Market',
        'Execution Price ($/tCO2e)': Number(tr.price || 0),
        'Volume (tCO2e)': Number(tr.quantity || 0),
        'Total Value ($)': Number(tr.totalCost || (tr.quantity * tr.price) || 0)
      };
    }
  });

  // --- SHEET 4: ABATEMENT DECARBONIZATION PROJECTS ---
  const abatementList = [];
  facilities.forEach(fac => {
    (fac.abatementTechnologies || []).filter(t => t.implemented).forEach((t) => {
      abatementList.push({
        'STT': abatementList.length + 1,
        'Mã Cơ Sở': fac.id,
        'Tên Doanh Nghiệp': fac.name,
        'Lĩnh Vực': fac.sectorType || 'N/A',
        'Tên Giải Pháp Công Nghệ': t.nameVi || t.name,
        'Vốn Đầu Tư Capex ($)': t.capex || 0,
        'Lượng Cắt Giảm (tCO2e/năm)': t.abatementTons || 0,
        'Tiết Kiệm Opex Hàng Năm ($/năm)': t.annualOpexSavings || 0,
        'Kỳ Triển Khai': t.implementedPeriod ? `Kỳ ${t.implementedPeriod}` : `Kỳ 1`
      });
    });
  });

  // Assemble Workbook
  const wb = XLSX.utils.book_new();

  // 1. Primary Sheet: Multi-Period Emissions & Allowances
  const wsMultiPeriod = XLSX.utils.json_to_sheet(multiPeriodRows);
  XLSX.utils.book_append_sheet(wb, wsMultiPeriod, isVi ? '1. PhatThai_HanNgach_CacKy' : '1. MultiPeriod_Emissions_Cap');

  // 2. Secondary Sheet: System Trajectory
  const wsSystem = XLSX.utils.json_to_sheet(systemPeriodsRows);
  XLSX.utils.book_append_sheet(wb, wsSystem, isVi ? '2. TienTrinh_HeThong' : '2. System_Progression');

  // 3. Trade Audit Sheet
  const wsTrades = XLSX.utils.json_to_sheet(tradeRows.length > 0 ? tradeRows : [
    isVi ? { 'Thông Báo': 'Chưa có giao dịch phát sinh.' } : { 'Notice': 'No trades recorded.' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsTrades, isVi ? '3. NhatKy_GiaoDich' : '3. Trade_Audit_Trail');

  // 4. Abatement Projects
  if (abatementList.length > 0) {
    const wsAbatement = XLSX.utils.json_to_sheet(abatementList);
    XLSX.utils.book_append_sheet(wb, wsAbatement, isVi ? '4. DuAn_GiamPhatThai' : '4. Decarbonization_Projects');
  }

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = isVi
    ? `ETS_TongKet_PhatThai_Va_HanNgach_CacKy_${startYear}-${endYear}_${dateStr}.xlsx`
    : `ETS_MultiPeriod_Emissions_Allowance_Report_${startYear}-${endYear}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
