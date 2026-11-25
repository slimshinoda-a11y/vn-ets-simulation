import React, { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkey.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.token || passkey.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Subtle accent glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Regulator Authentication</h2>
              <p className="text-xs text-slate-400">ETS Regulatory Commission / Admin Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Separate Admin Authorization</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Covered facilities are restricted to their facility console and the market board. Logging in as Administrator grants access to configure ETS parameters, correction factors, and round settlements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Passkey / Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoFocus
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter admin passkey (default: admin123)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Default simulation passkey: <code className="text-purple-300">admin123</code></span>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !passkey}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Unlock Admin Console'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
