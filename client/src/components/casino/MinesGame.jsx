import React, { useState } from 'react';
import { Bomb, Gem, ArrowLeft, RotateCcw, Volume2, ShieldAlert, Sparkles, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MinesGame({ onBack, user, onUpdateUser }) {
  const [mineCount, setMineCount] = useState(3);
  const [stake, setStake] = useState(200);
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'PLAYING' | 'WON' | 'BUST'
  const [grid, setGrid] = useState(Array(25).fill(null)); // null | 'gem' | 'mine'
  const [revealed, setRevealed] = useState(Array(25).fill(false));
  const [minePositions, setMinePositions] = useState(new Set());
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [profit, setProfit] = useState(0);

  // Calculate multiplier based on remaining tiles and picked gems
  const calculateNextMultiplier = (gemsPicked, totalMines) => {
    let mult = 0.97;
    for (let i = 0; i < gemsPicked; i++) {
      mult *= (25 - i) / (25 - totalMines - i);
    }
    return Number(mult.toFixed(2));
  };

  const startGame = async () => {
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    try {
      // Deduct stake via backend wallet
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'mines_game',
          matchTitle: '1X-Mines Turbo',
          marketName: `${mineCount} Mines`,
          selectionName: 'Mines Run',
          odds: 1.0,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Bet placement failed');
      if (onUpdateUser) onUpdateUser();

      // Generate random mines
      const positions = new Set();
      while (positions.size < mineCount) {
        positions.add(Math.floor(Math.random() * 25));
      }
      setMinePositions(positions);
      setGrid(Array(25).fill(null));
      setRevealed(Array(25).fill(false));
      setCurrentMultiplier(1.0);
      setProfit(0);
      setGameState('PLAYING');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTileClick = (index) => {
    if (gameState !== 'PLAYING' || revealed[index]) return;

    const isMine = minePositions.has(index);
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    const newGrid = [...grid];
    if (isMine) {
      // BUST
      newGrid[index] = 'mine';
      setGrid(newGrid);
      // Reveal all mines
      minePositions.forEach(pos => {
        newRevealed[pos] = true;
        newGrid[pos] = 'mine';
      });
      setRevealed(newRevealed);
      setGrid(newGrid);
      setGameState('BUST');
    } else {
      // GEM!
      newGrid[index] = 'gem';
      setGrid(newGrid);
      const gemsPicked = newGrid.filter(t => t === 'gem').length;
      const nextMult = calculateNextMultiplier(gemsPicked, mineCount);
      setCurrentMultiplier(nextMult);
      setProfit(Math.round(stake * nextMult));

      // Check if all gems found
      if (gemsPicked === 25 - mineCount) {
        handleCashout(nextMult);
      }
    }
  };

  const handleCashout = async (overrideMult) => {
    if (gameState !== 'PLAYING') return;
    const finalMult = overrideMult || currentMultiplier;
    const winAmount = Math.round(stake * finalMult);

    setGameState('WON');
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

    // Credit winnings to wallet
    try {
      await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: winAmount,
          method: `Mines Cashout (${finalMult}x)`
        })
      });
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      console.error(err);
    }
  };

  const gemsPickedCount = grid.filter(t => t === 'gem').length;

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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
            💎
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-MINES TURBO</h2>
            <p className="text-[10px] text-gray-400">Pick gems, avoid the hidden mines & cash out anytime!</p>
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
              <span>Bet Amount (PKR)</span>
              <span className="text-cyan-400 font-mono">Min: 50 | Max: 50,000</span>
            </label>
            <div className="relative">
              <input
                type="number"
                disabled={gameState === 'PLAYING'}
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
                  disabled={gameState === 'PLAYING'}
                  onClick={() => setStake(amt)}
                  className="py-1 bg-[#132233] hover:bg-[#1a2f47] text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Mines Count Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 flex justify-between">
              <span>Mines Count:</span>
              <span className="text-red-400 font-black font-mono">{mineCount} MINES ({25 - mineCount} GEMS)</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 20].map(cnt => (
                <button
                  key={cnt}
                  disabled={gameState === 'PLAYING'}
                  onClick={() => setMineCount(cnt)}
                  className={`py-1.5 rounded-xl text-xs font-black font-mono transition-all disabled:opacity-50 ${
                    mineCount === cnt
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-[#132233] text-gray-300 hover:bg-[#1b3049]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {gameState === 'PLAYING' ? (
            <button
              onClick={() => handleCashout()}
              disabled={gemsPickedCount === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex flex-col items-center justify-center disabled:opacity-50"
            >
              <span className="text-xs tracking-wider uppercase font-extrabold">CASH OUT NOW</span>
              <span className="text-base font-mono font-black">{profit > 0 ? `${profit.toLocaleString()} PKR (${currentMultiplier}x)` : 'Pick at least 1 Gem'}</span>
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>START ROUND ({stake.toLocaleString()} PKR)</span>
            </button>
          )}

          {/* Next Multiplier Preview */}
          {gameState === 'PLAYING' && (
            <div className="p-3 bg-[#08101a] rounded-xl border border-[#1a2d42] flex justify-between items-center text-xs">
              <span className="text-gray-400">Next Gem Multiplier:</span>
              <span className="text-cyan-400 font-mono font-black text-sm">
                {calculateNextMultiplier(gemsPickedCount + 1, mineCount)}x
              </span>
            </div>
          )}
        </div>

        {/* Right 5x5 Mines Grid */}
        <div className="lg:col-span-8 bg-[#0a131f] border border-[#192b3f] rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl relative">
          {/* Round status banner */}
          <div className="mb-4 text-center">
            {gameState === 'PLAYING' ? (
              <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/50 px-4 py-1.5 rounded-full text-emerald-300 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active Multiplier: {currentMultiplier}x | Gems Found: {gemsPickedCount} / {25 - mineCount}</span>
              </div>
            ) : gameState === 'WON' ? (
              <div className="inline-flex items-center gap-2 bg-amber-950/80 border border-amber-400 px-4 py-1.5 rounded-full text-amber-300 text-xs font-black animate-bounce">
                🎉 CASHED OUT! Won {profit.toLocaleString()} PKR ({currentMultiplier}x)!
              </div>
            ) : gameState === 'BUST' ? (
              <div className="inline-flex items-center gap-2 bg-red-950/80 border border-red-500 px-4 py-1.5 rounded-full text-red-300 text-xs font-black">
                💥 BOOM! You hit a mine. Better luck next time!
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-bold">
                Set bet and click START ROUND to begin!
              </div>
            )}
          </div>

          {/* 5x5 Grid */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3 w-full max-w-[420px] aspect-square">
            {grid.map((cell, idx) => {
              const isCellRevealed = revealed[idx];
              const isMine = cell === 'mine';
              const isGem = cell === 'gem';

              return (
                <button
                  key={idx}
                  disabled={gameState !== 'PLAYING' || isCellRevealed}
                  onClick={() => handleTileClick(idx)}
                  className={`rounded-2xl transition-all duration-200 aspect-square flex items-center justify-center text-2xl shadow-md select-none transform ${
                    isCellRevealed
                      ? isGem
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-300 scale-95 shadow-emerald-500/30'
                        : 'bg-gradient-to-tr from-red-700 to-rose-600 border-2 border-red-400 scale-95 shadow-red-500/30 animate-pulse'
                      : gameState === 'PLAYING'
                      ? 'bg-[#122030] hover:bg-[#1a2d42] border border-[#1f374e] hover:scale-105 active:scale-90 cursor-pointer'
                      : 'bg-[#0e1926] border border-[#172738] opacity-80 cursor-not-allowed'
                  }`}
                >
                  {isCellRevealed ? (
                    isGem ? (
                      <span className="filter drop-shadow text-3xl animate-bounce">💎</span>
                    ) : (
                      <span className="filter drop-shadow text-3xl">💣</span>
                    )
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1b3147]"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
