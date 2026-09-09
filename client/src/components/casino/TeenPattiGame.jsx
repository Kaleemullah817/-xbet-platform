import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VAL_RANK = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

export default function TeenPattiGame({ onBack, user, onUpdateUser }) {
  const [stake, setStake] = useState(200);
  const [betSide, setBetSide] = useState('A'); // 'A' | 'B' | 'TIE'
  const [isDealing, setIsDealing] = useState(false);
  const [handA, setHandA] = useState([]);
  const [handB, setHandB] = useState([]);
  const [winner, setWinner] = useState(null);
  const [lastWin, setLastWin] = useState(null);

  const drawCard = () => {
    const s = SUITS[Math.floor(Math.random() * SUITS.length)];
    const v = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { suit: s, value: v, isRed: s === '♥' || s === '♦', rank: VAL_RANK[v] };
  };

  // Evaluate 3-card hand score
  const evaluateHand = (hand) => {
    const ranks = hand.map(c => c.rank).sort((a, b) => b - a);
    const isFlush = hand[0].suit === hand[1].suit && hand[1].suit === hand[2].suit;
    const isTrio = hand[0].value === hand[1].value && hand[1].value === hand[2].value;
    const isStraight = (ranks[0] - ranks[1] === 1 && ranks[1] - ranks[2] === 1) ||
                       (ranks[0] === 14 && ranks[1] === 3 && ranks[2] === 2);
    const isPair = hand[0].value === hand[1].value || hand[1].value === hand[2].value || hand[0].value === hand[2].value;

    if (isTrio) return { score: 600 + ranks[0], type: 'Trail (Trio) 🔥' };
    if (isFlush && isStraight) return { score: 500 + ranks[0], type: 'Pure Sequence ✨' };
    if (isStraight) return { score: 400 + ranks[0], type: 'Sequence 📈' };
    if (isFlush) return { score: 300 + ranks[0], type: 'Color (Flush) 🎨' };
    if (isPair) return { score: 200 + ranks[0], type: 'Pair 👥' };
    return { score: 100 + ranks[0], type: 'High Card 🃏' };
  };

  const handleDeal = async () => {
    if (isDealing) return;
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    setIsDealing(true);
    setHandA([]);
    setHandB([]);
    setWinner(null);
    setLastWin(null);

    try {
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'teen_patti_live',
          matchTitle: '1X-Teen Patti 20-20',
          marketName: 'Winner',
          selectionName: `Bet on Player ${betSide}`,
          odds: betSide === 'TIE' ? 8.0 : 1.95,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      setTimeout(async () => {
        const hA = [drawCard(), drawCard(), drawCard()];
        const hB = [drawCard(), drawCard(), drawCard()];

        const evalA = evaluateHand(hA);
        const evalB = evaluateHand(hB);

        setHandA(hA);
        setHandB(hB);
        setIsDealing(false);

        let roundWinner = 'TIE';
        if (evalA.score > evalB.score) roundWinner = 'A';
        else if (evalB.score > evalA.score) roundWinner = 'B';

        setWinner(roundWinner);

        if (roundWinner === betSide) {
          const mult = betSide === 'TIE' ? 8 : 1.95;
          const winAmount = Math.round(stake * mult);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          setLastWin({ won: true, amount: winAmount });

          await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: winAmount,
              method: `Teen Patti Win (Player ${betSide})`
            })
          });
          if (onUpdateUser) onUpdateUser();
        } else {
          setLastWin({ won: false, amount: 0 });
        }
      }, 1000);
    } catch (err) {
      alert(err.message);
      setIsDealing(false);
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
          <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold">
            👑
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-TEEN PATTI 20-20</h2>
            <p className="text-[10px] text-gray-400">Desi 3-card poker showdown. Bet on Player A or Player B!</p>
          </div>
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Main Table */}
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
                disabled={isDealing}
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
                  disabled={isDealing}
                  onClick={() => setStake(amt)}
                  className="py-1 bg-[#132233] hover:bg-[#1a2f47] text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400">Choose Winner:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={isDealing}
                onClick={() => setBetSide('A')}
                className={`py-3 rounded-xl text-xs font-black transition-all ${
                  betSide === 'A' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400' : 'bg-[#142333] text-gray-400 hover:text-white'
                }`}
              >
                PLAYER A (1.95x)
              </button>
              <button
                disabled={isDealing}
                onClick={() => setBetSide('TIE')}
                className={`py-3 rounded-xl text-xs font-black transition-all ${
                  betSide === 'TIE' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400' : 'bg-[#142333] text-gray-400 hover:text-white'
                }`}
              >
                TIE (8.0x)
              </button>
              <button
                disabled={isDealing}
                onClick={() => setBetSide('B')}
                className={`py-3 rounded-xl text-xs font-black transition-all ${
                  betSide === 'B' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400' : 'bg-[#142333] text-gray-400 hover:text-white'
                }`}
              >
                PLAYER B (1.95x)
              </button>
            </div>
          </div>

          {/* Deal Button */}
          <button
            onClick={handleDeal}
            disabled={isDealing}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isDealing ? 'DEALING CARDS...' : `DEAL CARDS (${stake.toLocaleString()} PKR)`}</span>
          </button>

          {/* Win Result */}
          {lastWin && (
            <div className={`p-3 rounded-xl border text-center text-xs font-bold ${
              lastWin.won ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-red-950/80 border-red-500 text-red-300'
            }`}>
              {lastWin.won ? `🎉 WON ${lastWin.amount.toLocaleString()} PKR!` : 'Player on the other side won!'}
            </div>
          )}
        </div>

        {/* Right Showdown Table */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#180a1c] to-[#0d050f] border-4 border-purple-900 rounded-3xl p-8 flex flex-col justify-between shadow-2xl min-h-[420px] relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Player A Box */}
            <div className={`p-5 rounded-2xl border transition-all ${
              winner === 'A' ? 'bg-cyan-950/60 border-cyan-400 shadow-xl shadow-cyan-500/20' : 'bg-[#0d1622] border-[#182a3d]'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black font-gaming text-cyan-400">PLAYER A</span>
                {handA.length === 3 && (
                  <span className="text-xs font-black text-amber-300">{evaluateHand(handA).type}</span>
                )}
              </div>
              <div className="flex gap-2">
                {handA.length === 3 ? (
                  handA.map((c, i) => (
                    <div
                      key={i}
                      className={`w-16 h-24 rounded-xl bg-white flex flex-col justify-between p-2 shadow-xl font-black text-base ${
                        c.isRed ? 'text-red-600' : 'text-black'
                      }`}
                    >
                      <div>{c.value}</div>
                      <div className="text-2xl self-center">{c.suit}</div>
                      <div className="self-end">{c.value}</div>
                    </div>
                  ))
                ) : (
                  [1, 2, 3].map(i => (
                    <div key={i} className="w-16 h-24 rounded-xl bg-blue-950 border border-blue-800/40 flex items-center justify-center text-xl text-blue-400">
                      🂠
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Player B Box */}
            <div className={`p-5 rounded-2xl border transition-all ${
              winner === 'B' ? 'bg-red-950/60 border-red-400 shadow-xl shadow-red-500/20' : 'bg-[#0d1622] border-[#182a3d]'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black font-gaming text-red-400">PLAYER B</span>
                {handB.length === 3 && (
                  <span className="text-xs font-black text-amber-300">{evaluateHand(handB).type}</span>
                )}
              </div>
              <div className="flex gap-2">
                {handB.length === 3 ? (
                  handB.map((c, i) => (
                    <div
                      key={i}
                      className={`w-16 h-24 rounded-xl bg-white flex flex-col justify-between p-2 shadow-xl font-black text-base ${
                        c.isRed ? 'text-red-600' : 'text-black'
                      }`}
                    >
                      <div>{c.value}</div>
                      <div className="text-2xl self-center">{c.suit}</div>
                      <div className="self-end">{c.value}</div>
                    </div>
                  ))
                ) : (
                  [1, 2, 3].map(i => (
                    <div key={i} className="w-16 h-24 rounded-xl bg-red-950 border border-red-800/40 flex items-center justify-center text-xl text-red-400">
                      🂠
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Center Winner Banner */}
          {winner && (
            <div className="mt-6 text-center py-2 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-300 font-black text-sm">
              WINNER: {winner === 'TIE' ? 'HAND IS A TIE!' : `PLAYER ${winner} TAKES THE POT!`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
