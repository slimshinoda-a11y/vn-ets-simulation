import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  Flame, 
  Check, 
  Factory, 
  Zap, 
  Trees, 
  Gauge, 
  FlaskConical,
  UserCheck
} from 'lucide-react';
import { translations } from '../i18n';

export default function JoinModal({ 
  isOpen, 
  onClose, 
  existingFacilities = {}, 
  currentFacilityId, 
  onJoinFacility,
  isAdmin = false,
  lang = 'vi'
}) {
  const [sectors, setSectors] = useState([]);
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [mode, setMode] = useState('select'); // 'select' | 'create'
  const [loading, setLoading] = useState(false);

  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  useEffect(() => {
    fetch('/api/sectors')
      .then(res => res.json())
      .then(data => {
        setSectors(data);
        if (data.length > 0 && !selectedSectorId) {
          setSelectedSectorId(data[0].id);
          setFacilityName(`${data[0].name} (Tổ máy 2)`);
        }
      })
      .catch(err => console.error('Failed to load sectors', err));
  }, []);

  if (!isOpen) return null;

  const handleSelectSector = (sec) => {
    setSelectedSectorId(sec.id);
    setFacilityName(`${sec.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'select' && selectedExistingId) {
        await onJoinFacility({ facilityId: selectedExistingId });
      } else {
        await onJoinFacility({
          name: facilityName || (isVi ? 'Cơ Sở Mới' : 'New Facility'),
          sectorId: selectedSectorId || sectors[0]?.id
        });
      }
      onClose();
    } catch (err) {
      alert(`Join failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSectorIcon = (iconName) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Factory': return <Factory className="w-5 h-5 text-slate-300" />;
      case 'Flame': return <Flame className="w-5 h-5 text-rose-400" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5 text-purple-400" />;
      case 'Trees': return <Trees className="w-5 h-5 text-emerald-400" />;
      case 'Gauge': return <Gauge className="w-5 h-5 text-teal-400" />;
      default: return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const facilityList = Object.values(existingFacilities);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isVi ? 'Tham Gia Sàn Giao Dịch Hạn Ngạch' : 'Join ETS as a Facility'}
              </h2>
              <p className="text-xs text-slate-400">
                {isVi ? 'Chọn doanh nghiệp có sẵn hoặc tạo cơ sở công nghiệp mới' : 'Select an existing plant or create a new covered operator'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('select')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'select'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isVi ? 'Chọn / Chuyển Cơ Sở' : 'Claim / Switch Facility'}
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'create'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isVi ? 'Tạo Cơ Sở Mới' : 'Create New Facility'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'select' ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {facilityList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {isVi ? 'Chưa có cơ sở nào. Hãy chuyển sang "Tạo Cơ Sở Mới".' : 'No facilities registered yet. Switch to "Create New Facility".'}
                </div>
              ) : (
                facilityList.map((fac) => {
                  const isSelected = selectedExistingId === fac.id || (!selectedExistingId && currentFacilityId === fac.id);
                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedExistingId(fac.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{fac.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {fac.sectorType}
                          </span>
                          {isAdmin && fac.techTier === 'ADVANCED' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {isVi ? '🟢 Dư thừa' : '🟢 Surplus'}
                            </span>
                          )}
                          {isAdmin && fac.techTier === 'LEGACY' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {isVi ? '🔴 Thiếu hụt' : '🔴 Deficit'}
                            </span>
                          )}
                          {isAdmin && fac.techTier === 'STANDARD' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {isVi ? '🔵 Cân bằng' : '🔵 Parity'}
                            </span>
                          )}
                          {fac.id === currentFacilityId && (
                            <span className="text-[10px] text-emerald-400 font-bold">({isVi ? 'Đang chọn' : 'Current'})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {isVi ? 'Phát thải' : 'Emissions'}: {fac.actualEmissions.toLocaleString()} t • {isVi ? 'Hạn ngạch' : 'Allowances'}: {fac.allowances.toLocaleString()} ({fac.allowances >= fac.actualEmissions ? `+${(fac.allowances - fac.actualEmissions).toLocaleString()} t` : `-${Math.abs(fac.allowances - fac.actualEmissions).toLocaleString()} t`})
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isVi ? 'Tên Cơ Sở / Doanh Nghiệp' : 'Facility Name'}
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Nhiệt điện Duyên Hải"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {isVi ? 'Chọn Hồ Sơ Ngành Công Nghiệp (Nghị định 06)' : 'Select Industrial Sector Profile'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {sectors.map((sec) => {
                    const isSelected = selectedSectorId === sec.id;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => handleSelectSector(sec)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getSectorIcon(sec.icon)}
                          <span className="font-bold text-white text-xs">{sec.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {isVi ? 'Phát thải cơ sở:' : 'Baseline:'} <span className="text-slate-300 font-mono">{sec.baselineEmissions.toLocaleString()} t</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (mode === 'select' && !selectedExistingId && !currentFacilityId)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {loading ? (isVi ? 'Đang xử lý...' : 'Processing...') : mode === 'select' ? (isVi ? 'Vào Thị Trường Với Cơ Sở Đã Chọn' : 'Enter with Selected Facility') : (isVi ? 'Đăng Ký & Vào Sàn Giao Dịch' : 'Create & Enter Market')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
