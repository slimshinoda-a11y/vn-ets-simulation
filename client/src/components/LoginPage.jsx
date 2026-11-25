import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  Lock, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Factory, 
  Flame, 
  Search, 
  Filter,
  Sparkles,
  HelpCircle,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { translations, formatCurrency } from '../i18n';

export default function LoginPage({ 
  onLoginSuccess, 
  lang = 'vi', 
  setLang, 
  currency = 'VND', 
  setCurrency,
  state,
  theme = 'dark',
  setTheme 
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all'); // 'all' | 'power' | 'cement' | 'steel'
  const [searchQuery, setSearchQuery] = useState('');

  const [facilitiesDirectory, setFacilitiesDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isVi = lang === 'vi';
  const t = translations[lang] || translations.vi;

  // Load facilities directory for registration
  const fetchFacilities = async () => {
    try {
      const res = await fetch('/api/auth/facilities');
      const data = await res.json();
      if (data.success && data.facilities) {
        setFacilitiesDirectory(data.facilities);
      }
    } catch (e) {
      console.warn('Failed to fetch facilities directory:', e);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [state]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginUsername.trim()) {
      setErrorMsg(isVi ? 'Vui lòng nhập tên đăng nhập' : 'Please enter your username');
      return;
    }
    if (!loginPassword) {
      setErrorMsg(isVi ? 'Vui lòng nhập mật khẩu' : 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isVi ? 'Đăng nhập thất bại' : 'Login failed'));
      }

      setSuccessMsg(isVi ? 'Đăng nhập thành công! Đang chuyển hướng...' : 'Login successful! Redirecting...');
      setTimeout(() => {
        onLoginSuccess({
          user: data.user,
          token: data.token,
          facilityId: data.user?.facilityId
        });
      }, 400);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regUsername.trim()) {
      setErrorMsg(isVi ? 'Vui lòng nhập tên đăng nhập mong muốn' : 'Please enter a username');
      return;
    }
    if (regUsername.trim().length < 3) {
      setErrorMsg(isVi ? 'Tên đăng nhập phải có ít nhất 3 ký tự' : 'Username must be at least 3 characters');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setErrorMsg(isVi ? 'Mật khẩu phải có ít nhất 3 ký tự' : 'Password must be at least 3 characters');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setErrorMsg(isVi ? 'Mật khẩu xác nhận không khớp' : 'Password confirmation does not match');
      return;
    }
    if (!selectedFacilityId) {
      setErrorMsg(isVi ? 'Vui lòng chọn 1 công ty / cơ sở phát thải bên dưới' : 'Please select 1 company / facility below');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword,
          facilityId: selectedFacilityId
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isVi ? 'Đăng ký thất bại' : 'Registration failed'));
      }

      setSuccessMsg(isVi ? 'Đăng ký thành công! Đang vào sàn giao dịch...' : 'Registration successful! Entering market...');
      setTimeout(() => {
        onLoginSuccess({
          user: data.user,
          token: data.token,
          facilityId: data.user?.facilityId
        });
      }, 500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter facilities
  const filteredFacilities = facilitiesDirectory.filter((fac) => {
    if (sectorFilter !== 'all' && fac.sectorId !== sectorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = fac.name?.toLowerCase().includes(q);
      const matchId = fac.id?.toLowerCase().includes(q);
      return matchName || matchId;
    }
    return true;
  });

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${theme === 'light' ? 'bg-[#f6f8fb] text-slate-800' : 'bg-slate-950 text-slate-100'} selection:bg-emerald-500 selection:text-slate-950`}>
      
      {/* Top Bar: Brand & Language/Currency switch */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-wide text-white">ETS SIMULATOR</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VN ETS 2025–2030
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Hệ Thống Mô Phỏng Sàn Giao Dịch Hạn Ngạch Phát Thải Việt Nam</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'VND' : 'USD')}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            {currency === 'USD' ? '$ USD' : '₫ VNĐ'}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme && setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title={theme === 'light' ? (isVi ? 'Giao diện Sáng (Pastel) • Nhấp để đổi sang Tối' : 'Light Mode (Pastel) • Click for Dark') : (isVi ? 'Giao diện Tối • Nhấp để đổi sang Sáng (Pastel)' : 'Dark Mode • Click for Light')}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">{isVi ? 'Sáng' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">{isVi ? 'Tối' : 'Dark'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeTab === 'login' 
                ? (isVi ? 'Đăng Nhập Sàn Giao Dịch ETS' : 'Login to ETS Trading Exchange')
                : (isVi ? 'Đăng Ký Tài Khoản Cho Doanh Nghiệp' : 'Register Facility Account')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {activeTab === 'login'
                ? (isVi ? 'Đăng nhập vào hệ thống để bắt đầu phiên giao dịch hạn ngạch phát thải.' : 'Sign in to access your trading and compliance console.')
                : (isVi ? 'Mỗi người tham gia đăng ký 1 tài khoản gắn liền duy nhất với 1 nhà máy để tham gia thị trường các-bon.' : 'Each participant binds a unique username and password to one covered facility.')}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex max-w-sm mx-auto p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isVi ? 'Đăng Nhập' : 'Sign In'}
            </button>
            <button
              onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isVi ? 'Đăng Ký Công Ty Mới' : 'Register Company'}
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isVi ? 'Tên đăng nhập' : 'Username'}</span>
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={isVi ? 'Nhập tên đăng nhập của bạn' : 'Enter your username'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isVi ? 'Mật khẩu' : 'Password'}</span>
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{isLoading ? (isVi ? 'Đang xác thực...' : 'Authenticating...') : (isVi ? 'Đăng Nhập Vào Sàn Giao Dịch' : 'Sign In to Market')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER FORM (BOUND TO ONE COMPANY) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isVi ? 'Tên đăng nhập mới' : 'New Username'}</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. nguyenvana_pow01"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isVi ? 'Mật khẩu' : 'Password'}</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isVi ? 'Xác nhận mật khẩu' : 'Confirm Password'}</span>
                  </label>
                  <input
                    type="password"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Company Picker */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{isVi ? 'Chọn 1 Công Ty / Nhà Máy Của Bạn (Chỉ được chọn 1 cơ sở duy nhất)' : 'Select Your Company (Strictly 1 facility per account)'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isVi ? 'Cơ sở đã được người khác đăng ký sẽ bị khóa. Vui lòng chọn một cơ sở đang sẵn sàng.' : 'Claimed facilities are locked. Please pick an available facility.'}
                    </p>
                  </div>

                  {/* Sector Filter & Search */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSectorFilter('all')}
                        className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          sectorFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isVi ? 'Tất cả' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorFilter('power')}
                        className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          sectorFilter === 'power' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isVi ? 'Nhiệt điện' : 'Power'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorFilter('cement')}
                        className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          sectorFilter === 'cement' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isVi ? 'Xi măng' : 'Cement'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorFilter('steel')}
                        className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          sectorFilter === 'steel' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isVi ? 'Thép' : 'Steel'}
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isVi ? 'Tìm tên/mã...' : 'Search...'}
                        className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none w-28 sm:w-36 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Facilities Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {filteredFacilities.map((fac) => {
                    const isSelected = selectedFacilityId === fac.id;
                    const isClaimed = fac.isClaimed;

                    return (
                      <div
                        key={fac.id}
                        onClick={() => {
                          if (!isClaimed) {
                            setSelectedFacilityId(fac.id);
                            setErrorMsg('');
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                          isClaimed
                            ? 'bg-slate-950/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 cursor-pointer ring-1 ring-emerald-500'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 cursor-pointer hover:bg-slate-800/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono text-slate-400 font-bold">{fac.id}</span>
                            {isClaimed ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
                                {isVi ? `Đã nhận (@${fac.claimedBy})` : `Claimed (@${fac.claimedBy})`}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                {isVi ? 'Sẵn sàng' : 'Available'}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-white truncate">{fac.name}</h4>
                          <div className="text-[10px] text-slate-400 mt-0.5">{fac.sectorName}</div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">
                            {isVi ? 'Hạn ngạch phân bổ:' : 'Allocated quota:'}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {fac.allocatedAllowances?.toLocaleString() || fac.baselineEmissions?.toLocaleString()} t
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">
                  {selectedFacilityId ? (
                    <span>
                      {isVi ? 'Đang chọn:' : 'Selected:'}{' '}
                      <strong className="text-emerald-400 font-mono">{selectedFacilityId}</strong> ({facilitiesDirectory.find(f => f.id === selectedFacilityId)?.name})
                    </span>
                  ) : (
                    <span className="text-amber-400 italic">
                      {isVi ? 'Vui lòng bấm chọn 1 nhà máy ở danh sách trên' : 'Please click a company above'}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedFacilityId}
                  className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? (isVi ? 'Đang tạo tài khoản...' : 'Creating...') : (isVi ? 'Đăng Ký & Vào Sàn Giao Dịch' : 'Register & Enter Market')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/80">
        Vietnam ETS Simulation Platform • Thí Điểm Thị Trường Các-bon 2025–2030 • Nghị định 06/2022/NĐ-CP & Quyết định 01/2022/QĐ-TTg
      </footer>

    </div>
  );
}
