import React, { useState } from 'react';
import { 
  Building2, 
  Coins, 
  Flame, 
  TrendingDown, 
  ShieldCheck, 
  Layers, 
  Leaf, 
  AlertTriangle, 
  Sparkles,
  DollarSign,
  Clock,
  Zap,
  HelpCircle,
  HandCoins
} from 'lucide-react';
import TradingFloor from './TradingFloor';
import AbatementDesk from './AbatementDesk';
import BorrowingDesk from './BorrowingDesk';
import ComplianceSurrenderModal from './ComplianceSurrenderModal';
import AuctionModal from './AuctionModal';
import { translations, formatCurrency, getFacilityTechDesc } from '../i18n';

export default function FacilityDashboard({ 
  facility, 
  state, 
  onImplementAbatement, 
  onPlaceOrder, 
  onCancelOrder, 
  onExecuteDirectTrade,
  onAcceptDirectTrade,
  onRejectDirectTrade,
  onCancelDirectTrade,
  onSubmitSurrender, 
  onSubmitAuctionBid, 
  onExecuteBorrowing,
  onRepayBorrowing,
  onOpenJoinModal,
  isAdmin = false,
  lang = 'vi',
  currency = 'USD'
}) {
  const [activeSubTab, setActiveSubTab] = useState('trading'); // 'trading' | 'abatement' | 'borrowing'
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);

  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  if (!facility) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl font-bold">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">{isVi ? 'Tham Gia Với Tư Cách Cơ Sở Công Nghiệp' : 'Join as an Industrial Facility'}</h2>
        <p className="text-sm text-slate-400">
          {isVi 
            ? 'Để giao dịch hạn ngạch, đầu tư giải pháp giảm phát thải và tuân thủ quy định thị trường các-bon, hãy chọn hoặc đăng ký cơ sở của bạn.' 
            : 'To trade allowances, implement decarbonization activities, and comply with the ETS, select or register a facility.'}
        </p>
        <button
          onClick={onOpenJoinModal}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {isVi ? 'Chọn Cơ Sở & Vào Thị Trường' : 'Select Facility & Enter Market'}
        </button>
      </div>
    );
  }

  const parameters = state?.parameters || {};
  const actualEmissions = facility.actualEmissions;
  const allowancesHeld = facility.allowances;
  const offsetsHeld = facility.offsets;

  // Offset usage limit (30% under Vietnam ETS)
  const maxEligibleOffsets = Math.floor(actualEmissions * ((parameters.offsetUsageLimit || 30) / 100));
  const effectiveOffsets = Math.min(offsetsHeld, maxEligibleOffsets);
  
  // Total compliance coverage
  const totalCoverage = allowancesHeld + effectiveOffsets;
  const netPosition = totalCoverage - actualEmissions;
  const isSurplus = netPosition >= 0;
  const projectedPenalty = !isSurplus ? Math.abs(netPosition) * (parameters.penaltyRate || 60) : 0;

  // Abatement percentage
  const abatementPct = facility.baselineEmissions > 0 
    ? Math.round((facility.implementedAbatement / facility.baselineEmissions) * 100) 
    : 0;

  // Stop-trade countdown warning (< 30 seconds)
  const isClosingSoon = state?.phase === 'TRADING' && state?.timeRemaining != null && state.timeRemaining <= 30 && state.timeRemaining > 0;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Stop Trade Warning Banner (CarbonSim Spec: "Warns players before trading is halted") */}
      {isClosingSoon && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-black text-xs uppercase tracking-wider">
                {isVi ? 'CẢNH BÁO: PHIÊN GIAO DỊCH SẮP KẾT THÚC!' : 'STOP TRADE WARNING: TRADING CLOSING SOON!'}
              </span>
              <p className="text-xs text-amber-100">
                {isVi ? `Chỉ còn ${state.timeRemaining} giây trước khi chuyển sang giai đoạn quyết toán tuân thủ.` : `Only ${state.timeRemaining} seconds left before compliance settlement.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSurrenderModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer hover:bg-slate-100"
          >
            {isVi ? 'Chuẩn Bị Nộp Hạn Ngạch' : 'Prepare Surrender'}
          </button>
        </div>
      )}

      {/* Facility Header & Compliance Position Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Active Auction Notification Banner if live */}
        {state?.auction?.active && (
          <div className="mb-4 bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                  {isVi ? 'Đấu Giá Hạn Ngạch Sơ Cấp Đang Diễn Ra!' : 'Primary Government Auction Live!'}
                </span>
                <p className="text-xs text-amber-300/80">
                  {state.auction.totalOffered.toLocaleString()} {t.units} @ {isVi ? 'Giá sàn' : 'Reserve'} {formatCurrency(state.auction.reservePrice, currency)}/t
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuctionModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {isVi ? `Đấu Giá (${state.auction.timeRemaining}s)` : `Submit Bid (${state.auction.timeRemaining}s)`}
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Facility Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 text-xl font-black shrink-0">
              {facility.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white">{facility.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {facility.sectorType}
                </span>

                {/* Technology Tier Badge - Only visible to Admin */}
                {isAdmin && facility.techTier === 'ADVANCED' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isVi ? 'Công nghệ Tiên tiến (Dư thừa)' : 'Advanced Tech (Surplus)'}
                  </span>
                )}
                {isAdmin && facility.techTier === 'LEGACY' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    {isVi ? 'Công nghệ Cũ (Thiếu hụt)' : 'Legacy Tech (Deficit)'}
                  </span>
                )}
                {isAdmin && facility.techTier === 'STANDARD' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {isVi ? 'Công nghệ Tiêu chuẩn' : 'Standard Tech (Parity)'}
                  </span>
                )}

                {facility.isBot && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Bot
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                <span className="text-slate-400">{getFacilityTechDesc(facility, lang)}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.baselineEmissions}: <span className="font-mono text-slate-300">{facility.baselineEmissions.toLocaleString()} tCO2e</span> • 
                {t.freeAllocation} ({t.periodLabel} {state?.currentPeriod} • {state?.periodYearsLabel || '2025–2026'}): <span className="font-mono text-emerald-400">+{facility.allocatedAllowances.toLocaleString()} t ({state?.parameters?.freeAllocationRate || 100}% {t.free})</span>
              </p>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowSurrenderModal(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                state?.phase === 'COMPLIANCE' 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 animate-bounce' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>{t.surrenderAndSettle}</span>
            </button>
          </div>

        </div>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          
          {/* Card 1: Compliance Obligation (Net Emissions) */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 relative">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{t.actualEmissions}</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {actualEmissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO2e</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1 font-medium">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-{facility.implementedAbatement.toLocaleString()} t ({abatementPct}%)</span>
            </div>
          </div>

          {/* Card 2: Allowances */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 relative">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{t.allowances}</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {allowancesHeld.toLocaleString()} <span className="text-xs font-normal text-slate-500">{t.units}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {facility.bankedUnits > 0 && <span className="text-blue-400">+{facility.bankedUnits.toLocaleString()} banked</span>}
              {facility.borrowedUnits > 0 && <span className="text-amber-400">-{facility.borrowedUnits.toLocaleString()} debt</span>}
              {facility.bankedUnits === 0 && facility.borrowedUnits === 0 && <span>{isVi ? 'Sẵn sàng nộp / giao dịch' : 'Available for surrender'}</span>}
            </div>
          </div>

          {/* Card 3: Offsets */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 relative">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>{t.offsets}</span>
              <Leaf className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black font-mono text-teal-400">
              {offsetsHeld.toLocaleString()} <span className="text-xs font-normal text-slate-500">{t.credits}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {t.maxUsable}: <span className="text-teal-300 font-mono">{maxEligibleOffsets.toLocaleString()} t</span> (VN Cap: {parameters.offsetUsageLimit || 30}%)
            </div>
          </div>

          {/* Card 4: Net Balance & Projected Compliance */}
          <div className={`rounded-2xl p-4 border relative ${
            isSurplus 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className={isSurplus ? 'text-emerald-400' : 'text-rose-400'}>
                {isSurplus ? t.complianceSurplus : t.complianceDeficit}
              </span>
              {isSurplus ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              )}
            </div>
            <div className={`text-2xl font-black font-mono ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isSurplus ? `+${netPosition.toLocaleString()}` : `-${Math.abs(netPosition).toLocaleString()}`} <span className="text-xs font-normal text-slate-500">t</span>
            </div>
            <div className="text-[11px] mt-1">
              {isSurplus ? (
                <span className="text-emerald-400 font-medium">{t.readyForSettlement}</span>
              ) : (
                <span className="text-rose-400 font-bold">
                  {t.deficitPenaltyWarning}: {formatCurrency(projectedPenalty, currency)} ({formatCurrency(parameters.penaltyRate || 60, currency)}/t)
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Financial Sub-bar with Dual Currency Support */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{t.liquidCash}:</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatCurrency(facility.cash, currency)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span>{t.periodRevenue}: </span>
              <span className="font-mono text-slate-300">+{formatCurrency(facility.annualRevenue, currency)}</span>
            </div>
            {facility.cumulativeComplianceCost > 0 && (
              <div>
                <span>{t.penaltiesPaid}: </span>
                <span className="font-mono text-rose-400">-{formatCurrency(facility.cumulativeComplianceCost, currency)}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('trading')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'trading'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{t.marketFloorTab}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('abatement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'abatement'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Leaf className="w-4 h-4 text-teal-400" />
          <span>{t.macCurveTab}</span>
          {facility.abatementTechnologies.filter(t => !t.implemented).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500/20 text-teal-300">
              {facility.abatementTechnologies.filter(t => !t.implemented).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('borrowing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'borrowing'
              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HandCoins className="w-4 h-4 text-amber-400" />
          <span>{isVi ? 'Vay Mượn Hạn Ngạch' : 'Allowance Borrowing'}</span>
          {facility.borrowedUnits > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              {facility.borrowedUnits.toLocaleString()}t
            </span>
          )}
        </button>

        <button
          onClick={() => setShowSurrenderModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>{t.surrenderTab}</span>
        </button>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'trading' && (
        <TradingFloor
          facility={facility}
          state={state}
          onPlaceOrder={onPlaceOrder}
          onCancelOrder={onCancelOrder}
          onExecuteDirectTrade={onExecuteDirectTrade}
          onAcceptDirectTrade={onAcceptDirectTrade}
          onRejectDirectTrade={onRejectDirectTrade}
          onCancelDirectTrade={onCancelDirectTrade}
          onOpenAuctionModal={() => setShowAuctionModal(true)}
          lang={lang}
          currency={currency}
        />
      )}

      {activeSubTab === 'abatement' && (
        <AbatementDesk
          facility={facility}
          allowanceMarketPrice={state?.allowanceMarket?.lastPrice || 42.50}
          onImplementAbatement={onImplementAbatement}
          lang={lang}
          currency={currency}
        />
      )}

      {activeSubTab === 'borrowing' && (
        <BorrowingDesk
          facility={facility}
          parameters={state?.parameters}
          onExecuteBorrowing={onExecuteBorrowing}
          onRepayBorrowing={onRepayBorrowing}
          lang={lang}
          currency={currency}
        />
      )}

      {/* Surrender / Compliance Modal */}
      {showSurrenderModal && (
        <ComplianceSurrenderModal
          facility={facility}
          parameters={parameters}
          phase={state?.phase}
          onClose={() => setShowSurrenderModal(false)}
          onSubmitSurrender={onSubmitSurrender}
          lang={lang}
          currency={currency}
        />
      )}

      {/* Auction Modal */}
      {showAuctionModal && state?.auction && (
        <AuctionModal
          facility={facility}
          auction={state.auction}
          onClose={() => setShowAuctionModal(false)}
          onSubmitAuctionBid={onSubmitAuctionBid}
          lang={lang}
          currency={currency}
        />
      )}

    </div>
  );
}
