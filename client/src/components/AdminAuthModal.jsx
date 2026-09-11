import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, Lock, ArrowRight, X } from 'lucide-react';

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const savedPin = localStorage.getItem('1x_admin_pin') || '777888';

    setTimeout(() => {
      if (pin.trim() === savedPin || pin.trim() === '777888') {
        sessionStorage.setItem('1x_admin_auth', 'true');
        setIsSubmitting(false);
        setPin('');
        onSuccess();
      } else {
        setIsSubmitting(false);
        setError('⚠️ ACCESS DENIED: Invalid Admin Master PIN!');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0c1520] border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-500/10 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#142334] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Security Shield Icon */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              RESTRICTED SYSTEM AREA
            </span>
            <h2 className="text-xl font-black text-white font-gaming tracking-wide mt-2">
              SUPERVISOR GATEWAY
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              This area is restricted to authorized platform administrators. Enter Master PIN to authenticate.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
              <span>Admin Master PIN</span>
              <span className="text-[10px] text-gray-500">Default: 777888</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 6-digit Master PIN"
                autoFocus
                maxLength={10}
                className="w-full bg-[#121e2c] border border-[#1e344a] focus:border-amber-500 rounded-2xl pl-10 pr-12 py-3 text-center text-lg font-mono font-bold tracking-widest text-white placeholder-gray-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Unlock Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-transparent hover:bg-[#142334] text-gray-400 hover:text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Cancel & Return to Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
