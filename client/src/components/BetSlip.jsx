import React, { useState } from 'react';
import { 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Award,
  Zap,
  ArrowRight,
  Layers,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BetSlip({ 
  selectedBets = [], 
  onRemoveBet, 
  onClearBets, 
  myBets = [], 
  user, 
  onBetPlaced,
  onCashout,
  isMobile = false,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('slip'); // 'slip' | 'myBets'
  const [betType, setBetType] = useState('single'); // 'single' | 'accumulator'
  const [singleStakes, setSingleStakes] = useState({});
  const [accumulatorStake, setAccumulatorStake] = useState('500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  // Calculate Accumulator Totals
  const totalAccumulatorOdds = selectedBets.length > 0 
    ? Number(selectedBets.reduce((acc, b) => acc * b.odds, 1).toFixed(2)) 
    : 1.00;

  const totalAccumulatorPayout = Number((parseFloat(accumulatorStake || 0) * totalAccumulatorOdds).toFixed(2));

  // Quick Stake Helper
  const applyQuickStake = (amount) => {
    if (betType === 'accumulator') {
      setAccumulatorStake(amount.toString());
    } else {
      const updated = { ...singleStakes };
      selectedBets.forEach(b => {
        updated[b.matchId + '_' + b.marketKey] = amount.toString();
      });
      setSingleStakes(updated);
    }
  };

  const handlePlaceBets = async () => {
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (betType === 'accumulator') {
        const stake = parseFloat(accumulatorStake);
        if (!stake || stake < 10) {
          throw new Error('Minimum stake is 10 PKR');
        }
        if (selectedBets.length < 2) {
          throw new Error('Accumulator requires at least 2 selections!');
        }

        const res = await fetch('/api/bets/place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ACCUMULATOR',
            stake,
            selections: selectedBets
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to place bet');

        triggerConfetti();
        setMessage({ type: 'success', text: `Express Bet Placed! Payout: ${data.bet.potentialPayout} PKR` });
        onClearBets();
        if (onBetPlaced) onBetPlaced();
      } else {
        // Place each single bet
        let placedCount = 0;
        for (const bet of selectedBets) {
          const stake = parseFloat(singleStakes[bet.matchId + '_' + bet.marketKey] || '100');
          if (!stake || stake < 10) {
            throw new Error(`Minimum stake for ${bet.selectionName} is 10 PKR`);
          }

          const res = await fetch('/api/bets/place', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'SINGLE',
              matchId: bet.matchId,
              matchTitle: bet.matchTitle,
              marketName: bet.marketName,
              selectionName: bet.selectionName,
              odds: bet.odds,
              stake
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to place bet');
          placedCount++;
        }

        triggerConfetti();
        setMessage({ type: 'success', text: `Successfully placed ${placedCount} single bet(s)!` });
        onClearBets();
        if (onBetPlaced) onBetPlaced();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const slipContent = (
    <div className={`bg-[#0d1622] border-l border-[#1a2b3d] flex flex-col select-none shadow-2xl ${
      isMobile 
        ? 'w-full max-w-md h-[88vh] rounded-2xl border border-[#20344a] overflow-hidden' 
        : 'w-80 h-[calc(100vh-64px)] sticky top-16'
    }`}>
      {/* Top Slip vs My Bets Tab */}
      <div className="flex items-center justify-between p-2 bg-[#090f17] border-b border-[#182737] gap-1">
        <div className="grid grid-cols-2 flex-1 gap-1">
          <button
            onClick={() => setActiveTab('slip')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'slip'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>BET SLIP</span>
            {selectedBets.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-400 text-black text-[10px] font-black flex items-center justify-center ml-1">
                {selectedBets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('myBets')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'myBets'
                ? 'bg-[#182a3d] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>MY BETS</span>
            {myBets.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#20374e] text-gray-300 text-[10px] font-bold">
                {myBets.length}
              </span>
            )}
          </button>
        </div>

        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 ml-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#152332]"
            title="Close Bet Slip"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {activeTab === 'slip' ? (
        // BET SLIP VIEW
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Sub header: Single vs Accumulator switch */}
          {selectedBets.length > 1 && (
            <div className="p-2 border-b border-[#182737] flex gap-1 bg-[#101b28]">
              <button
                onClick={() => setBetType('single')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                  betType === 'single' ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Single ({selectedBets.length})
              </button>
              <button
                onClick={() => setBetType('accumulator')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1 ${
                  betType === 'accumulator' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 text-yellow-300" />
                <span>Accumulator</span>
              </button>
            </div>
          )}

          {/* Selected Bets List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {message && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                message.type === 'success' 
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' 
                  : 'bg-red-950/80 border border-red-500/50 text-red-300'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {selectedBets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#131f2d] flex items-center justify-center text-cyan-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-300">Your Bet Slip is Empty</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click on any match odd to add selections to your slip.
                  </p>
                </div>
              </div>
            ) : (
              selectedBets.map((bet, index) => {
                const key = bet.matchId + '_' + bet.marketKey;
                const stake = singleStakes[key] || '100';

                return (
                  <div 
                    key={index}
                    className="bg-[#121f2d] border border-[#1d3348] rounded-xl p-3 relative group hover:border-cyan-500/50 transition-colors"
                  >
                    <button
                      onClick={() => onRemoveBet(index)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove from slip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-[10px] text-gray-400 truncate pr-5 font-medium">
                      {bet.matchTitle}
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {bet.selectionName}
                      </span>
                      <span className="text-xs font-black text-cyan-400 font-gaming bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                        {bet.odds.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Market: <span className="text-gray-300 font-medium">{bet.marketName}</span>
                    </div>

                    {/* Individual Stake for Single Mode */}
                    {betType === 'single' && (
                      <div className="mt-2.5 pt-2 border-t border-[#1a2d3e] flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Stake (PKR):</span>
                        <input
                          type="number"
                          value={stake}
                          onChange={(e) => setSingleStakes({ ...singleStakes, [key]: e.target.value })}
                          className="w-20 bg-[#0a1118] border border-[#23384c] rounded px-2 py-0.5 text-xs text-right font-bold text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Slip Bottom Controls and Payout Calculation */}
          {selectedBets.length > 0 && (
            <div className="p-3 bg-[#0a1119] border-t border-[#182737] space-y-3">
              {/* Quick Stake Buttons */}
              <div className="flex items-center space-x-1.5">
                {[100, 500, 1000, 5000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => applyQuickStake(amount)}
                    className="flex-1 py-1 bg-[#142332] hover:bg-[#1b2f44] text-[10px] font-bold text-gray-300 rounded border border-[#1e344a] transition-colors"
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              {/* Accumulator Stake Input */}
              {betType === 'accumulator' && (
                <div className="bg-[#121f2d] p-2.5 rounded-xl border border-purple-500/30">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-gray-300 font-semibold">Total Odds (Multiplier):</span>
                    <span className="font-extrabold text-purple-400 font-gaming text-sm">
                      {totalAccumulatorOdds.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Express Stake (PKR):</span>
                    <input
                      type="number"
                      value={accumulatorStake}
                      onChange={(e) => setAccumulatorStake(e.target.value)}
                      className="w-24 bg-[#0a1118] border border-purple-500/40 rounded px-2 py-1 text-xs text-right font-bold text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              )}

              {/* Summary Payout */}
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-gray-400">Potential Return:</span>
                <span className="text-base font-extrabold text-emerald-400 font-gaming">
                  {betType === 'accumulator' 
                    ? totalAccumulatorPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : selectedBets.reduce((sum, b) => {
                        const st = parseFloat(singleStakes[b.matchId + '_' + b.marketKey] || '100');
                        return sum + (st * b.odds);
                      }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
                  } <span className="text-xs text-white">PKR</span>
                </span>
              </div>

              {/* Place Bet Action Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClearBets}
                  className="p-2.5 bg-[#142332] hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-colors border border-[#1e344a]"
                  title="Clear slip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePlaceBets}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Placing Bet...</span>
                  ) : (
                    <>
                      <span>PLACE BET</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // MY BETS VIEW
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {myBets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
              <Award className="w-8 h-8 text-gray-600" />
              <p className="text-xs text-gray-400">No placed bets found.</p>
            </div>
          ) : (
            myBets.map((bet) => (
              <div
                key={bet.id}
                className={`p-3 rounded-xl border transition-all ${
                  bet.status === 'WON' 
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : bet.status === 'LOST'
                    ? 'bg-red-950/30 border-red-500/40'
                    : 'bg-[#121f2d] border-[#1d3348]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>ID: {bet.id.slice(-8)}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    bet.status === 'WON' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : bet.status === 'LOST'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : bet.status === 'CASHED_OUT'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  }`}>
                    {bet.status}
                  </span>
                </div>

                <div className="text-xs font-bold text-white truncate">
                  {bet.type === 'ACCUMULATOR' ? `Accumulator (${bet.selections?.length} matches)` : bet.matchTitle}
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-300">{bet.selectionName || 'Combo Pick'}</span>
                  <span className="text-cyan-400 font-extrabold font-gaming">
                    {bet.odds ? `${bet.odds.toFixed(2)}x` : `${bet.totalOdds?.toFixed(2)}x`}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-[#192b3d] flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Stake: <strong className="text-white">{bet.stake} PKR</strong></span>
                  <span className="text-emerald-400 font-bold">
                    {bet.status === 'WON' 
                      ? `Won: +${bet.actualPayout} PKR` 
                      : bet.status === 'LOST'
                      ? 'Lost'
                      : `To Win: ${bet.potentialPayout} PKR`
                    }
                  </span>
                </div>

                {/* Cashout Option for active bets */}
                {bet.status === 'ACTIVE' && (
                  <button
                    onClick={() => onCashout(bet.id)}
                    className="mt-2.5 w-full py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <span>⚡ Early Cashout ({(bet.stake * 0.88).toFixed(0)} PKR)</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
        {slipContent}
      </div>
    );
  }

  return (
    <div className="hidden xl:flex">
      {slipContent}
    </div>
  );
}
