import React, { useState } from 'react';
import { 
  BarChart3, 
  Trophy, 
  Activity, 
  Clock
} from 'lucide-react';
import { translations, formatCurrency } from '../i18n';
import PriceSignalChart from './PriceSignalChart';

export default function MarketBoard({ state, lang = 'vi', currency = 'USD', isAdmin = false }) {
  const [leaderboardFilter, setLeaderboardFilter] = useState('all'); // 'all' | 'surplus' | 'deficit' | 'abatement' | 'profit'
  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  const { 
    parameters, 
    currentPeriod, 
    totalPeriods, 
    allowanceMarket, 
    offsetMarket, 
    facilities = {}, 
    history = [], 
    recentLogs = [],
    metrics
  } = state || {};

  const facilityList = Object.values(facilities);
  
  const totalSystemEmissions = facilityList.reduce((sum, f) => sum + f.actualEmissions, 0);
  const totalSystemBaseline = facilityList.reduce((sum, f) => sum + f.baselineEmissions, 0);
  const totalSystemAbatement = facilityList.reduce((sum, f) => sum + f.implementedAbatement, 0);
  const overallAbatementPct = totalSystemBaseline > 0 
    ? Math.round((totalSystemAbatement / totalSystemBaseline) * 100) 
    : 0;

  const filteredFacilities = facilityList.filter(f => {
    const net = (f.allowances + f.offsets) - f.actualEmissions;
    if (leaderboardFilter === 'surplus') return net > 1000 || f.techTier === 'ADVANCED';
    if (leaderboardFilter === 'deficit') return net < -1000 || f.techTier === 'LEGACY';
    return true;
  });

  const sortedFacilities = [...filteredFacilities].sort((a, b) => {
    if (leaderboardFilter === 'abatement') {
      const pctA = a.baselineEmissions ? a.implementedAbatement / a.baselineEmissions : 0;
      const pctB = b.baselineEmissions ? b.implementedAbatement / b.baselineEmissions : 0;
      return pctB - pctA;
    } else if (leaderboardFilter === 'profit') {
      return b.cash - a.cash;
    } else if (leaderboardFilter === 'deficit') {
      const covA = a.allowances + a.offsets - a.actualEmissions;
      const covB = b.allowances + b.offsets - b.actualEmissions;
      return covA - covB; // Most negative first
    } else {
      const covA = a.allowances + a.offsets - a.actualEmissions;
      const covB = b.allowances + b.offsets - b.actualEmissions;
      return covB - covA; // Most positive first
    }
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              {t.marketOverviewTitle}
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">{t.marketOverviewTitle}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {t.observatorySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.periodLabel} {currentPeriod} ({state?.periodYearsLabel || '2025–2026'}) {t.systemCap}</span>
              <div className="text-xl font-black font-mono text-emerald-400">
                {parameters?.totalCap?.toLocaleString()} <span className="text-xs text-slate-500 font-normal">tCO2e</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.actualEmissions}</span>
              <div className="text-xl font-black font-mono text-white">
                {totalSystemEmissions.toLocaleString()} <span className="text-xs text-slate-500 font-normal">tCO2e</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{parameters?.freeAllocationRate || 100}% {t.freeAllocation}</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.carbonAllowancesEua}</span>
            <div className="text-2xl font-black font-mono text-emerald-400 flex items-center gap-1.5">
              {formatCurrency(allowanceMarket?.lastPrice || 42.50, currency)}
              <span className="text-xs text-slate-500 font-normal">/t</span>
            </div>
            <span className="text-[10px] text-slate-500">{t.volumeTraded}: {(allowanceMarket?.volume || 0).toLocaleString()} tCO2e</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.carbonOffsetsCer}</span>
            <div className="text-2xl font-black font-mono text-teal-400 flex items-center gap-1.5">
              {formatCurrency(offsetMarket?.lastPrice || 18.00, currency)}
              <span className="text-xs text-slate-500 font-normal">/t</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {isVi ? 'Chiết khấu:' : 'Discount:'} {Math.round((1 - (offsetMarket?.lastPrice || 18)/(allowanceMarket?.lastPrice || 42.5)) * 100)}% {isVi ? 'so với hạn ngạch' : 'vs allowance'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.decarbonizationRate}</span>
            <div className="text-2xl font-black font-mono text-blue-400">
              {overallAbatementPct}%
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">-{totalSystemAbatement.toLocaleString()} tCO2e</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.nonComplianceFine}</span>
            <div className="text-2xl font-black font-mono text-rose-400">
              {formatCurrency(parameters?.penaltyRate || 60, currency)}
              <span className="text-xs text-slate-500 font-normal">/t</span>
            </div>
            <span className="text-[10px] text-slate-500">{isVi ? 'Phạt chế tài thiếu hụt' : 'Shortfall fine'}</span>
          </div>

        </div>

      </div>

      {/* Real-time Market Price Signals Chart (Allowances & Offsets) */}
      <PriceSignalChart 
        allowanceHistory={allowanceMarket?.priceHistory}
        offsetHistory={offsetMarket?.priceHistory}
        allowanceLastPrice={allowanceMarket?.lastPrice || 5.00}
        offsetLastPrice={offsetMarket?.lastPrice || 3.00}
        lang={lang}
        currency={currency}
      />

      {/* Main Grid: Leaderboard & System History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Participant Leaderboard */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">{t.facilityRankings}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setLeaderboardFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  leaderboardFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isVi ? 'Tất Cả' : 'All'}
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => setLeaderboardFilter('surplus')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      leaderboardFilter === 'surplus'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-400 hover:text-white'
                    }`}
                  >
                    {isVi ? '🟢 Dư Thừa' : '🟢 Surplus'}
                  </button>
                  <button
                    onClick={() => setLeaderboardFilter('deficit')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      leaderboardFilter === 'deficit'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-rose-400 hover:text-white'
                    }`}
                  >
                    {isVi ? '🔴 Thiếu Hụt' : '🔴 Deficit'}
                  </button>
                </>
              )}
              <button
                onClick={() => setLeaderboardFilter('abatement')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  leaderboardFilter === 'abatement'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.topDecarbonizers}
              </button>
              <button
                onClick={() => setLeaderboardFilter('profit')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  leaderboardFilter === 'profit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.highestCash}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 w-10 text-center">{t.rank}</th>
                  <th className="pb-3">{t.facilityAndSector}</th>
                  <th className="pb-3 text-right">{t.actualEmissions}</th>
                  <th className="pb-3 text-right">{t.decarbonizationRate}</th>
                  <th className="pb-3 text-right">{isVi ? 'Hạn ngạch + Tín chỉ' : 'Allowances + Offsets'}</th>
                  <th className="pb-3 text-right">{isVi ? 'Thặng dư/Thiếu' : 'Position'}</th>
                  <th className="pb-3 text-right">{t.liquidCash}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedFacilities.map((fac, idx) => {
                  const abtPct = fac.baselineEmissions > 0 
                    ? Math.round((fac.implementedAbatement / fac.baselineEmissions) * 100) 
                    : 0;
                  const totalUnits = fac.allowances + fac.offsets;
                  const net = totalUnits - fac.actualEmissions;
                  const isSurplus = net >= 0;

                  return (
                    <tr key={fac.id} className="hover:bg-slate-950/40">
                      <td className="py-3 text-center">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold inline-flex items-center justify-center text-xs border border-amber-500/40">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 font-bold inline-flex items-center justify-center text-xs border border-slate-400/40">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 font-bold inline-flex items-center justify-center text-xs border border-amber-700/40">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-white text-xs">{fac.name}</span>
                          {isAdmin && fac.techTier === 'ADVANCED' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {isVi ? 'Tiên tiến' : 'Advanced'}
                            </span>
                          )}
                          {isAdmin && fac.techTier === 'LEGACY' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {isVi ? 'Lạc hậu' : 'Legacy'}
                            </span>
                          )}
                          {isAdmin && fac.techTier === 'STANDARD' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {isVi ? 'Chuẩn' : 'Standard'}
                            </span>
                          )}
                        </div>
                        <div className="font-sans text-[10px] text-slate-400">{fac.sectorType}</div>
                      </td>
                      <td className="py-3 text-right text-slate-300">
                        {fac.actualEmissions.toLocaleString()} t
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-bold text-teal-400">{abtPct}%</span>
                        <span className="text-[10px] text-slate-500 ml-1">(-{fac.implementedAbatement.toLocaleString()} t)</span>
                      </td>
                      <td className="py-3 text-right text-slate-300">
                        {totalUnits.toLocaleString()}
                      </td>
                      <td className={`py-3 text-right font-bold ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isSurplus ? `+${net.toLocaleString()} t` : `-${Math.abs(net).toLocaleString()} t`}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-200">
                        {formatCurrency(fac.cash, currency, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Column: Live Event Log Feed */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              {t.auditLog}
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {recentLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 italic">
                {isVi ? 'Chưa có nhật ký ghi nhận' : 'No events recorded yet'}
              </div>
            ) : (
              recentLogs.map((log) => {
                const getBadge = () => {
                  switch (log.category) {
                    case 'POLICY': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    case 'TRADE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    case 'ABATEMENT': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
                    case 'AUCTION': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    case 'COMPLIANCE': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                    default: return 'bg-slate-800 text-slate-300 border-slate-700';
                  }
                };

                return (
                  <div key={log.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${getBadge()}`}>
                        {log.category}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {log.periodYears || `Kỳ ${log.period}`} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">{log.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Historical Settlements Section if available */}
      {history.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            {t.historicalSettlements}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((h) => (
              <div key={h.period} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white">{t.compliancePeriod} {h.period} ({h.periodYears})</span>
                  <span className="text-slate-500 font-mono">Cap: {h.cap?.toLocaleString()} t</span>
                </div>
                <div className="text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>{t.actualEmissions}:</span>
                    <span className="text-white font-bold">{h.totalSystemEmissions?.toLocaleString()} t</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.allowances}:</span>
                    <span className="text-emerald-400">{h.totalAllowancesSurrendered?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.offsets}:</span>
                    <span className="text-teal-400">{h.totalOffsetsSurrendered?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.penaltiesPaid}:</span>
                    <span className="text-rose-400">{formatCurrency(h.totalPenaltiesCollected || 0, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
