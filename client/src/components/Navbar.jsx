import React from 'react';
import { 
  Building2, 
  Settings, 
  BarChart3, 
  Clock, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Zap, 
  UserCheck,
  Globe,
  DollarSign,
  Coins,
  Trophy,
  Sun,
  Moon
} from 'lucide-react';
import { translations } from '../i18n';

export default function Navbar({ 
  state, 
  currentTab, 
  setCurrentTab, 
  currentFacility, 
  currentUser,
  isAdmin, 
  onLogout,
  onOpenJoinModal,
  onOpenPeriodSummary,
  onOpenGrandSummary,
  lang = 'vi',
  setLang,
  currency = 'USD',
  setCurrency,
  theme = 'dark',
  setTheme
}) {
  const { currentPeriod, totalPeriods, phase, timeRemaining, periodYearsLabel, isPaused } = state || {};
  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  const formatTime = (secs) => {
    if (secs == null || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseBadge = () => {
    if (isPaused && phase === 'TRADING') {
      return { label: isVi ? 'TẠM DỪNG' : 'PAUSED', color: 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse' };
    }
    switch (phase) {
      case 'SETUP':
        return { label: t.policySetup, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'TRADING':
        return { label: t.tradingOpen, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse' };
      case 'COMPLIANCE':
        return { label: t.complianceSettlement, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'COMPLETED':
        return { label: isVi ? 'HOÀN THÀNH THÍ ĐIỂM' : t.simulationConcluded, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      default:
        return { label: phase, color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const phaseBadge = getPhaseBadge();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Period Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">{t.brandTitle}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t.vnEtsPilot}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">{t.brandSubtitle}</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden lg:block" />

          {/* Compliance Period Tracker with 2-Year Label (e.g. 2025–2026) */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="text-center">
              <div className="text-[9px] uppercase font-bold text-slate-400">{t.compliancePeriod}</div>
              <div className="text-xs font-black text-emerald-400">
                {t.periodLabel} {currentPeriod} <span className="text-slate-300 font-bold">({periodYearsLabel || '2025–2026'})</span>
                <span className="text-slate-500 font-normal ml-0.5">/ {totalPeriods}</span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1.5 ${phaseBadge.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {phaseBadge.label}
            </div>

            {phase === 'TRADING' && (
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-200">
                <Clock className="w-3 h-3 text-amber-400" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setCurrentTab('facility')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'facility'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t.facilityConsole}</span>
          </button>

          <button
            onClick={() => setCurrentTab('market')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'market'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t.marketBoard}</span>
          </button>

          {/* ADMIN ONLY TAB */}
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-500/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t.etsParameters}</span>
            </button>
          )}
        </div>

        {/* Right Header: Language, Currency, Glossary, Admin & Facility */}
        <div className="flex items-center gap-2">
          
          {/* Quick Access: Period Summary Report */}
          {(state?.lastPeriodSettlement || state?.history?.length > 0) && (
            <button
              onClick={onOpenPeriodSummary}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
              title={isVi ? 'Xem Báo Cáo Tổng Kết Kỳ' : 'View Period Summary Report'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isVi ? 'Báo Cáo Kỳ' : 'Period Report'}</span>
            </button>
          )}

          {/* Quick Access: Grand Pilot Summary (2025-2030) */}
          {(state?.grandPilotSummary || phase === 'COMPLETED' || currentPeriod === totalPeriods) && (
            <button
              onClick={onOpenGrandSummary}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/50 text-[11px] font-bold transition-all cursor-pointer shadow-sm animate-pulse"
              title={isVi ? 'Báo Cáo Tổng Kết Giai Đoạn Thí Điểm (2025–2030)' : 'Grand Pilot Summary (2025–2030)'}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{isVi ? 'Tổng Kết 2025–2030' : 'Pilot 2025–2030'}</span>
            </button>
          )}

          {/* Currency Toggle: USD <-> VND */}
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'VND' : 'USD')}
            className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono font-bold transition-all cursor-pointer"
            title="Toggle Currency"
          >
            {currency === 'USD' ? '$ USD' : '₫ VNĐ'}
          </button>

          {/* Language Toggle: Tiếng Việt <-> English */}
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition-all cursor-pointer"
            title="Change Language"
          >
            <span>{lang === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}</span>
          </button>

          {/* Theme Toggle: Light (☀️) <-> Dark (🌙) */}
          <button
            onClick={() => setTheme && setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            title={theme === 'light' ? (isVi ? 'Giao diện Sáng (Pastel) • Nhấp để đổi sang Tối' : 'Pastel Light Mode • Click for Dark') : (isVi ? 'Giao diện Tối • Nhấp để đổi sang Sáng (Pastel)' : 'Dark Mode • Click for Pastel Light')}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                <span className="hidden sm:inline">{isVi ? 'Sáng' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">{isVi ? 'Tối' : 'Dark'}</span>
              </>
            )}
          </button>

          {/* Admin Role Status & Inspector */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 bg-purple-950/70 border border-purple-500/40 rounded-xl px-2.5 py-1 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-purple-300 text-[11px] hidden sm:inline">
                  {isVi ? 'Ban Quản Trị' : 'Admin Council'}
                </span>
              </div>

              {currentFacility && (
                <div 
                  onClick={onOpenJoinModal}
                  className="group cursor-pointer flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-800/80 border border-purple-500/30 hover:border-purple-400 rounded-xl px-2 py-1 transition-all"
                  title={isVi ? 'Xem với tư cách nhà máy khác' : 'Inspect another facility'}
                >
                  <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-[9px]">
                    {currentFacility.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left max-w-[110px] truncate hidden sm:block">
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-purple-300 truncate">
                      {currentFacility.name}
                    </div>
                  </div>
                  <span className="text-[9px] text-purple-300 bg-purple-950 px-1 py-0.2 rounded border border-purple-800">
                    {isVi ? 'Đổi xem' : 'Inspect'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Facility User: Bound Company Badge (Locked strictly to 1 company) */
            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-emerald-500/40 rounded-xl px-2.5 py-1">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[9px]">
                {currentFacility?.name?.substring(0, 2).toUpperCase() || 'DN'}
              </div>
              <div className="text-left max-w-[120px] truncate">
                <div className="text-[11px] font-bold text-emerald-300 truncate">
                  {currentFacility?.name || currentUser?.facilityName}
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  @{currentUser?.username || 'user'}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            title={isVi ? 'Đăng xuất khỏi hệ thống' : 'Sign out'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isVi ? 'Đăng Xuất' : 'Sign Out'}</span>
          </button>

        </div>

      </div>
    </header>
  );
}
