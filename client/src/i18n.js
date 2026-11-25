// Bilingual Dictionary: English & Tiếng Việt (VN)
export const translations = {
  en: {
    // Brand & Header
    brandTitle: 'ETS SIMULATOR',
    brandSubtitle: 'Vietnam Emission Trading Platform',
    vnEtsPilot: 'VN ETS Pilot',
    compliancePeriod: 'Compliance Period',
    periodLabel: 'Period',
    tradingOpen: 'Trading Open',
    policySetup: 'Policy Setup',
    complianceSettlement: 'Compliance Settlement',
    simulationConcluded: 'Simulation Concluded',
    adminActive: 'Regulator Active',
    adminLogin: 'Admin Login',
    joinFacility: 'Join Facility',
    switchFacility: 'Switch',
    logoutAdmin: 'Log out to participant view',

    // Navigation Tabs
    facilityConsole: 'Facility Console',
    marketBoard: 'Market Board',
    etsParameters: 'ETS Parameters (Admin)',
    glossary: 'Glossary & Guide',
    currencyUsd: 'USD ($)',
    currencyVnd: 'VNĐ (₫)',

    // Facility Dashboard
    actualEmissions: 'Actual Emissions',
    baselineEmissions: 'Baseline Emissions',
    freeAllocation: 'Free Allocation',
    free: 'Free',
    allowances: 'Allowances',
    offsets: 'Offsets / Credits',
    complianceSurplus: 'Compliance Surplus',
    complianceDeficit: 'Compliance Deficit',
    units: 'units',
    credits: 'credits',
    maxUsable: 'Max usable',
    readyForSettlement: 'Ready for compliance settlement',
    deficitPenaltyWarning: 'Deficit Fine',
    liquidCash: 'Liquid Cash Balance',
    periodRevenue: 'Period Revenue',
    penaltiesPaid: 'Penalties Paid',
    surrenderAndSettle: 'Surrender & Settle',
    marketFloorTab: 'Allowance & Credit Trading',
    macCurveTab: 'Decarbonization / MAC Curve',
    surrenderTab: 'Surrender & Compliance Ledger',
    directTrade: 'Direct Bilateral Trade (OTC)',
    exchangeTrading: 'Central Order Book',
    orderBookAsks: 'LỆNH CHÀO BÁN (ASKS)',
    orderBookBids: 'LỆNH CHÀO MUA (BIDS)',
    orderBookAsksDesc: 'Facilities offering to sell',
    orderBookBidsDesc: 'Facilities offering to buy',
    partnerFacility: 'Partner Enterprise',
    selectPartner: '-- Select partner enterprise --',
    agreedPrice: 'Agreed Price',
    transferVolume: 'Transfer Quantity',
    directBuy: 'Direct Buy from',
    directSell: 'Direct Sell to',
    confirmDirectTrade: 'Execute Direct Bilateral Trade',

    // MAC Curve & Abatement
    macTitle: 'Marginal Abatement Cost (MAC) Decision Engine',
    macSubtitle: 'Emission Reduction & Decarbonization Portfolio',
    macDescription: 'Compare internal abatement costs with market allowance price. Projects cheaper than market price generate direct compliance cost savings and surplus allowances to sell.',
    totalFacilityReduction: 'Total Facility Reduction',
    annualSavings: 'Annual Opex Savings',
    allowanceMarketPrice: 'Allowance Market Clearing Price',
    reductionPotential: 'Reduction Potential',
    capitalCost: 'Capital Cost (Capex)',
    unitAbatementCost: 'Unit Abatement Cost',
    implementActivity: 'Implement Activity',
    commissioned: 'Commissioned in Period',
    insufficientCash: 'Insufficient Cash',
    saveVsBuying: 'Save vs buying',
    higherThanMarket: 'Higher than market',

    // Trading Floor
    carbonAllowancesEua: 'Carbon Allowances',
    carbonOffsetsCer: 'Carbon Offsets',
    lastPrice: 'Last Price',
    highLow: '24h High / Low',
    volumeTraded: 'Volume Traded',
    orderEntry: 'Order Entry',
    available: 'Available',
    buy: 'Buy',
    sell: 'Sell',
    limitOrder: 'Limit Order',
    marketOrder: 'Market Order',
    price: 'Price',
    quantity: 'Quantity',
    estimatedValue: 'Estimated Value',
    placeOrder: 'Place Order',
    marketClosed: 'Market Closed',
    orderBookDepth: 'Order Book (Depth)',
    clearingSpread: 'Clearing Spread',
    recentTrades: 'Recent Trades',
    myActiveOrders: 'My Active Open Orders',
    cancel: 'Cancel',

    // Compliance Surrender
    surrenderDeskTitle: 'Compliance Surrender Desk',
    emissionsTarget: 'Emissions Target',
    totalSurrendered: 'Total Surrendered',
    settlementStatus: 'Settlement Status',
    covered100: '100% Covered',
    shortfall: 'Shortfall',
    surrenderAllowances: 'Surrender Carbon Allowances',
    surrenderOffsets: 'Surrender Verified Offsets',
    borrowAgainstFuture: 'Borrow Against Next Period Allocation',
    surplusRemaining: 'Surplus allowances remaining after surrender',
    bankedToNext: 'banked to next cycle',
    expiringLost: 'Expiring (lost units)',
    commitSurrender: 'Commit Compliance Surrender Package',

    // Primary Auction
    auctionTitle: 'Government Primary Auction',
    auctionSubtitle: 'Competitive Uniform Clearing Price Mechanism',
    totalOffered: 'Total Offered',
    reserveFloor: 'Reserve Floor',
    auctionClock: 'Auction Clock',
    yourBidPrice: 'Your Bid Price',
    quantityToBid: 'Quantity to Bid For',
    submitSealedBid: 'Submit Sealed Bid',

    // Market Board
    marketOverviewTitle: 'Systemwide Carbon Market Overview',
    observatorySubtitle: 'Real-time monitoring of aggregate ETS cap adherence, carbon price dynamics, and facility leaderboards.',
    systemCap: 'ETS Cap',
    correctionFactorLabel: 'Correction K',
    decarbonizationRate: 'Decarbonization Rate',
    nonComplianceFine: 'Non-Compliance Fine',
    facilityRankings: 'Facility Performance Rankings',
    topDecarbonizers: 'Top Decarbonizers',
    highestCash: 'Highest Cash Reserves',
    complianceSurplusFilter: 'Compliance Surplus',
    rank: 'Rank',
    facilityAndSector: 'Facility & Sector',
    auditLog: 'Live ETS Audit Log',
    historicalSettlements: 'Compliance Period Historical Settlements',

    // Admin Console
    adminTitle: 'ETS Regulatory Parameters',
    adminSubtitle: 'Configure caps, correction factors, allocation, offsets, and simulate market shocks.',
    openTradingRound: 'Open Trading Round',
    closeMarketCompliance: 'Close Market & Open Compliance',
    launchAuction: 'Launch Auction',
    executeSettlement: 'Execute Settlement & Penalties',
    advancePeriod: 'Advance to Period',
    resetSim: 'Reset',
    loadPreset: 'Load Regulatory Preset',
    vietnamPresetBtn: 'Vietnam ETS (2025–2026, 100% Free, 30% Offsets)',
    euPresetBtn: 'EU ETS Phase 4 (Strict, 60% Auction, -4.2% LRF)',
    californiaPresetBtn: 'California Cap-and-Trade (8% Offsets, Price Collar)',
    capSection: 'Compliance Period & Cap Growth',
    startYear: 'Start Year',
    cycleLength: 'Cycle Length (Years)',
    initialCap: 'Initial System Cap (tCO2e)',
    correctionFactor: 'Correction Factor (K % / Period)',
    tradingDuration: 'Trading Duration per Period (Seconds)',
    allocationSection: 'Allocation & Offset Flexibility',
    freeAllocRate: 'Free Allocation Rate (%)',
    offsetLimitDecree06: 'Offset Usage Limit (Decree 06)',
    auctionShareCap: 'Government Primary Auction Share (% of Cap)',
    surplusBanking: 'Surplus Allowance Banking',
    borrowingMechanism: 'Borrowing Mechanism',
    penaltiesSection: 'Penalties & Market Safeguards',
    shortfallPenaltyFine: 'Shortfall Penalty Fine ($/tCO2e)',
    marketFloor: 'Market Floor ($)',
    marketCeiling: 'Market Ceiling ($)',
    simulatedBots: 'Simulated Market Bots',
    saveParameters: 'Save & Apply Parameters',
    shocksTitle: 'Regulatory & Economic Shocks (CarbonSim)',
    shocksDescription: 'Introduce unexpected policy or macro shocks into the live market to test facility resilience.',
    triggerShock: 'Inject Market Shock',

    // Admin Login Modal
    regulatorAuth: 'Regulator Authentication',
    adminPasskey: 'Admin Passkey / Password',
    unlockAdmin: 'Unlock Admin Console',

    // AI Advisor
    aiAdvisorTitle: 'AI Carbon Portfolio Strategy Advisor',
    aiAdvisorSubtitle: 'Algorithmic compliance cost optimization',
    abatementRecommendation: 'Recommended Decarbonization Actions',
    marketRecommendation: 'Recommended Market Strategy',
    estimatedTotalCost: 'Projected Total Cost to Comply',

    // Diverse Compliance & Cohort Scale
    activeFacilityCount: 'Active Facility Cohort Count',
    facilityScalePreset: 'Facility Cohort Sizing',
    capStringency: 'Cap Stringency (% of Actual Emissions)',
    syncCapToEmissions: 'Sync Cap to Actual Emissions',
    reallocateAllowances: 'Recalculate Cap & Reallocate',
    techTier: 'Technology Tier',
    techTierAdvanced: 'Advanced Tech (Surplus)',
    techTierLegacy: 'Legacy Tech (Deficit)',
    techTierStandard: 'Standard Tech (Parity)',
    surplusBadge: 'Surplus',
    deficitBadge: 'Deficit',
    parityBadge: 'Parity',
    systemGap: 'Market Supply/Demand Gap',
    systemDeficitNotice: 'Market Scarcity (Deficit drives prices up)',
    systemSurplusNotice: 'Market Abundance (Surplus softens prices)',
    coveredPlants: 'Covered Plants'
  },

  vi: {
    // Brand & Header
    brandTitle: 'MÔ PHỎNG ETS',
    brandSubtitle: 'Sàn Mô Phỏng Thị Trường Các-bon Việt Nam',
    vnEtsPilot: 'Thí Điểm VN ETS',
    compliancePeriod: 'Kỳ Tuân Thủ',
    periodLabel: 'Kỳ',
    tradingOpen: 'Giao Dịch Mở',
    policySetup: 'Thiết Lập Chính Sách',
    complianceSettlement: 'Quyết Toán Tuân Thủ',
    simulationConcluded: 'Mô Phỏng Kết Thúc',
    adminActive: 'Cơ Quan Quản Lý (Admin)',
    adminLogin: 'Đăng Nhập Admin',
    joinFacility: 'Chọn Cơ Sở',
    switchFacility: 'Đổi',
    logoutAdmin: 'Thoát chế độ Quản lý',

    // Navigation Tabs
    facilityConsole: 'Bàn Điều Hành Cơ Sở',
    marketBoard: 'Bảng Thị Trường Chung',
    etsParameters: 'Tham Số ETS (Admin)',
    glossary: 'Thuật Ngữ & Cẩm Nang',
    currencyUsd: 'USD ($)',
    currencyVnd: 'VNĐ (₫)',

    // Facility Dashboard
    actualEmissions: 'Phát Thải Thực Tế',
    baselineEmissions: 'Phát Thải Cơ Sở (Baseline)',
    freeAllocation: 'Phân Bổ Miễn Phí',
    free: 'Miễn phí',
    allowances: 'Hạn Ngạch',
    offsets: 'Tín Chỉ Bù Trừ',
    complianceSurplus: 'Thặng Dư Tuân Thủ',
    complianceDeficit: 'Thiếu Hụt Tuân Thủ',
    units: 'hạn ngạch',
    credits: 'tín chỉ',
    maxUsable: 'Tối đa được dùng',
    readyForSettlement: 'Đã sẵn sàng quyết toán tuân thủ',
    deficitPenaltyWarning: 'Tiền Phạt Thiếu Hụt',
    liquidCash: 'Số Dư Tiền Mặt Khả Dụng',
    periodRevenue: 'Doanh Thu Kỳ',
    penaltiesPaid: 'Tiền Phạt Đã Nộp',
    surrenderAndSettle: 'Nộp Hạn Ngạch & Quyết Toán',
    marketFloorTab: 'Trao đổi hạn ngạch/tín chỉ',
    macCurveTab: 'Giảm Phát Thải / Đường MAC',
    surrenderTab: 'Sổ Nộp Hạn Ngạch & Tuân Thủ',
    directTrade: 'Mua Bán Trực Tiếp (Thỏa Thuận)',
    exchangeTrading: 'Sàn Khớp Lệnh Tập Trung',
    orderBookAsks: 'LỆNH CHÀO BÁN (ASKS)',
    orderBookBids: 'LỆNH CHÀO MUA (BIDS)',
    orderBookAsksDesc: 'Các doanh nghiệp chào bán',
    orderBookBidsDesc: 'Các doanh nghiệp chào mua',
    partnerFacility: 'Doanh nghiệp đối tác',
    selectPartner: '-- Chọn doanh nghiệp đối tác --',
    agreedPrice: 'Đơn giá thỏa thuận',
    transferVolume: 'Số lượng chuyển nhượng',
    directBuy: 'Mua trực tiếp từ',
    directSell: 'Bán trực tiếp cho',
    confirmDirectTrade: 'Xác Nhận Chuyển Nhượng Trực Tiếp',

    // MAC Curve & Abatement
    macTitle: 'Mô Hình Chi Phí Giảm Phát Thải Biên (MAC Curve)',
    macSubtitle: 'Danh Mục Giải Pháp Giảm Phát Thải & Khử Các-bon',
    macDescription: 'So sánh chi phí giảm phát thải của từng công nghệ với giá hạn ngạch thị trường. Giải pháp rẻ hơn giá thị trường sẽ tiết kiệm chi phí tuân thủ và tạo hạn ngạch dôi dư để bán sinh lời.',
    totalFacilityReduction: 'Tổng Lượng Giảm Của Cơ Sở',
    annualSavings: 'Tiết Kiệm Vận Hành (Opex)',
    allowanceMarketPrice: 'Giá Hạn Ngạch Khớp Lệnh Thị Trường',
    reductionPotential: 'Tiềm Năng Cắt Giảm',
    capitalCost: 'Chi Phí Đầu Tư (Capex)',
    unitAbatementCost: 'Chi Phí Giảm Suất Đầu Tư',
    implementActivity: 'Triển Khai Công Nghệ',
    commissioned: 'Đã đưa vào vận hành từ Kỳ',
    insufficientCash: 'Không Đủ Tiền Mặt',
    saveVsBuying: 'Rẻ hơn mua ngoài',
    higherThanMarket: 'Đắt hơn giá thị trường',

    // Trading Floor
    carbonAllowancesEua: 'Hạn Ngạch Phát Thải',
    carbonOffsetsCer: 'Tín Chỉ Các-bon Bù Trừ',
    lastPrice: 'Giá Khớp Lệnh Gần Nhất',
    highLow: 'Cao / Thấp Trong Kỳ',
    volumeTraded: 'Khối Lượng Giao Dịch',
    orderEntry: 'Đặt Lệnh Mua / Bán',
    available: 'Khả dụng',
    buy: 'Mua',
    sell: 'Bán',
    limitOrder: 'Lệnh Giới Hạn (Limit)',
    marketOrder: 'Lệnh Thị Trường (Market)',
    price: 'Mức Giá',
    quantity: 'Số Lượng',
    estimatedValue: 'Tổng Giá Trị Dự Kiến',
    placeOrder: 'Gửi Lệnh Lên Sàn',
    marketClosed: 'Thị Trường Đang Đóng',
    orderBookDepth: 'Sổ Lệnh Thị Trường (Độ Sâu)',
    clearingSpread: 'Mức Chênh Lệch / Giá Khớp',
    recentTrades: 'Nhật Ký Khớp Lệnh',
    myActiveOrders: 'Lệnh Đang Chờ Khớp Của Tôi',
    cancel: 'Hủy Lệnh',

    // Compliance Surrender
    surrenderDeskTitle: 'Bàn Nộp Hạn Ngạch Tuân Thủ',
    emissionsTarget: 'Nghĩa Vụ Phát Thải Thực Tế',
    totalSurrendered: 'Tổng Đã Nộp',
    settlementStatus: 'Trạng Thái Tuân Thủ',
    covered100: '100% Đạt Chuẩn',
    shortfall: 'Thiếu Hụt',
    surrenderAllowances: 'Nộp Hạn Ngạch Phát Thải',
    surrenderOffsets: 'Nộp Tín Chỉ Bù Trừ',
    borrowAgainstFuture: 'Vay Hạn Ngạch Từ Kỳ Tương Lai',
    surplusRemaining: 'Hạn ngạch thặng dư sau khi nộp đủ',
    bankedToNext: 'chuyển sang kỳ tiếp theo',
    expiringLost: 'Hết hạn (bị hủy)',
    commitSurrender: 'Xác Nhận Nộp Gói Tuân Thủ',

    // Primary Auction
    auctionTitle: 'Đấu Giá Hạn Ngạch Sơ Cấp Nhà Nước',
    auctionSubtitle: 'Cơ Chế Đấu Giá Một Mức Giá Khớp Thống Nhất',
    totalOffered: 'Tổng Lượng Đưa Ra Đấu Giá',
    reserveFloor: 'Mức Giá Sàn Dự Bị',
    auctionClock: 'Thời Gian Còn Lại',
    yourBidPrice: 'Mức Giá Bạn Đặt Mua',
    quantityToBid: 'Số Lượng Đặt Mua',
    submitSealedBid: 'Nộp Phiếu Đấu Giá',

    // Market Board
    marketOverviewTitle: 'Tổng Quan Thị Trường Các-bon Toàn Hệ Thống',
    observatorySubtitle: 'Giám sát mức trần phát thải (Cap), diễn biến giá các-bon và bảng xếp hạng thành tích các cơ sở.',
    systemCap: 'Hạn Mức Trần (Cap)',
    correctionFactorLabel: 'Hệ Số Hiệu Chỉnh K',
    decarbonizationRate: 'Tỷ Lệ Giảm Phát Thải',
    nonComplianceFine: 'Mức Phạt Vi Phạm Tuân Thủ',
    facilityRankings: 'Bảng Xếp Hạng Thành Tích Cơ Sở',
    topDecarbonizers: 'Dẫn Đầu Giảm Phát Thải',
    highestCash: 'Dự Trữ Tiền Mặt Lớn Nhất',
    complianceSurplusFilter: 'Thặng Dư Hạn Ngạch',
    rank: 'Hạng',
    facilityAndSector: 'Cơ Sở & Ngành',
    auditLog: 'Nhật Ký Sự Kiện Thị Trường',
    historicalSettlements: 'Lịch Sử Quyết Toán Các Kỳ Tuân Thủ',

    // Admin Console
    adminTitle: 'Quản Lý Tham Số Chính Sách ETS',
    adminSubtitle: 'Cấu hình hạn mức trần, hệ số hiệu chỉnh K, tỷ lệ phân bổ, hạn mức tín chỉ bù trừ và tạo cú sốc thị trường.',
    openTradingRound: 'Mở Phiên Giao Dịch',
    closeMarketCompliance: 'Đóng Sàn & Mở Kỳ Tuân Thủ',
    launchAuction: 'Kích Hoạt Đấu Giá',
    executeSettlement: 'Quyết Toán & Nộp Phạt',
    advancePeriod: 'Chuyển Sang Kỳ Tiếp Theo',
    resetSim: 'Khởi Tạo Lại',
    loadPreset: 'Tải Kịch Bản Mẫu',
    vietnamPresetBtn: 'Thí Điểm ETS Việt Nam (2025–2026, 100% Miễn Phí, 30% Tín Chỉ)',
    euPresetBtn: 'EU ETS Giai Đoạn 4 (Nghiêm Ngặt, 60% Đấu Giá, -4.2% LRF)',
    californiaPresetBtn: 'Cap-and-Trade California (8% Tín Chỉ, Biên Độ Giá)',
    capSection: 'Kỳ Tuân Thủ & Tăng Trưởng Hạn Mức (Cap)',
    startYear: 'Năm Khởi Điểm',
    cycleLength: 'Thời Lượng Chu Kỳ (Năm)',
    initialCap: 'Hạn Mức Trần Kỳ 1 (tCO2e)',
    correctionFactor: 'Hệ Số Hiệu Chỉnh (K % / Kỳ)',
    tradingDuration: 'Thời Lượng Giao Dịch Mỗi Kỳ (Giây)',
    allocationSection: 'Phân Bổ & Độ Linh Hoạt Tín Chỉ',
    freeAllocRate: 'Tỷ Lệ Phân Bổ Miễn Phí (%)',
    offsetLimitDecree06: 'Hạn Mức Tín Chỉ Bù Trừ (Nghị định 06)',
    auctionShareCap: 'Tỷ Lệ Đấu Giá Sơ Cấp (% Trần Cap)',
    surplusBanking: 'Cơ Chế Lưu Giữ Hạn Ngạch (Banking)',
    borrowingMechanism: 'Cơ Chế Vay Mượn Hạn Ngạch (Borrowing)',
    penaltiesSection: 'Mức Chế Tài & Bảo Đảm Thị Trường',
    shortfallPenaltyFine: 'Mức Phạt Thiếu Hụt ($/tCO2e)',
    marketFloor: 'Giá Sàn Thị Trường ($)',
    marketCeiling: 'Giá Trần Thị Trường ($)',
    simulatedBots: 'Cơ Chế Tạo Lập Thị Trường (AI Bots)',
    saveParameters: 'Lưu & Áp Dụng Tham Số',
    shocksTitle: 'Cú Sốc Thị Trường & Chính Sách (CarbonSim)',
    shocksDescription: 'Đưa vào các biến cố kinh tế / chính sách bất ngờ trong kỳ giao dịch để thử thách khả năng thích ứng của các doanh nghiệp.',
    triggerShock: 'Kích Hoạt Cú Sốc',

    // Admin Login Modal
    regulatorAuth: 'Xác Thực Cơ Quan Quản Lý',
    adminPasskey: 'Mật Khẩu Quản Trị (Admin Passkey)',
    unlockAdmin: 'Mở Khóa Bàn Quản Trị',

    // AI Advisor
    aiAdvisorTitle: 'Cố Vấn Chiến Lược Tuân Thủ Các-bon AI',
    aiAdvisorSubtitle: 'Tối ưu hóa tổng chi phí tuân thủ hạn ngạch và đầu tư',
    abatementRecommendation: 'Khuyến Nghị Đầu Tư Khử Các-bon',
    marketRecommendation: 'Khuyến Nghị Giao Dịch Thị Trường',
    estimatedTotalCost: 'Dự Báo Chi Phí Tuân Thủ Tổng Thể',

    // Diverse Compliance & Cohort Scale
    activeFacilityCount: 'Số Lượng Cơ Sở Tham Gia',
    facilityScalePreset: 'Quy Mô Thí Điểm',
    capStringency: 'Tỷ Lệ Hạn Ngạch Theo Phát Thải Thực Tế (% Cap/Phát thải)',
    syncCapToEmissions: 'Khớp Hạn Ngạch Theo Phát Thải',
    reallocateAllowances: 'Tính Lại Hạn Ngạch & Tái Phân Bổ',
    techTier: 'Phân Hạng Công Nghệ',
    techTierAdvanced: 'Công nghệ Tiên tiến (Dư thừa)',
    techTierLegacy: 'Công nghệ Lạc hậu (Thiếu hụt)',
    techTierStandard: 'Công nghệ Tiêu chuẩn (Cân bằng)',
    surplusBadge: 'Dư thừa',
    deficitBadge: 'Thiếu hụt',
    parityBadge: 'Cân bằng',
    systemGap: 'Cán Cân Cung Cầu Thị Trường',
    systemDeficitNotice: 'Khan hiếm hệ thống (Thiếu hụt thúc đẩy giá)',
    systemSurplusNotice: 'Dư thừa hệ thống (Nguồn cung dồi dào)',
    coveredPlants: 'Cơ sở phát thải'
  }
};

// Currency Converter Helper
// 1 USD = 25,000 VND
export const USD_VND_RATE = 25000;

// Active Language Detector & Locale Resolver
export function getActiveLang() {
  if (typeof globalThis !== 'undefined') {
    if (globalThis.__ets_current_lang) {
      return globalThis.__ets_current_lang;
    }
    try {
      if (globalThis.localStorage) {
        return globalThis.localStorage.getItem('ets_lang') || 'vi';
      }
    } catch (e) {}
  }
  return 'vi';
}

export function getNumberLocale(lang) {
  const effective = lang || getActiveLang();
  return (effective === 'vi' || effective === 'vi-VN') ? 'vi-VN' : 'en-US';
}

// Universal Number Formatter
// In 'vi': '.' for thousands, ',' for decimals (e.g. 1.234.567,89)
// In 'en': ',' for thousands, '.' for decimals (e.g. 1,234,567.89)
export function formatNumber(val, lang = getActiveLang(), options = {}) {
  if (val == null || isNaN(val)) return '0';
  const locale = getNumberLocale(lang);
  return new Intl.NumberFormat(locale, options).format(Number(val));
}

export function formatPercent(val, lang = getActiveLang(), decimals = 1) {
  if (val == null || isNaN(val)) return '0%';
  const numStr = formatNumber(val, lang, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${numStr}%`;
}

// Currency Formatter consistent with active language locale
// Tiếng Việt: '.' hàng nghìn, ',' hàng thập phân (vd: $1.234,50 hoặc 2.500.000 ₫)
// Tiếng Anh: ',' hàng nghìn, '.' hàng thập phân (vd: $1,234.50 hoặc 2,500,000 ₫)
export function formatCurrency(amountUsd, currency = 'USD', compact = false, lang = getActiveLang(), options = {}) {
  if (amountUsd == null || isNaN(amountUsd)) return '0';
  const effectiveLang = lang || getActiveLang();
  const isVi = (effectiveLang === 'vi' || effectiveLang === 'vi-VN');
  const locale = getNumberLocale(effectiveLang);
  const isNegative = amountUsd < 0;
  const absAmount = Math.abs(amountUsd);

  if (currency === 'VND') {
    const vnd = absAmount * USD_VND_RATE;
    if (compact) {
      if (vnd >= 1e9) {
        const num = formatNumber(vnd / 1e9, effectiveLang, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
        return `${isNegative ? '-' : ''}${num} ${isVi ? 'tỷ ₫' : 'B ₫'}`;
      }
      if (vnd >= 1e6) {
        const num = formatNumber(vnd / 1e6, effectiveLang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        return `${isNegative ? '-' : ''}${num} ${isVi ? 'tr ₫' : 'M ₫'}`;
      }
    }
    const val = new Intl.NumberFormat(locale, options).format(Math.round(vnd));
    return `${isNegative ? '-' : ''}${val} ₫`;
  } else {
    if (compact) {
      if (absAmount >= 1e6) {
        const num = formatNumber(absAmount / 1e6, effectiveLang, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
        return `${isNegative ? '-' : ''}$${num}M`;
      }
      if (absAmount >= 1e3) {
        const num = formatNumber(absAmount / 1e3, effectiveLang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        return `${isNegative ? '-' : ''}$${num}k`;
      }
    }
    const hasFractions = absAmount % 1 !== 0;
    const defaultOptions = {
      minimumFractionDigits: hasFractions ? 2 : 0,
      maximumFractionDigits: 2,
      ...options
    };
    const val = new Intl.NumberFormat(locale, defaultOptions).format(absAmount);
    return `${isNegative ? '-' : ''}$${val}`;
  }
}

// Global monkey-patch for Number.prototype.toLocaleString:
// Automatically formats numbers according to the active language:
// Tiếng Việt: dấu chấm '.' cho hàng nghìn, dấu phẩy ',' cho hàng thập phân.
// Tiếng Anh: dấu phẩy ',' cho hàng nghìn, dấu chấm '.' cho hàng thập phân.
if (typeof Number !== 'undefined' && !Number.prototype.__ets_patched) {
  const origToLocaleString = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function(locales, options) {
    let targetLocale = locales;
    if (!targetLocale) {
      targetLocale = getNumberLocale();
    } else if (targetLocale === 'vi' || targetLocale === 'vi-VN') {
      targetLocale = 'vi-VN';
    } else if (targetLocale === 'en' || targetLocale === 'en-US') {
      targetLocale = 'en-US';
    }
    try {
      return origToLocaleString.call(this, targetLocale, options);
    } catch (e) {
      return origToLocaleString.call(this, targetLocale);
    }
  };
  Number.prototype.__ets_patched = true;
}

// Bilingual Abatement Technologies Dictionary
export const TECH_TRANSLATIONS = {
  turb_eff: {
    name: {
      en: 'Turbine Heat Rate & Combustion Optimization',
      vi: 'Tối ưu hóa nhiệt trị tua-bin & hiệu suất buồng đốt'
    },
    category: {
      en: 'Energy Efficiency',
      vi: 'Hiệu quả năng lượng'
    },
    description: {
      en: 'Digital combustor tuning and blade aerodynamic coating to cut coal consumption.',
      vi: 'Cân chỉnh buồng đốt số hóa và phủ khí động học cánh tua-bin nhằm giảm suất tiêu hao than mịn.'
    }
  },
  biomass_co: {
    name: {
      en: 'Wood Pellet & Biomass Co-firing (10%)',
      vi: 'Đồng đốt viên nén gỗ & sinh khối (10%)'
    },
    category: {
      en: 'Fuel Switching',
      vi: 'Chuyển đổi nhiên liệu'
    },
    description: {
      en: 'Blend domestic certified plantation wood pellets into pulverizers.',
      vi: 'Phối trộn viên nén gỗ rừng trồng đạt chứng chỉ vào máy nghiền than giảm phát thải hóa thạch.'
    }
  },
  bess_storage: {
    name: {
      en: 'Substation BESS Peak Shaving Battery',
      vi: 'Hệ thống pin lưu trữ BESS cắt giảm phụ tải đỉnh'
    },
    category: {
      en: 'Electrification',
      vi: 'Điện khí hóa & Lưu trữ'
    },
    description: {
      en: 'Battery storage eliminates low-efficiency heavy oil start-up firings.',
      vi: 'Pin lưu trữ năng lượng giúp loại bỏ các chu kỳ khởi động đốt dầu FO hiệu suất thấp.'
    }
  },
  ccus_power: {
    name: {
      en: 'Post-Combustion Carbon Capture (CCUS)',
      vi: 'Thu giữ & tận dụng các-bon sau đốt (CCUS)'
    },
    category: {
      en: 'Carbon Capture',
      vi: 'Thu giữ các-bon'
    },
    description: {
      en: 'Chemical amine absorption unit capturing CO2 for industrial reuse.',
      vi: 'Hệ thống hấp thụ bằng dung dịch amine hóa học thu gom khí CO2 phục vụ công nghiệp.'
    }
  },
  whr_power: {
    name: {
      en: 'Waste Heat Recovery (WHR) Generator',
      vi: 'Phát điện tận dụng nhiệt dư khí thải (WHR)'
    },
    category: {
      en: 'Energy Efficiency',
      vi: 'Hiệu quả năng lượng'
    },
    description: {
      en: 'Generate captive power using preheater exhaust and clinker cooler heat.',
      vi: 'Phát điện tự dùng từ nhiệt khí thải tháp trao đổi nhiệt và giàn làm nguội clinker.'
    }
  },
  alt_fuels: {
    name: {
      en: 'Alternative Waste-Derived Fuels (AF)',
      vi: 'Sử dụng nhiên liệu thay thế từ rác thải (AF)'
    },
    category: {
      en: 'Fuel Switching',
      vi: 'Chuyển đổi nhiên liệu'
    },
    description: {
      en: 'Co-process sorted municipal waste, rice husks, and tire fluff in kiln.',
      vi: 'Đồng xử lý rác thải sinh hoạt phân loại, trấu nghiền và vụn cao su trong lò nung clinker.'
    }
  },
  clinker_sub: {
    name: {
      en: 'Calcined Clay & Pozzolan Blending',
      vi: 'Phối trộn sét nung hoạt tính & Puzolan'
    },
    category: {
      en: 'Process Optimization',
      vi: 'Tối ưu hóa quy trình'
    },
    description: {
      en: 'Lower clinker ratio in finished cement by blending activated pozzolans.',
      vi: 'Giảm tỷ lệ clinker trong xi măng thành phẩm bằng phụ gia khoáng hoạt tính cao.'
    }
  },
  oxyfuel_calciner: {
    name: {
      en: 'Oxyfuel Calciner Retrofit',
      vi: 'Cải tạo buồng phân hủy công nghệ Oxy-fuel'
    },
    category: {
      en: 'Advanced Low-Carbon',
      vi: 'Công nghệ các-bon thấp tiên tiến'
    },
    description: {
      en: 'High-purity oxygen combustion enabling 90% CO2 capture readiness.',
      vi: 'Đốt bằng oxy độ tinh khiết cao tạo dòng khí CO2 đậm đặc, sẵn sàng thu giữ 90% phát thải.'
    }
  },
  scrap_preheat: {
    name: {
      en: 'Scrap Preheating & Ladle Thermal Audit',
      vi: 'Gia nhiệt thép phế & tối ưu nhiệt thùng rót'
    },
    category: {
      en: 'Energy Efficiency',
      vi: 'Hiệu quả năng lượng'
    },
    description: {
      en: 'Preheat steel scrap using converter flue gas before furnace charging.',
      vi: 'Sử dụng nhiệt khí thải lò thổi để gia nhiệt trước thép phế liệu nạp vào lò luyện.'
    }
  },
  topgas_trt: {
    name: {
      en: 'Blast Furnace Top-Gas Recovery Turbine (TRT)',
      vi: 'Tua-bin thu hồi áp suất khí đỉnh lò cao (TRT)'
    },
    category: {
      en: 'Energy Efficiency',
      vi: 'Hiệu quả năng lượng'
    },
    description: {
      en: 'Extract energy from high-pressure furnace off-gas expansion.',
      vi: 'Tận dụng áp lực khí đỉnh lò cao giãn nở qua tua-bin phát điện không tiêu thụ thêm nhiên liệu.'
    }
  },
  eaf_shift: {
    name: {
      en: 'Hybrid Electric Arc Furnace (EAF) Shift',
      vi: 'Chuyển đổi sang lò hồ quang điện lai (EAF)'
    },
    category: {
      en: 'Electrification',
      vi: 'Điện khí hóa'
    },
    description: {
      en: 'Shift production line from coal blast furnace to green electric arc furnace.',
      vi: 'Chuyển đổi dây chuyền luyện thép từ lò cao đốt than sang lò hồ quang điện phát thải thấp.'
    }
  },
  h2_dri: {
    name: {
      en: 'Hydrogen Direct Reduction (H2-DRI)',
      vi: 'Hoàn nguyên quặng sắt trực tiếp bằng Hydro xanh (H2-DRI)'
    },
    category: {
      en: 'Breakthrough Tech',
      vi: 'Công nghệ đột phá'
    },
    description: {
      en: 'Zero-carbon green hydrogen replacing metallurgical coking coal.',
      vi: 'Sử dụng hydro xanh không phát thải thay thế hoàn toàn than cốc trong luyện thép.'
    }
  }
};

export function getTechName(tech, lang = 'vi') {
  if (!tech) return '';
  if (lang === 'vi') {
    if (tech.nameVi) return tech.nameVi;
    if (TECH_TRANSLATIONS[tech.id]?.name?.vi) return TECH_TRANSLATIONS[tech.id].name.vi;
  }
  return tech.nameEn || tech.name || '';
}

export function getTechCategory(tech, lang = 'vi') {
  if (!tech) return '';
  if (lang === 'vi') {
    if (tech.categoryVi) return tech.categoryVi;
    if (TECH_TRANSLATIONS[tech.id]?.category?.vi) return TECH_TRANSLATIONS[tech.id].category.vi;
  }
  return tech.categoryEn || tech.category || '';
}

export function getTechDescription(tech, lang = 'vi') {
  if (!tech) return '';
  if (lang === 'vi') {
    if (tech.descriptionVi) return tech.descriptionVi;
    if (TECH_TRANSLATIONS[tech.id]?.description?.vi) return TECH_TRANSLATIONS[tech.id].description.vi;
  }
  return tech.descriptionEn || tech.description || '';
}

export const FACILITY_TECH_DESC_TRANSLATIONS = {
  'Vintage subcritical pulverized coal boiler with high heat rate': 'Lò hơi than bột cận tới hạn thế hệ cũ có suất tiêu hao nhiệt cao',
  'Ultra-supercritical (USC) unit with combustion optimization & AI tuning': 'Tổ máy siêu siêu tới hạn (USC) tối ưu buồng đốt & điều khiển AI',
  'Standard subcritical coal generation unit operating at benchmark': 'Tổ máy than bột cận tới hạn tiêu chuẩn vận hành theo định mức phát thải',
  'Supercritical boiler with digital heat-rate management': 'Lò hơi siêu tới hạn với hệ thống quản lý suất tiêu hao nhiệt số hóa',
  'Standard baseload generation unit meeting sector emission factor': 'Tổ máy phát điện phụ tải nền tiêu chuẩn đạt hệ số phát thải ngành',
  'Advanced USC technology with low parasitic load and flue gas heat recovery': 'Công nghệ USC tiên tiến với tự dùng điện thấp và thu hồi nhiệt khí thải',
  'Circulating Fluidized Bed (CFB) with low-temperature clean combustion': 'Lò tầng sôi tuần hoàn (CFB) công nghệ đốt sạch nhiệt độ thấp',
  'Aging subcritical unit with degraded turbine efficiency': 'Tổ máy cận tới hạn lâu năm suy giảm hiệu suất tua-bin',
  'Standard coal-fired plant with standard electrostatic precipitation': 'Nhà máy đốt than tiêu chuẩn với lọc bụi tĩnh điện quy chuẩn',
  'Standard grid-connected baseload thermal station': 'Trạm nhiệt điện phụ tải nền đấu nối lưới điện tiêu chuẩn',
  'Modern CFB unit with biomass blending capability': 'Tổ máy tầng sôi tuần hoàn hiện đại có khả năng đồng đốt sinh khối',
  'Low-rank anthracite firing with high auxiliary energy consumption': 'Đốt than antraxit phẩm cấp thấp với điện tự dùng phụ trợ cao',
  'High-efficiency supercritical station with variable-speed draft fans': 'Nhà máy siêu tới hạn hiệu suất cao trang bị quạt gió biến tần',
  'Small-scale vintage boiler with severe thermal leakage': 'Lò hơi quy mô nhỏ cũ kỹ tổn thất nhiệt năng lớn',
  'Outdated captive power boiler needing overhaul': 'Lò hơi phát điện tự dùng lạc hậu cần đại tu nâng cấp',
  'Lignite-firing legacy unit with high moisture penalty': 'Tổ máy đốt than non công nghệ cũ chịu tổn thất độ ẩm cao',
  'Oldest subcritical installation in the fleet with maximum emission intensity': 'Tổ máy cận tới hạn lâu đời nhất với cường độ phát thải cao nhất',
  'Mine-mouth small unit with degraded thermal insulation': 'Tổ máy nhỏ tại miệng mỏ suy giảm lớp bảo ôn cách nhiệt',
  'Supercritical plant with variable frequency drives on feed pumps': 'Nhà máy siêu tới hạn với biến tần điều khiển bơm nước cấp',
  'CFB unit burning coal slurry and rejects efficiently': 'Tổ máy tầng sôi đốt tận dụng bùn than và xỉ than hiệu quả',
  'Modern plant with pre-drying coal handling system': 'Nhà máy hiện đại có hệ thống sấy sơ bộ than nhiên liệu',
  'Standard subcritical unit with average heat rate': 'Tổ máy cận tới hạn tiêu chuẩn với suất tiêu hao nhiệt trung bình',
  'Subcritical station needing burner upgrade': 'Nhà máy cận tới hạn cần nâng cấp hệ thống béc đốt',
  'High-performance USC unit connected to 500kV grid': 'Tổ máy siêu siêu tới hạn (USC) hiệu suất cao đấu nối lưới 500kV',
  'CFB station with in-furnace desulfurization': 'Nhà máy tầng sôi tuần hoàn có khử lưu huỳnh trực tiếp trong buồng đốt',
  'Captive plant with erratic load following and high fuel consumption': 'Nhà máy tự dùng theo phụ tải dao động tiêu hao nhiên liệu lớn',
  'Advanced supercritical unit with optimized steam cycle': 'Tổ máy siêu tới hạn tiên tiến với chu trình hơi nước tối ưu',
  'Standard pulverized coal boiler at design baseline': 'Lò hơi than bột tiêu chuẩn vận hành đúng đường cơ sở thiết kế',
  'Subcritical plant with high air ingress in air preheaters': 'Nhà máy cận tới hạn lọt gió nhiều ở bộ sấy không khí',
  'Older captive unit with outdated steam turbines': 'Tổ máy tự dùng cũ với tua-bin hơi thế hệ cũ',
  'Standard power plant with routine maintenance': 'Nhà máy nhiệt điện tiêu chuẩn bảo dưỡng định kỳ',
  'Modern plant with closed cooling tower reducing parasitic power': 'Nhà máy hiện đại dùng tháp làm mát kín giảm điện tự dùng',
  'Small industrial power unit with poor fuel-air control': 'Tổ máy nhiệt điện công nghiệp nhỏ kiểm soát tỷ lệ gió-than kém',
  'Standard subcritical generation facility': 'Cơ sở phát điện cận tới hạn tiêu chuẩn',
  'Advanced USC facility with automated sootblowing': 'Cơ sở siêu siêu tới hạn (USC) có hệ thống thổi bụi tự động'
};

export function getFacilityTechDesc(fac, lang = 'vi') {
  if (!fac) return '';
  if (lang === 'vi') {
    if (fac.techDescVi) return fac.techDescVi;
    if (fac.techDesc && FACILITY_TECH_DESC_TRANSLATIONS[fac.techDesc]) {
      return FACILITY_TECH_DESC_TRANSLATIONS[fac.techDesc];
    }
  }
  return fac.techDesc || '';
}
