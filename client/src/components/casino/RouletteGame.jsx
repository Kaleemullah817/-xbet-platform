import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function RouletteGame({ onBack, user, onUpdateUser }) {
  const [stake, setStake] = useState(200);
  const [selectedBet, setSelectedBet] = useState('RED'); // 'RED', 'BLACK', 'EVEN', 'ODD', '1-18', '19-36', or number
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [lastWin, setLastWin] = useState(null);
  const [history, setHistory] = useState([7, 14, 0, 32, 19]);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    setIsSpinning(true);
    setWinningNumber(null);
    setLastWin(null);

    try {
      // Deduct stake via wallet
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'roulette_euro',
          matchTitle: '1X-European Roulette',
          marketName: 'Roulette Market',
          selectionName: `Bet on ${selectedBet}`,
          odds: 2.0,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      // Spin delay
      setTimeout(async () => {
        const outcome = Math.floor(Math.random() * 37); // 0 to 36
        setWinningNumber(outcome);
        setHistory(prev => [outcome, ...prev.slice(0, 9)]);
        setIsSpinning(false);

        // Check win condition
        const isRed = RED_NUMBERS.includes(outcome);
        const isBlack = outcome !== 0 && !isRed;
        const isEven = outcome !== 0 && outcome % 2 === 0;
        const isOdd = outcome !== 0 && outcome % 2 !== 0;
        const isLow = outcome >= 1 && outcome <= 18;
        const isHigh = outcome >= 19 && outcome <= 36;

        let won = false;
        let payoutMult = 0;

        if (selectedBet === 'RED' && isRed) { won = true; payoutMult = 2; }
        else if (selectedBet === 'BLACK' && isBlack) { won = true; payoutMult = 2; }
        else if (selectedBet === 'EVEN' && isEven) { won = true; payoutMult = 2; }
        else if (selectedBet === 'ODD' && isOdd) { won = true; payoutMult = 2; }
        else if (selectedBet === '1-18' && isLow) { won = true; payoutMult = 2; }
        else if (selectedBet === '19-36' && isHigh) { won = true; payoutMult = 2; }
        else if (selectedBet === outcome) { won = true; payoutMult = 36; }

        if (won) {
          const winAmount = Math.round(stake * payoutMult);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          setLastWin({ won: true, amount: winAmount, mult: payoutMult });

          await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: winAmount,
              method: `Roulette Win (${selectedBet} - ${outcome})`
            })
          });
          if (onUpdateUser) onUpdateUser();
        } else {
          setLastWin({ won: false, amount: 0 });
        }
      }, 2000);
    } catch (err) {
      alert(err.message);
      setIsSpinning(false);
    }
  };

  const getNumberColor = (num) => {
    if (num === 0) return 'bg-emerald-600 text-white';
    if (RED_NUMBERS.includes(num)) return 'bg-red-600 text-white';
    return 'bg-gray-900 text-white border border-gray-700';
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
          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold">
            🎡
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-EUROPEAN ROULETTE</h2>
            <p className="text-[10px] text-gray-400">Bet on Red/Black, Even/Odd, or single lucky numbers up to 36x payout!</p>
          </div>
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left Controls */}
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
                disabled={isSpinning}
                value={stake}
                onChange={(e) => setStake(Math.max(50, Number(e.target.value)))}
                className="w-full bg-[#060c13] border border-[#1b3147] rounded-xl px-3.5 py-2.5 text-white font-black font-mono focus:border-cyan-400 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">PKR</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[100, 200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  disabled={isSpinning}
                  onClick={() => setStake(amt)}
                  className="py-1 bg-[#132233] hover:bg-[#1a2f47] text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Bet Indicator */}
          <div className="bg-[#08101a] p-3 rounded-xl border border-[#1a2d42] flex justify-between items-center">
            <span className="text-xs text-gray-400">Selected Bet:</span>
            <span className="text-sm font-black font-mono text-amber-400">{selectedBet}</span>
          </div>

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-sm shadow-xl shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isSpinning ? 'WHEEL IS SPINNING...' : `SPIN ROULETTE (${stake.toLocaleString()} PKR)`}</span>
          </button>

          {/* History */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-gray-400">Past Winning Numbers:</span>
            <div className="flex flex-wrap gap-1.5">
              {history.map((num, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs ${getNumberColor(num)}`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Roulette Board & Wheel */}
        <div className="lg:col-span-8 bg-[#0a131f] border border-[#192b3f] rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl space-y-6">
          {/* Wheel Result Circle */}
          <div className="relative flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all ${
              isSpinning
                ? 'border-amber-400 animate-spin bg-slate-900 text-4xl'
                : winningNumber !== null
                ? `${getNumberColor(winningNumber)} border-amber-400 scale-110 shadow-amber-500/40 text-4xl font-black font-mono`
                : 'border-[#1b2f44] bg-[#0c1521] text-2xl text-gray-400 font-bold'
            }`}>
              {isSpinning ? '🎡' : winningNumber !== null ? winningNumber : '1X'}
            </div>

            {lastWin && (
              <div className="mt-3 text-center">
                {lastWin.won ? (
                  <span className="text-emerald-400 font-black text-sm animate-bounce">
                    🎉 WON {lastWin.amount.toLocaleString()} PKR ({lastWin.mult}x)!
                  </span>
                ) : (
                  <span className="text-red-400 font-bold text-xs">
                    Number was {winningNumber}. Better luck next spin!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Outer Bets (Red, Black, Even, Odd, 1-18, 19-36) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full max-w-xl">
            {['RED', 'BLACK', 'EVEN', 'ODD', '1-18', '19-36'].map(b => (
              <button
                key={b}
                disabled={isSpinning}
                onClick={() => setSelectedBet(b)}
                className={`py-3 rounded-xl text-xs font-black transition-all ${
                  selectedBet === b ? 'ring-2 ring-amber-400 scale-105' : ''
                } ${
                  b === 'RED' ? 'bg-red-600 text-white' :
                  b === 'BLACK' ? 'bg-gray-950 border border-gray-700 text-white' :
                  'bg-[#122030] text-gray-300 hover:text-white'
                }`}
              >
                {b} (2x)
              </button>
            ))}
          </div>

          {/* Single Number Grid 0 to 36 */}
          <div className="w-full max-w-xl space-y-1 bg-[#060c13] p-3 rounded-2xl border border-[#182a3d]">
            <div className="text-[10px] text-gray-400 font-bold text-center pb-1">
              OR PICK A SINGLE LUCKY NUMBER (36x PAYOUT):
            </div>
            <div className="grid grid-cols-13 gap-1 text-[11px] font-mono font-black">
              <button
                disabled={isSpinning}
                onClick={() => setSelectedBet(0)}
                className={`py-2 rounded-md ${getNumberColor(0)} ${selectedBet === 0 ? 'ring-2 ring-amber-400 scale-110' : ''}`}
              >
                0
              </button>
              {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  disabled={isSpinning}
                  onClick={() => setSelectedBet(num)}
                  className={`py-2 rounded-md transition-all ${getNumberColor(num)} ${
                    selectedBet === num ? 'ring-2 ring-amber-400 scale-110' : ''
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
