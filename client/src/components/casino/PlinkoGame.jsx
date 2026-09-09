import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const MULTIPLIERS = [16, 9, 3, 1.5, 0.5, 0.2, 0.5, 1.5, 3, 9, 16];
const ROWS = 10;

export default function PlinkoGame({ onBack, user, onUpdateUser }) {
  const [stake, setStake] = useState(200);
  const [isDropping, setIsDropping] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [activeBinIndex, setActiveBinIndex] = useState(null);
  const [history, setHistory] = useState([1.5, 0.5, 3.0, 0.2, 9.0]);
  const canvasRef = useRef(null);

  const dropBall = async () => {
    if (isDropping) return;
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    setIsDropping(true);
    setLastWin(null);
    setActiveBinIndex(null);

    try {
      // Deduct stake via backend wallet
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'plinko_game',
          matchTitle: '1X-Plinko Master',
          marketName: 'Multiplier Drop',
          selectionName: 'Pin Drop',
          odds: 1.0,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      // Simulate physics path
      let col = 0;
      const path = [col];
      for (let r = 0; r < ROWS; r++) {
        const step = Math.random() < 0.5 ? 0 : 1;
        col += step;
        path.push(col);
      }

      // Animate ball on canvas
      animateBall(path, col);
    } catch (err) {
      alert(err.message);
      setIsDropping(false);
    }
  };

  const animateBall = (path, finalCol) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let stepIndex = 0;
    const totalSteps = path.length;
    const startY = 40;
    const rowGap = (height - 110) / ROWS;

    const interval = setInterval(() => {
      stepIndex++;
      drawPlinkoBoard(ctx, width, height);

      if (stepIndex < totalSteps) {
        // Draw current ball
        const r = stepIndex;
        const c = path[r];
        const pinsInRow = r + 1;
        const pinGap = width / (pinsInRow + 1);
        const ballX = (c + 1) * pinGap;
        const ballY = startY + r * rowGap;

        ctx.save();
        ctx.beginPath();
        ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      } else {
        clearInterval(interval);
        // Land in bin
        const binIdx = Math.min(finalCol, MULTIPLIERS.length - 1);
        const mult = MULTIPLIERS[binIdx];
        const winAmount = Math.round(stake * mult);

        setActiveBinIndex(binIdx);
        setLastWin({ mult, amount: winAmount });
        setHistory(prev => [mult, ...prev.slice(0, 9)]);
        setIsDropping(false);

        if (mult >= 2) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }

        // Credit wallet if winAmount > 0
        if (winAmount > 0) {
          fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: winAmount,
              method: `Plinko Drop (${mult}x)`
            })
          }).then(() => {
            if (onUpdateUser) onUpdateUser();
          });
        }
      }
    }, 120);
  };

  const drawPlinkoBoard = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Draw Pins
    const startY = 40;
    const rowGap = (height - 110) / ROWS;

    for (let r = 0; r <= ROWS; r++) {
      const pinsInRow = r + 1;
      const pinGap = width / (pinsInRow + 1);
      for (let c = 0; c < pinsInRow; c++) {
        const x = (c + 1) * pinGap;
        const y = startY + r * rowGap;

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#64748b';
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawPlinkoBoard(ctx, canvas.width, canvas.height);
    }
  }, []);

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
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-PLINKO MASTER</h2>
            <p className="text-[10px] text-gray-400">Drop balls through the pyramid for up to 16x multiplier!</p>
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
                disabled={isDropping}
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
                  disabled={isDropping}
                  onClick={() => setStake(amt)}
                  className="py-1 bg-[#132233] hover:bg-[#1a2f47] text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={dropBall}
            disabled={isDropping}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isDropping ? 'BALL DROPPING...' : `DROP BALL (${stake.toLocaleString()} PKR)`}</span>
          </button>

          {/* Recent Multipliers */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-gray-400">Recent Multipliers:</span>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                    h >= 9 ? 'bg-red-500/30 text-red-300 border border-red-500/40' :
                    h >= 2 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                    'bg-[#142333] text-gray-400'
                  }`}
                >
                  {h}x
                </span>
              ))}
            </div>
          </div>

          {/* Result Alert */}
          {lastWin && (
            <div className={`p-3 rounded-xl border text-center font-bold text-xs ${
              lastWin.mult >= 1 ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-red-950/80 border-red-500 text-red-300'
            }`}>
              {lastWin.mult >= 1 ? `🎉 WON ${lastWin.amount.toLocaleString()} PKR (${lastWin.mult}x)!` : `Landed ${lastWin.mult}x (${lastWin.amount.toLocaleString()} PKR)`}
            </div>
          )}
        </div>

        {/* Right Plinko Stage */}
        <div className="lg:col-span-8 bg-[#0a131f] border border-[#192b3f] rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl relative">
          <canvas
            ref={canvasRef}
            width={480}
            height={380}
            className="w-full max-w-[480px] h-[380px]"
          />

          {/* Bottom Multiplier Buckets */}
          <div className="w-full max-w-[480px] grid grid-cols-11 gap-1 mt-2">
            {MULTIPLIERS.map((m, idx) => {
              const isActive = activeBinIndex === idx;
              return (
                <div
                  key={idx}
                  className={`py-2 rounded-lg text-center font-mono font-black text-[10px] transition-all ${
                    isActive
                      ? 'bg-yellow-400 text-black scale-110 shadow-lg shadow-yellow-400/50'
                      : m >= 9
                      ? 'bg-red-600/80 text-white'
                      : m >= 3
                      ? 'bg-amber-600/80 text-white'
                      : m >= 1
                      ? 'bg-cyan-700/80 text-white'
                      : 'bg-[#18283b] text-gray-400'
                  }`}
                >
                  {m}x
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
