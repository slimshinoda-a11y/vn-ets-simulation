import React, { useState, useMemo } from 'react';
import { TrendingUp, Layers, Leaf, Activity, Clock, Maximize2, Filter } from 'lucide-react';
import { formatCurrency } from '../i18n';

export default function PriceSignalChart({ 
  allowanceHistory = [], 
  offsetHistory = [], 
  allowanceLastPrice = 5.00, 
  offsetLastPrice = 3.00,
  lang = 'vi',
  currency = 'USD'
}) {
  const isVi = lang === 'vi';
  const [showAllowance, setShowAllowance] = useState(true);
  const [showOffset, setShowOffset] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [timeRange, setTimeRange] = useState('ALL'); // '30', '60', 'ALL'

  // Prepare unified time series
  const chartData = useMemo(() => {
    const timeMap = new Map();

    const addEntries = (list, key) => {
      (list || []).forEach(pt => {
        // Round to nearest 5 seconds for visual alignment
        const t = Math.floor(pt.time / 5000) * 5000;
        if (!timeMap.has(t)) {
          timeMap.set(t, { time: t, allowancePrice: null, offsetPrice: null, volume: 0 });
        }
        const entry = timeMap.get(t);
        entry[key] = pt.price;
        entry.volume += (pt.volume || 0);
      });
    };

    addEntries(allowanceHistory, 'allowancePrice');
    addEntries(offsetHistory, 'offsetPrice');

    const sorted = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);

    // Forward fill missing values so lines connect smoothly
    let lastA = allowanceLastPrice;
    let lastO = offsetLastPrice;

    const filled = sorted.map(d => {
      if (d.allowancePrice != null) lastA = d.allowancePrice;
      if (d.offsetPrice != null) lastO = d.offsetPrice;
      return {
        ...d,
        allowancePrice: d.allowancePrice ?? lastA,
        offsetPrice: d.offsetPrice ?? lastO
      };
    });

    if (filled.length === 0) {
      const now = Date.now();
      return [
        { time: now - 60000, allowancePrice: allowanceLastPrice * 0.98, offsetPrice: offsetLastPrice * 0.98, volume: 1000 },
        { time: now, allowancePrice: allowanceLastPrice, offsetPrice: offsetLastPrice, volume: 2000 }
      ];
    }

    if (timeRange === '30') return filled.slice(-30);
    if (timeRange === '60') return filled.slice(-60);
    return filled.slice(-100);
  }, [allowanceHistory, offsetHistory, allowanceLastPrice, offsetLastPrice, timeRange]);

  // Dimensions for SVG rendering
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Min and max price range with margin
  const allPrices = chartData.flatMap(d => [
    showAllowance ? d.allowancePrice : null,
    showOffset ? d.offsetPrice : null
  ]).filter(p => p != null && !isNaN(p));

  const minPrice = allPrices.length > 0 ? Math.max(0, Math.min(...allPrices) * 0.85) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.15 : 8.00;
  const priceRange = maxPrice - minPrice || 1;

  // Coordinate mappers
  const getX = (index) => padding.left + (index / (chartData.length - 1 || 1)) * graphWidth;
  const getY = (price) => padding.top + (1 - (price - minPrice) / priceRange) * graphHeight;

  // Build SVG path strings
  const buildPath = (key) => {
    if (chartData.length === 0) return '';
    return chartData.reduce((path, d, i) => {
      const val = d[key];
      if (val == null) return path;
      const x = getX(i);
      const y = getY(val);
      return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  const allowancePath = buildPath('allowancePrice');
  const offsetPath = buildPath('offsetPrice');

  // Closed area path for gradient
  const allowanceArea = allowancePath 
    ? `${allowancePath} L ${getX(chartData.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z` 
    : '';

  // Max volume for volume histogram
  const maxVol = Math.max(1, ...chartData.map(d => d.volume || 0));

  // Current stats
  const discountSpread = Math.max(0, allowanceLastPrice - offsetLastPrice);
  const discountPct = allowanceLastPrice > 0 ? Math.round((discountSpread / allowanceLastPrice) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 shadow-xl space-y-4">
      
      {/* Header & Signal Ticker */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <TrendingUp className="w-4 h-4" />
            {isVi ? 'Tín Hiệu Giá Thị Trường Các-bon (Carbon Price Signal)' : 'Carbon Market Price Signal Tracking'}
          </div>
          <h2 className="text-lg font-black text-white mt-0.5">
            {isVi ? 'Diễn Biến Giá Hạn Ngạch & Tín Chỉ Bù Trừ' : 'Allowance vs. Offset Price Dynamics'}
          </h2>
        </div>

        {/* Real-time price badge summary */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isVi ? 'Hạn ngạch' : 'Allowance'}
            </span>
            <div className="text-base font-black font-mono text-white">
              {formatCurrency(allowanceLastPrice, currency)}/t
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1 uppercase">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              {isVi ? 'Tín chỉ bù trừ' : 'Credit / Offset'}
            </span>
            <div className="text-base font-black font-mono text-white">
              {formatCurrency(offsetLastPrice, currency)}/t
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              {isVi ? 'Mức Chiết Khấu' : 'Credit Discount'}
            </span>
            <div className="text-sm font-mono font-bold text-teal-300">
              -{discountPct}% ({formatCurrency(discountSpread, currency)}/t)
            </div>
          </div>
        </div>
      </div>

      {/* Chart Toolbar Controls: Filters & Timeframes */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        
        {/* Series Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showAllowance}
              onChange={(e) => setShowAllowance(e.target.checked)}
              className="w-3.5 h-3.5 accent-emerald-500 rounded"
            />
            <span className="font-semibold text-emerald-400">{isVi ? 'Hạn ngạch (~$5)' : 'Allowance (~$5)'}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showOffset}
              onChange={(e) => setShowOffset(e.target.checked)}
              className="w-3.5 h-3.5 accent-teal-500 rounded"
            />
            <span className="font-semibold text-teal-400">{isVi ? 'Tín chỉ bù trừ (~$3)' : 'Offsets (~$3)'}</span>
          </label>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setTimeRange('30')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              timeRange === '30' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            30 pts
          </button>
          <button
            onClick={() => setTimeRange('60')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              timeRange === '60' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            60 pts
          </button>
          <button
            onClick={() => setTimeRange('ALL')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              timeRange === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isVi ? 'Tất cả' : 'All'}
          </button>
        </div>

      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative bg-slate-950/90 rounded-2xl border border-slate-800/80 p-2 overflow-hidden select-none">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            if (mouseX >= padding.left && mouseX <= width - padding.right) {
              const relativeX = (mouseX - padding.left) / graphWidth;
              const index = Math.round(relativeX * (chartData.length - 1));
              if (chartData[index]) {
                setHoveredPoint({ ...chartData[index], x: getX(index), index });
              }
            }
          }}
        >
          <defs>
            {/* Emerald glow gradient for Allowance */}
            <linearGradient id="allowanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Grid line pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect x={padding.left} y={padding.top} width={graphWidth} height={graphHeight} fill="url(#grid)" />

          {/* Horizontal Price Gridlines & Labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const pVal = minPrice + (1 - ratio) * priceRange;
            const y = padding.top + ratio * graphHeight;
            return (
              <g key={ratio}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  stroke="#334155" 
                  strokeDasharray="2,3" 
                  strokeWidth="0.8" 
                />
                <text 
                  x={padding.left - 8} 
                  y={y + 3.5} 
                  fill="#64748b" 
                  fontSize="9" 
                  fontFamily="monospace" 
                  textAnchor="end"
                >
                  {formatCurrency(pVal, currency, true)}
                </text>
              </g>
            );
          })}

          {/* Mini Volume Bar Histogram at chart bottom */}
          {chartData.map((d, i) => {
            const vHeight = (d.volume / maxVol) * 35;
            const x = getX(i) - 1.5;
            const y = padding.top + graphHeight - vHeight;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width="3"
                height={vHeight}
                fill="#3b82f6"
                opacity="0.3"
                rx="1"
              />
            );
          })}

          {/* Allowance Area Gradient Fill */}
          {showAllowance && allowanceArea && (
            <path d={allowanceArea} fill="url(#allowanceAreaGrad)" />
          )}

          {/* Offset Trend Line (Teal) */}
          {showOffset && offsetPath && (
            <path
              d={offsetPath}
              fill="none"
              stroke="#14b8a6"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Allowance Trend Line (Emerald) */}
          {showAllowance && allowancePath && (
            <path
              d={allowancePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair Guide Line & Points */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + graphHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3,3"
              />

              {showAllowance && hoveredPoint.allowancePrice != null && (
                <circle
                  cx={hoveredPoint.x}
                  cy={getY(hoveredPoint.allowancePrice)}
                  r="5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}

              {showOffset && hoveredPoint.offsetPrice != null && (
                <circle
                  cx={hoveredPoint.x}
                  cy={getY(hoveredPoint.offsetPrice)}
                  r="4.5"
                  fill="#14b8a6"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Time axis stamps */}
          {chartData.length > 0 && [0, Math.floor(chartData.length / 2), chartData.length - 1].map((idx) => {
            const d = chartData[idx];
            if (!d) return null;
            const x = getX(idx);
            const timeStr = new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <text
                key={idx}
                x={x}
                y={height - 12}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor={idx === 0 ? 'start' : idx === chartData.length - 1 ? 'end' : 'middle'}
              >
                {timeStr}
              </text>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute top-4 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 shadow-2xl text-xs space-y-1 font-mono z-20 backdrop-blur-md"
            style={{
              left: `${Math.min(80, Math.max(10, (hoveredPoint.x / width) * 100))}%`
            }}
          >
            <div className="text-[10px] text-slate-400 flex items-center gap-1 border-b border-slate-800 pb-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{new Date(hoveredPoint.time).toLocaleTimeString()}</span>
            </div>

            {showAllowance && hoveredPoint.allowancePrice != null && (
              <div className="flex items-center justify-between gap-3 text-emerald-400">
                <span>{isVi ? 'Hạn ngạch:' : 'Allowance:'}</span>
                <span className="font-bold">{formatCurrency(hoveredPoint.allowancePrice, currency)}/t</span>
              </div>
            )}

            {showOffset && hoveredPoint.offsetPrice != null && (
              <div className="flex items-center justify-between gap-3 text-teal-400">
                <span>{isVi ? 'Tín chỉ:' : 'Offset:'}</span>
                <span className="font-bold">{formatCurrency(hoveredPoint.offsetPrice, currency)}/t</span>
              </div>
            )}

            {hoveredPoint.volume > 0 && (
              <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] pt-0.5 border-t border-slate-800">
                <span>{isVi ? 'Khối lượng:' : 'Volume:'}</span>
                <span>{hoveredPoint.volume.toLocaleString()} t</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CarbonSim Price Guidance Note */}
      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isVi 
              ? 'Tín hiệu giá phản ánh chi phí giảm phát thải biên (MAC) của 110 cơ sở và biên độ bảo hiểm giá (Sàn $1.50 - Trần $15.00).' 
              : 'Price signals reflect the marginal abatement cost (MAC) across 110 covered plants and the price collar ($1.50 Floor - $15.00 Ceiling).'}
          </span>
        </div>
        <span className="font-mono text-emerald-400 font-bold shrink-0">
          VN ETS Pilot ~ $5.00 / tCO2e
        </span>
      </div>

    </div>
  );
}
