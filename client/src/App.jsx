import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import FacilityDashboard from './components/FacilityDashboard';
import MarketBoard from './components/MarketBoard';
import AdminConsole from './components/AdminConsole';
import JoinModal from './components/JoinModal';
import AdminLoginModal from './components/AdminLoginModal';
import PeriodSummaryModal from './components/PeriodSummaryModal';
import GrandPilotSummaryModal from './components/GrandPilotSummaryModal';
import LoginPage from './components/LoginPage';
import { Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { translations } from './i18n';

let socket;

export default function App() {
  const [state, setState] = useState(null);
  const [currentTab, setCurrentTab] = useState('facility'); // 'facility' | 'market' | 'admin'

  // User session state (begins at LoginPage if null)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ets_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentFacilityId, setCurrentFacilityId] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ets_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.facilityId) return u.facilityId;
      }
      const urlParams = new URLSearchParams(window.location.search);
      const urlFac = urlParams.get('facility') || urlParams.get('fac') || urlParams.get('id');
      if (urlFac) {
        localStorage.setItem('ets_facility_id', urlFac);
        return urlFac;
      }
    } catch (e) {}
    return localStorage.getItem('ets_facility_id') || 'vn_pow_01';
  });
  
  // Admin authentication state
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('ets_admin_token') || '';
  });
  const isAdmin = currentUser?.role === 'admin' || Boolean(adminToken);

  // Localization and Currency states (defaulting to Vietnamese & VND)
  const [lang, setLangState] = useState(() => {
    let initialLang = 'vi';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'vi' || urlLang === 'en') {
        localStorage.setItem('ets_lang', urlLang);
        initialLang = urlLang;
      } else {
        initialLang = localStorage.getItem('ets_lang') || 'vi';
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.__ets_current_lang = initialLang;
    }
    return initialLang;
  });
  const [currency, setCurrencyState] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCurr = urlParams.get('currency');
      if (urlCurr === 'VND' || urlCurr === 'USD') {
        localStorage.setItem('ets_currency', urlCurr);
        return urlCurr;
      }
    } catch (e) {}
    return localStorage.getItem('ets_currency') || 'VND';
  });

  const setLang = (newLang) => {
    if (typeof window !== 'undefined') {
      window.__ets_current_lang = newLang;
    }
    setLangState(newLang);
    localStorage.setItem('ets_lang', newLang);
  };

  const setCurrency = (newCurr) => {
    setCurrencyState(newCurr);
    localStorage.setItem('ets_currency', newCurr);
  };

  // Theme selection: 'dark' (obsidian neon) or 'light' (pastel)
  const [theme, setThemeState] = useState(() => {
    let initialTheme = 'dark';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme');
      if (urlTheme === 'light' || urlTheme === 'dark') {
        localStorage.setItem('ets_theme', urlTheme);
        initialTheme = urlTheme;
      } else {
        const saved = localStorage.getItem('ets_theme');
        if (saved === 'light' || saved === 'dark') {
          initialTheme = saved;
        }
      }
    } catch (e) {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    return initialTheme;
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('ets_theme', newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isPeriodSummaryOpen, setIsPeriodSummaryOpen] = useState(false);
  const [isGrandSummaryOpen, setIsGrandSummaryOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const t = translations[lang] || translations.vi;

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to ETS Simulation Gateway');
    });

    socket.on('state-update', (newState) => {
      setState(newState);
    });

    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (!state) setState(data);
      })
      .catch(err => console.error('Error fetching initial state', err));

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const currentFacility = state?.facilities?.[currentFacilityId] || 
    (state?.facilities ? Object.values(state.facilities)[0] : null);

  const handleSelectFacility = (fid) => {
    setCurrentFacilityId(fid);
    localStorage.setItem('ets_facility_id', fid);
  };

  const handleLoginSuccess = ({ user, token, facilityId }) => {
    setCurrentUser(user);
    localStorage.setItem('ets_user', JSON.stringify(user));

    if (user.role === 'admin') {
      setAdminToken(token);
      localStorage.setItem('ets_admin_token', token);
      setCurrentTab('admin');
      showToast(lang === 'vi' ? 'Chào mừng Ban Quản Trị ETS. Đã mở toàn quyền điều hành!' : 'Welcome Admin Council. Full regulatory access granted!', 'success');
    } else {
      setAdminToken('');
      localStorage.removeItem('ets_admin_token');
      if (facilityId) {
        setCurrentFacilityId(facilityId);
        localStorage.setItem('ets_facility_id', facilityId);
      }
      setCurrentTab('facility');
      showToast(lang === 'vi' ? `Đăng nhập thành công! Bạn đang điều hành ${user.facilityName || facilityId}.` : `Logged in! You are managing ${user.facilityName || facilityId}.`, 'success');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminToken('');
    localStorage.removeItem('ets_user');
    localStorage.removeItem('ets_admin_token');
    showToast(lang === 'vi' ? 'Đã đăng xuất thành công.' : 'Logged out successfully.', 'info');
  };

  const handleAdminLoginSuccess = (token) => {
    setAdminToken(token);
    localStorage.setItem('ets_admin_token', token);
    setCurrentTab('admin');
    showToast(lang === 'vi' ? 'Đăng nhập Admin thành công. Đã mở toàn quyền quản trị.' : 'Admin session authenticated. Full regulatory controls unlocked.', 'success');
  };

  const handleAdminLogout = () => {
    handleLogout();
  };

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': adminToken || 'admin123'
  });

  // --- API Handlers ---

  const handleJoinFacility = async ({ name, sectorId, facilityId }) => {
    const res = await fetch('/api/facility/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sectorId, facilityId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join');
    handleSelectFacility(data.facility.id);
    showToast(lang === 'vi' ? `Đã vào sàn với tư cách: ${data.facility.name}` : `Entered ETS market as ${data.facility.name}`, 'success');
    return data.facility;
  };

  const handleUpdateParameters = async (newParams) => {
    const res = await fetch('/api/parameters', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(newParams)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update parameters');
    showToast(lang === 'vi' ? 'Đã lưu và áp dụng tham số chính sách mới' : 'ETS parameters updated successfully', 'success');
    return data.parameters;
  };

  const handleSetFacilitiesCount = async (count, capRatio) => {
    const res = await fetch('/api/admin/facilities-count', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ count, capRatio })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update facilities count');
    showToast(lang === 'vi' ? `Đã cấu hình quy mô ${data.activeFacilityCount} cơ sở phát thải` : `Active cohort updated to ${data.activeFacilityCount} facilities`, 'success');
    return data;
  };

  const handleSyncCapToEmissions = async (ratio, redistribute = true, extra = {}) => {
    const payload = typeof ratio === 'object' 
      ? { redistribute, ...ratio } 
      : { ratio, redistribute, ...extra };

    const res = await fetch('/api/admin/cap-from-emissions', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync cap to emissions');
    showToast(lang === 'vi' ? `Đã lưu lộ trình hạn ngạch: ${data.totalCap?.toLocaleString()} tCO2e (K = ${data.parameters?.correctionFactor >= 0 ? '+' : ''}${data.parameters?.correctionFactor}%)` : `Cap trajectory updated`, 'success');
    return data;
  };

  const handleImportFacilities = async (facilitiesList) => {
    const res = await fetch('/api/admin/import-facilities', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ facilities: facilitiesList })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import facilities');
    showToast(lang === 'vi' ? `Đã nạp thành công ${data.importedCount} cơ sở từ Excel!` : `Successfully imported ${data.importedCount} facilities from Excel!`, 'success');
    return data;
  };

  const handleInjectShock = async (shockType) => {
    const res = await fetch('/api/simulation/shock', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ shockType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger shock');
    showToast(lang === 'vi' ? `Kích hoạt cú sốc: ${data.title}` : `Injected shock: ${data.title}`, 'info');
    return data;
  };

  const handlePhaseAction = async (action, payload = {}) => {
    let endpoint = '';
    if (action === 'start-trading') endpoint = '/api/phase/start-trading';
    else if (action === 'pause-trading') endpoint = '/api/simulation/pause';
    else if (action === 'resume-trading') endpoint = '/api/simulation/resume';
    else if (action === 'compliance') endpoint = '/api/phase/compliance';
    else if (action === 'settle') endpoint = '/api/phase/settle';
    else if (action === 'next-period') endpoint = '/api/phase/next-period';
    else if (action === 'trigger-auction') endpoint = '/api/auction/start';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');

    if (action === 'settle') {
      showToast(lang === 'vi' ? 'Quyết toán tuân thủ kỳ hoàn tất! Đang hiển thị biên bản tổng kết.' : 'Compliance settled! Opening reconciliation report.', 'success');
      setIsPeriodSummaryOpen(true);
    } else if (action === 'pause-trading') {
      showToast(lang === 'vi' ? 'Đã tạm dừng thời gian kỳ giao dịch' : 'Trading round paused', 'info');
    } else if (action === 'resume-trading') {
      showToast(lang === 'vi' ? 'Đã tiếp tục phiên giao dịch' : 'Trading round resumed', 'success');
    } else if (action === 'next-period') {
      if (data?.phase === 'COMPLETED') {
        showToast(lang === 'vi' ? 'Toàn bộ giai đoạn thí điểm 2025–2030 đã hoàn thành!' : 'Pilot phase (2025–2030) concluded!', 'success');
        setIsGrandSummaryOpen(true);
      } else {
        showToast(lang === 'vi' ? `Đã chuyển sang Kỳ ${data.currentPeriod}` : `Advanced to Period ${data.currentPeriod}`, 'success');
      }
    } else {
      showToast(lang === 'vi' ? `Đã thực thi lệnh chuyển trạng thái` : `Executed: ${action.replace('-', ' ')}`, 'success');
    }

    return data;
  };

  const handleConfigureTime = async (timingConfig) => {
    const res = await fetch('/api/simulation/configure-time', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(timingConfig)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to configure timing');
    showToast(lang === 'vi' ? 'Đã cập nhật thời gian kỳ giao dịch & lộ trình thí điểm!' : 'Trading round timing updated!', 'success');
    return data;
  };

  const handleReset = async () => {
    const msg = lang === 'vi' 
      ? 'Bạn có chắc chắn muốn khởi tạo lại mô phỏng về Kỳ 1 (2025–2026)?' 
      : 'Are you sure you want to reset the simulation back to Period 1 (2025–2026)?';
    if (!window.confirm(msg)) return;
    const res = await fetch('/api/simulation/reset', { 
      method: 'POST',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (res.ok) showToast(lang === 'vi' ? 'Đã khởi tạo lại hệ thống' : 'Simulation reset to baseline', 'info');
  };

  const handleImplementAbatement = async (facilityId, techId) => {
    const res = await fetch('/api/abatement/implement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, techId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to implement abatement');
    showToast(lang === 'vi' ? `Đã vận hành giải pháp: ${data.tech?.name}` : `Decarbonization commissioned: ${data.tech?.name}`, 'success');
    return data;
  };

  const handlePlaceOrder = async (orderPayload) => {
    const res = await fetch('/api/order/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');
    return data;
  };

  const handleCancelOrder = async ({ facilityId, orderId, instrument }) => {
    const res = await fetch('/api/order/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, orderId, instrument })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
    showToast(lang === 'vi' ? 'Đã hủy lệnh thành công' : 'Order cancelled', 'info');
    return data;
  };

  const handleExecuteDirectTrade = async (tradePayload) => {
    const res = await fetch('/api/trade/direct/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradePayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit direct trade proposal');
    return data;
  };

  const handleAcceptDirectTrade = async ({ facilityId, proposalId }) => {
    const res = await fetch('/api/trade/direct/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, proposalId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to accept direct trade');
    showToast(lang === 'vi' ? 'Đã xác nhận giao dịch thỏa thuận thành công!' : 'Direct trade accepted and executed!', 'success');
    return data;
  };

  const handleRejectDirectTrade = async ({ facilityId, proposalId, reason }) => {
    const res = await fetch('/api/trade/direct/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, proposalId, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reject direct trade');
    showToast(lang === 'vi' ? 'Đã từ chối đề nghị thỏa thuận' : 'Direct trade proposal rejected', 'info');
    return data;
  };

  const handleCancelDirectTrade = async ({ facilityId, proposalId }) => {
    const res = await fetch('/api/trade/direct/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, proposalId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel direct trade proposal');
    showToast(lang === 'vi' ? 'Đã rút lại đề nghị thỏa thuận' : 'Proposal withdrawn', 'info');
    return data;
  };

  const handleExecuteBorrowing = async (facilityId, quantity) => {
    const res = await fetch('/api/borrowing/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to borrow allowances');
    showToast(lang === 'vi' ? `Vay thành công ${quantity.toLocaleString()} hạn ngạch từ kỳ sau!` : `Successfully borrowed ${quantity.toLocaleString()} allowances!`, 'success');
    return data;
  };

  const handleRepayBorrowing = async (facilityId, quantity) => {
    const res = await fetch('/api/borrowing/repay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to repay debt');
    showToast(lang === 'vi' ? `Đã hoàn trả sớm ${quantity.toLocaleString()} hạn ngạch vay!` : `Successfully repaid ${quantity.toLocaleString()} borrowed debt early!`, 'success');
    return data;
  };

  const handleSubmitSurrender = async (facilityId, surrenderPayload) => {
    const res = await fetch('/api/surrender/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, ...surrenderPayload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Surrender failed');
    showToast(lang === 'vi' ? 'Đã nộp gói hạn ngạch tuân thủ' : 'Compliance surrender package submitted', 'success');
    return data;
  };

  const handleSubmitAuctionBid = async ({ facilityId, price, quantity }) => {
    const res = await fetch('/api/auction/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId, price, quantity })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Auction bid failed');
    showToast(lang === 'vi' ? 'Đã nộp giá đấu sơ cấp' : 'Auction bid placed', 'success');
    return data;
  };

  // If not logged in, system begins at the LoginPage landing
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        state={state}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'light' ? 'bg-[#f6f8fb] text-slate-800' : 'bg-slate-950 text-slate-100'} selection:bg-emerald-500/30 selection:text-emerald-200`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        state={state}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentFacility={currentFacility}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        onOpenPeriodSummary={() => setIsPeriodSummaryOpen(true)}
        onOpenGrandSummary={() => setIsGrandSummaryOpen(true)}
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {currentTab === 'facility' && (
          <FacilityDashboard
            facility={currentFacility}
            state={state}
            onImplementAbatement={handleImplementAbatement}
            onPlaceOrder={handlePlaceOrder}
            onCancelOrder={handleCancelOrder}
            onExecuteDirectTrade={handleExecuteDirectTrade}
            onAcceptDirectTrade={handleAcceptDirectTrade}
            onRejectDirectTrade={handleRejectDirectTrade}
            onCancelDirectTrade={handleCancelDirectTrade}
            onSubmitSurrender={handleSubmitSurrender}
            onSubmitAuctionBid={handleSubmitAuctionBid}
            onExecuteBorrowing={handleExecuteBorrowing}
            onRepayBorrowing={handleRepayBorrowing}
            onOpenJoinModal={() => setIsJoinModalOpen(true)}
            isAdmin={isAdmin}
            lang={lang}
            currency={currency}
          />
        )}

        {currentTab === 'market' && (
          <MarketBoard 
            state={state}
            lang={lang}
            currency={currency}
            isAdmin={isAdmin}
          />
        )}

        {currentTab === 'admin' && (
          isAdmin ? (
            <AdminConsole
              state={state}
              onUpdateParameters={handleUpdateParameters}
              onSetFacilitiesCount={handleSetFacilitiesCount}
              onSyncCapToEmissions={handleSyncCapToEmissions}
              onImportFacilities={handleImportFacilities}
              onConfigureTime={handleConfigureTime}
              onOpenPeriodSummary={() => setIsPeriodSummaryOpen(true)}
              onOpenGrandSummary={() => setIsGrandSummaryOpen(true)}
              onPhaseAction={handlePhaseAction}
              onReset={handleReset}
              onInjectShock={handleInjectShock}
              lang={lang}
              currency={currency}
            />
          ) : (
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-12 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">
                {lang === 'vi' ? 'Yêu Cầu Quyền Quản Trị Viên' : 'Administrator Access Required'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'vi' 
                  ? 'Khu vực này chỉ dành cho Cơ quan Quản lý (Bộ TN&MT / Admin). Các cơ sở công nghiệp chỉ có quyền truy cập Bàn Điều Hành Cơ Sở và Bảng Thị Trường.'
                  : 'This console is reserved for the ETS Regulator (MONRE / Administrator). Facilities can only access the Facility Console and Market Board.'}
              </p>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                {lang === 'vi' ? 'Đăng Nhập Quản Trị Viên' : 'Log In as Administrator'}
              </button>
            </div>
          )
        )}
      </main>

      {/* Join / Switch Facility Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        existingFacilities={state?.facilities || {}}
        currentFacilityId={currentFacilityId}
        onJoinFacility={handleJoinFacility}
        isAdmin={isAdmin}
        lang={lang}
      />

      {/* Admin Passkey Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Period Reconciliation Summary Report Modal */}
      <PeriodSummaryModal
        isOpen={isPeriodSummaryOpen}
        onClose={() => setIsPeriodSummaryOpen(false)}
        state={state}
        lang={lang}
        currency={currency}
      />

      {/* Grand Pilot Phase Summary Report Modal (2025–2030) */}
      <GrandPilotSummaryModal
        isOpen={isGrandSummaryOpen}
        onClose={() => setIsGrandSummaryOpen(false)}
        state={state}
        lang={lang}
        currency={currency}
      />

    </div>
  );
}
