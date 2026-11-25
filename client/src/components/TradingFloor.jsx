import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Leaf, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Sliders,
  ListOrdered,
  History,
  FileText,
  HandCoins,
  Users,
  Building2,
  ArrowRightLeft
} from 'lucide-react';
import { translations, formatCurrency } from '../i18n';

const USD_VND_RATE = 25000;

export default function TradingFloor({ 
  facility, 
  state, 
  onPlaceOrder, 
  onCancelOrder, 
  onExecuteDirectTrade,
  onAcceptDirectTrade,
  onRejectDirectTrade,
  onCancelDirectTrade,
  onOpenAuctionModal,
  lang = 'vi',
  currency = 'USD'
}) {
  const [tradingMode, setTradingMode] = useState('EXCHANGE'); // 'EXCHANGE' | 'DIRECT'
  const [instrument, setInstrument] = useState('ALLOWANCE'); // 'ALLOWANCE' | 'OFFSET'
  const [side, setSide] = useState('BUY'); // 'BUY' | 'SELL'
  const [orderType, setOrderType] = useState('LIMIT'); // 'LIMIT' | 'MARKET'
  const [price, setPrice] = useState(currency === 'VND' ? '125000' : '5.00');
  const [quantity, setQuantity] = useState('1000');
  const [targetFacilityId, setTargetFacilityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalProcessingId, setProposalProcessingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [activeOrderTab, setActiveOrderTab] = useState('open'); // 'open' | 'history' | 'trades' | 'otc'

  const prevCurrencyRef = useRef(currency);

  const t = translations[lang] || translations.vi;
  const isVi = lang === 'vi';
  const market = instrument === 'ALLOWANCE' ? state?.allowanceMarket : state?.offsetMarket;
  const isTradingOpen = state?.phase === 'TRADING';

  // Bilateral OTC proposals involving this facility
  const incomingProposals = (state?.otcProposals || []).filter(
    p => p.toFacilityId === facility?.id && p.status === 'PENDING'
  );
  const outgoingProposals = (state?.otcProposals || []).filter(
    p => p.fromFacilityId === facility?.id && p.status === 'PENDING'
  );
  const facilityOtcHistory = (state?.otcProposals || []).filter(
    p => (p.fromFacilityId === facility?.id || p.toFacilityId === facility?.id)
  );

  // Automatically convert order price input between USD and VND when currency switches
  useEffect(() => {
    if (currency !== prevCurrencyRef.current) {
      setPrice(prev => {
        const val = parseFloat(prev);
        if (isNaN(val) || val <= 0) {
          const defaultUsd = instrument === 'ALLOWANCE' ? 5.00 : 3.00;
          return currency === 'VND' ? (defaultUsd * USD_VND_RATE).toString() : defaultUsd.toFixed(2);
        }
        if (currency === 'VND' && prevCurrencyRef.current === 'USD') {
          return Math.round(val * USD_VND_RATE).toString();
        }
        if (currency === 'USD' && prevCurrencyRef.current === 'VND') {
          return (val / USD_VND_RATE).toFixed(2);
        }
        return prev;
      });
      prevCurrencyRef.current = currency;
    }
  }, [currency, instrument]);

  const handleSwitchInstrument = (inst) => {
    setInstrument(inst);
    const m = inst === 'ALLOWANCE' ? state?.allowanceMarket : state?.offsetMarket;
    const baseUsd = m?.lastPrice || (inst === 'ALLOWANCE' ? 5.00 : 3.00);
    if (currency === 'VND') {
      setPrice(Math.round(baseUsd * USD_VND_RATE).toString());
    } else {
      setPrice(baseUsd.toFixed(2));
    }
  };

  // Convert entered price to USD for calculations & submission
  const priceInUsd = currency === 'VND' 
    ? (parseFloat(price) || 0) / USD_VND_RATE 
    : (parseFloat(price) || 0);

  const qty = parseInt(quantity, 10) || 0;
  const effectivePriceUsd = orderType === 'MARKET' 
    ? (market?.lastPrice || (instrument === 'ALLOWANCE' ? 5.0 : 3.0)) 
    : priceInUsd;
  const estTotalUsd = effectivePriceUsd * qty;

  const handleQuickPercent = (pct) => {
    if (side === 'BUY') {
      const p = effectivePriceUsd || 5.0;
      const maxQty = p > 0 ? Math.floor(facility.cash / p) : 0;
      setQuantity(Math.floor(maxQty * (pct / 100)).toString());
    } else {
      const available = instrument === 'ALLOWANCE' ? facility.allowances : facility.offsets;
      setQuantity(Math.floor(available * (pct / 100)).toString());
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!isTradingOpen) {
      setFeedback({ type: 'error', text: `${t.marketClosed} (${state?.phase})` });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', text: isVi ? 'Vui lòng nhập số lượng dương hợp lệ' : 'Please enter a valid positive quantity' });
      return;
    }

    if (orderType === 'LIMIT' && (isNaN(priceInUsd) || priceInUsd <= 0)) {
      setFeedback({ type: 'error', text: isVi ? 'Vui lòng nhập mức giá hợp lệ' : 'Please enter a valid price' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onPlaceOrder({
        facilityId: facility.id,
        side,
        instrument,
        type: orderType,
        price: orderType === 'MARKET' ? effectivePriceUsd : priceInUsd,
        quantity: qty
      });

      const tradesCount = res?.executedTrades?.length || 0;
      if (tradesCount > 0) {
        const totalTraded = res.executedTrades.reduce((s, tr) => s + tr.quantity, 0);
        setFeedback({ 
          type: 'success', 
          text: isVi 
            ? `Khớp lệnh thành công! Đã khớp ${tradesCount} lệnh, tổng cộng ${totalTraded.toLocaleString()} ${instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ'}!` 
            : `Executed ${tradesCount} trade(s) totaling ${totalTraded.toLocaleString()} ${instrument === 'ALLOWANCE' ? 'allowances' : 'credits'}!` 
        });
      } else if (orderType === 'MARKET') {
        setFeedback({
          type: 'error',
          text: isVi
            ? `Không có lệnh đối ứng trên thị trường để khớp lệnh thị trường (Market Order). Vui lòng đặt Lệnh Giới Hạn (Limit) hoặc chờ người bán.`
            : `No matching opposite orders on the market book to fill this market order.`
        });
      } else {
        setFeedback({ 
          type: 'success', 
          text: isVi 
            ? `Lệnh ${side === 'BUY' ? 'Mua' : 'Bán'} (${qty.toLocaleString()} ${instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ'}) đã được đưa vào sổ lệnh.` 
            : `Order placed: ${side} ${qty.toLocaleString()} ${instrument}.` 
        });
      }
    } catch (err) {
      let errMsg = err.message || '';
      if (isVi) {
        if (errMsg.includes('Insufficient funds')) {
          errMsg = errMsg.replace(/Insufficient funds: Need \$([\d,]+) but have \$([\d,]+)/, (match, need, have) => {
            const needNum = parseFloat(need.replace(/,/g, ''));
            const haveNum = parseFloat(have.replace(/,/g, ''));
            return `Không đủ tiền mặt: Cần ${formatCurrency(needNum, currency)} nhưng tài khoản chỉ có ${formatCurrency(haveNum, currency)}.`;
          });
        } else if (errMsg.includes('Insufficient') && errMsg.includes('inventory')) {
          errMsg = `Không đủ ${instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ'} khả dụng trong kho để bán.`;
        } else if (errMsg.includes('Price cannot be below market floor price')) {
          errMsg = `Mức giá không được thấp hơn giá sàn quy định (${formatCurrency(state?.parameters?.marketPriceFloor || 0.5, currency)}).`;
        } else if (errMsg.includes('Price exceeds market ceiling price')) {
          errMsg = `Mức giá không được vượt quá giá trần quy định (${formatCurrency(state?.parameters?.marketPriceCeiling || 15, currency)}).`;
        } else if (errMsg.includes('Trading is closed')) {
          errMsg = `Thị trường đang đóng cửa trong giai đoạn hiện tại.`;
        } else if (errMsg.includes('Trading is temporarily paused')) {
          errMsg = `Giao dịch đang tạm dừng bởi cơ quan điều hành.`;
        }
      }
      setFeedback({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDirectTrade = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!isTradingOpen) {
      setFeedback({ type: 'error', text: `${t.marketClosed} (${state?.phase})` });
      return;
    }

    if (!targetFacilityId) {
      setFeedback({ type: 'error', text: isVi ? 'Vui lòng chọn doanh nghiệp đối tác để giao dịch trực tiếp' : 'Please select a partner enterprise for direct trade' });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', text: isVi ? 'Vui lòng nhập số lượng dương hợp lệ' : 'Please enter a valid positive quantity' });
      return;
    }

    if (isNaN(priceInUsd) || priceInUsd <= 0) {
      setFeedback({ type: 'error', text: isVi ? 'Vui lòng nhập mức giá thỏa thuận hợp lệ' : 'Please enter a valid agreed price' });
      return;
    }

    const partner = state?.facilities?.[targetFacilityId];
    if (!partner) {
      setFeedback({ type: 'error', text: isVi ? 'Không tìm thấy doanh nghiệp đối tác' : 'Partner facility not found' });
      return;
    }

    const totalCostUsd = priceInUsd * qty;

    setIsSubmitting(true);
    try {
      if (!onExecuteDirectTrade) {
        throw new Error('Tính năng giao dịch trực tiếp chưa được kết nối');
      }
      await onExecuteDirectTrade({
        fromFacilityId: facility.id,
        toFacilityId: targetFacilityId,
        side,
        instrument,
        price: priceInUsd,
        quantity: qty
      });

      const instName = instrument === 'ALLOWANCE' ? (isVi ? 'hạn ngạch' : 'allowances') : (isVi ? 'tín chỉ' : 'credits');
      const actionName = side === 'BUY' ? (isVi ? 'mua từ' : 'buy from') : (isVi ? 'bán cho' : 'sell to');
      setFeedback({
        type: 'success',
        text: isVi 
          ? `Đã gửi đề nghị ${actionName} ${partner.name} (${qty.toLocaleString()} ${instName} @ ${formatCurrency(effectivePriceUsd, currency)}/t, tổng: ${formatCurrency(totalCostUsd, currency)}). Đang chờ đối tác xác nhận!`
          : `Direct trade proposal sent to ${partner.name}! Awaiting confirmation.`
      });
    } catch (err) {
      let errMsg = err.message || '';
      if (isVi) {
        if (errMsg.includes('Insufficient funds') || errMsg.includes('không đủ tiền mặt')) {
          errMsg = `Không thể gửi đề nghị: Bên mua không đủ tiền mặt để thực hiện giao dịch (Tổng tiền: ${formatCurrency(totalCostUsd, currency)}).`;
        } else if (errMsg.includes('Insufficient') || errMsg.includes('không đủ') || errMsg.includes('inventory')) {
          errMsg = `Không thể gửi đề nghị: Bên bán không có đủ ${instrument === 'ALLOWANCE' ? 'hạn ngạch' : 'tín chỉ'} để chuyển nhượng (Yêu cầu: ${qty.toLocaleString()} tCO2e).`;
        }
      }
      setFeedback({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    setProposalProcessingId(proposalId);
    setFeedback({ type: '', text: '' });
    try {
      if (!onAcceptDirectTrade) throw new Error('Tính năng xác nhận chưa sẵn sàng');
      await onAcceptDirectTrade({ facilityId: facility.id, proposalId });
      setFeedback({
        type: 'success',
        text: isVi 
          ? 'Đã xác nhận và khớp lệnh thỏa thuận thành công! Tài sản và tiền mặt đã được chuyển giao.' 
          : 'Direct trade confirmed and settled successfully!'
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Lỗi khi xác nhận giao dịch' });
    } finally {
      setProposalProcessingId(null);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    setProposalProcessingId(proposalId);
    setFeedback({ type: '', text: '' });
    try {
      if (!onRejectDirectTrade) throw new Error('Tính năng từ chối chưa sẵn sàng');
      await onRejectDirectTrade({ 
        facilityId: facility.id, 
        proposalId, 
        reason: isVi ? 'Doanh nghiệp từ chối đề xuất giao dịch này' : 'Declined by partner' 
      });
      setFeedback({
        type: 'success',
        text: isVi ? 'Đã từ chối đề nghị giao dịch.' : 'Direct trade proposal declined.'
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Lỗi khi từ chối giao dịch' });
    } finally {
      setProposalProcessingId(null);
    }
  };

  const handleCancelProposal = async (proposalId) => {
    setProposalProcessingId(proposalId);
    setFeedback({ type: '', text: '' });
    try {
      if (!onCancelDirectTrade) throw new Error('Tính năng hủy đề nghị chưa sẵn sàng');
      await onCancelDirectTrade({ facilityId: facility.id, proposalId });
      setFeedback({
        type: 'success',
        text: isVi ? 'Đã hủy và rút lại đề nghị giao dịch.' : 'Direct proposal cancelled.'
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Lỗi khi hủy đề nghị' });
    } finally {
      setProposalProcessingId(null);
    }
  };

  const depth = market?.depth || { bids: [], asks: [] };
  const recentTrades = market?.recentTrades || [];

  // Facility orders & execution trades
  const facilityOrders = facility?.orders || [];
  const facilityTrades = facility?.trades || [];

  // Facility open orders in active order book
  const userOpenOrders = facilityOrders.length > 0
    ? facilityOrders.filter(o => o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED')
    : [
        ...(state?.allowanceMarket?.bids || []),
        ...(state?.allowanceMarket?.asks || []),
        ...(state?.offsetMarket?.bids || []),
        ...(state?.offsetMarket?.asks || [])
      ].filter(o => o?.facilityId === facility.id && (o?.status === 'OPEN' || (o?.remainingQuantity && o.remainingQuantity > 0)));

  const displayFacilityOrders = facilityOrders.length > 0 ? facilityOrders : userOpenOrders;

  return (
    <div className="space-y-6">
      
      {/* Instrument Selection & Market Ticker Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
        
        {/* Toggle between Allowances and Offsets */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleSwitchInstrument('ALLOWANCE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              instrument === 'ALLOWANCE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.carbonAllowancesEua}</span>
          </button>

          <button
            onClick={() => handleSwitchInstrument('OFFSET')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              instrument === 'OFFSET'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Leaf className="w-4 h-4" />
            <span>{t.carbonOffsetsCer}</span>
          </button>
        </div>

        {/* Ticker Metrics with Currency formatting */}
        <div className="flex items-center gap-6 text-xs w-full md:w-auto justify-between md:justify-end">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.lastPrice}</span>
            <div className="text-base font-black font-mono text-white flex items-center gap-1">
              {formatCurrency(market?.lastPrice || 0, currency)}
              <span className="text-[11px] text-slate-400 font-normal">/t</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.highLow}</span>
            <div className="font-mono text-slate-300">
              {formatCurrency(market?.highPrice || 0, currency)} / {formatCurrency(market?.lowPrice || 0, currency)}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.volumeTraded}</span>
            <div className="font-mono font-bold text-emerald-400">
              {(market?.volume || 0).toLocaleString()} <span className="text-slate-500 text-[10px]">tCO2e</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Trading Area: 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Order Placement & Direct Bilateral Desk */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          
          {/* Header & Mode Switcher */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {tradingMode === 'EXCHANGE' ? (
                  <>
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>{t.orderEntry} ({instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')})</span>
                  </>
                ) : (
                  <>
                    <HandCoins className="w-4 h-4 text-purple-400" />
                    <span>{isVi ? 'Giao Dịch Trực Tiếp Giữa Doanh Nghiệp' : 'Direct Bilateral OTC Trading'}</span>
                  </>
                )}
              </h3>
              <span className="text-xs text-slate-400">
                {t.available}: <span className="font-mono text-white font-bold">
                  {instrument === 'ALLOWANCE' ? facility.allowances.toLocaleString() : facility.offsets.toLocaleString()}
                </span> {t.units}
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setTradingMode('EXCHANGE'); setFeedback({ type: '', text: '' }); }}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tradingMode === 'EXCHANGE'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isVi ? 'Sàn Khớp Lệnh' : 'Central Order Book'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setTradingMode('DIRECT'); setFeedback({ type: '', text: '' }); }}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                  tradingMode === 'DIRECT'
                    ? 'bg-purple-950/80 text-purple-200 shadow-sm border border-purple-500/50'
                    : 'text-purple-400 hover:text-purple-200'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5 text-purple-400" />
                <span>{isVi ? 'Mua Bán Trực Tiếp (P2P)' : 'Direct OTC (P2P)'}</span>
                {incomingProposals.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {incomingProposals.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* MODE 1: CENTRAL EXCHANGE ORDER BOOK FORM */}
          {tradingMode === 'EXCHANGE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.buy} {instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')}
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    side === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.sell} {instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === 'LIMIT'}
                    onChange={() => setOrderType('LIMIT')}
                    className="accent-emerald-500"
                  />
                  <span>{t.limitOrder}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === 'MARKET'}
                    onChange={() => setOrderType('MARKET')}
                    className="accent-emerald-500"
                  />
                  <span>{t.marketOrder}</span>
                </label>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-4 pt-1">
                {orderType === 'LIMIT' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.price} ({currency === 'VND' ? 'VNĐ/tCO2e' : 'USD/tCO2e'})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">
                        {currency === 'VND' ? '₫' : '$'}
                      </span>
                      <input
                        type="number"
                        step={currency === 'VND' ? '1000' : 'any'}
                        min={currency === 'VND' ? '1000' : '0.01'}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                        placeholder={currency === 'VND' ? '125000' : '5.00'}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.quantity} (tCO2e)
                    </label>
                    <div className="flex items-center gap-1">
                      {[25, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleQuickPercent(pct)}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="1000"
                  />
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{t.estimatedValue}:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(estTotalUsd, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{t.liquidCash}:</span>
                    <span className="font-mono text-slate-300">{formatCurrency(facility.cash, currency)}</span>
                  </div>
                </div>

                {feedback.text && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                    feedback.type === 'error'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  }`}>
                    {feedback.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isTradingOpen}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                    !isTradingOpen 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : side === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {isVi ? 'Đang gửi...' : 'Processing...'}
                    </span>
                  ) : !isTradingOpen ? (
                    t.marketClosed
                  ) : (
                    `${t.placeOrder} (${side === 'BUY' ? t.buy : t.sell})`
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: DIRECT BILATERAL P2P TRADING DESK */}
          {tradingMode === 'DIRECT' && (
            <div className="space-y-4">

              {/* 1. KHU VỰC ĐỀ NGHỊ GIAO DỊCH CHỜ BẠN XÁC NHẬN */}
              {incomingProposals.length > 0 && (
                <div className="space-y-2 p-3 bg-gradient-to-br from-purple-950/70 via-indigo-950/60 to-slate-950 rounded-2xl border border-purple-500/50 shadow-md">
                  <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/30">
                    <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      {isVi ? 'Đề Nghị Cần Bạn Xác Nhận' : 'Proposals Awaiting Your Confirmation'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                      {incomingProposals.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {incomingProposals.map((prop) => {
                      const isSenderBuying = prop.side === 'BUY'; // sender wants to buy from you => you are seller
                      const instLabel = prop.instrument === 'ALLOWANCE' ? (isVi ? 'hạn ngạch' : 'allowances') : (isVi ? 'tín chỉ' : 'credits');
                      const isBusy = proposalProcessingId === prop.id;

                      return (
                        <div key={prop.id} className="p-2.5 rounded-xl bg-slate-950/90 border border-purple-500/40 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>{prop.fromFacilityName}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 mt-0.5">
                                {isSenderBuying ? (
                                  <span className="text-emerald-400 font-semibold">
                                    {isVi ? `Đề nghị MUA từ bạn ${prop.quantity.toLocaleString()} ${instLabel}` : `Wants to BUY ${prop.quantity.toLocaleString()} ${instLabel} from you`}
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-semibold">
                                    {isVi ? `Đề nghị BÁN cho bạn ${prop.quantity.toLocaleString()} ${instLabel}` : `Wants to SELL ${prop.quantity.toLocaleString()} ${instLabel} to you`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-white">{formatCurrency(prop.price, currency)}/t</div>
                              <div className="text-[10px] text-slate-400 font-mono">Tổng: {formatCurrency(prop.totalCost, currency)}</div>
                            </div>
                          </div>

                          {/* Settlement impact reminder */}
                          <div className="text-[10.5px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                            {isSenderBuying ? (
                              <>
                                <span>{isVi ? 'Bạn nhận tiền:' : 'You receive:'} <strong className="text-emerald-400 font-mono">+{formatCurrency(prop.totalCost, currency)}</strong></span>
                                <span>{isVi ? 'Giao chuyển:' : 'Transfer:'} <strong className="text-amber-300 font-mono">-{prop.quantity.toLocaleString()}t</strong></span>
                              </>
                            ) : (
                              <>
                                <span>{isVi ? 'Bạn trả tiền:' : 'You pay:'} <strong className="text-rose-400 font-mono">-{formatCurrency(prop.totalCost, currency)}</strong></span>
                                <span>{isVi ? 'Nhận về:' : 'Receive:'} <strong className="text-emerald-400 font-mono">+{prop.quantity.toLocaleString()}t</strong></span>
                              </>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleAcceptProposal(prop.id)}
                              className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isBusy ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>{isVi ? 'Xác Nhận & Khớp' : 'Confirm & Settle'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleRejectProposal(prop.id)}
                              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{isVi ? 'Từ Chối' : 'Decline'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. KHU VỰC ĐỀ NGHỊ BẠN ĐÃ GỬI ĐI ĐANG CHỜ ĐỐI TÁC */}
              {outgoingProposals.length > 0 && (
                <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {isVi ? 'Đề Nghị Bạn Đã Gửi Đi (Chờ Đối Tác)' : 'Your Sent Proposals (Pending)'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                      {outgoingProposals.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {outgoingProposals.map((prop) => {
                      const isBusy = proposalProcessingId === prop.id;
                      const instLabel = prop.instrument === 'ALLOWANCE' ? (isVi ? 'hạn ngạch' : 'allowances') : (isVi ? 'tín chỉ' : 'credits');
                      return (
                        <div key={prop.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1">
                              <span>{prop.side === 'BUY' ? (isVi ? 'Mua từ:' : 'Buy from:') : (isVi ? 'Bán cho:' : 'Sell to:')}</span>
                              <span className="text-purple-300 font-bold">{prop.toFacilityName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {prop.quantity.toLocaleString()} {instLabel} @ {formatCurrency(prop.price, currency)} (Tổng: {formatCurrency(prop.totalCost, currency)})
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleCancelProposal(prop.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-[10px] transition-all cursor-pointer whitespace-nowrap"
                          >
                            {isBusy ? '...' : (isVi ? 'Hủy đề nghị' : 'Cancel')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. BIỂU MẪU TẠO ĐỀ NGHỊ GIAO DỊCH MỚI */}
              <form onSubmit={handleSubmitDirectTrade} className="space-y-4">
                
                {/* Direction selector: Mua Trực Tiếp Từ vs Bán Trực Tiếp Cho */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSide('BUY')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      side === 'BUY'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{isVi ? 'Đề Nghị Mua Từ' : 'Propose Buy From'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('SELL')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      side === 'SELL'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{isVi ? 'Đề Nghị Bán Cho' : 'Propose Sell To'}</span>
                  </button>
                </div>

                {/* Partner Facility Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isVi ? 'Chọn Doanh Nghiệp Đối Tác' : 'Select Partner Enterprise'}</span>
                  </label>
                  <select
                    value={targetFacilityId}
                    onChange={(e) => setTargetFacilityId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">{isVi ? '-- Chọn doanh nghiệp đối tác giao dịch --' : '-- Select partner facility --'}</option>
                    {Object.values(state?.facilities || {})
                      .filter(f => f.id !== facility?.id)
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          [{f.id}] {f.name} ({f.sectorId?.toUpperCase()})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Selected Partner Confirmation Badge (No balances or cash revealed) */}
                {targetFacilityId && state?.facilities?.[targetFacilityId] && (
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-semibold text-white">{state.facilities[targetFacilityId].name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-semibold">
                      {state.facilities[targetFacilityId].sectorId}
                    </span>
                  </div>
                )}

                {/* Agreed Unit Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {isVi ? 'Đơn Giá Thỏa Thuận' : 'Agreed Price'} ({currency === 'VND' ? 'VNĐ/tCO2e' : 'USD/tCO2e'})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const baseUsd = market?.lastPrice || (instrument === 'ALLOWANCE' ? 5.00 : 3.00);
                        setPrice(currency === 'VND' ? Math.round(baseUsd * USD_VND_RATE).toString() : baseUsd.toFixed(2));
                      }}
                      className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                    >
                      {isVi ? 'Lấy giá thị trường hiện tại' : 'Use Market Price'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">
                      {currency === 'VND' ? '₫' : '$'}
                    </span>
                    <input
                      type="number"
                      step={currency === 'VND' ? '1000' : 'any'}
                      min={currency === 'VND' ? '1000' : '0.01'}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                      placeholder={currency === 'VND' ? '125000' : '5.00'}
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {isVi ? 'Khối Lượng Chuyển Nhượng' : 'Transfer Quantity'} (tCO2e)
                    </label>
                    <div className="flex items-center gap-1">
                      {[25, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleQuickPercent(pct)}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                    placeholder="1000"
                  />
                </div>

                {/* Settlement calculation breakdown */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isVi ? 'Tổng tiền thanh toán thỏa thuận:' : 'Total Agreed Settlement:'}</span>
                    <span className="font-mono font-bold text-white text-sm">{formatCurrency(estTotalUsd, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isVi ? 'Tiền mặt của bạn:' : 'Your Cash:'}</span>
                    <span className="font-mono text-slate-300">{formatCurrency(facility.cash, currency)}</span>
                  </div>
                  <div className="text-[11px] text-purple-300/90 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                    <span>{side === 'BUY' ? (isVi ? 'Tiền trừ vào tài khoản bạn:' : 'Debited from you:') : (isVi ? 'Tiền cộng vào tài khoản bạn:' : 'Credited to you:')}</span>
                    <strong className={side === 'BUY' ? 'text-rose-400' : 'text-emerald-400'}>
                      {side === 'BUY' ? `-${formatCurrency(estTotalUsd, currency)}` : `+${formatCurrency(estTotalUsd, currency)}`}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300/90 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    {isVi 
                      ? 'Lưu ý: Lệnh sẽ chuyển thành đề nghị gửi tới đối tác. Giao dịch chỉ được thực hiện khi bên còn lại xác nhận và hệ thống kiểm tra cả hai bên đủ điều kiện số dư.' 
                      : 'Note: Proposal is sent to partner. Trade executes only after the partner confirms and both parties have sufficient balances.'}
                  </span>
                </div>

                {/* Feedback messages */}
                {feedback.text && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                    feedback.type === 'error'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  }`}>
                    {feedback.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                {/* Submit direct trade button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isTradingOpen || !targetFacilityId}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                    !isTradingOpen || !targetFacilityId
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : side === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {isVi ? 'Đang gửi đề nghị...' : 'Sending proposal...'}
                    </span>
                  ) : !isTradingOpen ? (
                    t.marketClosed
                  ) : !targetFacilityId ? (
                    isVi ? 'Vui lòng chọn doanh nghiệp đối tác' : 'Please select partner facility'
                  ) : (
                    <span>
                      {side === 'BUY' 
                        ? (isVi ? `Gửi Đề Nghị Mua Cho Đối Tác (${qty.toLocaleString()} tCO2e)` : `Send Buy Proposal (${qty.toLocaleString()} t)`) 
                        : (isVi ? `Gửi Đề Nghị Bán Cho Đối Tác (${qty.toLocaleString()} tCO2e)` : `Send Sell Proposal (${qty.toLocaleString()} t)`)}
                    </span>
                  )}
                </button>

              </form>

            </div>
          )}

        </div>

        {/* Middle Column: Depth Ladder / Order Book - RÕ RÀNG LỆNH CHÀO MUA & CHÀO BÁN */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>{t.orderBookDepth}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-bold">
              {instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')}
            </span>
          </div>

          {/* 1. KHU VỰC: LỆNH CHÀO BÁN (ASKS / SELL ORDERS) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-rose-950/50 border border-rose-500/40 text-[11px]">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {isVi ? 'LỆNH CHÀO BÁN (ASKS)' : 'SELL ORDERS (ASKS)'}
              </span>
              <span className="text-[10px] text-rose-400 font-semibold">
                {isVi ? 'Bên Bán Đang Chào' : 'Sellers Offering'}
              </span>
            </div>

            <div className="text-[10px] font-semibold text-slate-400 grid grid-cols-3 px-1 pb-1 border-b border-slate-800/60 uppercase">
              <span>{isVi ? 'Giá chào bán' : 'Ask Price'}</span>
              <span className="text-right">{isVi ? 'SL bán' : 'Volume'}</span>
              <span className="text-right">{isVi ? 'Lũy kế' : 'Cumulative'}</span>
            </div>

            <div className="space-y-0.5 min-h-[90px]">
              {depth.asks.length === 0 ? (
                <div className="text-center py-5 text-xs text-slate-500 italic">
                  {isVi ? 'Hiện chưa có lệnh chào bán nào trên sổ lệnh' : 'No asks on book'}
                </div>
              ) : (
                [...depth.asks].reverse().slice(0, 6).map((ask, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (currency === 'VND') {
                        setPrice(Math.round(ask.price * USD_VND_RATE).toString());
                      } else {
                        setPrice(ask.price.toFixed(2));
                      }
                    }}
                    title={isVi ? 'Nhấp để áp dụng mức giá chào bán này' : 'Click to copy price'}
                    className="grid grid-cols-3 text-xs font-mono py-1 hover:bg-rose-500/15 rounded px-1.5 cursor-pointer transition-colors"
                  >
                    <span className="text-rose-400 font-bold">{formatCurrency(ask.price, currency)}</span>
                    <span className="text-right text-slate-300">{ask.quantity.toLocaleString()}</span>
                    <span className="text-right text-slate-500">{ask.cumulative.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. THANH CHIA: GIÁ KHỚP GẦN NHẤT & CHÊNH LỆCH THỊ TRƯỜNG */}
          <div className="py-2.5 px-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono font-bold shadow-inner">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isVi ? 'Giá khớp gần nhất:' : 'Last Price:'}
            </span>
            <span className="text-emerald-400 text-sm font-black">{formatCurrency(market?.lastPrice || 0, currency)}</span>
          </div>

          {/* 3. KHU VỰC: LỆNH CHÀO MUA (BIDS / BUY ORDERS) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-[11px]">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {isVi ? 'LỆNH CHÀO MUA (BIDS)' : 'BUY ORDERS (BIDS)'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {isVi ? 'Bên Mua Đang Chào' : 'Buyers Offering'}
              </span>
            </div>

            <div className="text-[10px] font-semibold text-slate-400 grid grid-cols-3 px-1 pb-1 border-b border-slate-800/60 uppercase">
              <span>{isVi ? 'Giá chào mua' : 'Bid Price'}</span>
              <span className="text-right">{isVi ? 'SL mua' : 'Volume'}</span>
              <span className="text-right">{isVi ? 'Lũy kế' : 'Cumulative'}</span>
            </div>

            <div className="space-y-0.5 min-h-[90px]">
              {depth.bids.length === 0 ? (
                <div className="text-center py-5 text-xs text-slate-500 italic">
                  {isVi ? 'Hiện chưa có lệnh chào mua nào trên sổ lệnh' : 'No bids on book'}
                </div>
              ) : (
                depth.bids.slice(0, 6).map((bid, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (currency === 'VND') {
                        setPrice(Math.round(bid.price * USD_VND_RATE).toString());
                      } else {
                        setPrice(bid.price.toFixed(2));
                      }
                    }}
                    title={isVi ? 'Nhấp để áp dụng mức giá chào mua này' : 'Click to copy price'}
                    className="grid grid-cols-3 text-xs font-mono py-1 hover:bg-emerald-500/15 rounded px-1.5 cursor-pointer transition-colors"
                  >
                    <span className="text-emerald-400 font-bold">{formatCurrency(bid.price, currency)}</span>
                    <span className="text-right text-slate-300">{bid.quantity.toLocaleString()}</span>
                    <span className="text-right text-slate-500">{bid.cumulative.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Recent Trades Ticker */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              {t.recentTrades}
            </h3>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Tape</span>
          </div>

          <div className="text-[11px] font-semibold text-slate-400 grid grid-cols-3 pb-1 border-b border-slate-800/60">
            <span>{t.price} ({currency === 'VND' ? 'VNĐ' : 'USD'})</span>
            <span className="text-right">{t.quantity}</span>
            <span className="text-right">{isVi ? 'Giờ' : 'Time'}</span>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {recentTrades.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 italic">
                {isVi ? 'Chưa có lệnh khớp nào' : 'No trades executed yet'}
              </div>
            ) : (
              recentTrades.slice(0, 15).map((tr) => (
                <div key={tr.id} className="grid grid-cols-3 text-xs font-mono py-1 px-1 border-b border-slate-800/40">
                  <span className="font-bold text-slate-200">{formatCurrency(tr.price, currency)}</span>
                  <span className="text-right text-slate-300">{tr.quantity.toLocaleString()}</span>
                  <span className="text-right text-slate-500 text-[10px]">
                    {new Date(tr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Facility Order & Execution Management Desk */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ListOrdered className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {isVi ? 'Sổ Lệnh & Lịch Sử Giao Dịch Của Nhà Máy' : 'Facility Order & Execution Desk'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isVi ? `Theo dõi các lệnh đang mở, lịch sử đặt và khớp lệnh của ${facility.name}` : `Track open orders, history, and fills for ${facility.name}`}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveOrderTab('open')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeOrderTab === 'open' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{isVi ? 'Lệnh Đang Chờ' : 'Active Orders'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeOrderTab === 'open' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {userOpenOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveOrderTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeOrderTab === 'history' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isVi ? 'Sổ Lệnh Đã Đặt' : 'Order History'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeOrderTab === 'history' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {displayFacilityOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveOrderTab('trades')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeOrderTab === 'trades' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isVi ? 'Khớp Lệnh' : 'Fills Tape'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeOrderTab === 'trades' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {facilityTrades.length}
              </span>
            </button>

            <button
              onClick={() => setActiveOrderTab('otc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeOrderTab === 'otc' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5 text-purple-400" />
              <span>{isVi ? 'Thỏa Thuận P2P' : 'OTC Proposals'}</span>
              {incomingProposals.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white animate-pulse">
                  {incomingProposals.length}
                </span>
              ) : (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeOrderTab === 'otc' ? 'bg-slate-950 text-purple-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {facilityOtcHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Active Open Orders */}
        {activeOrderTab === 'open' && (
          <div className="overflow-x-auto">
            {userOpenOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-slate-600" />
                <span>{isVi ? 'Nhà máy hiện không có lệnh nào đang chờ khớp trên sàn.' : 'No active open orders on the market book.'}</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">{isVi ? 'Hàng hóa' : 'Instrument'}</th>
                    <th className="pb-2.5">{isVi ? 'Vị thế' : 'Side'}</th>
                    <th className="pb-2.5">{isVi ? 'Loại' : 'Type'}</th>
                    <th className="pb-2.5">{isVi ? 'Mức giá' : 'Price'}</th>
                    <th className="pb-2.5">{isVi ? 'Còn lại / Đã đặt' : 'Remaining / Qty'}</th>
                    <th className="pb-2.5">{isVi ? 'Tổng giá trị' : 'Total Value'}</th>
                    <th className="pb-2.5">{isVi ? 'Thời gian' : 'Time'}</th>
                    <th className="pb-2.5 text-right">{isVi ? 'Thao tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {userOpenOrders.map((ord) => {
                    const remQty = ord.remainingQuantity ?? ord.originalQuantity ?? ord.quantity ?? 0;
                    const origQty = ord.originalQuantity ?? ord.quantity ?? remQty;
                    return (
                      <tr key={ord.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 font-bold text-slate-300">
                          {ord.instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')}
                        </td>
                        <td className={`py-2.5 font-bold ${ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ord.side === 'BUY' ? (isVi ? 'MUA' : 'BUY') : (isVi ? 'BÁN' : 'SELL')}
                        </td>
                        <td className="py-2.5 text-slate-400">{ord.type}</td>
                        <td className="py-2.5 text-white font-bold">{formatCurrency(ord.price, currency)}</td>
                        <td className="py-2.5 text-slate-300">
                          {remQty.toLocaleString()} / {origQty.toLocaleString()} t
                        </td>
                        <td className="py-2.5 text-emerald-400 font-bold">
                          {formatCurrency(ord.price * remQty, currency)}
                        </td>
                        <td className="py-2.5 text-slate-500 text-[11px]">
                          {ord.timestamp ? new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onCancelOrder({ facilityId: facility.id, orderId: ord.id, instrument: ord.instrument })}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-sans font-medium transition-all cursor-pointer"
                          >
                            {t.cancel}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: All Placed Orders History */}
        {activeOrderTab === 'history' && (
          <div className="overflow-x-auto">
            {displayFacilityOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                <History className="w-6 h-6 text-slate-600" />
                <span>{isVi ? 'Chưa có lệnh nào được đặt bởi nhà máy trong phiên này.' : 'No orders recorded for this facility yet.'}</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">{isVi ? 'Thời gian' : 'Time'}</th>
                    <th className="pb-2.5">{isVi ? 'Mã lệnh' : 'Order ID'}</th>
                    <th className="pb-2.5">{isVi ? 'Hàng hóa' : 'Instrument'}</th>
                    <th className="pb-2.5">{isVi ? 'Vị thế' : 'Side'}</th>
                    <th className="pb-2.5">{isVi ? 'Mức giá' : 'Price'}</th>
                    <th className="pb-2.5">{isVi ? 'Khớp / Đặt' : 'Filled / Total'}</th>
                    <th className="pb-2.5">{isVi ? 'Tổng giá trị' : 'Total Value'}</th>
                    <th className="pb-2.5 text-right">{isVi ? 'Trạng thái' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {displayFacilityOrders.map((ord) => {
                    const totalQty = ord.originalQuantity ?? ord.quantity ?? 0;
                    const filledQty = ord.filledQuantity ?? (ord.remainingQuantity !== undefined ? totalQty - ord.remainingQuantity : 0);
                    const status = ord.status || (ord.remainingQuantity === 0 ? 'FILLED' : 'OPEN');
                    return (
                      <tr key={ord.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 text-slate-500 text-[11px]">
                          {ord.timestamp ? new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px]">{ord.id?.slice(0, 8)}...</td>
                        <td className="py-2.5 font-bold text-slate-300">
                          {ord.instrument === 'ALLOWANCE' ? 'Hạn ngạch' : 'Tín chỉ'}
                        </td>
                        <td className={`py-2.5 font-bold ${ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ord.side === 'BUY' ? (isVi ? 'MUA' : 'BUY') : (isVi ? 'BÁN' : 'SELL')}
                        </td>
                        <td className="py-2.5 text-white">{formatCurrency(ord.price, currency)}</td>
                        <td className="py-2.5 text-slate-300">
                          {filledQty.toLocaleString()} / {totalQty.toLocaleString()} t
                        </td>
                        <td className="py-2.5 text-slate-400">
                          {formatCurrency(ord.price * totalQty, currency)}
                        </td>
                        <td className="py-2.5 text-right font-sans">
                          {status === 'FILLED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {isVi ? 'Đã Khớp (100%)' : 'Filled'}
                            </span>
                          ) : status === 'PARTIALLY_FILLED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {isVi ? 'Khớp 1 phần' : 'Partial'}
                            </span>
                          ) : status === 'CANCELLED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              {isVi ? 'Đã Hủy' : 'Cancelled'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {isVi ? 'Đang Chờ Khớp' : 'Open'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Execution History Tape */}
        {activeOrderTab === 'trades' && (
          <div className="overflow-x-auto">
            {facilityTrades.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                <FileText className="w-6 h-6 text-slate-600" />
                <span>{isVi ? 'Nhà máy chưa phát sinh giao dịch khớp lệnh nào.' : 'No executed trades yet.'}</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">{isVi ? 'Thời gian' : 'Time'}</th>
                    <th className="pb-2.5">{isVi ? 'Phương thức' : 'Method'}</th>
                    <th className="pb-2.5">{isVi ? 'Vị thế' : 'Role'}</th>
                    <th className="pb-2.5">{isVi ? 'Hàng hóa' : 'Instrument'}</th>
                    <th className="pb-2.5">{isVi ? 'Đơn giá' : 'Price'}</th>
                    <th className="pb-2.5">{isVi ? 'Khối lượng' : 'Volume'}</th>
                    <th className="pb-2.5 text-right">{isVi ? 'Tổng tiền thanh toán' : 'Settled Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {facilityTrades.map((tr, idx) => {
                    const isDirect = tr.isDirect || tr.tradeType === 'DIRECT';
                    const partnerName = tr.role === 'BUY' ? (tr.sellerFacilityName || tr.sellerFacilityId) : (tr.buyerFacilityName || tr.buyerFacilityId);
                    return (
                      <tr key={tr.id || idx} className="hover:bg-slate-950/40">
                        <td className="py-2.5 text-slate-500 text-[11px]">
                          {tr.timestamp ? new Date(tr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="py-2.5">
                          {isDirect ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
                              <HandCoins className="w-3 h-3 text-purple-400" />
                              <span>{isVi ? 'Thỏa thuận trực tiếp' : 'Direct OTC'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                              <Sliders className="w-3 h-3 text-blue-400" />
                              <span>{isVi ? 'Sàn khớp lệnh' : 'Exchange'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 font-bold">
                          <div className={tr.role === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                            {tr.role === 'BUY' ? (isVi ? 'MUA' : 'BUY') : (isVi ? 'BÁN' : 'SELL')}
                          </div>
                          {isDirect && partnerName && (
                            <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                              {tr.role === 'BUY' ? (isVi ? `Từ: ${partnerName}` : `From: ${partnerName}`) : (isVi ? `Cho: ${partnerName}` : `To: ${partnerName}`)}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 font-bold text-slate-300">
                          {tr.instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')}
                        </td>
                        <td className="py-2.5 text-white">{formatCurrency(tr.price, currency)}</td>
                        <td className="py-2.5 text-slate-300 font-bold">{tr.quantity.toLocaleString()} tCO2e</td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">
                          {formatCurrency(tr.totalCost, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 4: OTC Bilateral Proposals History & Pending */}
        {activeOrderTab === 'otc' && (
          <div className="overflow-x-auto">
            {facilityOtcHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                <HandCoins className="w-6 h-6 text-slate-600" />
                <span>{isVi ? 'Nhà máy chưa phát sinh đề xuất thỏa thuận P2P nào.' : 'No OTC proposals recorded for this facility.'}</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">{isVi ? 'Thời gian' : 'Time'}</th>
                    <th className="pb-2.5">{isVi ? 'Đối tác' : 'Partner'}</th>
                    <th className="pb-2.5">{isVi ? 'Chiều giao dịch' : 'Direction'}</th>
                    <th className="pb-2.5">{isVi ? 'Hàng hóa' : 'Instrument'}</th>
                    <th className="pb-2.5">{isVi ? 'Đơn giá' : 'Price'}</th>
                    <th className="pb-2.5">{isVi ? 'Khối lượng' : 'Volume'}</th>
                    <th className="pb-2.5">{isVi ? 'Tổng tiền' : 'Total Amount'}</th>
                    <th className="pb-2.5">{isVi ? 'Trạng thái' : 'Status'}</th>
                    <th className="pb-2.5 text-right">{isVi ? 'Thao tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {facilityOtcHistory.map((prop) => {
                    const isFromMe = prop.fromFacilityId === facility.id;
                    const partnerName = isFromMe ? prop.toFacilityName : prop.fromFacilityName;
                    const partnerId = isFromMe ? prop.toFacilityId : prop.fromFacilityId;
                    const isBusy = proposalProcessingId === prop.id;

                    const myDirection = isFromMe 
                      ? (prop.side === 'BUY' ? 'BUY' : 'SELL')
                      : (prop.side === 'BUY' ? 'SELL' : 'BUY');

                    return (
                      <tr key={prop.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 text-slate-500 text-[11px]">
                          {prop.createdAt ? new Date(prop.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="py-2.5 font-sans font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-400" />
                            <span>{partnerName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">[{partnerId}]</span>
                        </td>
                        <td className="py-2.5 font-bold">
                          <span className={myDirection === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                            {myDirection === 'BUY' ? (isVi ? 'MUA' : 'BUY') : (isVi ? 'BÁN' : 'SELL')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans block font-normal">
                            {isFromMe ? (isVi ? '(Tôi đề nghị)' : '(Outgoing)') : (isVi ? '(Đối tác gửi)' : '(Incoming)')}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-300">
                          {prop.instrument === 'ALLOWANCE' ? (isVi ? 'Hạn ngạch' : 'Allowance') : (isVi ? 'Tín chỉ' : 'Offset')}
                        </td>
                        <td className="py-2.5 text-white">{formatCurrency(prop.price, currency)}</td>
                        <td className="py-2.5 text-slate-300 font-bold">{prop.quantity.toLocaleString()} t</td>
                        <td className="py-2.5 text-emerald-400 font-bold">
                          {formatCurrency(prop.totalCost, currency)}
                        </td>
                        <td className="py-2.5 font-sans">
                          {prop.status === 'ACCEPTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {isVi ? 'Đã Khớp Lệnh' : 'Settled'}
                            </span>
                          ) : prop.status === 'PENDING' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                              {isVi ? 'Chờ Xác Nhận' : 'Pending'}
                            </span>
                          ) : prop.status === 'REJECTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {isVi ? 'Đã Từ Chối' : 'Declined'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              {isVi ? 'Đã Hủy' : 'Cancelled'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-sans">
                          {prop.status === 'PENDING' && !isFromMe && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                disabled={isBusy}
                                onClick={() => handleAcceptProposal(prop.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                              >
                                {isBusy ? '...' : (isVi ? 'Xác nhận' : 'Confirm')}
                              </button>
                              <button
                                disabled={isBusy}
                                onClick={() => handleRejectProposal(prop.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-[10px] transition-all cursor-pointer"
                              >
                                {isVi ? 'Từ chối' : 'Decline'}
                              </button>
                            </div>
                          )}
                          {prop.status === 'PENDING' && isFromMe && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleCancelProposal(prop.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-[10px] transition-all cursor-pointer"
                            >
                              {isBusy ? '...' : (isVi ? 'Hủy đề nghị' : 'Cancel')}
                            </button>
                          )}
                          {prop.status !== 'PENDING' && (
                            <span className="text-slate-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
