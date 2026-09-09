import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export default function AndarBaharGame({ onBack, user, onUpdateUser }) {
  const [stake, setStake] = useState(200);
  const [betSide, setBetSide] = useState('ANDAR'); // 'ANDAR' | 'BAHAR'
  const [isDealing, setIsDealing] = useState(false);
  const [jokerCard, setJokerCard] = useState(null);
  const [andarCards, setAndarCards] = useState([]);
  const [baharCards, setBaharCards] = useState([]);
  const [winningSide, setWinningSide] = useState(null);
  const [lastWin, setLastWin] = useState(null);

  const drawCard = () => {
    const s = SUITS[Math.floor(Math.random() * SUITS.length)];
    const v = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { suit: s, value: v, isRed: s === '♥' || s === '♦' };
  };

  const handleStartGame = async () => {
    if (isDealing) return;
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    setIsDealing(true);
    setAndarCards([]);
    setBaharCards([]);
    setWinningSide(null);
    setLastWin(null);

    try {
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'andar_bahar_game',
          matchTitle: '1X-Andar Bahar Classic',
          marketName: 'Spot Bet',
          selectionName: `Bet on ${betSide}`,
          odds: betSide === 'ANDAR' ? 1.90 : 2.00,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      // Draw Center Trump / Joker Card
      const joker = drawCard();
      setJokerCard(joker);

      // Deal cards alternatively
      let currentAndar = [];
      let currentBahar = [];
      let turn = 'ANDAR';
      let matchFound = false;
      let winningWinner = null;

      const dealInterval = setInterval(() => {
        const nextCard = drawCard();

        if (turn === 'ANDAR') {
          currentAndar.push(nextCard);
          setAndarCards([...currentAndar]);
          if (nextCard.value === joker.value) {
            matchFound = true;
            winningWinner = 'ANDAR';
          } else {
            turn = 'BAHAR';
          }
        } else {
          currentBahar.push(nextCard);
          setBaharCards([...currentBahar]);
          if (nextCard.value === joker.value) {
            matchFound = true;
            winningWinner = 'BAHAR';
          } else {
            turn = 'ANDAR';
          }
        }

        // Finish round when matched or reached 16 cards
        if (matchFound || currentAndar.length + currentBahar.length >= 14) {
          clearInterval(dealInterval);
          if (!winningWinner) winningWinner = Math.random() < 0.5 ? 'ANDAR' : 'BAHAR';
          setWinningSide(winningWinner);
          setIsDealing(false);

          if (winningWinner === betSide) {
            const mult = betSide === 'ANDAR' ? 1.90 : 2.00;
            const winAmount = Math.round(stake * mult);
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            setLastWin({ won: true, amount: winAmount });

            fetch('/api/wallet/deposit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: winAmount,
                method: `Andar Bahar Win (${betSide})`
              })
            }).then(() => {
              if (onUpdateUser) onUpdateUser();
            });
          } else {
            setLastWin({ won: false, amount: 0 });
          }
        }
      }, 350);
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
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
            🃏
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-ANDAR BAHAR TRADITIONAL</h2>
            <p className="text-[10px] text-gray-400">Match the center Joker card on Andar or Bahar for up to 2.0x payout!</p>
          </div>
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Main Board */}
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
            <label className="text-xs font-bold text-gray-400">Select Winning Side:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isDealing}
                onClick={() => setBetSide('ANDAR')}
                className={`py-4 rounded-xl text-xs font-black transition-all ${
                  betSide === 'ANDAR'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400 scale-105'
                    : 'bg-[#142333] text-gray-400 hover:text-white'
                }`}
              >
                ANDAR (1.90x)
              </button>
              <button
                disabled={isDealing}
                onClick={() => setBetSide('BAHAR')}
                className={`py-4 rounded-xl text-xs font-black transition-all ${
                  betSide === 'BAHAR'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400 scale-105'
                    : 'bg-[#142333] text-gray-400 hover:text-white'
                }`}
              >
                BAHAR (2.00x)
              </button>
            </div>
          </div>

          {/* Deal Button */}
          <button
            onClick={handleStartGame}
            disabled={isDealing}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isDealing ? 'DEALING CARDS...' : `START ROUND (${stake.toLocaleString()} PKR)`}</span>
          </button>

          {/* Win Result */}
          {lastWin && (
            <div className={`p-3 rounded-xl border text-center text-xs font-bold ${
              lastWin.won ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-red-950/80 border-red-500 text-red-300'
            }`}>
              {lastWin.won ? `🎉 WON ${lastWin.amount.toLocaleString()} PKR on ${betSide}!` : `Matched on ${winningSide}! Better luck next time.`}
            </div>
          )}
        </div>

        {/* Right Andar Bahar Felt Table */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#112319] to-[#0a1610] border-4 border-emerald-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl min-h-[440px] space-y-6">
          {/* Center Joker Trump Card */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
              JOKER / TRUMP CARD TO MATCH:
            </span>
            {jokerCard ? (
              <div
                className={`w-18 h-28 rounded-xl bg-white border-2 border-amber-400 flex flex-col justify-between p-2.5 shadow-2xl font-black text-lg scale-110 ${
                  jokerCard.isRed ? 'text-red-600' : 'text-black'
                }`}
              >
                <div>{jokerCard.value}</div>
                <div className="text-3xl self-center">{jokerCard.suit}</div>
                <div className="self-end">{jokerCard.value}</div>
              </div>
            ) : (
              <div className="w-18 h-28 rounded-xl bg-amber-950/60 border-2 border-dashed border-amber-400/50 flex items-center justify-center text-amber-400 font-bold text-xs">
                Pending Deal
              </div>
            )}
          </div>

          {/* Andar & Bahar Deal Rows */}
          <div className="space-y-4">
            {/* Andar Row */}
            <div className={`p-3 rounded-2xl border transition-all ${
              winningSide === 'ANDAR' ? 'bg-blue-950/80 border-blue-400 shadow-xl' : 'bg-black/30 border-[#1c3628]'
            }`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-black text-blue-400 uppercase">ANDAR ({andarCards.length} CARDS)</span>
                {winningSide === 'ANDAR' && <span className="text-xs font-black text-emerald-400 animate-bounce">WINNER!</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[50px]">
                {andarCards.map((c, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg bg-white font-mono font-black text-xs shadow ${
                      c.isRed ? 'text-red-600' : 'text-black'
                    }`}
                  >
                    {c.value}{c.suit}
                  </span>
                ))}
              </div>
            </div>

            {/* Bahar Row */}
            <div className={`p-3 rounded-2xl border transition-all ${
              winningSide === 'BAHAR' ? 'bg-amber-950/80 border-amber-400 shadow-xl' : 'bg-black/30 border-[#1c3628]'
            }`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-black text-amber-400 uppercase">BAHAR ({baharCards.length} CARDS)</span>
                {winningSide === 'BAHAR' && <span className="text-xs font-black text-emerald-400 animate-bounce">WINNER!</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[50px]">
                {baharCards.map((c, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg bg-white font-mono font-black text-xs shadow ${
                      c.isRed ? 'text-red-600' : 'text-black'
                    }`}
                  >
                    {c.value}{c.suit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
