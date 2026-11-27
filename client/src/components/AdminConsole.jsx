import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Sliders, 
  Play, 
  Pause, 
  CheckCircle, 
  RotateCcw, 
  Gavel, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Scale,
  Sparkles, 
  Bot, 
  Save, 
  RefreshCw, 
  Flag, 
  Calendar,
  Zap,
  Leaf,
  AlertTriangle,
  Flame,
  Trees,
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  Check,
  X,
  Layers,
  Clock,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { translations, formatCurrency, formatNumber } from '../i18n';
import { exportSimulationAuditExcel } from '../utils/exportAuditExcel';

export default function AdminConsole({ 
  state, 
  onUpdateParameters, 
  onSetFacilitiesCount,
  onSyncCapToEmissions,
  onImportFacilities,
  onConfigureTime,
  onOpenPeriodSummary,
  onOpenGrandSummary,
  onPhaseAction, 
  onReset,
  onInjectShock,
  lang = 'vi',
  currency = 'USD'
}) {
  const { parameters, phase, currentPeriod, totalPeriods, auction, facilities, history, periodYearsLabel, metrics } = state || {};
  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  const currentCount = parameters?.activeFacilityCount || Object.keys(facilities || {}).length || 110;
  const currentRatio = parameters?.capStringencyRatio || 98;

  const [form, setForm] = useState({
    presetName: parameters?.presetName || 'vietnam_ets_110',
    startYear: parameters?.startYear || 2025,
    periodLengthYears: parameters?.periodLengthYears || 2,
    activeFacilityCount: currentCount,
    capStringencyRatio: currentRatio,
    totalCap: parameters?.totalCap || 10500000,
    correctionFactor: parameters?.correctionFactor != null ? parameters.correctionFactor : 4.0,
    freeAllocationRate: parameters?.freeAllocationRate != null ? parameters.freeAllocationRate : 100,
    auctionShare: parameters?.auctionShare != null ? parameters.auctionShare : 0,
    auctionReservePrice: parameters?.auctionReservePrice || 4.0,
    offsetUsageLimit: parameters?.offsetUsageLimit != null ? parameters.offsetUsageLimit : 30,
    bankingAllowed: parameters?.bankingAllowed ?? true,
    bankingLimit: parameters?.bankingLimit != null ? parameters.bankingLimit : 100,
    borrowingAllowed: parameters?.borrowingAllowed ?? true,
    borrowingLimit: parameters?.borrowingLimit != null ? parameters.borrowingLimit : 15,
    borrowingInterestRate: parameters?.borrowingInterestRate != null ? parameters.borrowingInterestRate : 1.00,
    penaltyRate: parameters?.penaltyRate || 12.0,
    marketPriceFloor: parameters?.marketPriceFloor || 1.5,
    marketPriceCeiling: parameters?.marketPriceCeiling || 15.0,
    botsEnabled: parameters?.botsEnabled ?? true,
    botComplianceTarget: parameters?.botComplianceTarget != null ? parameters.botComplianceTarget : 95,
    botPriceTrend: parameters?.botPriceTrend || 'NEUTRAL',
    botPriceIntensity: parameters?.botPriceIntensity != null ? parameters.botPriceIntensity : 50,
    botEndPeriodScarcity: parameters?.botEndPeriodScarcity ?? true,
    botStrategyMix: parameters?.botStrategyMix || 'DIVERSE',
    enterpriseEmissionGrowthEnabled: parameters?.enterpriseEmissionGrowthEnabled ?? true,
    enterpriseEmissionGrowthRate: parameters?.enterpriseEmissionGrowthRate != null ? parameters.enterpriseEmissionGrowthRate : 3.5,
    enterpriseEmissionGrowthMode: parameters?.enterpriseEmissionGrowthMode || 'SECTOR_BASED',
    periodDuration: state?.periodDuration || 600,
    totalPeriods: state?.totalPeriods || 3
  });

  const [facilityCountInput, setFacilityCountInput] = useState(currentCount);
  const [capRatioInput, setCapRatioInput] = useState(currentRatio);
  const [periodCapRatios, setPeriodCapRatios] = useState(() => {
    if (parameters?.periodCapRatios && Object.keys(parameters.periodCapRatios).length > 0) {
      return { ...parameters.periodCapRatios };
    }
    const initRatios = {};
    const totalP = state?.totalPeriods || 3;
    const base = parameters?.capStringencyRatio || 98;
    for (let p = 1; p <= totalP; p++) {
      initRatios[p] = p === 1 ? base : Math.round(base + (p - 1) * 4);
    }
    return initRatios;
  });
  const [isApplyingScale, setIsApplyingScale] = useState(false);
  const [isSyncingCap, setIsSyncingCap] = useState(false);
  const [capSavedSuccess, setCapSavedSuccess] = useState(false);

  // User Accounts Directory Management
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        headers: { 'x-admin-key': localStorage.getItem('ets_admin_token') || 'admin123' }
      });
      const data = await res.json();
      if (data.success && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.warn('Failed to fetch accounts:', e);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [state]);

  const handleDeleteAccount = async (username) => {
    if (!window.confirm(isVi ? `Xác nhận xóa tài khoản "${username}" và giải phóng cơ sở này?` : `Delete account "${username}" and release facility?`)) return;
    try {
      const res = await fetch('/api/admin/accounts/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': localStorage.getItem('ets_admin_token') || 'admin123'
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        fetchAccounts();
      }
    } catch (e) {
      alert(`Error deleting account: ${e.message}`);
    }
  };

  useEffect(() => {
    if (parameters?.periodCapRatios) {
      setPeriodCapRatios(prev => ({ ...prev, ...parameters.periodCapRatios }));
    }
  }, [parameters?.periodCapRatios]);

  useEffect(() => {
    if (parameters) {
      setForm(prev => ({
        ...prev,
        bankingAllowed: parameters.bankingAllowed ?? prev.bankingAllowed,
        bankingLimit: parameters.bankingLimit != null ? parameters.bankingLimit : prev.bankingLimit,
        borrowingAllowed: parameters.borrowingAllowed ?? prev.borrowingAllowed,
        borrowingLimit: parameters.borrowingLimit != null ? parameters.borrowingLimit : prev.borrowingLimit,
        borrowingInterestRate: parameters.borrowingInterestRate != null ? parameters.borrowingInterestRate : prev.borrowingInterestRate,
        botComplianceTarget: parameters.botComplianceTarget != null ? parameters.botComplianceTarget : prev.botComplianceTarget,
        botPriceTrend: parameters.botPriceTrend || prev.botPriceTrend,
        botPriceIntensity: parameters.botPriceIntensity != null ? parameters.botPriceIntensity : prev.botPriceIntensity,
        botEndPeriodScarcity: parameters.botEndPeriodScarcity ?? prev.botEndPeriodScarcity,
        botStrategyMix: parameters.botStrategyMix || prev.botStrategyMix,
        enterpriseEmissionGrowthEnabled: parameters.enterpriseEmissionGrowthEnabled ?? prev.enterpriseEmissionGrowthEnabled,
        enterpriseEmissionGrowthRate: parameters.enterpriseEmissionGrowthRate != null ? parameters.enterpriseEmissionGrowthRate : prev.enterpriseEmissionGrowthRate,
        enterpriseEmissionGrowthMode: parameters.enterpriseEmissionGrowthMode || prev.enterpriseEmissionGrowthMode
      }));
    }
  }, [
    parameters?.bankingAllowed, 
    parameters?.bankingLimit, 
    parameters?.borrowingAllowed, 
    parameters?.borrowingLimit, 
    parameters?.borrowingInterestRate,
    parameters?.botComplianceTarget,
    parameters?.botPriceTrend,
    parameters?.botPriceIntensity,
    parameters?.botEndPeriodScarcity,
    parameters?.botStrategyMix,
    parameters?.enterpriseEmissionGrowthEnabled,
    parameters?.enterpriseEmissionGrowthRate,
    parameters?.enterpriseEmissionGrowthMode
  ]);

  const handleUpdatePeriodRatio = (p, val) => {
    const num = Math.max(50, Math.min(200, Number(val) || 0));
    setPeriodCapRatios(prev => ({ ...prev, [p]: num }));
    if (p === (currentPeriod || 1)) {
      setCapRatioInput(num);
    }
  };

  const applyPeriodCapPreset = (templateType) => {
    const totalP = totalPeriodsInput || state?.totalPeriods || 3;
    const newRatios = {};
    if (templateType === 'vn_pdp8') {
      for (let p = 1; p <= totalP; p++) {
        newRatios[p] = 100 + (p - 1) * 4;
      }
    } else if (templateType === 'net_zero') {
      for (let p = 1; p <= totalP; p++) {
        newRatios[p] = Math.max(70, Math.round(100 - (p - 1) * 2.5));
      }
    } else if (templateType === 'parity') {
      for (let p = 1; p <= totalP; p++) {
        newRatios[p] = 100;
      }
    } else if (templateType === 'strict') {
      for (let p = 1; p <= totalP; p++) {
        newRatios[p] = 95;
      }
    }
    setPeriodCapRatios(newRatios);
    const activeP = currentPeriod || 1;
    if (newRatios[activeP] != null) {
      setCapRatioInput(newRatios[activeP]);
    }
  };

  // Timing & Pilot Milestones configuration state
  const [periodDurationInput, setPeriodDurationInput] = useState(state?.periodDuration || 600);
  const [startYearInput, setStartYearInput] = useState(parameters?.startYear || 2025);
  const [periodLengthInput, setPeriodLengthInput] = useState(parameters?.periodLengthYears || 2);
  const [totalPeriodsInput, setTotalPeriodsInput] = useState(state?.totalPeriods || 3);
  const [isSavingTiming, setIsSavingTiming] = useState(false);
  const [timingSavedSuccess, setTimingSavedSuccess] = useState(false);

  const handleApplyTiming = async () => {
    setIsSavingTiming(true);
    try {
      if (onConfigureTime) {
        await onConfigureTime({
          periodDuration: periodDurationInput,
          totalPeriods: totalPeriodsInput,
          startYear: startYearInput,
          periodLengthYears: periodLengthInput
        });
      }
      setTimingSavedSuccess(true);
      setTimeout(() => setTimingSavedSuccess(false), 2500);
    } catch (err) {
      alert(`Failed to save timing: ${err.message}`);
    } finally {
      setIsSavingTiming(false);
    }
  };

  // Excel Import state
  const [importPreview, setImportPreview] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [auctionQty, setAuctionQty] = useState(25000);
  const [auctionReserve, setAuctionReserve] = useState(4.0);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // --- Excel Template Generation & Download ---
  const downloadExcelTemplate = (fileType = 'xlsx') => {
    const sampleRows = [
      {
        "Facility Name": "Power Facility P-01",
        "Sector": "Power",
        "Actual Emissions (tCO2e)": 145000,
        "Allocated Allowances (tCO2e)": 115000,
        "Starting Cash (USD)": 500000,
        "Technology Note": "Vintage subcritical coal boiler (Deficit)"
      },
      {
        "Facility Name": "Power Facility P-02",
        "Sector": "Power",
        "Actual Emissions (tCO2e)": 110000,
        "Allocated Allowances (tCO2e)": 140000,
        "Starting Cash (USD)": 500000,
        "Technology Note": "Ultra-supercritical USC unit (Surplus)"
      },
      {
        "Facility Name": "Power Facility P-03",
        "Sector": "Power",
        "Actual Emissions (tCO2e)": 135000,
        "Allocated Allowances (tCO2e)": 135000,
        "Starting Cash (USD)": 500000,
        "Technology Note": "Standard baseline coal unit (Parity)"
      },
      {
        "Facility Name": "Cement Plant C-01",
        "Sector": "Cement",
        "Actual Emissions (tCO2e)": 92000,
        "Allocated Allowances (tCO2e)": 90000,
        "Starting Cash (USD)": 420000,
        "Technology Note": "Standard rotary kiln near benchmark"
      },
      {
        "Facility Name": "Cement Plant C-02",
        "Sector": "Cement",
        "Actual Emissions (tCO2e)": 65000,
        "Allocated Allowances (tCO2e)": 88000,
        "Starting Cash (USD)": 420000,
        "Technology Note": "Modern precalciner kiln with WHR (Surplus)"
      },
      {
        "Facility Name": "Cement Plant C-03",
        "Sector": "Cement",
        "Actual Emissions (tCO2e)": 88000,
        "Allocated Allowances (tCO2e)": 65000,
        "Starting Cash (USD)": 420000,
        "Technology Note": "Vintage kiln with high heat loss (Deficit)"
      },
      {
        "Facility Name": "Steel Mill S-01",
        "Sector": "Steel",
        "Actual Emissions (tCO2e)": 160000,
        "Allocated Allowances (tCO2e)": 120000,
        "Starting Cash (USD)": 600000,
        "Technology Note": "Vintage blast furnace converter (Deficit)"
      },
      {
        "Facility Name": "Steel Mill S-02",
        "Sector": "Steel",
        "Actual Emissions (tCO2e)": 78000,
        "Allocated Allowances (tCO2e)": 98000,
        "Starting Cash (USD)": 600000,
        "Technology Note": "Electric Arc Furnace EAF scrap recycling (Surplus)"
      },
      {
        "Facility Name": "Steel Mill S-03",
        "Sector": "Steel",
        "Actual Emissions (tCO2e)": 140000,
        "Allocated Allowances (tCO2e)": 140000,
        "Starting Cash (USD)": 600000,
        "Technology Note": "Standard blast furnace with top-gas turbine (Parity)"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Facilities_Setup");

    if (fileType === 'csv') {
      XLSX.writeFile(wb, "ETS_Facilities_Setup_Template.csv", { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, "ETS_Facilities_Setup_Template.xlsx");
    }
  };

  // --- Excel File Upload & Parser ---
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const worksheet = wb.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error(isVi ? 'File Excel không có dữ liệu!' : 'Excel file contains no data rows!');
        }

        // Normalize rows supporting English & Vietnamese column headers
        const parsed = rawJson.map((row, idx) => {
          const name = row['Facility Name'] || row['Tên Cơ Sở'] || row['Tên cơ sở'] || row['Name'] || row['Cơ Sở'] || `Facility ${String(idx + 1).padStart(2, '0')}`;
          const sector = row['Sector'] || row['Ngành'] || row['Ngành Nghề'] || 'Power';
          
          const actual = Number(
            row['Actual Emissions (tCO2e)'] ??
            row['Actual Emissions'] ??
            row['Phát Thải Thực Tế (tCO2e)'] ??
            row['Phát Thải Thực Tế'] ??
            row['Phát thải thực tế'] ??
            row['Actual'] ??
            row['Phát Thải'] ??
            100000
          ) || 0;

          const allowance = Number(
            row['Allocated Allowances (tCO2e)'] ??
            row['Allocated Allowances'] ??
            row['Hạn Ngạch Phân Bổ (tCO2e)'] ??
            row['Hạn Ngạch Phân Bổ'] ??
            row['Hạn ngạch phân bổ'] ??
            row['Allowance'] ??
            row['Allowances'] ??
            row['Hạn Ngạch'] ??
            100000
          ) || 0;

          const cash = Number(
            row['Starting Cash (USD)'] ??
            row['Starting Cash'] ??
            row['Tiền Mặt Khởi Điểm'] ??
            row['Tiền Mặt'] ??
            row['Cash'] ??
            500000
          ) || 500000;

          const techDesc = row['Technology Note'] || row['Ghi Chú Công Nghệ'] || row['Ghi chú'] || row['Note'] || '';

          const net = allowance - actual;
          const techTier = net > 1500 ? 'ADVANCED' : net < -1500 ? 'LEGACY' : 'STANDARD';

          return {
            id: `fac_imp_${String(idx + 1).padStart(2, '0')}`,
            name,
            sector,
            actualEmissions: actual,
            allowance,
            cash,
            techTier,
            techDesc
          };
        });

        setImportPreview(parsed);
      } catch (err) {
        console.error('Failed to parse Excel file', err);
        setImportError(err.message || (isVi ? 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.' : 'Failed to parse Excel file. Please verify format.'));
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input so re-selecting same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setIsImporting(true);
    try {
      if (onImportFacilities) {
        await onImportFacilities(importPreview);
      }
      setImportPreview(null);
      setImportFileName('');
      // Reset local ratio inputs to 100% based on the imported file
      setCapRatioInput(100);
      const totalP = totalPeriodsInput || state?.totalPeriods || 3;
      const newRatios = {};
      for (let p = 1; p <= totalP; p++) {
        newRatios[p] = 100;
      }
      setPeriodCapRatios(newRatios);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplyFacilityCount = async (count) => {
    const num = Number(count);
    setFacilityCountInput(num);
    setIsApplyingScale(true);
    try {
      if (onSetFacilitiesCount) {
        await onSetFacilitiesCount(num, capRatioInput);
      } else {
        await onUpdateParameters({ activeFacilityCount: num });
      }
      setForm(prev => ({ ...prev, activeFacilityCount: num }));
    } catch (err) {
      alert(`Error updating facilities count: ${err.message}`);
    } finally {
      setIsApplyingScale(false);
    }
  };

  const handleApplyCapSettings = async () => {
    setIsSyncingCap(true);
    try {
      const activeP = currentPeriod || 1;
      const curRatio = periodCapRatios[activeP] != null ? periodCapRatios[activeP] : capRatioInput;
      const isImported = Boolean(parameters?.isImported || (parameters?.importedBaseCap && parameters.importedBaseCap > 0));
      const refBase = (isImported && parameters?.importedBaseCap > 0)
        ? parameters.importedBaseCap
        : totalSystemEmissions;

      const baseCap = Math.round(refBase * (curRatio / 100));

      const totalP = totalPeriodsInput || state?.totalPeriods || 3;
      const pCaps = {};
      for (let p = 1; p <= totalP; p++) {
        const ratio = periodCapRatios[p] != null ? periodCapRatios[p] : curRatio;
        pCaps[p] = Math.round(refBase * (ratio / 100));
      }

      if (onSyncCapToEmissions) {
        const res = await onSyncCapToEmissions(curRatio, true, {
          totalCap: baseCap,
          periodCapRatios,
          periodCaps: pCaps,
          enterpriseEmissionGrowthEnabled: form.enterpriseEmissionGrowthEnabled ?? true,
          enterpriseEmissionGrowthRate: form.enterpriseEmissionGrowthRate != null ? Number(form.enterpriseEmissionGrowthRate) : 3.5,
          enterpriseEmissionGrowthMode: form.enterpriseEmissionGrowthMode || 'SECTOR_BASED'
        });
        if (res?.totalCap) {
          setForm(prev => ({ 
            ...prev, 
            totalCap: res.totalCap, 
            capStringencyRatio: curRatio,
            periodCapRatios,
            periodCaps: pCaps
          }));
        }
      } else {
        await onUpdateParameters({ 
          totalCap: baseCap,
          capStringencyRatio: curRatio, 
          syncCapWithEmissions: true,
          periodCapRatios,
          periodCaps: pCaps,
          enterpriseEmissionGrowthEnabled: form.enterpriseEmissionGrowthEnabled ?? true,
          enterpriseEmissionGrowthRate: form.enterpriseEmissionGrowthRate != null ? Number(form.enterpriseEmissionGrowthRate) : 3.5,
          enterpriseEmissionGrowthMode: form.enterpriseEmissionGrowthMode || 'SECTOR_BASED'
        });
        setForm(prev => ({ 
          ...prev, 
          totalCap: baseCap, 
          capStringencyRatio: curRatio,
          periodCapRatios,
          periodCaps: pCaps
        }));
      }

      setCapSavedSuccess(true);
      setTimeout(() => setCapSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Error updating cap: ${err.message}`);
    } finally {
      setIsSyncingCap(false);
    }
  };

  const handleSyncCap = (ratio) => {
    if (ratio != null) {
      handleUpdatePeriodRatio(currentPeriod || 1, ratio);
    }
    handleApplyCapSettings();
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateParameters(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Error updating parameters: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (presetName) => {
    let newPreset = {};
    if (presetName === 'vietnam_ets') {
      newPreset = {
        presetName: 'vietnam_ets',
        startYear: 2025,
        periodLengthYears: 2,
        totalPeriods: 3,
        totalCap: 420000,
        correctionFactor: 4.0,
        freeAllocationRate: 100,
        auctionShare: 0,
        auctionReservePrice: 20.0,
        offsetUsageLimit: 30,
        bankingAllowed: true,
        bankingLimit: 100,
        borrowingAllowed: true,
        borrowingLimit: 15,
        borrowingInterestRate: 1.00,
        penaltyRate: 60.0,
        marketPriceFloor: 8.0,
        marketPriceCeiling: 90.0,
        botsEnabled: true
      };
    } else if (presetName === 'eu_ets') {
      newPreset = {
        presetName: 'eu_ets',
        startYear: 2025,
        periodLengthYears: 1,
        totalPeriods: 4,
        totalCap: 350000,
        correctionFactor: -4.2,
        freeAllocationRate: 40,
        auctionShare: 60,
        auctionReservePrice: 45.0,
        offsetUsageLimit: 0,
        bankingAllowed: true,
        bankingLimit: 100,
        borrowingAllowed: false,
        borrowingLimit: 0,
        borrowingInterestRate: 1.0,
        penaltyRate: 110.0,
        marketPriceFloor: 20.0,
        marketPriceCeiling: 150.0,
        botsEnabled: true
      };
    } else if (presetName === 'california') {
      newPreset = {
        presetName: 'california',
        startYear: 2025,
        periodLengthYears: 1,
        totalPeriods: 4,
        totalCap: 380000,
        correctionFactor: -3.5,
        freeAllocationRate: 65,
        auctionShare: 35,
        auctionReservePrice: 22.0,
        offsetUsageLimit: 8,
        bankingAllowed: true,
        bankingLimit: 100,
        borrowingAllowed: false,
        borrowingLimit: 0,
        borrowingInterestRate: 1.0,
        penaltyRate: 85.0,
        marketPriceFloor: 22.0,
        marketPriceCeiling: 80.0,
        botsEnabled: true
      };
    }

    setForm(prev => ({ ...prev, ...newPreset }));
    onUpdateParameters(newPreset);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const totalSystemEmissions = Object.values(facilities || {}).reduce((s, f) => s + f.actualEmissions, 0);
  const isImported = Boolean(parameters?.isImported || (parameters?.importedBaseCap && parameters.importedBaseCap > 0));
  const importedBaseCap = parameters?.importedBaseCap || 0;
  const referenceBaseCap = (isImported && importedBaseCap > 0) ? importedBaseCap : totalSystemEmissions;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Phase Controls */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/30 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Sliders className="w-4 h-4" />
              {isVi ? 'Ủy Ban Quản Lý Chính Sách ETS (Cục BĐKH / Bộ TN&MT)' : 'ETS Policy Regulatory Commission (MONRE / Admin Desk)'}
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">{t.adminTitle}</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isVi 
                ? 'Thiết lập theo Nghị định 06/2022/NĐ-CP: Chu kỳ tuân thủ 2 năm (2025–2026), phân bổ 100% miễn phí, hạn mức tín chỉ bù trừ 30% và hệ số hiệu chỉnh K.' 
                : 'Configured for Vietnam ETS (Decree 06/2022/ND-CP): 2-year cycles (2025–2026), 100% free allocation, 30% offset limit, and correction factor.'}
            </p>
          </div>

          {/* Regulator Phase Action Center */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            {phase === 'SETUP' && (
              <button
                onClick={() => onPhaseAction('start-trading')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t.openTradingRound}</span>
              </button>
            )}

            {phase === 'TRADING' && (
              <>
                {state?.isPaused ? (
                  <button
                    onClick={() => onPhaseAction('resume-trading')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    title={isVi ? 'Tiếp tục thời gian kỳ giao dịch' : 'Resume trading period'}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isVi ? 'Tiếp Tục Kỳ' : 'Resume Period'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onPhaseAction('pause-trading')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                    title={isVi ? 'Tạm dừng đồng hồ và các lệnh giao dịch' : 'Pause trading period'}
                  >
                    <Pause className="w-4 h-4" />
                    <span>{isVi ? 'Tạm Dừng Kỳ' : 'Pause Period'}</span>
                  </button>
                )}

                <button
                  onClick={() => onPhaseAction('compliance')}
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.closeMarketCompliance}</span>
                </button>

                {form.auctionShare > 0 && (
                  <button
                    onClick={() => onPhaseAction('trigger-auction', { quantity: auctionQty, reservePrice: auctionReserve })}
                    disabled={auction?.active}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30 transition-all cursor-pointer"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>{auction?.active ? 'Đấu giá đang diễn ra' : t.launchAuction}</span>
                  </button>
                )}
              </>
            )}

            {phase === 'COMPLIANCE' && (
              <>
                <button
                  onClick={() => onPhaseAction('settle')}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-bold shadow-lg transition-all cursor-pointer ${
                    history?.some(h => h.period === currentPeriod)
                      ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{history?.some(h => h.period === currentPeriod) ? (isVi ? 'Đã Chốt Sổ Tuân Thủ' : 'Settlement Completed') : t.executeSettlement}</span>
                </button>

                <button
                  onClick={() => onPhaseAction('next-period')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <span>
                    {history?.some(h => h.period === currentPeriod) 
                      ? `${t.advancePeriod} ${currentPeriod + 1}` 
                      : (isVi ? `Chốt Sổ & Sang Kỳ ${currentPeriod + 1}` : `Settle & Advance to Period ${currentPeriod + 1}`)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {phase === 'COMPLETED' && (
              <button
                onClick={onOpenGrandSummary}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>{isVi ? 'Báo Cáo Tổng Kết 2025–2030' : 'View 2025–2030 Grand Report'}</span>
              </button>
            )}

            {/* Quick Access to Period Summary Report */}
            {(state?.lastPeriodSettlement || state?.history?.length > 0) && (
              <button
                onClick={onOpenPeriodSummary}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                title={isVi ? 'Xem Báo Cáo Tổng Kết Kỳ' : 'View Latest Period Summary'}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isVi ? 'Báo Cáo Kỳ' : 'Period Report'}</span>
              </button>
            )}

            {/* Quick Access to Grand Pilot Phase Summary */}
            <button
              onClick={onOpenGrandSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title={isVi ? 'Xem Báo Cáo Toàn Diện Thí Điểm (2025–2030)' : 'View Pilot Phase 2025–2030 Grand Report'}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>{isVi ? 'Tổng Kết 2025–2030' : 'Pilot 2025–2030'}</span>
            </button>

            {/* Quick Access to Export Audit Excel */}
            <button
              onClick={() => exportSimulationAuditExcel(state, lang)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/30"
              title={isVi ? 'Xuất báo cáo Excel đối chiếu số dư hạn ngạch, phân bổ và lịch sử giao dịch toàn sàn' : 'Export Excel Audit Report with facility balances and trades'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isVi ? 'Xuất Excel Kiểm Soát' : 'Export Audit Excel'}</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Reset simulation back to Period 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetSim}</span>
            </button>
          </div>
        </div>

        {/* Regulatory Presets Selector */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {t.loadPreset}:
          </span>
          <button
            onClick={() => applyPreset('vietnam_ets')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            <span>{t.vietnamPresetBtn}</span>
          </button>
          <button
            onClick={() => applyPreset('eu_ets')}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 hover:bg-purple-900/40 text-purple-300 border border-purple-800/50 transition-all cursor-pointer"
          >
            {t.euPresetBtn}
          </button>
          <button
            onClick={() => applyPreset('california')}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 hover:bg-teal-900/40 text-teal-300 border border-teal-800/50 transition-all cursor-pointer"
          >
            {t.californiaPresetBtn}
          </button>
        </div>
      </div>

      {/* TIMING & PILOT PHASE MILESTONES CONFIGURATION */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {isVi ? 'Cấu Hình Thời Gian Kỳ Tuân Thủ & Lộ Trình Thí Điểm (2025–2030)' : 'Compliance Timing & Pilot Phase Schedule (2025–2030)'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {isVi ? 'Thời Gian Thực' : 'Real-Time'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi
                  ? 'Quy định độ dài mỗi phiên giao dịch thực tế (giây / phút) và chu kỳ 3 kỳ tuân thủ 2 năm (2025–2026, 2027–2028, 2029–2030).'
                  : 'Configure real-world duration of trading rounds and pilot phase multi-year schedule.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyTiming}
            disabled={isSavingTiming}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
          >
            {isSavingTiming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{timingSavedSuccess ? (isVi ? 'Đã Lưu Thành Công!' : 'Saved!') : (isVi ? 'Lưu Cấu Hình Thời Gian' : 'Save Timing')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subpanel 1: Real-life Duration of each period */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                {isVi ? 'Thời Gian Mỗi Phiên Giao Dịch Thực Tế:' : 'Trading Round Duration (Real-Time):'}
              </span>
              <span className="font-mono font-bold text-purple-400 text-sm">
                {periodDurationInput}s ({Math.floor(periodDurationInput / 60)} {isVi ? 'phút' : 'min'} {periodDurationInput % 60}s)
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { secs: 600, labelVi: '10 Phút (Mặc định)', descVi: 'Chuẩn quy định', labelEn: '10 Min (Default)', descEn: 'Standard Session' },
                { secs: 900, labelVi: '15 Phút', descVi: 'Phiên mở rộng', labelEn: '15 Min', descEn: 'Extended' },
                { secs: 1200, labelVi: '20 Phút', descVi: 'Thảo luận sâu', labelEn: '20 Min', descEn: 'In-Depth' },
                { secs: 1800, labelVi: '30 Phút', descVi: 'Đàm phán chiến lược', labelEn: '30 Min', descEn: 'Strategic' },
                { secs: 2700, labelVi: '45 Phút', descVi: 'Mô phỏng nâng cao', labelEn: '45 Min', descEn: 'Advanced' },
                { secs: 3600, labelVi: '60 Phút', descVi: 'Tập huấn chuyên sâu', labelEn: '60 Min', descEn: 'Full Workshop' },
                { secs: 300, labelVi: '5 Phút', descVi: 'Phiên ngắn', labelEn: '5 Min', descEn: 'Short Round' },
                { secs: 180, labelVi: '3 Phút', descVi: 'Thử nghiệm nhanh', labelEn: '3 Min', descEn: 'Quick Test' }
              ].map(preset => (
                <button
                  key={preset.secs}
                  type="button"
                  onClick={() => setPeriodDurationInput(preset.secs)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    periodDurationInput === preset.secs
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{isVi ? preset.labelVi : preset.labelEn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? preset.descVi : preset.descEn}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min="60"
                max="3600"
                step="60"
                value={periodDurationInput}
                onChange={(e) => setPeriodDurationInput(Number(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer"
              />
              <span className="text-xs font-mono text-purple-300 font-bold shrink-0">{periodDurationInput}s ({Math.floor(periodDurationInput / 60)} {isVi ? 'phút' : 'm'})</span>
            </div>
          </div>

          {/* Subpanel 2: Pilot Phase Milestones (2025-2030) */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                {isVi ? 'Lộ Trình Giai Đoạn Thí Điểm (Nghị Định 06):' : 'Pilot Phase Timeline (Decree 06):'}
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {startYearInput} – {startYearInput + totalPeriodsInput * periodLengthInput - 1}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">
                  {isVi ? 'Năm Bắt Đầu' : 'Start Year'}
                </label>
                <input
                  type="number"
                  value={startYearInput}
                  onChange={(e) => setStartYearInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">
                  {isVi ? 'Độ Dài Kỳ (Năm)' : 'Years/Period'}
                </label>
                <input
                  type="number"
                  value={periodLengthInput}
                  onChange={(e) => setPeriodLengthInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">
                  {isVi ? 'Số Kỳ Thí Điểm' : 'Total Periods'}
                </label>
                <input
                  type="number"
                  value={totalPeriodsInput}
                  onChange={(e) => setTotalPeriodsInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Generated Pilot Milestones visual */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 pt-1 overflow-x-auto">
              {Array.from({ length: totalPeriodsInput }).map((_, idx) => {
                const pStart = startYearInput + idx * periodLengthInput;
                const pEnd = pStart + periodLengthInput - 1;
                const isCurrent = (idx + 1) === currentPeriod;

                return (
                  <div
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg border text-center shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Kỳ {idx + 1}: {pStart}–{pEnd} ({periodCapRatios[idx + 1] != null ? periodCapRatios[idx + 1] : (idx === 0 ? capRatioInput : 100 + idx * 4)}%)
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* EXCEL / CSV BATCH IMPORT SECTION */}
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {isVi ? 'Nhập & Tùy Biến Danh Sách Cơ Sở Từ Excel / CSV' : 'Batch Facility & Cap Import (Excel / CSV)'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isVi ? 'Mới' : 'New'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi 
                  ? 'Tải lên bảng danh sách cơ sở tự chọn với phát thải thực tế, hạn ngạch phân bổ và công nghệ để chạy mô phỏng chính xác.' 
                  : 'Import a custom roster of facilities with custom actual emissions, allowance caps, and technologies.'}
              </p>
            </div>
          </div>

          {/* Template Download Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadExcelTemplate('xlsx')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isVi ? 'Tải Mẫu Excel (.xlsx)' : 'Download Excel (.xlsx)'}</span>
            </button>
            <button
              type="button"
              onClick={() => downloadExcelTemplate('csv')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isVi ? 'Tải Mẫu CSV' : 'Download CSV'}</span>
            </button>
            <button
              type="button"
              onClick={() => exportSimulationAuditExcel(state, lang)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer"
              title={isVi ? 'Xuất toàn bộ bảng dữ liệu thực tế và giao dịch hiện tại ra Excel để kiểm soát' : 'Export all current facility data and trades to Excel for auditing'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>{isVi ? 'Xuất Dữ Liệu Thực Tế (.xlsx)' : 'Export Live Audit (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".xlsx, .xls, .csv" 
          className="hidden" 
        />

        {/* Import Error Banner */}
        {importError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{importError}</span>
            </div>
            <button 
              onClick={() => setImportError(null)} 
              className="text-rose-400 hover:text-white ml-2 text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 1: Dropzone (No preview yet) */}
        {!importPreview && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const dummyEvent = { target: { files: e.dataTransfer.files } };
                handleFileUpload(dummyEvent);
              }
            }}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-emerald-950/10 rounded-2xl p-6 text-center transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all">
                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                {isVi ? 'Kéo thả file Excel / CSV vào đây, hoặc nhấn để chọn file' : 'Drag and drop Excel / CSV here, or click to browse'}
              </div>
              <p className="text-xs text-slate-400 max-w-lg">
                {isVi 
                  ? 'Hỗ trợ định dạng .xlsx, .xls, .csv. Các cột hỗ trợ cả tiếng Việt (Tên cơ sở, Lĩnh vực, Phát thải thực tế, Hạn ngạch phân bổ) và tiếng Anh.'
                  : 'Supports .xlsx, .xls, .csv. Column headers can be in English or Vietnamese.'}
              </p>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span>• {currentCount} {isVi ? 'cơ sở đang kích hoạt' : 'facilities active'}</span>
                <span>• {metrics?.actualEmissions?.toLocaleString() || (isVi ? '12.500.000' : '12,500,000')} tCO2e {isVi ? 'tổng phát thải' : 'total emissions'}</span>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Preview Drawer / Card (After parsing Excel) */}
        {importPreview && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Stats summary bar */}
            {(() => {
              const totalActual = importPreview.reduce((sum, f) => sum + (f.actualEmissions || 0), 0);
              const totalCap = importPreview.reduce((sum, f) => sum + (f.allowance || 0), 0);
              const surplusCount = importPreview.filter(f => f.allowance > f.actualEmissions).length;
              const deficitCount = importPreview.filter(f => f.allowance < f.actualEmissions).length;
              const parityCount = importPreview.filter(f => f.allowance === f.actualEmissions).length;
              const netBalance = totalCap - totalActual;
              const stringency = totalActual > 0 
                ? formatNumber((totalCap / totalActual) * 100, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) 
                : formatNumber(100, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

              return (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white font-mono">{importFileName || 'facilities.xlsx'}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                        {importPreview.length} {isVi ? 'Cơ sở đọc thành công' : 'Facilities parsed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setImportPreview(null);
                          setImportFileName('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                      >
                        {isVi ? 'Hủy / Chọn file khác' : 'Cancel / Change File'}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isVi ? 'Đang áp dụng...' : 'Applying...'}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isVi ? 'Xác Nhận Nạp Vào Mô Phỏng' : 'Apply to Simulation'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Tổng Phát Thải Thực Tế' : 'Total Actual Emissions'}</div>
                      <div className="text-sm font-bold font-mono text-white mt-0.5">
                        {totalActual.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">tCO2e</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Tổng Hạn Ngạch (Cap)' : 'Total Allocated Cap'}</div>
                      <div className="text-sm font-bold font-mono text-blue-400 mt-0.5">
                        {totalCap.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">tCO2e ({stringency}%)</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Cân Đối Toàn Thị Trường' : 'Net Market Balance'}</div>
                      <div className={`text-sm font-bold font-mono mt-0.5 ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {netBalance >= 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{netBalance >= 0 ? (isVi ? 'Thặng dư' : 'Surplus') : (isVi ? 'Thiếu hụt' : 'Deficit')}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Phân Hóa Cơ Sở' : 'Facility Diversity'}</div>
                      <div className="text-xs font-semibold mt-0.5 flex items-center gap-2">
                        <span className="text-emerald-400">🟢 {surplusCount}</span>
                        <span className="text-rose-400">🔴 {deficitCount}</span>
                        <span className="text-slate-400">⚪ {parityCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">{isVi ? 'Tên Cơ Sở' : 'Facility Name'}</th>
                          <th className="py-2 px-3">{isVi ? 'Lĩnh Vực' : 'Sector'}</th>
                          <th className="py-2 px-3 text-right">{isVi ? 'Phát Thải (tCO2e)' : 'Emissions (tCO2e)'}</th>
                          <th className="py-2 px-3 text-right">{isVi ? 'Hạn Ngạch (tCO2e)' : 'Cap (tCO2e)'}</th>
                          <th className="py-2 px-3 text-center">{isVi ? 'Cân Đối' : 'Position'}</th>
                          <th className="py-2 px-3">{isVi ? 'Công Nghệ / Phân Hóa' : 'Technology Note'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {importPreview.slice(0, 10).map((fac, idx) => {
                          const net = fac.allowance - fac.actualEmissions;
                          const isSurplus = net > 0;
                          const isDeficit = net < 0;

                          return (
                            <tr key={fac.id || idx} className="hover:bg-slate-900/50">
                              <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-sans font-bold text-slate-200">{fac.name}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold ${
                                  fac.sector === 'Power' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                                  fac.sector === 'Cement' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                                  'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {fac.sector}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300">{fac.actualEmissions.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right text-blue-400 font-bold">{fac.allowance.toLocaleString()}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold ${
                                  isSurplus ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                  isDeficit ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {isSurplus ? `+${net.toLocaleString()} (${isVi ? 'Dư' : 'Surplus'})` :
                                   isDeficit ? `${net.toLocaleString()} (${isVi ? 'Thiếu' : 'Deficit'})` :
                                   (isVi ? 'Cân bằng' : 'Parity')}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-400 truncate max-w-xs" title={fac.techDesc}>
                                {fac.techDesc || (fac.techTier === 'ADVANCED' ? 'Tiên tiến / Hiệu suất cao' : fac.techTier === 'LEGACY' ? 'Lạc hậu / Suất tiêu hao lớn' : 'Tiêu chuẩn')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {importPreview.length > 10 && (
                    <div className="text-center text-[11px] text-slate-500 pt-1">
                      {isVi 
                        ? `... và ${importPreview.length - 10} cơ sở khác trong danh sách tải lên.`
                        : `... and ${importPreview.length - 10} more facilities in the uploaded file.`}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Panel: Registered Participant Accounts & Facility Bindings */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
              👥
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {isVi ? 'Quản Lý Tài Khoản Người Dùng & Gán Công Ty' : 'Participant Accounts & Company Bindings'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isVi ? 'Theo dõi danh sách người tham gia đã đăng ký tài khoản gắn với từng nhà máy' : 'Directory of users registered and bound to specific facilities'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-xl border border-purple-500/30">
              {accounts.length} {isVi ? 'Tài khoản đã đăng ký' : 'Registered Users'}
            </span>
            <button
              onClick={fetchAccounts}
              disabled={isLoadingAccounts}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title={isVi ? 'Làm mới danh sách' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            {isVi 
              ? 'Chưa có tài khoản người dùng nào đăng ký. Toàn bộ các cơ sở hiện đang vận hành tự động bởi bot AI. Người dùng mới có thể đăng ký tài khoản tại Trang Đăng Nhập.' 
              : 'No participant accounts registered yet. All facilities are operating under AI market makers. Users can register at the Login Page.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">{isVi ? 'Tài Khoản' : 'Username'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Mã Cơ Sở' : 'Facility ID'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Tên Công Ty / Nhà Máy' : 'Company Name'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Ngành' : 'Sector'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Lần Hoạt Động Cuối' : 'Last Active'}</th>
                  <th className="py-2.5 px-3 text-right">{isVi ? 'Thao Tác' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {accounts.map((acc) => (
                  <tr key={acc.username} className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-bold text-purple-300">@{acc.username}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">{acc.facilityId}</td>
                    <td className="py-2 px-3 text-slate-200 font-sans">{acc.facilityName}</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] font-sans">{acc.sector}</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleDeleteAccount(acc.username)}
                        className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px] font-sans font-bold transition-all cursor-pointer"
                        title={isVi ? 'Hủy liên kết và giải phóng cơ sở này' : 'Unbind and release facility'}
                      >
                        {isVi ? 'Hủy liên kết' : 'Unbind'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW: Facility Cohort Sizing & Dynamic Cap Stringency Control Centers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel A: Active Facility Cohort & Technology Diversity */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                🏢
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isVi ? 'Quy Mô Cơ Sở Tham Gia & Phân Hóa Công Nghệ' : 'Active Facility Cohort & Tech Diversity'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isVi ? 'Cấu hình số lượng nhà máy tham gia thí điểm sàn ETS' : 'Configure number of participating facilities in ETS'}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/30">
              {currentCount} {isVi ? 'Cơ sở' : 'Plants'}
            </span>
          </div>

          {/* Quick preset chips */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              {isVi ? 'Chọn Nhanh Quy Mô Thí Điểm:' : 'Quick Cohort Size Presets:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { count: 10, labelVi: '10 Cơ Sở', descVi: 'Pilot Rút Gọn', labelEn: '10 Plants', descEn: 'Compact' },
                { count: 30, labelVi: '30 Cơ Sở', descVi: 'Nhóm Trọng Điểm', labelEn: '30 Plants', descEn: 'Key Emitters' },
                { count: 50, labelVi: '50 Cơ Sở', descVi: 'Quy Mô Vừa', labelEn: '50 Plants', descEn: 'Mid Scale' },
                { count: 110, labelVi: '110 Cơ Sở', descVi: 'Toàn Diện VN ETS', labelEn: '110 Plants', descEn: 'Full Vietnam' }
              ].map(preset => (
                <button
                  key={preset.count}
                  type="button"
                  onClick={() => handleApplyFacilityCount(preset.count)}
                  disabled={isApplyingScale}
                  className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    facilityCountInput === preset.count
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{isVi ? preset.labelVi : preset.labelEn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? preset.descVi : preset.descEn}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Slider & Number Input */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                {isVi ? 'Tùy Chỉnh Số Lượng Cơ Sở (5 – 110):' : 'Custom Cohort Sizing (5 – 110):'}
              </span>
              <span className="font-mono font-bold text-blue-400 text-sm">{facilityCountInput}</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="110"
                step="5"
                value={facilityCountInput}
                onChange={(e) => setFacilityCountInput(Number(e.target.value))}
                className="flex-1 accent-blue-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleApplyFacilityCount(facilityCountInput)}
                disabled={isApplyingScale || facilityCountInput === currentCount}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                {isApplyingScale ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : (isVi ? 'Áp Dụng' : 'Apply')}
              </button>
            </div>
          </div>

          {/* Diverse Technology & Compliance Situation Status Banner */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {isVi ? 'Phân Hóa Tình Trạng Công Nghệ & Vị Thế Tuân Thủ:' : 'Technology Diversity & Compliance Distribution:'}
            </span>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-2.5 rounded-2xl">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                  {isVi ? '🟢 Dư Thừa' : '🟢 Surplus'}
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {metrics?.surplusCount ?? Object.values(facilities || {}).filter(f => (f.allowances + f.offsets) > f.actualEmissions + 1500).length}
                </div>
                <span className="text-[9px] text-slate-400 block font-sans">
                  {isVi ? 'Công nghệ Tiên tiến' : 'Advanced Tech'}
                </span>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/40 p-2.5 rounded-2xl">
                <span className="text-[10px] text-rose-400 font-bold block uppercase">
                  {isVi ? '🔴 Thiếu Hụt' : '🔴 Deficit'}
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {metrics?.deficitCount ?? Object.values(facilities || {}).filter(f => (f.allowances + f.offsets) < f.actualEmissions - 1500).length}
                </div>
                <span className="text-[9px] text-slate-400 block font-sans">
                  {isVi ? 'Công nghệ Cũ / Lạc hậu' : 'Legacy Vintage'}
                </span>
              </div>

              <div className="bg-blue-950/30 border border-blue-500/40 p-2.5 rounded-2xl">
                <span className="text-[10px] text-blue-400 font-bold block uppercase">
                  {isVi ? '🔵 Cân Bằng' : '🔵 Parity'}
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {metrics?.balancedCount ?? Math.max(0, currentCount - (metrics?.surplusCount || 0) - (metrics?.deficitCount || 0))}
                </div>
                <span className="text-[9px] text-slate-400 block font-sans">
                  {isVi ? 'Công nghệ Tiêu chuẩn' : 'Standard Baseline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel B: MULTI-PERIOD CAP ADJUSTMENT BY PERCENTAGE (%) */}
        <div id="cap-governance-panel" className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30 shadow-inner">
                ⚖️
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  {isVi 
                    ? `Điều Chỉnh Hạn Ngạch Theo % Cho Các Kỳ (${startYearInput}–${startYearInput + totalPeriodsInput * periodLengthInput - 1})` 
                    : `Multi-Period Cap Adjustment by % (${startYearInput}–${startYearInput + totalPeriodsInput * periodLengthInput - 1})`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isVi 
                    ? (isImported 
                        ? 'Cấu hình tỷ lệ % hạn ngạch theo lượng hạn ngạch có trong file import cho từng kỳ tuân thủ.' 
                        : 'Cấu hình tỷ lệ % hạn ngạch so với phát thải thực tế cho từng kỳ tuân thủ trong giai đoạn đã thiết lập.')
                    : (isImported 
                        ? 'Configure cap % proportional to imported allowances for each period.' 
                        : 'Configure cap percentage relative to actual emissions for each period in the established schedule.')}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              {totalPeriodsInput} {isVi ? 'Kỳ Tuân Thủ' : 'Periods'}
            </span>
          </div>

          {/* Import Indicator Alert when facilities were imported */}
          {isImported && (
            <div className="flex items-start sm:items-center gap-2.5 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-sans">
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
              <div className="flex-1">
                <span className="font-bold">
                  {isVi ? 'Đang áp dụng danh sách từ File Import' : 'Active Imported Dataset'}:
                </span>{' '}
                {isVi 
                  ? `Tổng hạn ngạch gốc trong file là ${importedBaseCap.toLocaleString()} tCO2e. Mọi điều chỉnh % ở các kỳ bên dưới sẽ tự động tính theo tỷ lệ lượng hạn ngạch gốc của từng cơ sở trong file import.`
                  : `Base allowance in file is ${importedBaseCap.toLocaleString()} tCO2e. All period % adjustments below scale proportionally with each facility's imported allowance.`}
              </div>
            </div>
          )}

          {/* Real-time Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 font-mono">
            {isImported ? (
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center gap-1">
                  <span>📄</span> {isVi ? 'Hạn Ngạch Gốc (File Import - Mốc 100%):' : 'Imported Base Allowances (100%):'}
                </span>
                <div className="text-lg font-black text-amber-300 mt-0.5 flex items-baseline gap-1.5">
                  {importedBaseCap.toLocaleString()} 
                  <span className="text-xs text-slate-500 font-normal font-sans">tCO2e</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  {isVi ? 'Tổng Phát Thải Thực Tế Hiện Tại:' : 'Current Actual Emissions:'}
                </span>
                <div className="text-lg font-black text-white mt-0.5 flex items-baseline gap-1.5">
                  {(metrics?.totalActualEmissions || totalSystemEmissions).toLocaleString()} 
                  <span className="text-xs text-slate-500 font-normal font-sans">tCO2e</span>
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {isVi ? `Hạn Ngạch Kỳ Hiện Tại (Kỳ ${currentPeriod || 1}):` : `Current Period Cap (Period ${currentPeriod || 1}):`}
              </span>
              <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-baseline gap-1.5">
                {(form.totalCap || parameters?.totalCap || 0).toLocaleString()} 
                <span className="text-xs text-slate-500 font-normal font-sans">tCO2e</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Templates for Multi-Period Phase */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              {isVi ? 'Mẫu Kịch Bản Lộ Trình Toàn Giai Đoạn:' : 'Phase Trajectory Preset Templates:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { 
                  type: 'vn_pdp8', 
                  labelVi: isImported ? '+4%/kỳ (Tăng trưởng)' : '+4%/kỳ (Nghị Định 06)', 
                  descVi: isImported ? '100% → 104% → 108% file import' : '100% → 104% → 108%', 
                  labelEn: '+4%/Period (Growth)', 
                  descEn: isImported ? '100% → 104% of import' : 'Industrial Growth' 
                },
                { 
                  type: 'net_zero', 
                  labelVi: isImported ? '-2.5%/kỳ (Lộ Trình Xanh)' : '-2.5%/kỳ (Lộ Trình Xanh)', 
                  descVi: isImported ? '100% → 98% → 95% file import' : '100% → 98% → 95%', 
                  labelEn: '-2.5%/Period (Net Zero)', 
                  descEn: isImported ? '100% → 98% of import' : 'Emissions Decline' 
                },
                { 
                  type: 'parity', 
                  labelVi: isImported ? '100% Chuẩn File Import' : '100% Cân Bằng', 
                  descVi: isImported ? 'Đúng lượng trong file' : 'Ngang lượng phát thải', 
                  labelEn: isImported ? '100% Imported File' : '100% Parity', 
                  descEn: isImported ? 'Exact match file cap' : 'Balanced Market' 
                },
                { 
                  type: 'strict', 
                  labelVi: isImported ? '95% File Import (Thắt chặt)' : '95% Thắt Chặt', 
                  descVi: isImported ? 'Giảm 5% so với file import' : 'Tạo khan hiếm đẩy giá', 
                  labelEn: '95% Strict', 
                  descEn: isImported ? '95% of imported cap' : 'High Scarcity' 
                }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => applyPeriodCapPreset(item.type)}
                  className="p-2.5 rounded-2xl text-left border bg-slate-950/70 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all cursor-pointer group"
                >
                  <div className="font-bold text-xs group-hover:text-emerald-300">{isVi ? item.labelVi : item.labelEn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{isVi ? item.descVi : item.descEn}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ENTERPRISE EMISSIONS GROWTH FACTOR (DEVELOPING COUNTRY CONTEXT) */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-slate-950/80 border-amber-500/30 space-y-4 shadow-lg shadow-amber-950/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black shrink-0">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-white text-xs sm:text-sm">
                      {isVi 
                        ? 'Yếu Tố Tăng Trưởng Phát Thải Doanh Nghiệp Theo Kỳ (Quốc Gia Đang Phát Triển)' 
                        : 'Enterprise Emissions Growth Factor Across Periods (Developing Nation Context)'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      {isVi ? 'Bối Cảnh Việt Nam' : 'Vietnam Context'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isVi
                      ? 'Mô phỏng sự mở rộng tự nhiên của sản lượng và phát thải doanh nghiệp qua từng kỳ theo tăng trưởng kinh tế & Quy hoạch Điện VIII. Khi bước sang kỳ mới, phát thải cơ sở của các nhà máy sẽ tăng theo tỷ lệ đã chọn.'
                      : 'Simulates organic expansion of industrial enterprise emissions across periods driven by economic GDP growth. When advancing periods, baseline emissions expand automatically.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-2.5 cursor-pointer self-end sm:self-center shrink-0 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={form.enterpriseEmissionGrowthEnabled ?? true}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setForm(prev => ({ ...prev, enterpriseEmissionGrowthEnabled: val }));
                    if (onUpdateParameters) {
                      onUpdateParameters({ enterpriseEmissionGrowthEnabled: val });
                    }
                  }}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold font-mono text-amber-300">
                  {form.enterpriseEmissionGrowthEnabled ?? true 
                    ? (isVi ? 'KÍCH HOẠT' : 'ENABLED') 
                    : (isVi ? 'TẮT' : 'DISABLED')}
                </span>
              </label>
            </div>

            {/* Controls when enabled */}
            {(form.enterpriseEmissionGrowthEnabled ?? true) ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Rate Slider & Presets */}
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">
                        {isVi ? 'Tốc độ tăng trưởng phát thải cơ sở mỗi kỳ:' : 'Base Emission Growth Rate per Period:'}
                      </span>
                      <span className="font-mono font-extrabold text-amber-400 text-sm">
                        +{form.enterpriseEmissionGrowthRate ?? 3.5}% / {isVi ? 'kỳ' : 'period'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.5"
                      value={form.enterpriseEmissionGrowthRate ?? 3.5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setForm(prev => ({ ...prev, enterpriseEmissionGrowthRate: val }));
                      }}
                      onMouseUp={() => {
                        if (onUpdateParameters) {
                          onUpdateParameters({ enterpriseEmissionGrowthRate: form.enterpriseEmissionGrowthRate ?? 3.5 });
                        }
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />

                    {/* Quick rate buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { rate: 2.0, labelVi: '+2.0% (Thấp)', labelEn: '+2.0% (Low)' },
                        { rate: 3.5, labelVi: '+3.5% (Chuẩn VN)', labelEn: '+3.5% (VN Base)' },
                        { rate: 5.0, labelVi: '+5.0% (Năng động)', labelEn: '+5.0% (Dynamic)' },
                        { rate: 7.5, labelVi: '+7.5% (Tăng tốc)', labelEn: '+7.5% (High)' }
                      ].map(r => (
                        <button
                          key={r.rate}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, enterpriseEmissionGrowthRate: r.rate }));
                            if (onUpdateParameters) {
                              onUpdateParameters({ enterpriseEmissionGrowthRate: r.rate });
                            }
                          }}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer truncate ${
                            (form.enterpriseEmissionGrowthRate ?? 3.5) === r.rate
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {isVi ? r.labelVi : r.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Growth Distribution Mode */}
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="text-xs text-slate-300 font-semibold">
                      {isVi ? 'Cơ chế phân bổ tăng trưởng:' : 'Growth Allocation Mechanism:'}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setForm(prev => ({ ...prev, enterpriseEmissionGrowthMode: 'SECTOR_BASED' }));
                          if (onUpdateParameters) {
                            onUpdateParameters({ enterpriseEmissionGrowthMode: 'SECTOR_BASED' });
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          (form.enterpriseEmissionGrowthMode || 'SECTOR_BASED') === 'SECTOR_BASED'
                            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40 font-bold'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs">{isVi ? 'Phân hóa theo ngành (Khuyên dùng)' : 'Sector-Based (Rec.)'}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {isVi 
                            ? 'Điện: +130% tốc độ cơ sở; Thép: +105%; Xi măng: +80%; Khác: +95%' 
                            : 'Power: +130% base rate; Steel: +105%; Cement: +80%; Others: +95%'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setForm(prev => ({ ...prev, enterpriseEmissionGrowthMode: 'UNIFORM' }));
                          if (onUpdateParameters) {
                            onUpdateParameters({ enterpriseEmissionGrowthMode: 'UNIFORM' });
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          form.enterpriseEmissionGrowthMode === 'UNIFORM'
                            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40 font-bold'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs">{isVi ? 'Đồng đều tất cả cơ sở' : 'Uniform Across All'}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {isVi 
                            ? `Áp dụng đúng +${form.enterpriseEmissionGrowthRate ?? 3.5}% cho toàn bộ 110 cơ sở` 
                            : `Apply exact +${form.enterpriseEmissionGrowthRate ?? 3.5}% to all facilities`}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Period Projected Emissions Preview Banner */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isVi ? 'Dự báo phát thải hệ thống theo lộ trình tăng trưởng:' : 'Projected System Emissions Across Periods:'}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                    {Array.from({ length: totalPeriodsInput || state?.totalPeriods || 3 }).map((_, idx) => {
                      const p = idx + 1;
                      const gRate = (form.enterpriseEmissionGrowthRate ?? 3.5) / 100;
                      const factor = Math.pow(1 + gRate, p - 1);
                      const baseEmiss = metrics?.totalActualEmissions || totalSystemEmissions || 10700000;
                      const proj = Math.round(baseEmiss * factor);
                      return (
                        <div key={p} className="flex items-center gap-1">
                          <span className="text-slate-500 font-sans font-bold">Kỳ {p}:</span>
                          <span className={p === 1 ? 'text-slate-300 font-bold' : 'text-amber-400 font-bold'}>
                            {proj.toLocaleString()} t
                          </span>
                          {p > 1 && (
                            <span className="text-[9px] text-amber-500">
                              (+{((factor - 1) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-xl border border-slate-800/60">
                {isVi 
                  ? '⚠️ Yếu tố tăng trưởng phát thải đang tắt. Phát thải cơ sở của các doanh nghiệp sẽ giữ nguyên qua các kỳ (phù hợp với kịch bản các nước phát triển có sản lượng công nghiệp bão hòa).' 
                  : '⚠️ Emissions growth factor disabled. Enterprise emissions will remain static across periods (representative of mature economies with stagnant output).'}
              </div>
            )}
          </div>

          {/* Individual Period Cap % Adjuster Cards */}
          <div className="space-y-3 pt-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isVi ? 'Tùy Chỉnh Tỷ Lệ % Hạn Ngạch Từng Kỳ:' : 'Adjust Cap % by Individual Period:'}
            </label>

            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: totalPeriodsInput || state?.totalPeriods || 3 }).map((_, idx) => {
                const p = idx + 1;
                const pStart = startYearInput + (p - 1) * periodLengthInput;
                const pEnd = pStart + periodLengthInput - 1;
                const isCurrent = p === (currentPeriod || 1);
                const ratio = periodCapRatios[p] != null ? periodCapRatios[p] : (p === 1 ? capRatioInput : 100 + (p - 1) * 4);
                const refBase = (isImported && importedBaseCap > 0) ? importedBaseCap : totalSystemEmissions;
                const calcCap = Math.round(refBase * (ratio / 100));
                const gap = calcCap - totalSystemEmissions;

                return (
                  <div key={p} className={`p-4 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30' 
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                          isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {isVi ? `Kỳ ${p}` : `Period ${p}`} ({pStart}–{pEnd})
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            {isVi ? 'Đang Diễn Ra' : 'Active'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-emerald-400">
                          {calcCap.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans font-normal">tCO2e</span>
                        </span>
                        <span className={`text-[11px] font-mono ml-2 font-semibold ${gap < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ({gap >= 0 ? `+${gap.toLocaleString()}` : gap.toLocaleString()} t)
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-400">
                          {isVi 
                            ? (isImported ? 'Tỷ lệ % Hạn ngạch file:' : 'Tỷ lệ % Phát thải:') 
                            : (isImported ? '% of Imported Cap:' : 'Cap % of Emissions:')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdatePeriodRatio(p, ratio - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="50"
                            max="200"
                            value={ratio}
                            onChange={(e) => handleUpdatePeriodRatio(p, Number(e.target.value))}
                            className="w-16 bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-center font-mono font-bold text-emerald-300 text-xs focus:outline-none focus:border-emerald-400"
                          />
                          <span className="text-xs font-mono font-bold text-slate-400">%</span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePeriodRatio(p, ratio + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="70"
                        max="130"
                        value={ratio}
                        onChange={(e) => handleUpdatePeriodRatio(p, Number(e.target.value))}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button & Confirmation */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-sans">
              {capSavedSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-bounce">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isVi ? '✓ Đã cập nhật tỷ lệ hạn ngạch (%) cho tất cả các kỳ thành công!' : '✓ Cap percentages updated for all periods successfully!'}</span>
                </span>
              ) : (
                <span>
                  {isVi ? 'Hệ thống sẽ lưu tỷ lệ % và tự động áp dụng hạn ngạch tương ứng khi bước sang từng kỳ.' : 'Cap percentages will be persisted and applied as each period starts.'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleApplyCapSettings}
              disabled={isSyncingCap}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white text-xs font-black transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95"
            >
              {isSyncingCap ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isVi ? 'Đang Lưu & Tái Phân Bổ...' : 'Syncing & Reallocating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>{isVi ? 'Áp Dụng & Tái Phân Bổ Hạn Ngạch Các Kỳ' : 'Apply & Sync Multi-Period Caps'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Main Parameters Configuration Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 1: 100% Free Allocation & 30% Offsets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{t.allocationSection}</h3>
              <p className="text-[11px] text-slate-400">100% Free Allocation & 30% Domestic Offsets</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.freeAllocRate}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={form.freeAllocationRate}
                onChange={(e) => handleChange('freeAllocationRate', Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="w-14 text-sm font-mono font-bold text-emerald-400 text-right">{form.freeAllocationRate}%</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {isVi ? 'Thí điểm VN ETS phân bổ 100% miễn phí cho các nhà máy.' : 'Vietnam ETS Pilot allocates 100% free allowances.'}
            </span>
          </div>

          {/* Vietnam 30% Offset Usage Limit */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300">{t.offsetLimitDecree06}</span>
              <span className="text-xs font-mono font-bold text-teal-400">{form.offsetUsageLimit}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={form.offsetUsageLimit}
              onChange={(e) => handleChange('offsetUsageLimit', Number(e.target.value))}
              className="w-full accent-teal-500"
            />
            <p className="text-[11px] text-slate-400 leading-tight">
              {isVi 
                ? 'Theo Nghị định 06/2022/NĐ-CP, doanh nghiệp được dùng tối đa 30% tín chỉ các-bon bù trừ trong nước để hoàn thành nghĩa vụ.' 
                : 'Under Decree 06/2022/ND-CP, facilities may use up to 30% domestic carbon offsets for compliance.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.auctionShareCap}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="50"
                value={form.auctionShare}
                onChange={(e) => handleChange('auctionShare', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="w-14 text-sm font-mono font-bold text-purple-400 text-right">{form.auctionShare}%</span>
            </div>
          </div>

          {/* Flexibility: Surplus Banking */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200 block">{t.surplusBanking}</span>
                <span className="text-[10px] text-slate-400">
                  {isVi ? 'Chuyển hạn ngạch thặng dư chưa dùng sang các kỳ tiếp theo' : 'Carry unused surplus allowances forward to future periods'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.bankingAllowed}
                onChange={(e) => handleChange('bankingAllowed', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {form.bankingAllowed && (
              <div className="pt-2 border-t border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{isVi ? 'Tỷ lệ lưu giữ tối đa (% Hạn ngạch thừa):' : 'Max Banking Limit (% Surplus):'}</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.bankingLimit != null ? form.bankingLimit : 100}
                      onChange={(e) => handleChange('bankingLimit', Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-14 bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-0.5 text-right font-bold text-emerald-400 text-xs focus:outline-none"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.bankingLimit != null ? form.bankingLimit : 100}
                  onChange={(e) => handleChange('bankingLimit', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 italic">
                  {isVi 
                    ? `Doanh nghiệp được lưu giữ tối đa ${form.bankingLimit ?? 100}% hạn ngạch dư thừa. Phần thặng dư vượt quá sẽ tự động hết hạn.` 
                    : `Facilities may carry over up to ${form.bankingLimit ?? 100}% of remaining surplus. Any remainder expires.`}
                </p>
              </div>
            )}
          </div>

          {/* Flexibility: Allowance Borrowing */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200 block">{t.borrowingMechanism}</span>
                <span className="text-[10px] text-slate-400">
                  {isVi ? 'Cho phép cơ sở thiếu hụt vay trước một phần hạn ngạch từ kỳ sau' : 'Allow deficit facilities to borrow against next period allocation'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.borrowingAllowed}
                onChange={(e) => handleChange('borrowingAllowed', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {form.borrowingAllowed && (
              <div className="pt-2 border-t border-slate-800/60 space-y-3">
                {/* Borrowing Limit % */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{isVi ? 'Tỷ lệ vay tối đa (% Hạn ngạch phân bổ kỳ này):' : 'Max Borrowing Limit (% Current Allocation):'}</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={form.borrowingLimit != null ? form.borrowingLimit : 15}
                        onChange={(e) => handleChange('borrowingLimit', Math.max(0, Math.min(50, Number(e.target.value))))}
                        className="w-14 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-0.5 text-right font-bold text-amber-400 text-xs focus:outline-none"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={form.borrowingLimit != null ? form.borrowingLimit : 15}
                    onChange={(e) => handleChange('borrowingLimit', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Borrowing Interest Rate */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pt-1.5 border-t border-slate-800/50">
                  <div>
                    <span>{isVi ? 'Hệ số lãi phạt khi vay:' : 'Repayment Interest Multiplier:'}</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {isVi 
                        ? (Number(form.borrowingInterestRate ?? 1.0) === 1.0
                            ? '(Hệ số 1.0: Vay 100 tấn hoàn trả đúng 100 tấn ở kỳ sau, không tính lãi phạt)'
                            : `(Hệ số ${form.borrowingInterestRate}: Vay 100 tấn phải hoàn trả ${Math.round((form.borrowingInterestRate ?? 1.0) * 100)} tấn ở kỳ sau, lãi phạt +${Math.round(((form.borrowingInterestRate ?? 1.0) - 1) * 100)}%)`)
                        : (Number(form.borrowingInterestRate ?? 1.0) === 1.0
                            ? '(Multiplier 1.0: Borrow 100 t, repay exactly 100 t next period without penalty)'
                            : `(Multiplier ${form.borrowingInterestRate}: Borrow 100 t, repay ${Math.round((form.borrowingInterestRate ?? 1.0) * 100)} t next period)`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      max="2.00"
                      value={form.borrowingInterestRate != null ? form.borrowingInterestRate : 1.00}
                      onChange={(e) => handleChange('borrowingInterestRate', Math.max(1.0, Math.min(2.0, Number(e.target.value))))}
                      className="w-16 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-0.5 text-right font-bold text-amber-400 text-xs focus:outline-none"
                    />
                    <span className="text-slate-400 font-bold">x</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  {isVi 
                    ? `Giới hạn vay tối đa ${form.borrowingLimit ?? 15}% hạn ngạch phân bổ trong kỳ này, hệ số lãi phạt ${form.borrowingInterestRate ?? 1.0}x (${Math.round(((form.borrowingInterestRate ?? 1.0) - 1) * 100)}% lãi phạt) khấu trừ ở kỳ sau.` 
                    : `Borrowing capped at ${form.borrowingLimit ?? 15}% of this period's allocation with ${form.borrowingInterestRate ?? 1.0}x repayment multiplier (${Math.round(((form.borrowingInterestRate ?? 1.0) - 1) * 100)}% interest penalty).`}
                </p>
              </div>
            )}
          </div>

          {/* Dedicated Save Button for Section 1: Allocation & Flexibility */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-teal-600/25 transition-all cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isVi ? 'Đang Lưu...' : 'Saving...'}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>{isVi ? '✓ Đã Lưu Thông Số Phân Bổ & Độ Linh Hoạt!' : '✓ Allocation & Flexibility Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-teal-200" />
                  <span>{isVi ? 'Lưu Thông Số Phân Bổ & Độ Linh Hoạt Tín Chỉ' : 'Save Allocation & Offset Flexibility Parameters'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Enforcement & Market Safeguards */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{t.penaltiesSection}</h3>
              <p className="text-[11px] text-slate-400">Shortfall fines & liquidity</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.shortfallPenaltyFine}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="5"
                value={form.penaltyRate}
                onChange={(e) => handleChange('penaltyRate', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-rose-400 font-mono font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.marketFloor}
              </label>
              <input
                type="number"
                value={form.marketPriceFloor}
                onChange={(e) => handleChange('marketPriceFloor', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.marketCeiling}
              </label>
              <input
                type="number"
                value={form.marketPriceCeiling}
                onChange={(e) => handleChange('marketPriceCeiling', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>{t.simulatedBots}</span>
              </div>
              <input
                type="checkbox"
                checked={form.botsEnabled}
                onChange={(e) => handleChange('botsEnabled', e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            {form.botsEnabled && (
              <div className="pt-2 border-t border-slate-800/60 space-y-4">
                {/* 1. Target Compliance Rate */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      {isVi ? 'Mục tiêu tuân thủ toàn thị trường:' : 'Target System Compliance Rate:'}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {form.botComplianceTarget != null ? form.botComplianceTarget : 95}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="70"
                      max="100"
                      step="1"
                      value={form.botComplianceTarget != null ? form.botComplianceTarget : 95}
                      onChange={(e) => handleChange('botComplianceTarget', Number(e.target.value))}
                      className="flex-1 accent-purple-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      {[90, 95, 98].map(target => (
                        <button
                          key={target}
                          type="button"
                          onClick={() => handleChange('botComplianceTarget', target)}
                          className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-all ${
                            (form.botComplianceTarget ?? 95) === target
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {target}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] leading-relaxed text-slate-300 space-y-1 mt-2">
                    <p className="text-slate-400">
                      {isVi 
                        ? `Các AI Bots sẽ tự động phân bổ theo nhiều chiến lược tuân thủ (đầu tư giảm phát thải công nghệ MAC, mua tín chỉ các-bon bù trừ VCM tối đa 30%, và liên tục giao dịch mua/bán hạn ngạch trên sàn) để hướng tới tỷ lệ tuân thủ ~${form.botComplianceTarget ?? 95}%.` 
                        : `AI Bots autonomously pursue diverse compliance pathways (internal MAC decarbonization, carbon offsets up to 30%, and active allowance market trading) targeting ~${form.botComplianceTarget ?? 95}% compliance.`}
                    </p>
                    <p className="text-[10px] text-emerald-400/90 font-medium">
                      {isVi
                        ? '✓ Hệ thống luôn duy trì thanh khoản hai chiều và khớp lệnh giao dịch thực tế liên tục trên sàn.'
                        : '✓ Continuous two-sided market liquidity and real trade executions are maintained on the trading floor.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle className="w-4 h-4 text-emerald-300" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveSuccess ? (isVi ? 'Đã Lưu Tham Số Thành Công!' : 'Parameters Saved!') : t.saveParameters}</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
