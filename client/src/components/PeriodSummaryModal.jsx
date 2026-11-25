import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Factory, 
  Flame, 
  ShieldCheck, 
  DollarSign, 
  Coins, 
  Layers, 
  Leaf, 
  Printer, 
  Calendar,
  Building2,
  Search,
  Filter
} from 'lucide-react';
import { formatCurrency } from '../i18n';

export default function PeriodSummaryModal({
  isOpen,
  onClose,
  state,
  initialPeriod = null,
  lang = 'vi',
  currency = 'USD'
}) {
  const isVi = lang === 'vi';
  const history = state?.history || [];
  
  // Choose which period in history to show (default to latest or initialPeriod)
  const [selectedPeriodNum, setSelectedPeriodNum] = useState(
    initialPeriod || (history.length > 0 ? history[history.length - 1].period : state?.currentPeriod || 1)
  );
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'COMPLIANT' | 'NON_COMPLIANT'
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Find the settlement item for the selected period
  const settlementItem = history.find(h => h.period === selectedPeriodNum) || 
    (history.length > 0 ? history[history.length - 1] : null);

  const summary = settlementItem?.summary || {
    period: state?.currentPeriod || 1,
    periodYears: state?.periodYearsLabel || '2025–2026',
    totalFacilities: Object.keys(state?.facilities || {}).length || 110,
    compliantCount: 0,
    nonCompliantCount: 0,
    complianceRate: 0,
    totalSystemEmissions: state?.metrics?.totalActualEmissions || 0,
    totalAllowancesSurrendered: 0,
    totalOffsetsSurrendered: 0,
    totalBorrowed: 0,
    totalBanked: 0,
    totalPenaltiesCollected: 0,
    allowanceTrading: { volume: 0, turnover: 0, avgPrice: 5.0, tradeCount: 0 },
    offsetTrading: { volume: 0, turnover: 0, avgPrice: 3.0, tradeCount: 0 },
    abatement: { projectsCount: 0, abatedTons: 0, capexInvested: 0, annualOpexSaved: 0 },
    sectorStats: {}
  };

  const facilitiesList = settlementItem?.facilities || [];

  const filteredFacilities = facilitiesList.filter(fac => {
    const matchesSearch = fac.facilityName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fac.sectorType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || fac.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-blue-950/80 p-6 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0 border border-emerald-500/40 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isVi ? `Báo Cáo Tổng Kết Kỳ Tuân Thủ ${summary.period}` : `Compliance Period ${summary.period} Reconciliation Report`}
                </h2>
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {summary.periodYears}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {isVi 
                  ? 'Biên bản tổng hợp quyết toán nộp hạn ngạch, tín chỉ bù trừ, tiền phạt vi phạm và thống kê thanh khoản giao dịch.'
                  : 'Official settlement record of allowance surrender, offset credits, penalty enforcement, and exchange liquidity.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Multi-Period Selector if more than 1 period is settled */}
            {history.length > 1 && (
              <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800">
                {history.map(h => (
                  <button
                    key={h.period}
                    onClick={() => setSelectedPeriodNum(h.period)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPeriodNum === h.period
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kỳ {h.period} ({h.periodYears})
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isVi ? 'In báo cáo' : 'Print report'}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Compliance Rate */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isVi ? 'Tỷ Lệ Tuân Thủ' : 'Compliance Rate'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {summary.complianceRate}%
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">🟢 {summary.compliantCount} {isVi ? 'Đạt' : 'Pass'}</span>
                <span className="text-rose-400 font-bold">🔴 {summary.nonCompliantCount} {isVi ? 'Vi Phạm' : 'Fail'}</span>
                <span className="text-slate-400">({summary.totalFacilities} {isVi ? 'cơ sở' : 'plants'})</span>
              </div>
            </div>

            {/* Card 2: Allowance Trading */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isVi ? 'Khớp Hạn Ngạch' : 'Allowance Trading'}</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black font-mono text-blue-400">
                {summary.allowanceTrading?.volume?.toLocaleString() || 0}
                <span className="text-xs font-normal text-slate-400 ml-1">tCO2e</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span>{isVi ? 'Doanh số:' : 'Turnover:'} <strong className="text-white">{formatCurrency(summary.allowanceTrading?.turnover || 0, currency, true)}</strong></span>
                <span>{isVi ? 'Giá TB:' : 'Avg:'} <strong className="text-blue-300">{formatCurrency(summary.allowanceTrading?.avgPrice || 5.0, currency, false, lang)}</strong></span>
              </div>
            </div>

            {/* Card 3: Offset / Credit Trading */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-teal-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isVi ? 'Khớp Tín Chỉ Bù Trừ' : 'Offset Trading'}</span>
                <Leaf className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black font-mono text-teal-400">
                {summary.offsetTrading?.volume?.toLocaleString() || 0}
                <span className="text-xs font-normal text-slate-400 ml-1">tCO2e</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span>{isVi ? 'Doanh số:' : 'Turnover:'} <strong className="text-white">{formatCurrency(summary.offsetTrading?.turnover || 0, currency, true)}</strong></span>
                <span>{isVi ? 'Giá TB:' : 'Avg:'} <strong className="text-teal-300">{formatCurrency(summary.offsetTrading?.avgPrice || 3.0, currency, false, lang)}</strong></span>
              </div>
            </div>

            {/* Card 4: Decarbonization Abatement */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isVi ? 'Giảm Phát Thải Mới' : 'New Mitigation'}</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black font-mono text-purple-400">
                {summary.abatement?.abatedTons?.toLocaleString() || 0}
                <span className="text-xs font-normal text-slate-400 ml-1">tCO2e/y</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span><strong className="text-white">{summary.abatement?.projectsCount || 0}</strong> {isVi ? 'dự án đầu tư' : 'projects'}</span>
                <span>Vốn: <strong className="text-purple-300">{formatCurrency(summary.abatement?.capexInvested || 0, currency, true)}</strong></span>
              </div>
            </div>

          </div>

          {/* Row 2: Sector Breakdown & Regulatory Balance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Panel A: Sectoral Performance */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Factory className="w-4 h-4 text-blue-400" />
                  {isVi ? 'Hiệu Suất Tuân Thủ Theo Ngành' : 'Sector Compliance Performance'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {summary.totalSystemEmissions?.toLocaleString()} tCO2e {isVi ? 'phát thải' : 'emissions'}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'power', nameVi: 'Nhiệt Điện (Power)', nameEn: 'Power & Utilities', icon: Zap, color: 'amber' },
                  { key: 'cement', nameVi: 'Xi Măng (Cement)', nameEn: 'Cement & Minerals', icon: Factory, color: 'emerald' },
                  { key: 'steel', nameVi: 'Luyện Kim & Thép (Steel)', nameEn: 'Metals & Steel', icon: Flame, color: 'blue' }
                ].map(sec => {
                  const sData = summary.sectorStats?.[sec.key] || {
                    facilityCount: 0,
                    actualEmissions: 0,
                    compliantCount: 0,
                    complianceRate: 100
                  };
                  const Icon = sec.icon;

                  return (
                    <div key={sec.key} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-${sec.color}-500/10 text-${sec.color}-400 flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-200">{isVi ? sec.nameVi : sec.nameEn}</div>
                          <div className="text-[10px] text-slate-400">
                            {sData.facilityCount} {isVi ? 'cơ sở' : 'plants'} • {sData.actualEmissions?.toLocaleString()} tCO2e
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-black font-mono ${sData.complianceRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {sData.complianceRate}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sData.compliantCount}/{sData.facilityCount} {isVi ? 'đạt chuẩn' : 'compliant'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel B: Regulatory Surrender & Penalty Details */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  {isVi ? 'Quyết Toán Nộp & Truy Thu Chế Tài' : 'Surrender & Enforcement Balance'}
                </h3>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  {formatCurrency(summary.totalPenaltiesCollected || 0, currency)} {isVi ? 'tiền phạt' : 'penalties'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Hạn Ngạch Nộp' : 'Allowances Surrendered'}</div>
                  <div className="text-base font-bold font-mono text-blue-400 mt-1">
                    {summary.totalAllowancesSurrendered?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">tCO2e</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Tín Chỉ Bù Trừ Nộp (Max 30%)' : 'Offsets Surrendered'}</div>
                  <div className="text-base font-bold font-mono text-teal-400 mt-1">
                    {summary.totalOffsetsSurrendered?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">tCO2e</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Hạn Ngạch Lưu Ký (Banking)' : 'Allowances Banked'}</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    {summary.totalBanked?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">tCO2e</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isVi ? 'Vay Mượn Hạn Ngạch (Borrowing)' : 'Allowances Borrowed'}</div>
                  <div className="text-base font-bold font-mono text-amber-400 mt-1">
                    {summary.totalBorrowed?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">tCO2e</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {isVi 
                  ? `Theo Nghị định 06/2022/NĐ-CP: Mức phạt vi phạm thiếu hụt hạn ngạch là ${formatCurrency(12, currency, false, lang)}/tCO2e (đã truy thu trực tiếp từ ngân quỹ doanh nghiệp). Hạn ngạch vay mượn sẽ bị khấu trừ 110% (kèm lãi suất 10%) trong đợt phân bổ miễn phí của Kỳ kế tiếp.`
                  : `Under Vietnam ETS rules: Non-compliance shortfalls incur a ${formatCurrency(12, currency, false, lang)}/tCO2e fine. Borrowed units are deducted at 110% (including 10% interest) from the facility free allocation in the next compliance period.`}
              </div>
            </div>

          </div>

          {/* Row 3: Facilities Compliance Ledger Table */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isVi ? 'Bảng Kê Chi Tiết Tuân Thủ Từng Cơ Sở' : 'Facility-by-Facility Compliance Roster'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isVi ? `Hiển thị ${filteredFacilities.length} / ${facilitiesList.length} cơ sở trong Kỳ ${summary.period}` : `Showing ${filteredFacilities.length} of ${facilitiesList.length} facilities`}
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isVi ? 'Tìm tên cơ sở...' : 'Search facility...'}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterStatus === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isVi ? 'Tất Cả' : 'All'}
                  </button>
                  <button
                    onClick={() => setFilterStatus('COMPLIANT')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterStatus === 'COMPLIANT' ? 'bg-emerald-600/30 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isVi ? 'Đạt' : 'Pass'}
                  </button>
                  <button
                    onClick={() => setFilterStatus('NON_COMPLIANT')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterStatus === 'NON_COMPLIANT' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isVi ? 'Vi Phạm' : 'Fail'}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isVi ? 'Tên Cơ Sở' : 'Facility Name'}</th>
                    <th className="py-2.5 px-3">{isVi ? 'Lĩnh Vực' : 'Sector'}</th>
                    <th className="py-2.5 px-3 text-right">{isVi ? 'Phát Thải (tCO2e)' : 'Emissions'}</th>
                    <th className="py-2.5 px-3 text-right">{isVi ? 'Nộp Hạn Ngạch' : 'Allowances'}</th>
                    <th className="py-2.5 px-3 text-right">{isVi ? 'Nộp Tín Chỉ' : 'Offsets'}</th>
                    <th className="py-2.5 px-3 text-right">{isVi ? 'Vay Mượn' : 'Borrowed'}</th>
                    <th className="py-2.5 px-3 text-right">{isVi ? 'Tiền Phạt' : 'Penalty'}</th>
                    <th className="py-2.5 px-3 text-center">{isVi ? 'Kết Luận' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredFacilities.map((fac, idx) => {
                    const isCompliant = fac.status === 'COMPLIANT';

                    return (
                      <tr key={fac.facilityId || idx} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-200">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <span>{fac.facilityName}</span>
                            {fac.complianceStrategy && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium inline-block w-fit ${
                                fac.complianceStrategy === 'ABATEMENT_FOCUS'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : fac.complianceStrategy === 'OFFSET_FOCUS'
                                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                  : fac.complianceStrategy === 'ALLOWANCE_FOCUS'
                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                  : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              }`}>
                                {isVi ? fac.strategyLabelVi : fac.strategyLabelEn}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400 text-[10px]">{fac.sectorType}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{fac.actualEmissions?.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-blue-400 font-bold">{fac.surrenderedAllowances?.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-teal-400 font-bold">{fac.surrenderedOffsets?.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-amber-400">{fac.borrowed > 0 ? fac.borrowed.toLocaleString() : '—'}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-400">
                          {fac.penalty > 0 ? formatCurrency(fac.penalty, currency) : '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold inline-flex items-center gap-1 ${
                            isCompliant
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {isCompliant ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>{isVi ? 'ĐẠT' : 'PASS'}</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>{isVi ? 'VI PHẠM' : 'FAIL'}</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isVi 
              ? `Kỳ ${summary.period} (${summary.periodYears}) • Hệ Thống Mô Phỏng Sàn Giao Dịch ETS Việt Nam`
              : `Period ${summary.period} (${summary.periodYears}) • Vietnam ETS Platform`}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {isVi ? 'Đóng Báo Cáo' : 'Close Report'}
          </button>
        </div>

      </div>
    </div>
  );
}
