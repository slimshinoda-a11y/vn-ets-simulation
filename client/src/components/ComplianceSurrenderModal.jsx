import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Layers, 
  Leaf, 
  Coins, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react';
import { translations, formatCurrency } from '../i18n';

export default function ComplianceSurrenderModal({ 
  facility, 
  parameters = {}, 
  phase, 
  onClose, 
  onSubmitSurrender,
  lang = 'vi',
  currency = 'USD'
}) {
  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  const actualEmissions = facility?.actualEmissions || 0;
  const allowancesHeld = facility?.allowances || 0;
  const offsetsHeld = facility?.offsets || 0;

  // Offset limit constraint (30% under Decree 06)
  const maxAllowedOffsets = Math.floor(actualEmissions * ((parameters.offsetUsageLimit || 30) / 100));

  const defaultOffsets = Math.min(offsetsHeld, maxAllowedOffsets);
  const defaultAllowances = Math.min(allowancesHeld, Math.max(0, actualEmissions - defaultOffsets));

  const [allowances, setAllowances] = useState(defaultAllowances);
  const [offsets, setOffsets] = useState(defaultOffsets);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const totalSurrendered = Number(allowances) + Number(offsets);
  const deficit = Math.max(0, actualEmissions - totalSurrendered);
  const isCompliant = deficit === 0;
  const penalty = deficit * (parameters.penaltyRate || 60);

  const surplusAllowances = Math.max(0, allowancesHeld - allowances);
  const bankableUnits = parameters.bankingAllowed 
    ? Math.floor(surplusAllowances * ((parameters.bankingLimit || 100) / 100))
    : 0;
  const expiringUnits = surplusAllowances - bankableUnits;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setSubmitting(true);
    try {
      await onSubmitSurrender(facility.id, {
        allowances: Number(allowances),
        offsets: Number(offsets)
      });
      setFeedback({ 
        type: 'success', 
        text: isVi ? 'Đã lưu và xác nhận gói nộp hạn ngạch tuân thủ thành công!' : 'Compliance surrender package saved successfully!' 
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.surrenderDeskTitle}</h2>
              <p className="text-xs text-slate-400">{facility.name} • {isVi ? 'Quyết toán nghĩa vụ hạn ngạch' : 'Surrender Obligation Settlement'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Obligation Summary Banner */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.emissionsTarget}</span>
            <div className="text-lg font-black font-mono text-white mt-0.5">
              {actualEmissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO2e</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.totalSurrendered}</span>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
              {totalSurrendered.toLocaleString()} <span className="text-xs font-normal text-slate-500">{t.units}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.settlementStatus}</span>
            <div className={`text-xs font-bold mt-1.5 flex items-center justify-center gap-1 ${
              isCompliant ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isCompliant ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{isCompliant ? t.covered100 : `${t.shortfall}: ${deficit.toLocaleString()} t`}</span>
            </div>
          </div>
        </div>

        {/* Surrender Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Carbon Allowances */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                {t.surrenderAllowances}
              </span>
              <span className="text-slate-400">
                {isVi ? 'Đang nắm giữ:' : 'Holding:'} <strong className="text-white font-mono">{allowancesHeld.toLocaleString()}</strong> {t.units}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={allowancesHeld}
                value={allowances}
                onChange={(e) => setAllowances(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min="0"
                max={allowancesHeld}
                value={allowances}
                onChange={(e) => setAllowances(Math.min(allowancesHeld, Math.max(0, Number(e.target.value))))}
                className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-sm font-mono text-right text-emerald-400 font-bold"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{isVi ? 'Đơn vị tuân thủ sơ cấp theo hạn mức Cap' : 'Primary compliance unit under ETS cap'}</span>
              <button
                type="button"
                onClick={() => setAllowances(Math.min(allowancesHeld, actualEmissions))}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                {isVi ? 'Nộp Tối Đa Cần Thiết' : 'Max Required'}
              </button>
            </div>
          </div>

          {/* Section 2: Carbon Offsets with 30% Vietnam Limit */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-teal-400" />
                {t.surrenderOffsets}
              </span>
              <span className="text-slate-400">
                {isVi ? 'Có sẵn:' : 'Holding:'} <strong className="text-white font-mono">{offsetsHeld.toLocaleString()}</strong> | 
                {isVi ? 'Trần tối đa (30%):' : 'Max 30%:'} <strong className="text-teal-400 font-mono">{maxAllowedOffsets.toLocaleString()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={Math.min(offsetsHeld, maxAllowedOffsets)}
                value={offsets}
                onChange={(e) => setOffsets(Number(e.target.value))}
                className="flex-1 accent-teal-500"
              />
              <input
                type="number"
                min="0"
                max={Math.min(offsetsHeld, maxAllowedOffsets)}
                value={offsets}
                onChange={(e) => setOffsets(Math.min(Math.min(offsetsHeld, maxAllowedOffsets), Math.max(0, Number(e.target.value))))}
                className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-sm font-mono text-right text-teal-400 font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {isVi 
                ? `Hạn mức Nghị định 06: Tối đa 30% nghĩa vụ (${maxAllowedOffsets.toLocaleString()} tCO2e) được nộp bằng tín chỉ các-bon bù trừ.`
                : `Decree 06 limit: maximum 30% of emissions (${maxAllowedOffsets.toLocaleString()} tCO2e) can be fulfilled with offsets.`}
            </p>
          </div>

          {/* Facility Debt Notice if any */}
          {facility?.borrowedUnits > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-300">
              <Coins className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">
                  {isVi ? 'Dư nợ vay mượn hạn ngạch hiện tại:' : 'Current Borrowed Debt:'}
                </span>{' '}
                <strong className="font-mono text-amber-200">{facility.borrowedUnits.toLocaleString()} tCO2e</strong>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  {isVi 
                    ? 'Số nợ này sẽ được hệ thống tự động khấu trừ từ đợt phân bổ hạn ngạch miễn phí của kỳ tiếp theo (hoặc bạn có thể hoàn trả sớm tại tab "Vay Mượn").'
                    : 'This debt will be deducted from next period\'s free allocation (or you can repay early in the "Borrowing" tab).'}
                </p>
              </div>
            </div>
          )}

          {/* Section 4: Banking & Surplus Assessment */}
          <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>{t.surplusRemaining}:</span>
              <span className="font-mono font-bold text-white">{surplusAllowances.toLocaleString()} {t.units}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{isVi ? 'Quy tắc lưu giữ:' : 'Banking rule:'}</span>
              <span className="font-mono text-emerald-400">+{bankableUnits.toLocaleString()} {t.bankedToNext}</span>
            </div>
            {expiringUnits > 0 && (
              <div className="flex items-center justify-between text-[11px] text-rose-400">
                <span>{t.expiringLost}:</span>
                <span className="font-mono">-{expiringUnits.toLocaleString()} {t.units}</span>
              </div>
            )}
          </div>

          {deficit > 0 && (
            <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{isVi ? 'Cảnh Báo Nộp Phạt Do Thiếu Hụt' : 'Shortfall Penalty Warning'}</span>
                <p className="mt-0.5 text-rose-200">
                  {isVi 
                    ? `Cơ sở còn thiếu ${deficit.toLocaleString()} tCO2e. Tại thời điểm quyết toán, cơ sở sẽ bị xử phạt hành chính ${formatCurrency(penalty, currency)} (${formatCurrency(parameters.penaltyRate || 60, currency)}/t).`
                    : `You have an uncovered shortfall of ${deficit.toLocaleString()} tCO2e. At settlement, fine is ${formatCurrency(penalty, currency)}.`}
                </p>
              </div>
            </div>
          )}

          {feedback.text && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              feedback.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            }`}>
              {feedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {submitting ? (isVi ? 'Đang xác nhận...' : 'Submitting Surrender...') : t.commitSurrender}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
