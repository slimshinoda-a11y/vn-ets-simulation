// Sector definitions and 110 Vietnamese Covered Facilities (Pilot ETS under Decision 01/2022/QD-TTg & Decree 06/2022/ND-CP)

const SECTOR_TEMPLATES = {
  power: {
    sectorType: 'Power & Utilities (Nhiệt điện)',
    icon: 'Zap',
    defaultBaseline: 95000,
    startingCash: 500000,
    annualRevenue: 850000,
    technologies: [
      {
        id: 'turb_eff',
        name: 'Turbine Heat Rate & Combustion Optimization',
        nameVi: 'Tối ưu hóa nhiệt trị tua-bin & hiệu suất buồng đốt',
        category: 'Energy Efficiency',
        categoryVi: 'Hiệu quả năng lượng',
        abatementTons: 8000,
        capex: 16000, // $2.00 / tCO2e
        unitCost: 2.00,
        annualOpexSavings: 9000,
        description: 'Digital combustor tuning and blade aerodynamic coating to cut coal consumption.',
        descriptionVi: 'Cân chỉnh buồng đốt số hóa và phủ khí động học cánh tua-bin nhằm giảm suất tiêu hao than mịn.'
      },
      {
        id: 'biomass_co',
        name: 'Wood Pellet & Biomass Co-firing (10%)',
        nameVi: 'Đồng đốt viên nén gỗ & sinh khối (10%)',
        category: 'Fuel Switching',
        categoryVi: 'Chuyển đổi nhiên liệu',
        abatementTons: 18000,
        capex: 63000, // $3.50 / tCO2e
        unitCost: 3.50,
        annualOpexSavings: 7000,
        description: 'Blend domestic certified plantation wood pellets into pulverizers.',
        descriptionVi: 'Phối trộn viên nén gỗ rừng trồng đạt chứng chỉ vào máy nghiền than giảm phát thải hóa thạch.'
      },
      {
        id: 'bess_storage',
        name: 'Substation BESS Peak Shaving Battery',
        nameVi: 'Hệ thống pin lưu trữ BESS cắt giảm phụ tải đỉnh',
        category: 'Electrification',
        categoryVi: 'Điện khí hóa & Lưu trữ',
        abatementTons: 10000,
        capex: 48000, // $4.80 / tCO2e
        unitCost: 4.80,
        annualOpexSavings: 12000,
        description: 'Battery storage eliminates low-efficiency heavy oil start-up firings.',
        descriptionVi: 'Pin lưu trữ năng lượng giúp loại bỏ các chu kỳ khởi động đốt dầu FO hiệu suất thấp.'
      },
      {
        id: 'ccus_power',
        name: 'Post-Combustion Carbon Capture (CCUS)',
        nameVi: 'Thu giữ & tận dụng các-bon sau đốt (CCUS)',
        category: 'Carbon Capture',
        categoryVi: 'Thu giữ các-bon',
        abatementTons: 40000,
        capex: 480000, // $12.00 / tCO2e
        unitCost: 12.00,
        annualOpexSavings: -15000,
        description: 'Chemical amine absorption unit capturing CO2 for industrial reuse.',
        descriptionVi: 'Hệ thống hấp thụ bằng dung dịch amine hóa học thu gom khí CO2 phục vụ công nghiệp.'
      }
    ]
  },
  cement: {
    sectorType: 'Non-Metallic Minerals (Xi măng)',
    icon: 'Factory',
    defaultBaseline: 75000,
    startingCash: 420000,
    annualRevenue: 680000,
    technologies: [
      {
        id: 'whr_power',
        name: 'Waste Heat Recovery (WHR) Generator',
        nameVi: 'Phát điện tận dụng nhiệt dư khí thải (WHR)',
        category: 'Energy Efficiency',
        categoryVi: 'Hiệu quả năng lượng',
        abatementTons: 9000,
        capex: 19800, // $2.20 / tCO2e
        unitCost: 2.20,
        annualOpexSavings: 18000,
        description: 'Generate captive power using preheater exhaust and clinker cooler heat.',
        descriptionVi: 'Phát điện tự dùng từ nhiệt khí thải tháp trao đổi nhiệt và giàn làm nguội clinker.'
      },
      {
        id: 'alt_fuels',
        name: 'Alternative Waste-Derived Fuels (AF)',
        nameVi: 'Sử dụng nhiên liệu thay thế từ rác thải (AF)',
        category: 'Fuel Switching',
        categoryVi: 'Chuyển đổi nhiên liệu',
        abatementTons: 14000,
        capex: 44800, // $3.20 / tCO2e
        unitCost: 3.20,
        annualOpexSavings: 14000,
        description: 'Co-process sorted municipal waste, rice husks, and tire fluff in kiln.',
        descriptionVi: 'Đồng xử lý rác thải sinh hoạt phân loại, trấu nghiền và vụn cao su trong lò nung clinker.'
      },
      {
        id: 'clinker_sub',
        name: 'Calcined Clay & Pozzolan Blending',
        nameVi: 'Phối trộn sét nung hoạt tính & Puzolan',
        category: 'Process Optimization',
        categoryVi: 'Tối ưu hóa quy trình',
        abatementTons: 16000,
        capex: 80000, // $5.00 / tCO2e
        unitCost: 5.00,
        annualOpexSavings: 15000,
        description: 'Lower clinker ratio in finished cement by blending activated pozzolans.',
        descriptionVi: 'Giảm tỷ lệ clinker trong xi măng thành phẩm bằng phụ gia khoáng hoạt tính cao.'
      },
      {
        id: 'oxyfuel_calciner',
        name: 'Oxyfuel Calciner Retrofit',
        nameVi: 'Cải tạo buồng phân hủy công nghệ Oxy-fuel',
        category: 'Advanced Low-Carbon',
        categoryVi: 'Công nghệ các-bon thấp tiên tiến',
        abatementTons: 30000,
        capex: 285000, // $9.50 / tCO2e
        unitCost: 9.50,
        annualOpexSavings: -8000,
        description: 'High-purity oxygen combustion enabling 90% CO2 capture readiness.',
        descriptionVi: 'Đốt bằng oxy độ tinh khiết cao tạo dòng khí CO2 đậm đặc, sẵn sàng thu giữ 90% phát thải.'
      }
    ]
  },
  steel: {
    sectorType: 'Metals & Mining (Luyện kim & Thép)',
    icon: 'Flame',
    defaultBaseline: 110000,
    startingCash: 600000,
    annualRevenue: 980000,
    technologies: [
      {
        id: 'scrap_preheat',
        name: 'Scrap Preheating & Ladle Thermal Audit',
        nameVi: 'Gia nhiệt thép phế & tối ưu nhiệt thùng rót',
        category: 'Energy Efficiency',
        categoryVi: 'Hiệu quả năng lượng',
        abatementTons: 12000,
        capex: 28800, // $2.40 / tCO2e
        unitCost: 2.40,
        annualOpexSavings: 16000,
        description: 'Preheat steel scrap using converter flue gas before furnace charging.',
        descriptionVi: 'Sử dụng nhiệt khí thải lò thổi để gia nhiệt trước thép phế liệu nạp vào lò luyện.'
      },
      {
        id: 'topgas_trt',
        name: 'Blast Furnace Top-Gas Recovery Turbine (TRT)',
        nameVi: 'Tua-bin thu hồi áp suất khí đỉnh lò cao (TRT)',
        category: 'Energy Efficiency',
        categoryVi: 'Hiệu quả năng lượng',
        abatementTons: 16000,
        capex: 56000, // $3.50 / tCO2e
        unitCost: 3.50,
        annualOpexSavings: 24000,
        description: 'Extract energy from high-pressure furnace off-gas expansion.',
        descriptionVi: 'Tận dụng áp lực khí đỉnh lò cao giãn nở qua tua-bin phát điện không tiêu thụ thêm nhiên liệu.'
      },
      {
        id: 'eaf_shift',
        name: 'Hybrid Electric Arc Furnace (EAF) Shift',
        nameVi: 'Chuyển đổi sang lò hồ quang điện lai (EAF)',
        category: 'Electrification',
        categoryVi: 'Điện khí hóa',
        abatementTons: 40000,
        capex: 280000, // $7.00 / tCO2e
        unitCost: 7.00,
        annualOpexSavings: 20000,
        description: 'Shift production line from coal blast furnace to green electric arc furnace.',
        descriptionVi: 'Chuyển đổi dây chuyền luyện thép từ lò cao đốt than sang lò hồ quang điện phát thải thấp.'
      },
      {
        id: 'h2_dri',
        name: 'Hydrogen Direct Reduction (H2-DRI)',
        nameVi: 'Hoàn nguyên quặng sắt trực tiếp bằng Hydro xanh (H2-DRI)',
        category: 'Breakthrough Tech',
        categoryVi: 'Công nghệ đột phá',
        abatementTons: 50000,
        capex: 750000, // $15.00 / tCO2e
        unitCost: 15.00,
        annualOpexSavings: -25000,
        description: 'Zero-carbon green hydrogen replacing metallurgical coking coal.',
        descriptionVi: 'Sử dụng hydro xanh không phát thải thay thế hoàn toàn than cốc trong luyện thép.'
      }
    ]
  }
};

// 110 Anonymous Covered Facilities under the ETS Simulation Platform
// Calibrated with realistic emission intensities reflecting diverse technologies:
// - ADVANCED (~38% of facilities): Emission Intensity Ratio 0.65 - 0.78 (Generates Persistent Surplus)
// - STANDARD (~25% of facilities): Emission Intensity Ratio 0.94 - 1.05 (Near Parity Benchmark)
// - LEGACY   (~37% of facilities): Emission Intensity Ratio 1.25 - 1.55 (Faces Persistent Deficit)
const VN_110_FACILITIES_LIST = [
  // --- THERMAL POWER SECTOR (35 Anonymous Plants) ---
  { id: 'vn_pow_01', name: 'Power Facility P-01', sector: 'power', baseline: 120000, techTier: 'LEGACY', emissionRatio: 1.35, techDesc: 'Vintage subcritical pulverized coal boiler with high heat rate' },
  { id: 'vn_pow_02', name: 'Power Facility P-02', sector: 'power', baseline: 145000, techTier: 'ADVANCED', emissionRatio: 0.68, techDesc: 'Ultra-supercritical (USC) unit with combustion optimization & AI tuning' },
  { id: 'vn_pow_03', name: 'Power Facility P-03', sector: 'power', baseline: 135000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Standard subcritical coal generation unit operating at benchmark' },
  { id: 'vn_pow_04', name: 'Power Facility P-04', sector: 'power', baseline: 150000, techTier: 'ADVANCED', emissionRatio: 0.72, techDesc: 'Supercritical boiler with digital heat-rate management' },
  { id: 'vn_pow_05', name: 'Power Facility P-05', sector: 'power', baseline: 140000, techTier: 'STANDARD', emissionRatio: 0.99, techDesc: 'Standard baseload generation unit meeting sector emission factor' },
  { id: 'vn_pow_06', name: 'Power Facility P-06', sector: 'power', baseline: 130000, techTier: 'ADVANCED', emissionRatio: 0.65, techDesc: 'Advanced USC technology with low parasitic load and flue gas heat recovery' },
  { id: 'vn_pow_07', name: 'Power Facility P-07', sector: 'power', baseline: 125000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'Circulating Fluidized Bed (CFB) with low-temperature clean combustion' },
  { id: 'vn_pow_08', name: 'Power Facility P-08', sector: 'power', baseline: 85000, techTier: 'LEGACY', emissionRatio: 1.38, techDesc: 'Aging subcritical unit with degraded turbine efficiency' },
  { id: 'vn_pow_09', name: 'Power Facility P-09', sector: 'power', baseline: 130000, techTier: 'STANDARD', emissionRatio: 1.02, techDesc: 'Standard coal-fired plant with standard electrostatic precipitation' },
  { id: 'vn_pow_10', name: 'Power Facility P-10', sector: 'power', baseline: 125000, techTier: 'STANDARD', emissionRatio: 0.98, techDesc: 'Standard grid-connected baseload thermal station' },
  { id: 'vn_pow_11', name: 'Power Facility P-11', sector: 'power', baseline: 95000, techTier: 'ADVANCED', emissionRatio: 0.73, techDesc: 'Modern CFB unit with biomass blending capability' },
  { id: 'vn_pow_12', name: 'Power Facility P-12', sector: 'power', baseline: 105000, techTier: 'LEGACY', emissionRatio: 1.32, techDesc: 'Low-rank anthracite firing with high auxiliary energy consumption' },
  { id: 'vn_pow_13', name: 'Power Facility P-13', sector: 'power', baseline: 140000, techTier: 'ADVANCED', emissionRatio: 0.69, techDesc: 'High-efficiency supercritical station with variable-speed draft fans' },
  { id: 'vn_pow_14', name: 'Power Facility P-14', sector: 'power', baseline: 65000, techTier: 'LEGACY', emissionRatio: 1.42, techDesc: 'Small-scale vintage boiler with severe thermal leakage' },
  { id: 'vn_pow_15', name: 'Power Facility P-15', sector: 'power', baseline: 55000, techTier: 'LEGACY', emissionRatio: 1.45, techDesc: 'Outdated captive power boiler needing overhaul' },
  { id: 'vn_pow_16', name: 'Power Facility P-16', sector: 'power', baseline: 50000, techTier: 'LEGACY', emissionRatio: 1.50, techDesc: 'Lignite-firing legacy unit with high moisture penalty' },
  { id: 'vn_pow_17', name: 'Power Facility P-17', sector: 'power', baseline: 45000, techTier: 'LEGACY', emissionRatio: 1.55, techDesc: 'Oldest subcritical installation in the fleet with maximum emission intensity' },
  { id: 'vn_pow_18', name: 'Power Facility P-18', sector: 'power', baseline: 40000, techTier: 'LEGACY', emissionRatio: 1.40, techDesc: 'Mine-mouth small unit with degraded thermodynamic cycle' },
  { id: 'vn_pow_19', name: 'Power Facility P-19', sector: 'power', baseline: 90000, techTier: 'STANDARD', emissionRatio: 1.03, techDesc: 'Standard commercial power generator operating at average heat rate' },
  { id: 'vn_pow_20', name: 'Power Facility P-20', sector: 'power', baseline: 155000, techTier: 'ADVANCED', emissionRatio: 0.66, techDesc: 'State-of-the-art USC flagship with automated combustion control' },
  { id: 'vn_pow_21', name: 'Power Facility P-21', sector: 'power', baseline: 110000, techTier: 'ADVANCED', emissionRatio: 0.67, techDesc: 'Combined Cycle Gas Turbine (CCGT) with low carbon intensity per MWh' },
  { id: 'vn_pow_22', name: 'Power Facility P-22', sector: 'power', baseline: 105000, techTier: 'ADVANCED', emissionRatio: 0.68, techDesc: 'Modern F-class gas turbine with high thermodynamic cycle efficiency' },
  { id: 'vn_pow_23', name: 'Power Facility P-23', sector: 'power', baseline: 80000, techTier: 'ADVANCED', emissionRatio: 0.71, techDesc: 'High-efficiency combined cycle gas generation' },
  { id: 'vn_pow_24', name: 'Power Facility P-24', sector: 'power', baseline: 115000, techTier: 'ADVANCED', emissionRatio: 0.69, techDesc: 'Multi-shaft CCGT cluster with advanced heat recovery steam generator' },
  { id: 'vn_pow_25', name: 'Power Facility P-25', sector: 'power', baseline: 110000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'Natural gas combined cycle with 58% thermal efficiency' },
  { id: 'vn_pow_26', name: 'Power Facility P-26', sector: 'power', baseline: 75000, techTier: 'STANDARD', emissionRatio: 1.04, techDesc: 'Heavy oil peaking plant maintaining standby grid readiness' },
  { id: 'vn_pow_27', name: 'Power Facility P-27', sector: 'power', baseline: 60000, techTier: 'STANDARD', emissionRatio: 1.00, techDesc: 'Standard open/combined cycle gas support plant' },
  { id: 'vn_pow_28', name: 'Power Facility P-28', sector: 'power', baseline: 135000, techTier: 'ADVANCED', emissionRatio: 0.72, techDesc: 'New commercial supercritical unit with low net plant heat rate' },
  { id: 'vn_pow_29', name: 'Power Facility P-29', sector: 'power', baseline: 125000, techTier: 'ADVANCED', emissionRatio: 0.74, techDesc: 'Modern supercritical installation with automated air-fuel ratio control' },
  { id: 'vn_pow_30', name: 'Power Facility P-30', sector: 'power', baseline: 85000, techTier: 'LEGACY', emissionRatio: 1.34, techDesc: 'Industrial captive boiler with unoptimized auxiliary steam consumption' },
  { id: 'vn_pow_31', name: 'Power Facility P-31', sector: 'power', baseline: 65000, techTier: 'LEGACY', emissionRatio: 1.37, techDesc: 'Pulp & paper captive coal boiler with high flue heat loss' },
  { id: 'vn_pow_32', name: 'Power Facility P-32', sector: 'power', baseline: 55000, techTier: 'LEGACY', emissionRatio: 1.39, techDesc: 'Chemical manufacturing captive thermal boiler' },
  { id: 'vn_pow_33', name: 'Power Facility P-33', sector: 'power', baseline: 70000, techTier: 'LEGACY', emissionRatio: 1.36, techDesc: 'Agro-processing captive generation line with vintage hardware' },
  { id: 'vn_pow_34', name: 'Power Facility P-34', sector: 'power', baseline: 90000, techTier: 'STANDARD', emissionRatio: 0.98, techDesc: 'Standard configuration plant aligning with national grid benchmarks' },
  { id: 'vn_pow_35', name: 'Power Facility P-35', sector: 'power', baseline: 75000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Refinery captive cogeneration plant operating at balanced baseline' },

  // --- CEMENT SECTOR (48 Anonymous Plants) ---
  { id: 'vn_cem_01', name: 'Cement Plant C-01', sector: 'cement', baseline: 85000, techTier: 'STANDARD', emissionRatio: 0.99, techDesc: 'Standard dry-process rotary kiln with baseline heat consumption' },
  { id: 'vn_cem_02', name: 'Cement Plant C-02', sector: 'cement', baseline: 80000, techTier: 'STANDARD', emissionRatio: 0.98, techDesc: 'Clinker line testing alternative fuel co-processing' },
  { id: 'vn_cem_03', name: 'Cement Plant C-03', sector: 'cement', baseline: 90000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Standard capacity dry rotary kiln operating near benchmark' },
  { id: 'vn_cem_04', name: 'Cement Plant C-04', sector: 'cement', baseline: 95000, techTier: 'STANDARD', emissionRatio: 1.02, techDesc: 'Large-scale integrated clinker production line' },
  { id: 'vn_cem_05', name: 'Cement Plant C-05', sector: 'cement', baseline: 88000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'Modern dry-process kiln with integrated Waste Heat Recovery (WHR)' },
  { id: 'vn_cem_06', name: 'Cement Plant C-06', sector: 'cement', baseline: 65000, techTier: 'LEGACY', emissionRatio: 1.38, techDesc: 'Vintage rotary line with excessive clinker calcination heat loss' },
  { id: 'vn_cem_07', name: 'Cement Plant C-07', sector: 'cement', baseline: 70000, techTier: 'STANDARD', emissionRatio: 0.99, techDesc: 'Modernized standard line with closed-circuit grinding' },
  { id: 'vn_cem_08', name: 'Cement Plant C-08', sector: 'cement', baseline: 72000, techTier: 'STANDARD', emissionRatio: 1.00, techDesc: 'European-standard multi-channel calciner line' },
  { id: 'vn_cem_09', name: 'Cement Plant C-09', sector: 'cement', baseline: 110000, techTier: 'ADVANCED', emissionRatio: 0.67, techDesc: 'Japanese BAT kiln line with 35% captive WHR power and low clinker factor' },
  { id: 'vn_cem_10', name: 'Cement Plant C-10', sector: 'cement', baseline: 55000, techTier: 'ADVANCED', emissionRatio: 0.69, techDesc: 'Advanced vertical roller mill station using mineral pozzolan blending' },
  { id: 'vn_cem_11', name: 'Cement Plant C-11', sector: 'cement', baseline: 95000, techTier: 'STANDARD', emissionRatio: 0.97, techDesc: 'Captive WHR generator covering 28% of electricity requirements' },
  { id: 'vn_cem_12', name: 'Cement Plant C-12', sector: 'cement', baseline: 85000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Standard precalciner rotary kiln with automatic feed dosing' },
  { id: 'vn_cem_13', name: 'Cement Plant C-13', sector: 'cement', baseline: 82000, techTier: 'STANDARD', emissionRatio: 1.02, techDesc: 'Standard European plant running on standard coal mixture' },
  { id: 'vn_cem_14', name: 'Cement Plant C-14', sector: 'cement', baseline: 78000, techTier: 'STANDARD', emissionRatio: 1.03, techDesc: 'Standard 4-stage suspension preheater clinker line' },
  { id: 'vn_cem_15', name: 'Cement Plant C-15', sector: 'cement', baseline: 80000, techTier: 'STANDARD', emissionRatio: 0.98, techDesc: 'Commercial joint-venture plant operating on benchmark emissions' },
  { id: 'vn_cem_16', name: 'Cement Plant C-16', sector: 'cement', baseline: 125000, techTier: 'ADVANCED', emissionRatio: 0.66, techDesc: 'High-capacity 12,500 t/day state-of-the-art kiln with minimal specific heat' },
  { id: 'vn_cem_17', name: 'Cement Plant C-17', sector: 'cement', baseline: 75000, techTier: 'ADVANCED', emissionRatio: 0.71, techDesc: 'New-generation dry kiln with integrated waste heat recovery' },
  { id: 'vn_cem_18', name: 'Cement Plant C-18', sector: 'cement', baseline: 90000, techTier: 'STANDARD', emissionRatio: 1.02, techDesc: 'Standard commercial clinker production plant' },
  { id: 'vn_cem_19', name: 'Cement Plant C-19', sector: 'cement', baseline: 85000, techTier: 'STANDARD', emissionRatio: 0.99, techDesc: 'Energy-saving vertical roller mill system' },
  { id: 'vn_cem_20', name: 'Cement Plant C-20', sector: 'cement', baseline: 115000, techTier: 'ADVANCED', emissionRatio: 0.69, techDesc: 'Dual-line complex equipped with 20 MW WHR generation' },
  { id: 'vn_cem_21', name: 'Cement Plant C-21', sector: 'cement', baseline: 110000, techTier: 'ADVANCED', emissionRatio: 0.68, techDesc: 'Ultra-efficient Japanese precalciner system with optimized cooler' },
  { id: 'vn_cem_22', name: 'Cement Plant C-22', sector: 'cement', baseline: 120000, techTier: 'ADVANCED', emissionRatio: 0.67, techDesc: 'Modern multi-line facility with automated digital energy management' },
  { id: 'vn_cem_23', name: 'Cement Plant C-23', sector: 'cement', baseline: 105000, techTier: 'LEGACY', emissionRatio: 1.34, techDesc: 'Large kiln with suboptimal thermal insulation and high shell losses' },
  { id: 'vn_cem_24', name: 'Cement Plant C-24', sector: 'cement', baseline: 80000, techTier: 'ADVANCED', emissionRatio: 0.65, techDesc: 'European green eco-plant benchmark with lowest specific clinker emissions' },
  { id: 'vn_cem_25', name: 'Cement Plant C-25', sector: 'cement', baseline: 75000, techTier: 'STANDARD', emissionRatio: 0.97, techDesc: 'Energy-efficient regional rotary kiln line' },
  { id: 'vn_cem_26', name: 'Cement Plant C-26', sector: 'cement', baseline: 92000, techTier: 'ADVANCED', emissionRatio: 0.66, techDesc: 'Eco-pioneer co-processing industrial waste (AF) + 12 MW WHR' },
  { id: 'vn_cem_27', name: 'Cement Plant C-27', sector: 'cement', baseline: 78000, techTier: 'ADVANCED', emissionRatio: 0.72, techDesc: 'Modern dry-process plant with advanced clinker reduction solutions' },
  { id: 'vn_cem_28', name: 'Cement Plant C-28', sector: 'cement', baseline: 72000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'International corporate green manufacturing standard' },
  { id: 'vn_cem_29', name: 'Cement Plant C-29', sector: 'cement', baseline: 68000, techTier: 'LEGACY', emissionRatio: 1.33, techDesc: 'Unretrofitted kiln lacking waste heat recovery generation' },
  { id: 'vn_cem_30', name: 'Cement Plant C-30', sector: 'cement', baseline: 52000, techTier: 'STANDARD', emissionRatio: 1.00, techDesc: 'Standard delta clinker grinding and bagging facility' },
  { id: 'vn_cem_31', name: 'Cement Plant C-31', sector: 'cement', baseline: 65000, techTier: 'STANDARD', emissionRatio: 1.02, techDesc: 'Standard dry rotary kiln serving regional construction' },
  { id: 'vn_cem_32', name: 'Cement Plant C-32', sector: 'cement', baseline: 48000, techTier: 'LEGACY', emissionRatio: 1.37, techDesc: 'Older production hardware with high specific fuel consumption' },
  { id: 'vn_cem_33', name: 'Cement Plant C-33', sector: 'cement', baseline: 50000, techTier: 'LEGACY', emissionRatio: 1.44, techDesc: 'Converted vertical kiln line with high combustion losses' },
  { id: 'vn_cem_34', name: 'Cement Plant C-34', sector: 'cement', baseline: 52000, techTier: 'LEGACY', emissionRatio: 1.35, techDesc: 'Remote highland plant with high thermal and logistical penalties' },
  { id: 'vn_cem_35', name: 'Cement Plant C-35', sector: 'cement', baseline: 60000, techTier: 'LEGACY', emissionRatio: 1.38, techDesc: 'Older kiln line fully dependent on low-grade coal without preheating' },
  { id: 'vn_cem_36', name: 'Cement Plant C-36', sector: 'cement', baseline: 58000, techTier: 'LEGACY', emissionRatio: 1.41, techDesc: 'Obsolete line with GHG emission intensity far exceeding sector caps' },
  { id: 'vn_cem_37', name: 'Cement Plant C-37', sector: 'cement', baseline: 46000, techTier: 'LEGACY', emissionRatio: 1.40, techDesc: 'Small-scale kiln with poor waste gas heat recapture' },
  { id: 'vn_cem_38', name: 'Cement Plant C-38', sector: 'cement', baseline: 54000, techTier: 'LEGACY', emissionRatio: 1.36, techDesc: 'Worn equipment with significant radiation losses across kiln shell' },
  { id: 'vn_cem_39', name: 'Cement Plant C-39', sector: 'cement', baseline: 42000, techTier: 'LEGACY', emissionRatio: 1.46, techDesc: 'Outdated legacy plant with high raw meal calcination losses' },
  { id: 'vn_cem_40', name: 'Cement Plant C-40', sector: 'cement', baseline: 40000, techTier: 'LEGACY', emissionRatio: 1.48, techDesc: 'Vintage production unit with heavy coal consumption rate' },
  { id: 'vn_cem_41', name: 'Cement Plant C-41', sector: 'cement', baseline: 38000, techTier: 'LEGACY', emissionRatio: 1.45, techDesc: 'Remote plant using inefficient manual combustion controls' },
  { id: 'vn_cem_42', name: 'Cement Plant C-42', sector: 'cement', baseline: 36000, techTier: 'LEGACY', emissionRatio: 1.47, techDesc: 'Vintage kiln requiring technological modernization' },
  { id: 'vn_cem_43', name: 'Cement Plant C-43', sector: 'cement', baseline: 44000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Modern vertical roller grinding terminal' },
  { id: 'vn_cem_44', name: 'Cement Plant C-44', sector: 'cement', baseline: 46000, techTier: 'LEGACY', emissionRatio: 1.50, techDesc: 'Legacy converted shaft kiln with severe emission intensity' },
  { id: 'vn_cem_45', name: 'Cement Plant C-45', sector: 'cement', baseline: 62000, techTier: 'STANDARD', emissionRatio: 0.98, techDesc: 'Standard joint-venture manufacturing line' },
  { id: 'vn_cem_46', name: 'Cement Plant C-46', sector: 'cement', baseline: 85000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'Recently commissioned modern dry kiln line' },
  { id: 'vn_cem_47', name: 'Cement Plant C-47', sector: 'cement', baseline: 48000, techTier: 'LEGACY', emissionRatio: 1.42, techDesc: 'Older clinker burning setup with excessive fuel penalty' },
  { id: 'vn_cem_48', name: 'Cement Plant C-48', sector: 'cement', baseline: 40000, techTier: 'LEGACY', emissionRatio: 1.52, techDesc: 'Aging kiln line with outdated cooler and heat recovery' },

  // --- STEEL & IRON COMPLEX SECTOR (27 Anonymous Plants) ---
  { id: 'vn_stl_01', name: 'Steel Mill S-01', sector: 'steel', baseline: 180000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Integrated blast furnace-basic oxygen furnace (BF-BOF) with off-gas recovery' },
  { id: 'vn_stl_02', name: 'Steel Mill S-02', sector: 'steel', baseline: 160000, techTier: 'ADVANCED', emissionRatio: 0.69, techDesc: 'Modern hot-rolled coil line utilizing endless strip production (ESP)' },
  { id: 'vn_stl_03', name: 'Steel Mill S-03', sector: 'steel', baseline: 140000, techTier: 'STANDARD', emissionRatio: 1.00, techDesc: 'Standard blast furnace complex generating 80% captive power' },
  { id: 'vn_stl_04', name: 'Steel Mill S-04', sector: 'steel', baseline: 195000, techTier: 'STANDARD', emissionRatio: 0.98, techDesc: 'Mega-scale integrated steel complex with comprehensive top-gas turbines' },
  { id: 'vn_stl_05', name: 'Steel Mill S-05', sector: 'steel', baseline: 185000, techTier: 'STANDARD', emissionRatio: 0.97, techDesc: 'Blast furnace equipped with Coke Dry Quenching (CDQ) heat recovery' },
  { id: 'vn_stl_06', name: 'Steel Mill S-06', sector: 'steel', baseline: 110000, techTier: 'ADVANCED', emissionRatio: 0.68, techDesc: 'Electric Arc Furnace (EAF) mini-mill utilizing domestic recycled scrap' },
  { id: 'vn_stl_07', name: 'Steel Mill S-07', sector: 'steel', baseline: 80000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'Green scrap-based EAF steelmaking with ultra-high power transformers' },
  { id: 'vn_stl_08', name: 'Steel Mill S-08', sector: 'steel', baseline: 75000, techTier: 'LEGACY', emissionRatio: 1.36, techDesc: 'Vintage electric furnace with high electrode and electricity consumption' },
  { id: 'vn_stl_09', name: 'Steel Mill S-09', sector: 'steel', baseline: 85000, techTier: 'ADVANCED', emissionRatio: 0.72, techDesc: 'Continuous scrap preheating Consteel system with reduced tap-to-tap time' },
  { id: 'vn_stl_10', name: 'Steel Mill S-10', sector: 'steel', baseline: 120000, techTier: 'LEGACY', emissionRatio: 1.45, techDesc: 'Coal-intensive blast furnace operating without gas expansion turbines' },
  { id: 'vn_stl_11', name: 'Steel Mill S-11', sector: 'steel', baseline: 95000, techTier: 'LEGACY', emissionRatio: 1.55, techDesc: 'Vintage metallurgical coking blast furnace with extreme emission intensity' },
  { id: 'vn_stl_12', name: 'Steel Mill S-12', sector: 'steel', baseline: 82000, techTier: 'ADVANCED', emissionRatio: 0.67, techDesc: 'Top-tier automated EAF steelmaker with oxy-fuel burners' },
  { id: 'vn_stl_13', name: 'Steel Mill S-13', sector: 'steel', baseline: 78000, techTier: 'ADVANCED', emissionRatio: 0.66, techDesc: 'Japanese BAT electric arc steelmaking with minimal specific kWh per ton' },
  { id: 'vn_stl_14', name: 'Steel Mill S-14', sector: 'steel', baseline: 65000, techTier: 'STANDARD', emissionRatio: 1.02, techDesc: 'Continuous billet casting and rebar rolling line' },
  { id: 'vn_stl_15', name: 'Steel Mill S-15', sector: 'steel', baseline: 62000, techTier: 'STANDARD', emissionRatio: 1.01, techDesc: 'Cold-rolling and hot-dip galvanizing production facility' },
  { id: 'vn_stl_16', name: 'Steel Mill S-16', sector: 'steel', baseline: 70000, techTier: 'ADVANCED', emissionRatio: 0.68, techDesc: 'Modern EAF with secondary metallurgical refining and strict emission controls' },
  { id: 'vn_stl_17', name: 'Steel Mill S-17', sector: 'steel', baseline: 72000, techTier: 'ADVANCED', emissionRatio: 0.65, techDesc: 'Smokeless green steel facility: direct hot-charging from EAF to rolling' },
  { id: 'vn_stl_18', name: 'Steel Mill S-18', sector: 'steel', baseline: 58000, techTier: 'LEGACY', emissionRatio: 1.35, techDesc: 'Heavy fuel oil reheat furnace with poor thermal efficiency' },
  { id: 'vn_stl_19', name: 'Steel Mill S-19', sector: 'steel', baseline: 50000, techTier: 'LEGACY', emissionRatio: 1.42, techDesc: 'Manual batch rolling furnace with substantial combustion heat loss' },
  { id: 'vn_stl_20', name: 'Steel Mill S-20', sector: 'steel', baseline: 68000, techTier: 'ADVANCED', emissionRatio: 0.70, techDesc: 'Non-Oxidizing Furnace (NOF) continuous galvanizing line with waste heat recovery' },
  { id: 'vn_stl_21', name: 'Steel Mill S-21', sector: 'steel', baseline: 60000, techTier: 'ADVANCED', emissionRatio: 0.71, techDesc: 'Continuous cold galvanizing line with regenerative thermal oxidizers' },
  { id: 'vn_stl_22', name: 'Steel Mill S-22', sector: 'steel', baseline: 54000, techTier: 'STANDARD', emissionRatio: 0.99, techDesc: 'Standard pre-painted steel sheet manufacturing line' },
  { id: 'vn_stl_23', name: 'Steel Mill S-23', sector: 'steel', baseline: 62000, techTier: 'LEGACY', emissionRatio: 1.40, techDesc: 'Outdated scrap-smelting induction furnace with high grid losses' },
  { id: 'vn_stl_24', name: 'Steel Mill S-24', sector: 'steel', baseline: 48000, techTier: 'LEGACY', emissionRatio: 1.38, techDesc: 'Older intermediate rolling mill with heavy radiant heat losses' },
  { id: 'vn_stl_25', name: 'Steel Mill S-25', sector: 'steel', baseline: 42000, techTier: 'ADVANCED', emissionRatio: 0.72, techDesc: 'Upgraded EAF mini-mill with computerized chemical energy injection' },
  { id: 'vn_stl_26', name: 'Steel Mill S-26', sector: 'steel', baseline: 55000, techTier: 'LEGACY', emissionRatio: 1.48, techDesc: 'Small mountain blast furnace with high specific coke rate' },
  { id: 'vn_stl_27', name: 'Steel Mill S-27', sector: 'steel', baseline: 64000, techTier: 'ADVANCED', emissionRatio: 0.66, techDesc: 'Advanced structural steel complex with high automation and minimal carbon footprint' }
];

module.exports = { 
  SECTOR_TEMPLATES, 
  VN_110_FACILITIES_LIST 
};
