import React, { useState, useRef } from 'react';
import { ArrowLeft, Sparkles, Trophy, Gift, RotateCcw, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRIZES = [
  { label: '500 PKR', value: 500, color: '#ec4899' },
  { label: '100 PKR', value: 100, color: '#3b82f6' },
  { label: '2,500 PKR', value: 2500, color: '#8b5cf6' },
  { label: '50 PKR', value: 50, color: '#06b6d4' },
  { label: '5,000 PKR 🏆', value: 5000, color: '#eab308' },
  { label: '200 PKR', value: 200, color: '#10b981' },
  { label: '1,000 PKR', value: 1000, color: '#f97316' },
  { label: '300 PKR', value: 300, color: '#6366f1' }
];

export default function DailyWheelModal({ onBack, user, onUpdateUser }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [hasFreeSpin, setHasFreeSpin] = useState(true);

  const spinWheel = async () => {
    if (isSpinning) return;
    const spinCost = hasFreeSpin ? 0 : 200;

    if (spinCost > 0 && (!user || user.balance < spinCost)) {
      alert('Insufficient balance for 200 PKR spin! Deposit funds to spin.');
      return;
    }

    setIsSpinning(true);
    setWonPrize(null);

    try {
      if (spinCost > 0) {
        await fetch('/api/bets/place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SINGLE',
            matchId: 'wheel_spin',
            matchTitle: '1X-Daily Wheel Spin',
            marketName: 'Lucky Wheel',
            selectionName: 'Wheel Spin',
            odds: 2.0,
            stake: spinCost
          })
        });
        if (onUpdateUser) onUpdateUser();
      }

      // Determine winning index (weighted towards reasonable wins)
      const rand = Math.random();
      let winningIndex = 3; // 50 PKR default
      if (rand < 0.35) winningIndex = 3; // 50 PKR
      else if (rand < 0.65) winningIndex = 1; // 100 PKR
      else if (rand < 0.85) winningIndex = 5; // 200 PKR
      else if (rand < 0.94) winningIndex = 0; // 500 PKR
      else if (rand < 0.98) winningIndex = 6; // 1000 PKR
      else winningIndex = 4; // 5000 PKR Jackpot!

      // Calculate degrees (each slice is 360 / 8 = 45 deg)
      const sliceDeg = 360 / PRIZES.length;
      const extraSpins = 360 * 5; // 5 full rotations
      const targetDeg = extraSpins + (PRIZES.length - 1 - winningIndex) * sliceDeg + sliceDeg / 2;

      setRotation(prev => prev + targetDeg);

      setTimeout(async () => {
        setIsSpinning(false);
        const prize = PRIZES[winningIndex];
        setWonPrize(prize);
        setHasFreeSpin(false);
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

        // Credit wallet
        await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: prize.value,
            method: `Daily Wheel Reward (${prize.label})`
          })
        });
        if (onUpdateUser) onUpdateUser();
      }, 4500);
    } catch (err) {
      alert(err.message);
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-[#080f18] text-white min-h-[680px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#18283a]">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white bg-[#101d2d] px-3.5 py-2 rounded-xl border border-[#1d334a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Casino Lobby</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center justify-center font-bold">
            🎁
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">DAILY LUCKY WHEEL</h2>
            <p className="text-[10px] text-gray-400">Spin the wheel every 24 hours to win up to 5,000 PKR instantly!</p>
          </div>
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Center Wheel Stage */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
        {/* Pointer Triangle */}
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 z-20 -mb-4 drop-shadow-[0_4px_8px_rgba(234,179,8,0.6)]"></div>

        {/* The Wheel */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-8 border-amber-500/80 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden bg-slate-900">
          <div
            className="w-full h-full rounded-full transition-transform duration-[4500ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* 8 Segments */}
            {PRIZES.map((prize, idx) => {
              const rotate = idx * 45;
              return (
                <div
                  key={idx}
                  className="absolute w-full h-full top-0 left-0 flex items-center justify-center origin-center"
                  style={{ transform: `rotate(${rotate}deg)` }}
                >
                  <div
                    className="absolute top-4 font-black font-mono text-xs sm:text-sm text-white drop-shadow-md tracking-wider flex items-center gap-1"
                    style={{ color: prize.color }}
                  >
                    <span>{prize.label}</span>
                  </div>
                </div>
              );
            })}

            {/* Circular spoke dividers */}
            <div className="absolute inset-0 rounded-full border-4 border-amber-400/30 pointer-events-none"></div>
          </div>

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-4 border-[#0a121c] flex items-center justify-center shadow-xl z-10">
            <span className="text-xl font-black text-black">1X</span>
          </div>
        </div>

        {/* Win Notification Banner */}
        {wonPrize && (
          <div className="mt-6 p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-center space-y-1 animate-bounce">
            <div className="text-xs uppercase font-extrabold text-emerald-400">CONGRATULATIONS!</div>
            <div className="text-xl font-black text-white font-mono">
              You won {wonPrize.label}! Credited to your wallet.
            </div>
          </div>
        )}

        {/* Spin Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-2xl text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>
              {isSpinning
                ? 'WHEEL IS SPINNING...'
                : hasFreeSpin
                ? 'FREE DAILY SPIN (0 PKR)'
                : 'SPIN AGAIN (200 PKR)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
