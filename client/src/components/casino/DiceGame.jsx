import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DiceGame({ onBack, user, onUpdateUser }) {
  const [stake, setStake] = useState(200);
  const [targetNumber, setTargetNumber] = useState(50);
  const [rollMode, setRollMode] = useState('OVER'); // 'OVER' | 'UNDER'
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [isWon, setIsWon] = useState(null);
  const [history, setHistory] = useState([74.2, 12.8, 88.5, 41.0, 62.3]);

  // Win chance & multiplier
  const winChance = rollMode === 'OVER' ? 100 - targetNumber : targetNumber;
  const multiplier = Number((98 / winChance).toFixed(2));
  const potentialProfit = Math.round(stake * multiplier);

  const handleRoll = async () => {
    if (isRolling) return;
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    setIsRolling(true);
    setLastRoll(null);
    setIsWon(null);

    try {
      // Deduct stake via wallet
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'dice_game',
          matchTitle: '1X-Dice Roll',
          marketName: `Roll ${rollMode} ${targetNumber}`,
          selectionName: 'Dice Stake',
          odds: multiplier,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      // Roll animation delay
      setTimeout(async () => {
        const result = Number((Math.random() * 100).toFixed(2));
        const won = rollMode === 'OVER' ? result > targetNumber : result < targetNumber;

        setLastRoll(result);
        setIsWon(won);
        setHistory(prev => [result, ...prev.slice(0, 9)]);
        setIsRolling(false);

        if (won) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: potentialProfit,
              method: `Dice Win (${multiplier}x)`
            })
          });
          if (onUpdateUser) onUpdateUser();
        }
      }, 500);
    } catch (err) {
      alert(err.message);
      setIsRolling(false);
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
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold">
            🎲
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-DICE HIGH ROLLER</h2>
            <p className="text-[10px] text-gray-400">Set target, roll over or under, and win up to 98x multiplier!</p>
          </div>
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 bg-[#0c1521] border border-[#182a3d] rounded-2xl p-5 space-y-4 shadow-xl">
          {/* Bet Stake */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 flex justify-between">
              <span>Bet Stake (PKR)</span>
              <span className="text-cyan-400 font-mono">Min: 50 | Max: 50,000</span>
            </label>
            <div className="relative">
              <input
                type="number"
                disabled={isRolling}
                value={stake}
                onChange={(e) => setStake(Math.max(50, Number(e.target.value)))}
                className="w-full bg-[#060c13] border border-[#1b3147] rounded-xl px-3.5 py-2.5 text-white font-black font-mono focus:border-cyan-400 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">PKR</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[100, 250, 500, 1000].map(amt => (
                <button
                  key={amt}
                  disabled={isRolling}
                  onClick={() => setStake(amt)}
                  className="py-1 bg-[#132233] hover:bg-[#1a2f47] text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Roll Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400">Roll Condition:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRollMode('OVER')}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  rollMode === 'OVER'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-[#132233] text-gray-400 hover:text-white'
                }`}
              >
                ROLL OVER &gt; {targetNumber}
              </button>
              <button
                onClick={() => setRollMode('UNDER')}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  rollMode === 'UNDER'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-[#132233] text-gray-400 hover:text-white'
                }`}
              >
                ROLL UNDER &lt; {targetNumber}
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 bg-[#08101a] p-3 rounded-xl border border-[#1a2d42]">
            <div>
              <span className="text-[10px] text-gray-400 block">Win Chance:</span>
              <span className="text-sm font-black font-mono text-cyan-300">{winChance}%</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block">Payout Multiplier:</span>
              <span className="text-sm font-black font-mono text-amber-400">{multiplier}x</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl text-sm shadow-xl shadow-cyan-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isRolling ? 'ROLLING DICE...' : `ROLL DICE (${stake.toLocaleString()} PKR)`}</span>
          </button>

          {/* Recent Rolls */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-gray-400">Roll History:</span>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    h > 50 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Dice Slider & Result Stage */}
        <div className="lg:col-span-8 bg-[#0a131f] border border-[#192b3f] rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl space-y-8 min-h-[380px]">
          {/* Big Result Display */}
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-36 h-36 rounded-3xl border-2 flex items-center justify-center text-4xl font-black font-mono shadow-2xl transition-all ${
              isRolling
                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 animate-spin'
                : isWon === true
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-emerald-500/30 scale-105'
                : isWon === false
                ? 'border-red-500 bg-red-950/60 text-red-300 shadow-red-500/30'
                : 'border-[#223952] bg-[#0c1622] text-gray-400'
            }`}>
              {isRolling ? '🎲' : lastRoll !== null ? lastRoll : '50.00'}
            </div>

            <div className="text-center">
              {isWon === true && (
                <span className="text-emerald-400 font-bold text-sm animate-bounce">
                  🎉 WON {potentialProfit.toLocaleString()} PKR ({multiplier}x)!
                </span>
              )}
              {isWon === false && (
                <span className="text-red-400 font-bold text-sm">
                  Missed target! Try again.
                </span>
              )}
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="w-full max-w-lg space-y-3 px-4">
            <div className="flex justify-between text-xs font-mono font-bold text-gray-400">
              <span>0</span>
              <span className="text-white bg-[#142333] px-3 py-1 rounded-lg border border-[#1e344e]">
                Target: {targetNumber}
              </span>
              <span>100</span>
            </div>

            <input
              type="range"
              min="2"
              max="98"
              value={targetNumber}
              onChange={(e) => setTargetNumber(Number(e.target.value))}
              disabled={isRolling}
              className="w-full h-3 bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-500 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
