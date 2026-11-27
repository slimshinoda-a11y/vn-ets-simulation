import React from 'react';
import { 
  X, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Coins, 
  BarChart3, 
  Factory, 
  Leaf, 
  Printer, 
  Flag,
  Award,
  ArrowRight,
  Zap,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency } from '../i18n';
import { exportSimulationAuditExcel } from '../utils/exportAuditExcel';

export default function GrandPilotSummaryModal({
  isOpen,
  onClose,
  state,
  lang = 'vi',
  currency = 'USD'
}) {
  const isVi = lang === 'vi';
  if (!isOpen) return null;

  const grand = state?.grandPilotSummary || {
    pilotTitle: `Báo Cáo Tổng Kết Giai Đoạn Thí Điểm Sàn ETS Việt Nam (2025–2030)`,
    startYear: 2025,
    endYear: 2030,
    totalPeriods: 3,
    totalFacilities: Object.keys(state?.facilities || {}).length || 110,
    avgComplianceRate: 92.4,
    cumulativeEmissions: 28500000,
    cumulativeAllowancesSurrendered: 27100000,
    cumulativeOffsetsSurrendered: 1200000,
    cumulativePenalties: 2400000,
    marketLiquidity: {
      totalTurnoverUSD: 4500000,
      totalTurnoverVND: 4500000 * 25400,
      allowanceVolume: 820000,
      allowanceTurnoverUSD: 4100000,
      offsetVolume: 135000,
      offsetTurnoverUSD: 405000,
      totalTradesCount: 142
    },
    decarbonization: {
      totalProjects: 18,
      totalTonsAbated: 485000,
      totalCapexUSD: 3600000,
      totalCapexVND: 3600000 * 25400
    },
    periodProgression: [
      { period: 1, periodYears: '2025–2026', cap: 9500000, emissions: 9800000, complianceRate: 91.2, allowanceAvgPrice: 5.05, allowanceVolume: 240000, offsetVolume: 45000, abatedTons: 120000, penalties: 960000 },
      { period: 2, periodYears: '2027–2028', cap: 9880000, emissions: 9600000, complianceRate: 93.6, allowanceAvgPrice: 5.40, allowanceVolume: 280000, offsetVolume: 42000, abatedTons: 165000, penalties: 780000 },
      { period: 3, periodYears: '2029–2030', cap: 10275000, emissions: 9100000, complianceRate: 95.8, allowanceAvgPrice: 5.85, allowanceVolume: 300000, offsetVolume: 48000, abatedTons: 200000, penalties: 660000 }
    ],
    topAbaters: [],
    topFinancials: []
  };

  const periodProgression = grand.periodProgression?.length > 0 ? grand.periodProgression : [
    { period: 1, periodYears: '2025–2026', cap: 9500000, emissions: 9800000, complianceRate: 91.2, allowanceAvgPrice: 5.05, allowanceVolume: 240000, offsetVolume: 45000, abatedTons: 120000, penalties: 960000 },
    { period: 2, periodYears: '2027–2028', cap: 9880000, emissions: 9600000, complianceRate: 93.6, allowanceAvgPrice: 5.40, allowanceVolume: 280000, offsetVolume: 42000, abatedTons: 165000, penalties: 780000 },
    { period: 3, periodYears: '2029–2030', cap: 10275000, emissions: 9100000, complianceRate: 95.8, allowanceAvgPrice: 5.85, allowanceVolume: 300000, offsetVolume: 48000, abatedTons: 200000, penalties: 660000 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Grand Header */}
        <div className="relative bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 p-6 sm:p-8 border-b border-purple-500/30 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30 border border-white/20 shrink-0">
                <Trophy className="w-8 h-8 text-amber-200 fill-amber-200/40" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Flag className="w-3 h-3 text-red-400 fill-red-400" />
                    {isVi ? 'Giai Đoạn Thí Điểm Hoàn Thành' : 'Pilot Phase Concluded'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {grand.startYear || 2025} – {grand.endYear || 2030}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {isVi ? 'Báo Cáo Toàn Diện Thí Điểm Sàn ETS Việt Nam' : 'Vietnam ETS Pilot Phase Concluding Report'}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {isVi
                    ? 'Tổng kết kết quả thực hiện cơ chế giao dịch hạn ngạch phát thải khí nhà kính thí điểm (2025–2030) theo Nghị định 06/2022/NĐ-CP, chuẩn bị kết nối thị trường carbon quốc tế.'
                    : 'Comprehensive evaluation of the Vietnam ETS Pilot Phase (2025–2030) covering macroeconomic compliance, trading liquidity, and enterprise decarbonization.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => exportSimulationAuditExcel(state, lang)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                title={isVi ? 'Xuất toàn bộ bảng phát thải và hạn ngạch của từng cơ sở theo từng kỳ ra Excel (.xlsx)' : 'Export full multi-period emissions and allowances per facility to Excel (.xlsx)'}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>{isVi ? 'Xuất Báo Cáo Excel Các Kỳ' : 'Export Multi-Period Excel'}</span>
              </button>
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
        </div>

        {/* Grand Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[72vh] overflow-y-auto">
          
          {/* 4 Grand Macro KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/40 relative overflow-hidden group">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? 'Tổng Giảm Phát Thải (6 Năm)' : 'Cumulative Abated (6 Years)'}
              </div>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                {(grand.decarbonization?.totalTonsAbated || 485000).toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1">tCO2e</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {grand.decarbonization?.totalProjects || 18} {isVi ? 'dự án công nghệ cao' : 'abatement projects'}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/40 relative overflow-hidden group">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? 'Vốn Doanh Nghiệp Đầu Tư Xanh' : 'Enterprise Green CAPEX'}
              </div>
              <div className="text-3xl font-black font-mono text-purple-300 mt-1">
                {formatCurrency(grand.decarbonization?.totalCapexUSD || 3600000, currency, true)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isVi ? 'Đầu tư nội bộ doanh nghiệp' : 'Private decarbonization'}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-blue-500/40 relative overflow-hidden group">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? 'Tổng Doanh Số Sàn Giao Dịch' : 'Total ETS Market Turnover'}
              </div>
              <div className="text-3xl font-black font-mono text-blue-400 mt-1">
                {formatCurrency(grand.marketLiquidity?.totalTurnoverUSD || 4500000, currency, true)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {grand.marketLiquidity?.totalTradesCount || 142} {isVi ? 'giao dịch thành công' : 'cleared transactions'}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 relative overflow-hidden group">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? 'Tỷ Lệ Tuân Thủ Trung Bình' : 'Average Compliance Rate'}
              </div>
              <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                {grand.avgComplianceRate || 93.5}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {grand.totalFacilities || 110} {isVi ? 'cơ sở trọng điểm tham gia' : 'covered pilot facilities'}
              </div>
            </div>

          </div>

          {/* Period-by-Period Evolution Timeline */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  {isVi ? 'Tiến Trình 3 Kỳ Tuân Thủ (2025–2030)' : 'Evolution Across 3 Compliance Periods (2025–2030)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isVi ? 'So sánh lộ trình hạn ngạch (Cap), giá tín chỉ, thanh khoản thị trường và tỷ lệ tuân thủ qua từng chu kỳ.' : 'Multi-period trajectory of cap stringency, carbon pricing, and mitigation uptake.'}
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/30">
                {periodProgression.length} {isVi ? 'Kỳ Tuân Thủ' : 'Periods'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{isVi ? 'Chu Kỳ Tuân Thủ' : 'Period'}</th>
                    <th className="py-3 px-4 text-right">{isVi ? 'Hạn Ngạch Cap (tCO2e)' : 'Cap (tCO2e)'}</th>
                    <th className="py-3 px-4 text-right">{isVi ? 'Phát Thải Thực Tế' : 'Actual Emissions'}</th>
                    <th className="py-3 px-4 text-right">{isVi ? 'Khối Lượng Giao Dịch' : 'Trading Volume'}</th>
                    <th className="py-3 px-4 text-right">{isVi ? 'Giá Hạn Ngạch TB' : 'Avg Allowance Price'}</th>
                    <th className="py-3 px-4 text-right">{isVi ? 'Giảm Phát Thải' : 'Abated Tons'}</th>
                    <th className="py-3 px-4 text-center">{isVi ? 'Tỷ Lệ Tuân Thủ' : 'Compliance Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {periodProgression.map((p, idx) => (
                    <tr key={p.period || idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 text-[10px] flex items-center justify-center font-bold">
                          {p.period}
                        </span>
                        <span>Kỳ {p.period} ({p.periodYears})</span>
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-bold">{p.cap?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{p.emissions?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-teal-400">
                        {((p.allowanceVolume || 0) + (p.offsetVolume || 0)).toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">t</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">${p.allowanceAvgPrice || 5.0}</td>
                      <td className="py-3 px-4 text-right text-purple-400 font-bold">+{p.abatedTons?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {p.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enterprise Honors & Policy Conclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Decarbonization Champions */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  {isVi ? 'Vinh Danh: Tiên Phong Khử Carbon (Top Abaters)' : 'Hall of Fame: Decarbonization Leaders'}
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {(grand.topAbaters?.length > 0 ? grand.topAbaters : [
                  { name: 'Cement Plant C-02', sector: 'Cement', abatedTons: 65000, implementedCount: 3 },
                  { name: 'Steel Mill S-01', sector: 'Steel', abatedTons: 58000, implementedCount: 2 },
                  { name: 'Power Facility P-04', sector: 'Power', abatedTons: 52000, implementedCount: 2 }
                ]).map((fac, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{fac.name}</div>
                        <div className="text-[10px] text-slate-400">{fac.sector} • {fac.implementedCount} {isVi ? 'dự án vận hành' : 'projects'}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-400">
                      -{fac.abatedTons?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">tCO2e</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Regulatory Conclusions */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  {isVi ? 'Đánh Giá & Lộ Trình Sau 2030' : 'Policy Evaluation & Post-2030 Roadmap'}
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>{isVi ? 'Sẵn sàng vận hành chính thức:' : 'Commercial readiness:'}</strong> {isVi ? '110 cơ sở đã nắm vững quy trình kiểm kê, nộp hạn ngạch và giao dịch bù trừ theo đúng Nghị định 06/2022/NĐ-CP.' : 'All covered facilities fully adapted to MRV, allowance surrender, and offset clearing.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>{isVi ? 'Tín hiệu giá ổn định:' : 'Stable price signal:'}</strong> {isVi ? 'Giá hạn ngạch vận động lành mạnh quanh vùng $5.00 – $5.85/tCO2e, phản ánh chi phí giảm phát thải thực tế mà không gây sốc chi phí năng lượng.' : 'Allowance price formed reliably around $5.00-$5.85/t, matching domestic abatement costs.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>{isVi ? 'Chuyển đổi sau 2030:' : 'Post-2030 Transition:'}</strong> {isVi ? 'Bắt đầu áp dụng đấu giá một phần (Auctioning 10–20%), mở rộng sang ngành Hóa chất & Giao thông, và liên kết thị trường carbon khu vực.' : 'Introduce partial auctioning (10-20%), expand to chemicals and logistics, and link regionally.'}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Grand Footer */}
        <div className="p-5 bg-slate-950 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {isVi 
              ? 'Hệ Thống Mô Phỏng Sàn Giao Dịch Hạn Ngạch Phát Thải Khí Nhà Kính Việt Nam (Bộ TN&MT)'
              : 'Vietnam Greenhouse Gas Emission Trading Simulation Platform (MONRE)'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => exportSimulationAuditExcel(state, lang)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              title={isVi ? 'Xuất toàn bộ bảng phát thải và hạn ngạch của từng cơ sở theo từng kỳ ra Excel (.xlsx)' : 'Export full multi-period emissions and allowances per facility to Excel (.xlsx)'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>{isVi ? 'Xuất Báo Cáo Excel Các Kỳ (.xlsx)' : 'Export Multi-Period Excel (.xlsx)'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {isVi ? 'Hoàn Tất & Đóng' : 'Close Grand Report'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
