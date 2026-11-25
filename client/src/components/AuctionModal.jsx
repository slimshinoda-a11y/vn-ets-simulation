import React, { useState } from 'react';
import { Gavel, Clock, X, AlertCircle, CheckCircle2, Coins, Sparkles } from 'lucide-react';
import { formatCurrency } from '../i18n';

export default function AuctionModal({ facility, auction, onClose, onSubmitAuctionBid, lang = 'vi', currency = 'USD' }) {
  const isVi = lang === 'vi';
  const [price, setPrice] = useState(auction?.reservePrice ? (auction.reservePrice + 2).toFixed(2) : '27.00');
  const [quantity, setQuantity] = useState('5000');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const totalCost = (Number(price) || 0) * (Number(quantity) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    const p = parseFloat(price);
    const q = parseInt(quantity, 10);

    if (p < auction.reservePrice) {
      setFeedback({ 
        type: 'error', 
        text: isVi 
          ? `Mức giá bỏ thầu tối thiểu phải bằng giá sàn (${formatCurrency(auction.reservePrice, currency, false, lang)})` 
          : `Bid price must be at or above reserve price (${formatCurrency(auction.reservePrice, currency, false, lang)})` 
      });
      return;
    }

    if (facility.cash < totalCost) {
      setFeedback({ 
        type: 'error', 
        text: isVi 
          ? `Số dư không đủ: Yêu cầu ${formatCurrency(totalCost, currency, false, lang)}, hiện có ${formatCurrency(facility.cash, currency, false, lang)}` 
          : `Insufficient funds: Bid requires ${formatCurrency(totalCost, currency, false, lang)}, available: ${formatCurrency(facility.cash, currency, false, lang)}` 
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitAuctionBid({
        facilityId: facility.id,
        price: p,
        quantity: q
      });
      setFeedback({ type: 'success', text: 'Auction bid submitted successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const existingBid = auction?.bids?.find(b => b.facilityId === facility.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Government Primary Auction</h2>
              <p className="text-xs text-slate-400">Competitive Uniform Clearing Price Mechanism</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auction Parameters Info */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">{isVi ? 'Tổng Chào Bán' : 'Total Offered'}</span>
            <span className="font-mono font-bold text-white">{auction.totalOffered.toLocaleString()} t</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">{isVi ? 'Giá Sàn Đấu Giá' : 'Reserve Floor'}</span>
            <span className="font-mono font-bold text-amber-400">{formatCurrency(auction.reservePrice, currency, false, lang)}/t</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">{isVi ? 'Thời Gian Còn Lại' : 'Auction Clock'}</span>
            <span className="font-mono font-bold text-rose-400">{auction.timeRemaining}s {isVi ? 'còn lại' : 'remaining'}</span>
          </div>
        </div>

        {existingBid && (
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
            <strong>{isVi ? 'Lệnh Đang Đặt:' : 'Active Bid:'}</strong> {isVi ? 'Bạn đang đặt' : 'You currently have a bid of'} {existingBid.quantity.toLocaleString()} {isVi ? 'hạn ngạch @' : 'units @'} {formatCurrency(existingBid.price, currency, false, lang)}/t.
          </div>
        )}

        {/* Bid Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isVi ? `Giá Bỏ Thầu (${currency === 'VND' ? 'VNĐ' : '$'}/tCO2e)` : 'Your Bid Price ($/tCO2e)'}
            </label>
            <input
              type="number"
              step="any"
              min={auction.reservePrice}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">{isVi ? 'Tối thiểu phải đạt' : 'Must be at least'} {formatCurrency(auction.reservePrice, currency, false, lang)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quantity to Bid For (Allowances)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max={auction.totalOffered}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs flex justify-between text-slate-300">
            <span>Max Capital Commitment:</span>
            <span className="font-mono font-bold text-white">${totalCost.toLocaleString()}</span>
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
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
          >
            {submitting ? 'Placing Bid...' : 'Submit Sealed Bid'}
          </button>
        </form>

      </div>
    </div>
  );
}
