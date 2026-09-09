import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const THEMES = {
  fruits: {
    id: 'fruits',
    name: 'Lucky 777 Fruits',
    symbols: ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣', '💰'],
    multipliers: { '7️⃣': 50, '💰': 25, '💎': 15, '🔔': 8, '🍇': 5, '🍋': 3, '🍒': 2 },
    bg: 'from-amber-950/40 via-red-950/20 to-black',
    accent: 'text-amber-400 border-amber-500'
  },
  pharaoh: {
    id: 'pharaoh',
    name: "Pharaoh's Gold",
    symbols: ['🏺', '📜', '🪲', '👁️', '☥', '👑'],
    multipliers: { '👑': 60, '☥': 30, '👁️': 18, '🪲': 10, '📜': 6, '🏺': 3 },
    bg: 'from-yellow-950/40 via-amber-950/20 to-black',
    accent: 'text-yellow-400 border-yellow-500'
  },
  dragon: {
    id: 'dragon',
    name: 'Dragon Wilds',
    symbols: ['🏮', '🪙', '🪷', '🎏', '☯️', '🐉'],
    multipliers: { '🐉': 80, '☯️': 40, '🎏': 20, '🪷': 12, '🪙': 6, '🏮': 3 },
    bg: 'from-red-950/40 via-rose-950/20 to-black',
    accent: 'text-rose-400 border-rose-500'
  }
};

export default function SlotsGame({ onBack, user, onUpdateUser }) {
  const [activeThemeKey, setActiveThemeKey] = useState('fruits');
  const [stake, setStake] = useState(200);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([
    ['7️⃣', '🍒', '🍋'],
    ['7️⃣', '7️⃣', '🍇'],
    ['7️⃣', '🔔', '💎']
  ]);
  const [lastWin, setLastWin] = useState(null);

  const theme = THEMES[activeThemeKey];

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    setIsSpinning(true);
    setLastWin(null);

    try {
      // Deduct stake via wallet
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: `slot_${theme.id}`,
          matchTitle: `1X-Slots: ${theme.name}`,
          marketName: 'Slot Spin',
          selectionName: '3x3 Spin',
          odds: 1.0,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      // Spinning animation
      let count = 0;
      const spinInterval = setInterval(() => {
        count++;
        setReels([
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
        ]);

        if (count >= 15) {
          clearInterval(spinInterval);
          finishSpin();
        }
      }, 90);
    } catch (err) {
      alert(err.message);
      setIsSpinning(false);
    }
  };

  const getRandomSymbol = () => {
    const list = theme.symbols;
    return list[Math.floor(Math.random() * list.length)];
  };

  const finishSpin = async () => {
    // Generate final grid
    const finalGrid = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];

    // High chance of matching center line for fun
    if (Math.random() < 0.35) {
      const luckySym = getRandomSymbol();
      finalGrid[0][1] = luckySym;
      finalGrid[1][1] = luckySym;
      finalGrid[2][1] = luckySym;
    }

    setReels(finalGrid);
    setIsSpinning(false);

    // Evaluate paylines
    // Row 0, Row 1 (center), Row 2
    let totalWin = 0;
    let wonLines = [];

    // Check Row 1 (Center horizontal)
    if (finalGrid[0][1] === finalGrid[1][1] && finalGrid[1][1] === finalGrid[2][1]) {
      const sym = finalGrid[0][1];
      const mult = theme.multipliers[sym] || 5;
      totalWin += Math.round(stake * mult);
      wonLines.push(`Center Line: 3x ${sym} (${mult}x)`);
    }

    // Check Top line
    if (finalGrid[0][0] === finalGrid[1][0] && finalGrid[1][0] === finalGrid[2][0]) {
      const sym = finalGrid[0][0];
      const mult = theme.multipliers[sym] || 3;
      totalWin += Math.round(stake * mult);
      wonLines.push(`Top Line: 3x ${sym} (${mult}x)`);
    }

    // Check Bottom line
    if (finalGrid[0][2] === finalGrid[1][2] && finalGrid[1][2] === finalGrid[2][2]) {
      const sym = finalGrid[0][2];
      const mult = theme.multipliers[sym] || 3;
      totalWin += Math.round(stake * mult);
      wonLines.push(`Bottom Line: 3x ${sym} (${mult}x)`);
    }

    if (totalWin > 0) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setLastWin({ amount: totalWin, lines: wonLines });

      await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalWin,
          method: `Slot Win (${theme.name})`
        })
      });
      if (onUpdateUser) onUpdateUser();
    }
  };

  return (
    <div className={`flex-1 flex flex-col p-4 md:p-6 bg-gradient-to-b ${theme.bg} text-white min-h-[680px]`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#18283a]">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white bg-[#101d2d] px-3.5 py-2 rounded-xl border border-[#1d334a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Casino Lobby</span>
        </button>

        {/* Switch 3 Slot Themes */}
        <div className="flex items-center space-x-2 bg-[#0c1521] p-1.5 rounded-2xl border border-[#1a2e45]">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveThemeKey(t.id)}
              disabled={isSpinning}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeThemeKey === t.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-4 bg-[#0c1521] border border-[#182a3d] rounded-2xl p-5 space-y-4 shadow-xl">
          {/* Bet Stake */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 flex justify-between">
              <span>Bet Stake (PKR)</span>
              <span className="text-cyan-400 font-mono">Min: 50 | Max: 25,000</span>
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

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>{isSpinning ? 'SPINNING REELS...' : `SPIN REELS (${stake.toLocaleString()} PKR)`}</span>
          </button>

          {/* Paytable Preview */}
          <div className="space-y-1 pt-2">
            <span className="text-xs font-bold text-gray-400">Paytable Top Multipliers:</span>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              {Object.entries(theme.multipliers).slice(0, 6).map(([sym, mult]) => (
                <div key={sym} className="bg-[#101b27] p-2 rounded-xl border border-[#1b2c3d]">
                  <div className="text-xl">{sym}</div>
                  <div className="text-amber-400 font-mono font-black text-[11px]">{mult}x</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 3x3 Slot Machine */}
        <div className="lg:col-span-8 bg-[#0a131f] border-4 border-amber-500/60 rounded-3xl p-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] relative">
          <div className="text-center pb-4">
            <h3 className="text-xl font-black font-gaming tracking-wider text-amber-300 uppercase">
              {theme.name}
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">Match 3 symbols on center, top, or bottom paylines!</span>
          </div>

          {/* 3 Reels Stage */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[440px] bg-black/80 p-4 rounded-2xl border border-amber-400/40 shadow-inner">
            {reels.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2.5 bg-[#121c29] p-2 rounded-xl border border-[#20344b] overflow-hidden">
                {col.map((sym, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`h-20 sm:h-24 rounded-lg flex items-center justify-center text-4xl sm:text-5xl select-none transition-transform ${
                      rowIdx === 1 ? 'bg-amber-950/40 border-2 border-amber-500/60 shadow-lg' : 'bg-[#0b131e]'
                    } ${isSpinning ? 'animate-pulse' : ''}`}
                  >
                    <span>{sym}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Win Announcement */}
          {lastWin && (
            <div className="mt-4 p-3 bg-emerald-950/90 border border-emerald-400 rounded-xl text-center animate-bounce">
              <div className="text-sm font-black text-emerald-300">
                🎉 BIG WIN! Won {lastWin.amount.toLocaleString()} PKR!
              </div>
              <div className="text-[10px] text-emerald-200">
                {lastWin.lines.join(' | ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
