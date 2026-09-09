import React, { useState, useEffect, useRef } from 'react';
import { Plane, Zap, Award, AlertTriangle, ShieldCheck, History, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CrashGame({ crashState, user, onUpdateUser }) {
  const [betAmount, setBetAmount] = useState('500');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [myCrashBet, setMyCrashBet] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const canvasRef = useRef(null);

  // Monitor round changes
  useEffect(() => {
    if (crashState.status === 'STARTING') {
      // Clear previous bet when new round countdown begins
      if (myCrashBet && (myCrashBet.cashedOut || crashState.status === 'STARTING')) {
        setMyCrashBet(null);
      }
    } else if (crashState.status === 'CRASHED') {
      if (myCrashBet && !myCrashBet.cashedOut) {
        setStatusMessage({ type: 'lost', text: `Plane flew away! Lost ${myCrashBet.amount} PKR` });
      }
    }
  }, [crashState.status]);

  // Handle Place Bet
  const handlePlaceBet = async () => {
    setStatusMessage(null);
    const amount = parseFloat(betAmount);
    if (!amount || amount < 10) {
      setStatusMessage({ type: 'error', text: 'Min stake is 10 PKR' });
      return;
    }
    if (amount > user.balance) {
      setStatusMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    try {
      const res = await fetch('/api/crash/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place bet');

      setMyCrashBet(data.bet);
      setStatusMessage({ type: 'info', text: `Bet placed for ${amount} PKR. Ready for takeoff!` });
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Handle Cash Out
  const handleCashOut = async () => {
    if (!myCrashBet || myCrashBet.cashedOut) return;

    try {
      const res = await fetch('/api/crash/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId: myCrashBet.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cashout');

      setMyCrashBet({ ...myCrashBet, cashedOut: true, cashoutMultiplier: data.bet.cashoutMultiplier });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setStatusMessage({ type: 'won', text: `Cashed out at ${data.bet.cashoutMultiplier}x! Won +${data.payout} PKR!` });
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Auto cashout listener during flight
  useEffect(() => {
    if (crashState.status === 'FLYING' && myCrashBet && !myCrashBet.cashedOut) {
      const target = parseFloat(autoCashout);
      if (target && crashState.multiplier >= target) {
        handleCashOut();
      }
    }
  }, [crashState.multiplier, crashState.status]);

  // Canvas drawing for flight path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (crashState.status === 'FLYING' || crashState.status === 'CRASHED') {
      const m = Math.min(crashState.multiplier, 15);
      const progress = Math.min(1, (m - 1.0) / 7.0);
      
      const startX = 40;
      const startY = height - 40;
      const endX = startX + (width - 120) * progress;
      const endY = startY - (height - 100) * Math.pow(progress, 0.85);

      // Draw curved flight trajectory
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (endX - startX) * 0.4, startY, endX, endY);
      ctx.strokeStyle = crashState.status === 'CRASHED' ? '#ef4444' : '#00e676';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw glowing gradient fill under curve
      const gradient = ctx.createLinearGradient(0, endY, 0, startY);
      if (crashState.status === 'CRASHED') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 230, 118, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');
      }
      ctx.lineTo(endX, startY);
      ctx.lineTo(startX, startY);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Plane Icon at end position
      ctx.save();
      ctx.translate(endX, endY);
      ctx.fillStyle = crashState.status === 'CRASHED' ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [crashState.multiplier, crashState.status]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Top Header & History Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#101c2a] p-3.5 rounded-2xl border border-[#1b2f44]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white font-gaming tracking-wide flex items-center gap-2">
              AVIATOR CRASH <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black">PROVABLY FAIR</span>
            </h2>
            <p className="text-[11px] text-gray-400">Cash out before the jet crashes to multiply your stake!</p>
          </div>
        </div>

        {/* Multiplier History Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <History className="w-4 h-4 text-gray-500 shrink-0 mr-1" />
          {crashState.history?.slice(0, 8).map((h, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-lg text-xs font-black font-gaming shrink-0 border ${
                h >= 10
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                  : h >= 2.0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>

      {/* Main Game Stage + Live Bets Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[420px]">
        {/* Left Flight Canvas Arena */}
        <div className="lg:col-span-8 bg-[#091017] rounded-2xl border border-[#1a2c3e] relative flex flex-col items-center justify-center overflow-hidden min-h-[360px] shadow-2xl">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Central Multiplier Display */}
          <div className="z-10 text-center select-none flex flex-col items-center">
            {crashState.status === 'STARTING' && (
              <div className="space-y-2 animate-bounce">
                <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                  <Plane className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="text-xl font-extrabold text-gray-200 uppercase font-gaming tracking-wider">
                  Next round starts in
                </div>
                <div className="text-4xl font-black text-cyan-400 font-gaming">
                  {crashState.countdown}s
                </div>
              </div>
            )}

            {crashState.status === 'FLYING' && (
              <div className="space-y-1">
                <div className="text-6xl md:text-8xl font-black tracking-tight text-white font-gaming drop-shadow-[0_0_25px_rgba(0,230,118,0.4)]">
                  {crashState.multiplier?.toFixed(2)}<span className="text-emerald-400">x</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold animate-pulse">
                  ✈️ Flying Away...
                </p>
              </div>
            )}

            {crashState.status === 'CRASHED' && (
              <div className="space-y-2 animate-pulse">
                <div className="text-2xl font-black text-red-500 uppercase tracking-widest font-gaming">
                  FLEW AWAY!
                </div>
                <div className="text-6xl md:text-7xl font-black text-red-500 font-gaming drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">
                  {crashState.multiplier?.toFixed(2)}x
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Players Table */}
        <div className="lg:col-span-4 bg-[#0d1622] rounded-2xl border border-[#1a2b3d] flex flex-col p-3 shadow-xl max-h-[460px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#182737] mb-2 px-1">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
              <Zap className="w-3.5 h-3.5 text-yellow-400 mr-1.5" /> All Bets ({crashState.activeBets?.length || 0})
            </span>
            <span className="text-[11px] text-gray-400">Round #{crashState.roundId}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {crashState.activeBets?.map((bet, i) => (
              <div
                key={bet.id || i}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                  bet.isUser 
                    ? 'bg-cyan-950/40 border border-cyan-500/40' 
                    : bet.cashedOut
                    ? 'bg-emerald-950/30 border border-emerald-500/20'
                    : 'bg-[#121f2e]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    bet.isUser ? 'bg-cyan-500 text-black' : 'bg-[#1d3147] text-gray-300'
                  }`}>
                    {bet.user[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold truncate max-w-[90px] ${bet.isUser ? 'text-cyan-300' : 'text-gray-200'}`}>
                      {bet.user}
                    </span>
                    <span className="text-[10px] text-gray-400">{bet.amount} PKR</span>
                  </div>
                </div>

                {bet.cashedOut ? (
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-400 font-gaming bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                      {bet.cashoutMultiplier?.toFixed(2)}x
                    </span>
                    <span className="block text-[10px] text-emerald-300 font-semibold mt-0.5">
                      +{(bet.amount * bet.cashoutMultiplier).toFixed(0)} PKR
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-500 italic">In Flight...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Control Panel (Betting bar) */}
      <div className="bg-[#101c2a] rounded-2xl border border-[#1c3046] p-4 shadow-xl">
        {statusMessage && (
          <div className={`mb-3 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'won'
              ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-200'
              : statusMessage.type === 'lost'
              ? 'bg-red-950/90 border border-red-500/60 text-red-200'
              : statusMessage.type === 'error'
              ? 'bg-red-950/90 border border-red-500/60 text-red-200'
              : 'bg-cyan-950/90 border border-cyan-500/60 text-cyan-200'
          }`}>
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Bet Stake Input + Presets */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">Bet Amount (PKR):</span>
              <span className="text-gray-400">Available: <strong className="text-white">{user?.balance?.toLocaleString()} PKR</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={crashState.status === 'FLYING' && myCrashBet && !myCrashBet.cashedOut}
                className="flex-1 bg-[#091017] border border-[#20344a] rounded-xl px-4 py-2.5 text-base font-extrabold text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="flex space-x-1">
                {['200', '500', '1000', '2500'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className="px-2.5 py-2.5 bg-[#172738] hover:bg-[#1f354d] text-xs font-bold text-gray-300 rounded-xl transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto Cashout Setting */}
          <div className="md:col-span-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">Auto Cashout:</span>
              <span className="text-cyan-400 font-bold font-gaming">{autoCashout}x</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                placeholder="2.00"
                className="w-full bg-[#091017] border border-[#20344a] rounded-xl px-4 py-2.5 text-base font-extrabold text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute right-4 top-3 text-sm text-gray-500 font-bold">x</span>
            </div>
          </div>

          {/* Big Action Button (BET or CASHOUT) */}
          <div className="md:col-span-4">
            {crashState.status === 'FLYING' && myCrashBet && !myCrashBet.cashedOut ? (
              <button
                onClick={handleCashOut}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-lg rounded-2xl shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex flex-col items-center justify-center animate-pulse"
              >
                <span>CASH OUT</span>
                <span className="text-sm font-extrabold font-gaming">
                  {(myCrashBet.amount * crashState.multiplier).toFixed(0)} PKR ({crashState.multiplier.toFixed(2)}x)
                </span>
              </button>
            ) : (
              <button
                onClick={handlePlaceBet}
                disabled={crashState.status !== 'STARTING' || (myCrashBet && !myCrashBet.cashedOut)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Plane className="w-5 h-5" />
                <span>
                  {myCrashBet && !myCrashBet.cashedOut
                    ? 'BET ACCEPTED (WAITING)'
                    : crashState.status === 'STARTING'
                    ? `BET ${betAmount} PKR`
                    : 'WAIT FOR NEXT ROUND'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
