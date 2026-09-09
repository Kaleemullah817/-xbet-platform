import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, Plus, Hand, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export default function BlackjackGame({ onBack, user, onUpdateUser }) {
  const [stake, setStake] = useState(200);
  const [gameState, setGameState] = useState('BETTING'); // 'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'ENDED'
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [resultMessage, setResultMessage] = useState(null);

  const getCardValue = (val) => {
    if (['J', 'Q', 'K'].includes(val)) return 10;
    if (val === 'A') return 11;
    return parseInt(val, 10);
  };

  const calculateHandScore = (hand) => {
    let score = 0;
    let aces = 0;
    hand.forEach(card => {
      score += getCardValue(card.value);
      if (card.value === 'A') aces++;
    });
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const drawCard = () => {
    const s = SUITS[Math.floor(Math.random() * SUITS.length)];
    const v = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { suit: s, value: v, isRed: s === '♥' || s === '♦' };
  };

  const startRound = async () => {
    if (!user || user.balance < stake) {
      alert('Insufficient balance! Please deposit PKR to play.');
      return;
    }

    try {
      // Deduct stake via wallet
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SINGLE',
          matchId: 'blackjack_game',
          matchTitle: '1X-Blackjack VIP',
          marketName: 'Blackjack Hand',
          selectionName: 'Player Hand',
          odds: 2.0,
          stake: stake
        })
      });
      if (!res.ok) throw new Error('Failed to place bet');
      if (onUpdateUser) onUpdateUser();

      const pCards = [drawCard(), drawCard()];
      const dCards = [drawCard(), drawCard()];

      setPlayerCards(pCards);
      setDealerCards(dCards);
      setResultMessage(null);

      const pScore = calculateHandScore(pCards);
      if (pScore === 21) {
        // Natural Blackjack!
        endRound(pCards, dCards, 'BLACKJACK');
      } else {
        setGameState('PLAYING');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const hit = () => {
    if (gameState !== 'PLAYING') return;
    const newCards = [...playerCards, drawCard()];
    setPlayerCards(newCards);
    const score = calculateHandScore(newCards);

    if (score > 21) {
      // Bust
      endRound(newCards, dealerCards, 'BUST');
    } else if (score === 21) {
      stand(newCards);
    }
  };

  const stand = (currPlayerCards = playerCards) => {
    if (gameState !== 'PLAYING') return;
    setGameState('DEALER_TURN');

    let currentDealer = [...dealerCards];
    let dScore = calculateHandScore(currentDealer);

    // Dealer draws to 17
    while (dScore < 17) {
      currentDealer.push(drawCard());
      dScore = calculateHandScore(currentDealer);
    }

    setDealerCards(currentDealer);
    const pScore = calculateHandScore(currPlayerCards);

    if (dScore > 21) {
      endRound(currPlayerCards, currentDealer, 'DEALER_BUST');
    } else if (pScore > dScore) {
      endRound(currPlayerCards, currentDealer, 'PLAYER_WIN');
    } else if (dScore > pScore) {
      endRound(currPlayerCards, currentDealer, 'DEALER_WIN');
    } else {
      endRound(currPlayerCards, currentDealer, 'PUSH');
    }
  };

  const endRound = async (pCards, dCards, outcome) => {
    setGameState('ENDED');
    let winAmount = 0;
    let msg = '';

    if (outcome === 'BLACKJACK') {
      winAmount = Math.round(stake * 2.5); // 3:2 payout
      msg = `🎉 NATURAL BLACKJACK! Won ${winAmount.toLocaleString()} PKR (3:2)!`;
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } else if (outcome === 'PLAYER_WIN' || outcome === 'DEALER_BUST') {
      winAmount = stake * 2;
      msg = `🎉 YOU WON ${winAmount.toLocaleString()} PKR!`;
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else if (outcome === 'PUSH') {
      winAmount = stake; // Return stake
      msg = `🤝 PUSH (Tie)! Stake of ${winAmount.toLocaleString()} PKR returned.`;
    } else {
      msg = outcome === 'BUST' ? '💥 BUST! Score over 21.' : 'Dealer won this hand. Better luck next time!';
    }

    setResultMessage(msg);

    if (winAmount > 0) {
      await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: winAmount,
          method: `Blackjack Payout (${outcome})`
        })
      });
      if (onUpdateUser) onUpdateUser();
    }
  };

  const playerScore = calculateHandScore(playerCards);
  const dealerScore = gameState === 'PLAYING'
    ? getCardValue(dealerCards[0]?.value || '0')
    : calculateHandScore(dealerCards);

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
            ♠️
          </div>
          <div>
            <h2 className="text-base font-black font-gaming tracking-wide text-white">1X-BLACKJACK CLASSIC</h2>
            <p className="text-[10px] text-gray-400">Beat the dealer to 21 without busting. Natural Blackjack pays 3:2!</p>
          </div>
        </div>

        <div className="bg-[#101e2e] border border-[#1d354e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="text-gray-400">Balance:</span>
          <span className="text-emerald-400 font-mono font-black">{user?.balance?.toLocaleString() || 0} PKR</span>
        </div>
      </div>

      {/* Main Blackjack Felt Table */}
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
                disabled={gameState === 'PLAYING'}
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
                  disabled={gameState === 'PLAYING'}
                  onClick={() => setStake(amt)}
                  className="py-1 bg-[#132233] hover:bg-[#1a2f47] text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {gameState === 'PLAYING' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={hit}
                className="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>HIT</span>
              </button>
              <button
                onClick={() => stand()}
                className="py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-sm shadow-xl shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Hand className="w-5 h-5" />
                <span>STAND</span>
              </button>
            </div>
          ) : (
            <button
              onClick={startRound}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>DEAL CARDS ({stake.toLocaleString()} PKR)</span>
            </button>
          )}

          {/* Result Alert */}
          {resultMessage && (
            <div className="p-3.5 bg-black/70 border border-amber-400 rounded-xl text-center text-xs font-bold text-amber-300">
              {resultMessage}
            </div>
          )}
        </div>

        {/* Right Felt Table */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#0a3520] to-[#062013] border-4 border-emerald-900 rounded-3xl p-8 flex flex-col justify-between shadow-2xl min-h-[420px] relative">
          {/* Dealer Hand */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-emerald-200">
              <span>DEALER'S HAND</span>
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded">Score: {dealerScore}</span>
            </div>
            <div className="flex gap-2.5">
              {dealerCards.map((c, i) => (
                <div
                  key={i}
                  className={`w-16 h-24 rounded-xl bg-white flex flex-col justify-between p-2 shadow-xl select-none font-black text-base ${
                    c.isRed ? 'text-red-600' : 'text-black'
                  }`}
                >
                  {gameState === 'PLAYING' && i === 1 ? (
                    <div className="w-full h-full bg-blue-900 rounded-lg flex items-center justify-center text-white text-xs">
                      🂠
                    </div>
                  ) : (
                    <>
                      <div>{c.value}</div>
                      <div className="text-2xl self-center">{c.suit}</div>
                      <div className="self-end">{c.value}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Center Logo */}
          <div className="text-center py-4 opacity-30 select-none">
            <span className="text-2xl font-black font-gaming tracking-widest text-white">BLACKJACK PAYS 3 TO 2</span>
          </div>

          {/* Player Hand */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-emerald-200">
              <span>YOUR HAND</span>
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded">Score: {playerScore}</span>
            </div>
            <div className="flex gap-2.5">
              {playerCards.map((c, i) => (
                <div
                  key={i}
                  className={`w-16 h-24 rounded-xl bg-white flex flex-col justify-between p-2 shadow-xl select-none font-black text-base ${
                    c.isRed ? 'text-red-600' : 'text-black'
                  }`}
                >
                  <div>{c.value}</div>
                  <div className="text-2xl self-center">{c.suit}</div>
                  <div className="self-end">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
