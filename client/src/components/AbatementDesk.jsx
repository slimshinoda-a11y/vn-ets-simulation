import React, { useState } from 'react';
import { 
  Leaf, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  BarChart2 
} from 'lucide-react';
import { translations, formatCurrency, getTechName, getTechCategory, getTechDescription } from '../i18n';

export default function AbatementDesk({ 
  facility, 
  allowanceMarketPrice = 42.50, 
  onImplementAbatement,
  lang = 'vi',
  currency = 'USD'
}) {
  const [loadingTechId, setLoadingTechId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';

  const technologies = facility?.abatementTechnologies || [];
  const sortedTechs = [...technologies].sort((a, b) => a.unitCost - b.unitCost);

  const handleImplement = async (tech) => {
    setErrorMsg('');
    if (facility.cash < tech.capex) {
      setErrorMsg(`${t.insufficientCash}: Cần ${formatCurrency(tech.capex, currency)} nhưng số dư khả dụng là ${formatCurrency(facility.cash, currency)}`);
      return;
    }

    setLoadingTechId(tech.id);
    try {
      await onImplementAbatement(facility.id, tech.id);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingTechId(null);
    }
  };

  const totalPossibleAbatement = technologies.reduce((s, t) => s + t.abatementTons, 0);
  const totalImplementedAbatement = technologies
    .filter(t => t.implemented)
    .reduce((s, t) => s + t.abatementTons, 0);
  
  const annualSavings = technologies
    .filter(t => t.implemented)
    .reduce((s, t) => s + (t.annualOpexSavings || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Intro & Economic Concept Banner */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wide">
              <Leaf className="w-4 h-4" />
              {t.macTitle}
            </div>
            <h2 className="text-xl font-black text-white mt-1">{t.macSubtitle}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {t.macDescription} ({isVi ? 'Giá hạn ngạch tham chiếu hiện tại:' : 'Current market allowance price:'}{' '}
              <span className="text-emerald-400 font-mono font-bold">{formatCurrency(allowanceMarketPrice, currency)}/tCO2e</span>).
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.totalFacilityReduction}</span>
            <div className="text-xl font-black font-mono text-teal-400">
              {totalImplementedAbatement.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {totalPossibleAbatement.toLocaleString()} tCO2e</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              {t.annualSavings}: +{formatCurrency(annualSavings, currency)}/{isVi ? 'năm' : 'yr'}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Visual MAC Curve Bar Comparison */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-teal-400" />
            {isVi ? 'Đường Chi Phí Giảm Phát Thải Biên So Với Giá Thị Trường' : 'Marginal Abatement Cost vs Allowance Market Clearing Price'}
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {isVi ? 'Giá Hạn Ngạch Sàn:' : 'Market Allowance:'} {formatCurrency(allowanceMarketPrice, currency)}/t
          </span>
        </div>

        <div className="space-y-2.5 pt-2">
          {sortedTechs.map((tech) => {
            const isCheaper = tech.unitCost <= allowanceMarketPrice;
            const savingsPerTon = Math.abs(allowanceMarketPrice - tech.unitCost);
            
            return (
              <div key={tech.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{getTechName(tech, lang)}</span>
                    <span className="text-[10px] text-slate-400">({tech.abatementTons.toLocaleString()} t/{isVi ? 'năm' : 'yr'})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className={`font-bold ${isCheaper ? 'text-teal-400' : 'text-amber-400'}`}>
                      {formatCurrency(tech.unitCost, currency)}/t
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isCheaper ? `(${t.saveVsBuying} ${formatCurrency(savingsPerTon, currency)}/t)` : `(${t.higherThanMarket})`}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      tech.implemented 
                        ? 'bg-emerald-500' 
                        : isCheaper ? 'bg-teal-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (tech.unitCost / 100) * 100)}%` }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-emerald-300 shadow-sm z-10"
                    style={{ left: `${Math.min(100, (allowanceMarketPrice / 100) * 100)}%` }}
                    title={`${isVi ? 'Giá hạn ngạch hiện tại:' : 'Current Allowance Price:'} ${formatCurrency(allowanceMarketPrice, currency, false, lang)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Abatement Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technologies.map((tech) => {
          const isCheaper = tech.unitCost <= allowanceMarketPrice;
          const canAfford = facility.cash >= tech.capex;
          const isLoading = loadingTechId === tech.id;

          return (
            <div 
              key={tech.id}
              className={`rounded-2xl p-5 border transition-all ${
                tech.implemented 
                  ? 'bg-emerald-950/15 border-emerald-500/30' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {getTechCategory(tech, lang)}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{getTechName(tech, lang)}</h4>
                  <p className="text-xs text-slate-400 mt-1">{getTechDescription(tech, lang)}</p>
                </div>

                {tech.implemented && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isVi ? 'Đang Hoạt Động' : 'Active'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">{t.reductionPotential}</span>
                  <span className="font-mono font-bold text-teal-400">-{tech.abatementTons.toLocaleString()} t</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{t.capitalCost}</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(tech.capex, currency, true)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{t.unitAbatementCost}</span>
                  <span className={`font-mono font-bold ${isCheaper ? 'text-teal-400' : 'text-amber-400'}`}>
                    {formatCurrency(tech.unitCost, currency)}/t
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {tech.annualOpexSavings > 0 
                    ? `${isVi ? 'Tiết kiệm vận hành:' : 'Opex benefit:'} +${formatCurrency(tech.annualOpexSavings, currency)}/năm` 
                    : tech.annualOpexSavings < 0 
                    ? `${isVi ? 'Tải vận hành thêm:' : 'Operating load:'} -${formatCurrency(Math.abs(tech.annualOpexSavings), currency)}/năm` 
                    : (isVi ? 'Opex trung tính' : 'Neutral opex')}
                </span>

                {tech.implemented ? (
                  <span className="text-xs font-semibold text-emerald-400">
                    {t.commissioned} {tech.implementedPeriod || 1}
                  </span>
                ) : (
                  <button
                    onClick={() => handleImplement(tech)}
                    disabled={!canAfford || isLoading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      canAfford 
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-600/20' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <span>{isLoading ? (isVi ? 'Đang lắp đặt...' : 'Commissioning...') : !canAfford ? t.insufficientCash : t.implementActivity}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
