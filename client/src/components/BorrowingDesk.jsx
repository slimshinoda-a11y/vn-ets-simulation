import React, { useState } from 'react';
import { 
  HandCoins, 
  Landmark, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RotateCcw, 
  Clock, 
  Percent, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { translations, formatCurrency } from '../i18n';

export default function BorrowingDesk({
  facility,
  parameters = {},
  onExecuteBorrowing,
  onRepayBorrowing,
  lang = 'vi',
  currency = 'USD'
}) {
  const isVi = lang === 'vi';
  const t = translations[lang] || translations.vi;

  const isAllowed = Boolean(parameters?.borrowingAllowed);
  const borrowLimit = parameters?.borrowingLimit != null ? parameters.borrowingLimit : 15;
  const interestRate = parameters?.borrowingInterestRate != null ? Number(parameters.borrowingInterestRate) : 1.0;
  const interestPercent = Math.round((interestRate - 1) * 100);

  // Current period allocation as base for borrowing limit
  const currentPeriodAllocation = facility?.allocatedAllowances || (
    (parameters?.isImported && facility?.importedAllowance != null)
      ? facility.importedAllowance
      : (facility?.baselineEmissions || 0)
  );

  const maxBorrowable = isAllowed ? Math.floor(currentPeriodAllocation * (borrowLimit / 100)) : 0;
  const alreadyBorrowed = facility?.borrowedThisPeriod || 0;
  const remainingBorrowable = Math.max(0, maxBorrowable - alreadyBorrowed);
  const totalDebt = facility?.borrowedUnits || 0;
  const availableAllowances = facility?.allowances || 0;

  // Form states
  const [borrowInput, setBorrowInput] = useState(0);
  const [repayInput, setRepayInput] = useState(0);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [borrowMsg, setBorrowMsg] = useState(null);
  const [repayMsg, setRepayMsg] = useState(null);

  const estimatedDeductionNextPeriod = Math.round(borrowInput * interestRate);
  const estimatedInterestPenaltyTons = estimatedDeductionNextPeriod - borrowInput;

  const handleBorrowSubmit = async (e) => {
    e?.preventDefault();
    setBorrowMsg(null);
    if (!isAllowed) {
      setBorrowMsg({ type: 'error', text: isVi ? 'Cơ chế vay mượn đang bị tắt bởi Ban Quản Trị.' : 'Borrowing is disabled by the regulator.' });
      return;
    }
    if (borrowInput <= 0) {
      setBorrowMsg({ type: 'error', text: isVi ? 'Vui lòng nhập số lượng hạn ngạch lớn hơn 0.' : 'Please enter an amount greater than 0.' });
      return;
    }
    if (borrowInput > remainingBorrowable) {
      setBorrowMsg({ type: 'error', text: isVi ? `Vượt quá hạn mức còn lại (${remainingBorrowable.toLocaleString()} tCO2e).` : `Exceeds remaining limit (${remainingBorrowable.toLocaleString()} tCO2e).` });
      return;
    }

    setIsBorrowing(true);
    try {
      if (onExecuteBorrowing) {
        await onExecuteBorrowing(facility.id, borrowInput);
      }
      setBorrowMsg({ 
        type: 'success', 
        text: isVi 
          ? `Vay thành công ${borrowInput.toLocaleString()} tCO2e! Hạn ngạch đã được cộng ngay vào tài khoản của cơ sở.` 
          : `Successfully borrowed ${borrowInput.toLocaleString()} tCO2e! Allowances credited to your holding.` 
      });
      setBorrowInput(0);
    } catch (err) {
      setBorrowMsg({ type: 'error', text: err.message });
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleRepaySubmit = async (e) => {
    e?.preventDefault();
    setRepayMsg(null);
    if (repayInput <= 0) {
      setRepayMsg({ type: 'error', text: isVi ? 'Vui lòng nhập số lượng hoàn trả lớn hơn 0.' : 'Please enter an amount greater than 0.' });
      return;
    }
    if (repayInput > availableAllowances) {
      setRepayMsg({ type: 'error', text: isVi ? 'Bạn không đủ số dư hạn ngạch để hoàn trả.' : 'Insufficient allowances available to repay.' });
      return;
    }
    if (repayInput > totalDebt) {
      setRepayMsg({ type: 'error', text: isVi ? `Số lượng hoàn trả vượt quá tổng dư nợ hiện tại (${totalDebt.toLocaleString()} tCO2e).` : `Exceeds current total debt (${totalDebt.toLocaleString()} tCO2e).` });
      return;
    }

    setIsRepaying(true);
    try {
      if (onRepayBorrowing) {
        await onRepayBorrowing(facility.id, repayInput);
      }
      setRepayMsg({ 
        type: 'success', 
        text: isVi 
          ? `Đã hoàn trả sớm ${repayInput.toLocaleString()} tCO2e dư nợ vay thành công!` 
          : `Successfully repaid ${repayInput.toLocaleString()} tCO2e borrowed debt early!` 
      });
      setRepayInput(0);
    } catch (err) {
      setRepayMsg({ type: 'error', text: err.message });
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Landmark className="w-4 h-4" />
              <span>{isVi ? 'Cơ Chế Linh Hoạt ETS • Vay Mượn Hạn Ngạch' : 'ETS Flexibility Mechanism • Allowance Borrowing'}</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {isVi ? 'Bàn Vay Mượn Hạn Ngạch (Borrowing Desk)' : 'Allowance Borrowing Desk'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              {isVi 
                ? `Cho phép cơ sở tạm thời thiếu hụt vay trước hạn ngạch tính theo tỷ lệ phân bổ của kỳ này (${borrowLimit}%), giúp giảm áp lực tiền phạt và tăng tính thanh khoản (khấu trừ kèm lãi phạt ở kỳ kế tiếp).` 
                : `Enables facilities facing temporary deficits to borrow allowances based on this period's allocation (${borrowLimit}%), mitigating compliance penalties and enhancing cash-flow flexibility.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 font-mono ${
              isAllowed 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-amber-400 animate-ping' : 'bg-rose-400'}`}></span>
              {isAllowed 
                ? (isVi ? 'Cơ Chế Vay Đang Mở' : 'Borrowing Active') 
                : (isVi ? 'Đang Tắt Bởi Ban Quản Trị' : 'Disabled by Regulator')}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Current Period Allocation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{isVi ? 'Hạn Ngạch Phân Bổ Kỳ Này' : 'Current Period Allocation'}</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {currentPeriodAllocation.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">tCO2e</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isVi ? 'Căn cứ tính hạn mức vay mượn trong kỳ này' : 'Base for current period borrowing limit'}
          </p>
        </div>

        {/* Card 2: Max Borrowable Limit */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{isVi ? 'Hạn Mức Vay Tối Đa' : 'Max Borrowing Cap'}</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {maxBorrowable.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">tCO2e</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{isVi ? 'Trần tỷ lệ chính phủ:' : 'Policy ceiling:'}</span>
            <strong className="text-amber-300 font-mono">{borrowLimit}%</strong>
          </div>
        </div>

        {/* Card 3: Already Borrowed & Remaining */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{isVi ? 'Hạn Mức Còn Được Vay' : 'Remaining Borrowable'}</span>
            <HandCoins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {remainingBorrowable.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">tCO2e</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{isVi ? 'Đã vay trong kỳ:' : 'Borrowed this cycle:'}</span>
            <strong className="text-slate-200 font-mono">{alreadyBorrowed.toLocaleString()} t</strong>
          </div>
        </div>

        {/* Card 4: Outstanding Debt */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{isVi ? 'Tổng Dư Nợ Phải Khấu Trừ' : 'Total Outstanding Debt'}</span>
            <Coins className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {totalDebt.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">tCO2e</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{isVi ? 'Lãi suất phạt vay:' : 'Interest penalty:'}</span>
            <strong className="text-rose-300 font-mono">{interestRate}x {interestPercent > 0 ? `(+${interestPercent}%)` : `(${isVi ? '0% lãi phạt' : 'No penalty'})`}</strong>
          </div>
        </div>

      </div>

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Borrowing Form & Calculator (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-amber-400" />
                <span>{isVi ? 'Đăng Ký Vay Trước Hạn Ngạch' : 'Borrow Allowances Against Future Allocation'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi 
                  ? 'Hạn ngạch vay sẽ được cộng ngay lập tức vào số dư để giao dịch hoặc lưu trữ.' 
                  : 'Borrowed units will be credited immediately to your holding balance.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">{isVi ? 'Hạn ngạch hiện có:' : 'Current holding:'}</span>
              <strong className="text-sm font-mono text-emerald-400">{availableAllowances.toLocaleString()} tCO2e</strong>
            </div>
          </div>

          {!isAllowed ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-400/60 mx-auto" />
              <div className="text-sm font-bold text-slate-300">
                {isVi ? 'Cơ Chế Vay Mượn Đang Tắt' : 'Borrowing Currently Disabled'}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isVi 
                  ? 'Ban quản trị (Admin) chưa bật tính năng vay mượn hạn ngạch cho kỳ này. Vui lòng liên hệ Admin nếu muốn kích hoạt linh hoạt vay mượn.' 
                  : 'The regulatory authority has disabled allowance borrowing for this compliance phase.'}
              </p>
            </div>
          ) : remainingBorrowable <= 0 ? (
            <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-amber-300">
                {isVi ? 'Đã Hết Hạn Mức Vay Trong Kỳ Này' : 'Borrowing Limit Reached'}
              </div>
              <p className="text-xs text-slate-400">
                {isVi 
                  ? `Bạn đã vay đủ ${alreadyBorrowed.toLocaleString()} tCO2e (tối đa ${borrowLimit}% của kỳ sau).` 
                  : `You have exhausted the ${borrowLimit}% cap (${alreadyBorrowed.toLocaleString()} tCO2e).`}
              </p>
            </div>
          ) : (
            <form onSubmit={handleBorrowSubmit} className="space-y-6">
              
              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <label htmlFor="borrowAmount">{isVi ? 'Số Lượng Hạn Ngạch Muốn Vay (tCO2e):' : 'Borrow Quantity (tCO2e):'}</label>
                  <span className="text-slate-400">
                    {isVi ? 'Tối đa:' : 'Max:'} <strong className="text-amber-400 font-mono">{remainingBorrowable.toLocaleString()}</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="borrowAmount"
                    type="number"
                    min="0"
                    max={remainingBorrowable}
                    value={borrowInput || ''}
                    onChange={(e) => setBorrowInput(Math.min(remainingBorrowable, Math.max(0, Number(e.target.value))))}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-xl font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-700"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                    tCO2e
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max={remainingBorrowable}
                  value={borrowInput}
                  onChange={(e) => setBorrowInput(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />

                {/* Quick percentage buttons */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[25, 50, 75, 100].map(pct => {
                    const val = Math.floor(remainingBorrowable * (pct / 100));
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setBorrowInput(val)}
                        className="py-1.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-amber-950/30 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        {pct}% ({val.toLocaleString()})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Calculation Breakdown Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold block pb-1 border-b border-slate-800">
                  {isVi ? 'Bảng Tính Chi Tiết Vay Mượn:' : 'Borrowing Breakdown Calculator:'}
                </span>

                <div className="flex items-center justify-between text-slate-300">
                  <span>{isVi ? 'Hạn ngạch nhận ngay vào tài khoản:' : 'Allowances credited now:'}</span>
                  <strong className="text-emerald-400 font-bold">+{borrowInput.toLocaleString()} tCO2e</strong>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>{isVi ? 'Hệ số hoàn trả vay:' : 'Repayment multiplier:'}</span>
                  <span className="text-amber-300 font-bold">{interestRate}x {interestPercent > 0 ? `(+${interestPercent}%)` : `(${isVi ? 'Tỷ lệ 1:1, không lãi phạt' : '1:1 ratio, no penalty'})`}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>{isVi ? 'Lãi phạt vay phát sinh:' : 'Interest penalty tons:'}</span>
                  <span className="text-rose-400 font-semibold">+{estimatedInterestPenaltyTons.toLocaleString()} tCO2e</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm">
                  <span className="font-sans font-bold text-white">{isVi ? 'Tổng khấu trừ ở kỳ sau:' : 'Total deducted next period:'}</span>
                  <strong className="text-rose-400 font-bold">-{estimatedDeductionNextPeriod.toLocaleString()} tCO2e</strong>
                </div>
              </div>

              {/* Feedback messages */}
              {borrowMsg && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  borrowMsg.type === 'success' 
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                }`}>
                  {borrowMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{borrowMsg.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isBorrowing || borrowInput <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-lg shadow-amber-600/20 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isBorrowing ? (
                  <span>{isVi ? 'Đang Thực Hiện Vay...' : 'Processing Borrowing...'}</span>
                ) : (
                  <>
                    <HandCoins className="w-5 h-5 text-slate-950" />
                    <span>{isVi ? `Xác Nhận Vay ${borrowInput.toLocaleString()} tCO2e` : `Confirm Borrow ${borrowInput.toLocaleString()} tCO2e`}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Early Repayment & Rules Guide (1 Col) */}
        <div className="space-y-6">
          
          {/* Early Repayment Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">
                {isVi ? 'Hoàn Trả Nợ Vay Sớm' : 'Early Debt Repayment'}
              </h4>
            </div>

            {totalDebt <= 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400/70 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">{isVi ? 'Không Có Dư Nợ' : 'Zero Debt'}</p>
                <p className="text-[11px] text-slate-500">{isVi ? 'Cơ sở hiện không có khoản nợ vay nào.' : 'Facility has no outstanding borrowing debt.'}</p>
              </div>
            ) : (
              <form onSubmit={handleRepaySubmit} className="space-y-4 text-xs">
                <p className="text-slate-400">
                  {isVi 
                    ? `Dùng hạn ngạch hiện có (${availableAllowances.toLocaleString()} tCO2e) để trả bớt ${totalDebt.toLocaleString()} tCO2e nợ vay.` 
                    : `Use holdings (${availableAllowances.toLocaleString()} t) to pay down ${totalDebt.toLocaleString()} t debt.`}
                </p>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{isVi ? 'Số lượng trả:' : 'Repay amount:'}</span>
                    <button
                      type="button"
                      onClick={() => setRepayInput(Math.min(availableAllowances, totalDebt))}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      {isVi ? 'Trả tối đa' : 'Pay Max'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={Math.min(availableAllowances, totalDebt)}
                    value={repayInput || ''}
                    onChange={(e) => setRepayInput(Math.min(Math.min(availableAllowances, totalDebt), Math.max(0, Number(e.target.value))))}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {repayMsg && (
                  <div className={`p-2.5 rounded-lg text-[11px] ${
                    repayMsg.type === 'success' ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'
                  }`}>
                    {repayMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRepaying || repayInput <= 0}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer border border-slate-700"
                >
                  {isRepaying ? (isVi ? 'Đang Xử Lý...' : 'Processing...') : (isVi ? 'Hoàn Trả Nợ Vay' : 'Repay Debt')}
                </button>
              </form>
            )}
          </div>

          {/* Policy Knowledge Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-300 font-bold">
              <Info className="w-4 h-4 text-blue-400" />
              <span>{isVi ? 'Quy Định Vay Mượn Hạn Ngạch' : 'Borrowing Regulations'}</span>
            </div>

            <ul className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  {isVi 
                    ? `Hạn mức trần hiện tại: Tối đa ${borrowLimit}% hạn ngạch phân bổ trong kỳ này.` 
                    : `Borrowing ceiling: Capped at ${borrowLimit}% of this period's allocation.`}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  {isVi 
                    ? `Lãi suất phạt hoàn trả: ${interestRate}x (+${interestPercent}%). Nhằm khuyến khích doanh nghiệp ưu tiên giảm phát thải hoặc mua trên sàn.` 
                    : `Repayment penalty: ${interestRate}x (+${interestPercent}%) to prevent moral hazard.`}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  {isVi 
                    ? 'Tự động khấu trừ: Khi chuyển kỳ, hệ thống sẽ tự động trừ thẳng phần nợ này từ lượng hạn ngạch cấp mới.' 
                    : 'Automatic deduction: Debt will be deducted automatically from the new allocation next cycle.'}
                </span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
