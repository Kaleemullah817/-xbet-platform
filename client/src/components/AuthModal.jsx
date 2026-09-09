import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Phone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  RefreshCw,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  
  // Form fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  
  // OTP fields
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [testOtpHint, setTestOtpHint] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Send OTP Request
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!username.trim() || username.length < 3) {
      setFeedback({ type: 'error', text: 'Username must be at least 3 characters' });
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setFeedback({ type: 'error', text: 'Please enter a valid Pakistani mobile number (e.g. 03001234567)' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address to receive OTP code' });
      return;
    }
    if (!password || password.length < 6) {
      setFeedback({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          phone,
          email,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setTestOtpHint(data.otp);
      setCountdown(600);
      setStep('otp');
      setFeedback({
        type: 'success',
        text: `Verification code sent to ${email}!`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Verify OTP & Create Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setFeedback({ type: 'error', text: 'Please enter the complete 6-digit OTP code' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      setFeedback({ type: 'success', text: 'Email verified! Account successfully created.' });

      localStorage.setItem('xbet_user', JSON.stringify(data.user));

      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!identifier.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your mobile number or username' });
      return;
    }
    if (!password) {
      setFeedback({ type: 'error', text: 'Please enter your password' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setFeedback({ type: 'success', text: data.message });
      localStorage.setItem('xbet_user', JSON.stringify(data.user));

      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 800);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0e1927] border border-[#1f374e] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#182a3c] bg-[#0c1622]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              1X
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-gaming tracking-wide">
                {mode === 'register' 
                  ? (step === 'otp' ? 'EMAIL OTP CONFIRMATION' : 'CREATE BETTING ACCOUNT') 
                  : 'LOGIN TO ACCOUNT'}
              </h3>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 inline" /> Real Money Security Guard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#152435] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Registration vs Login) */}
        {step !== 'otp' && (
          <div className="grid grid-cols-2 p-1.5 bg-[#09111a] border-b border-[#182a3c] gap-1 text-xs font-bold">
            <button
              onClick={() => { setMode('register'); setStep('form'); setFeedback(null); }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Registration
            </button>
            <button
              onClick={() => { setMode('login'); setFeedback(null); }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-[#182b3e] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200' 
                : 'bg-red-950/90 border border-red-500 text-red-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {mode === 'register' ? (
            step === 'form' ? (
              // REGISTRATION FORM
              <form onSubmit={handleSendOtp} className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-300 font-bold block mb-1">Username / Player Name:</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asad_King7"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#091119] border border-[#1f374e] rounded-xl pl-9 pr-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">Mobile Number (EasyPaisa/JazzCash):</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#091119] border border-[#1f374e] rounded-xl pl-9 pr-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1 flex items-center justify-between">
                    <span>Email Address (For Real OTP):</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Required</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#091119] border border-[#1f374e] rounded-xl pl-9 pr-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Password:</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#091119] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Confirm Password:</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#091119] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-[#09111a] rounded-xl border border-cyan-500/20 text-[11px] text-gray-400">
                  🛡️ Click karne par aapke email par **6-digit OTP code** send hoga jisko enter karna lazmi hoga.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-lg shadow-cyan-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Sending Code...' : 'SEND VERIFICATION OTP CODE'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              // OTP VERIFICATION STEP
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-white font-gaming">ENTER 6-DIGIT OTP CODE</h4>
                  <p className="text-gray-400 text-xs">
                    Code has been dispatched to: <strong className="text-cyan-300">{email}</strong>
                  </p>
                </div>

                {/* Monospace 6-digit OTP Input */}
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#080e16] border-2 border-cyan-500/50 focus:border-cyan-400 rounded-2xl py-3.5 text-center text-3xl font-black tracking-[12px] text-emerald-400 font-mono focus:outline-none shadow-inner"
                  />
                </div>

                {/* Expiry Timer & Quick Resend */}
                <div className="flex items-center justify-between text-xs px-1 text-gray-400">
                  <span>Expires in: <strong className="text-amber-400 font-mono font-bold">{formatTimer(countdown)}</strong></span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 540 || isSubmitting}
                    className="text-cyan-400 hover:underline font-bold disabled:opacity-40"
                  >
                    Resend Code
                  </button>
                </div>

                {/* Test Helper Pill */}
                {testOtpHint && (
                  <div className="p-2.5 bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/40 rounded-xl text-center">
                    <span className="text-[11px] text-gray-300 block">System Generated OTP:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono tracking-widest">{testOtpHint}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">(Also visible live in Admin Panel OTP Logs)</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || otpInput.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying OTP...' : 'VERIFY & ACTIVATE ACCOUNT'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('form'); setFeedback(null); }}
                  className="w-full text-center text-xs text-gray-400 hover:text-white pt-1 flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email or Mobile Number</span>
                </button>
              </form>
            )
          ) : (
            // LOGIN FORM
            <form onSubmit={handleLogin} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Mobile Number or Username:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="03001234567 or Player_777"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[#091119] border border-[#1f374e] rounded-xl pl-9 pr-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Password:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#091119] border border-[#1f374e] rounded-xl pl-9 pr-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{isSubmitting ? 'Logging in...' : 'LOGIN TO ACCOUNT'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
