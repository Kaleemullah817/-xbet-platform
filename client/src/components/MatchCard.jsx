import React from 'react';
import { Activity, Flame, TrendingUp, TrendingDown, Clock, Shield } from 'lucide-react';

export default function MatchCard({ match, onSelectOdd, selectedBets = [] }) {
  const isSelected = (marketKey, outcomeKey) => {
    return selectedBets.some(
      b => b.matchId === match.id && b.marketKey === marketKey && b.outcomeKey === outcomeKey
    );
  };

  const sportIcons = {
    cricket: '🏏',
    football: '⚽',
    tennis: '🎾',
    basketball: '🏀'
  };

  return (
    <div className="bg-[#101b27] hover:bg-[#13202e] border border-[#1b2b3d] hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 shadow-md">
      {/* Top Header: League, Live Indicator, and Time/Status */}
      <div className="flex items-center justify-between border-b border-[#182737] pb-2.5 mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-base">{sportIcons[match.sport] || '🏆'}</span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
            {match.league}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {match.isLive ? (
            <div className="flex items-center space-x-1.5 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full text-red-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
              <span>LIVE</span>
              <span className="text-gray-400 font-normal">| {match.status}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-gray-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>{match.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Teams & Score Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4">
        {/* Teams and scores column */}
        <div className="md:col-span-6 space-y-2">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-sm font-bold text-white tracking-wide">{match.homeTeam}</span>
            </div>
            <span className="text-base font-extrabold text-cyan-400 font-gaming">
              {match.homeScore}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-sm font-bold text-white tracking-wide">{match.awayTeam}</span>
            </div>
            <span className="text-base font-extrabold text-amber-400 font-gaming">
              {match.awayScore}
            </span>
          </div>

          {/* Cricket Live Inning Details if applicable */}
          {match.currentOver && (
            <div className="flex items-center justify-between text-xs bg-[#0b131c] px-2.5 py-1.5 rounded-lg border border-[#172534] text-gray-400 mt-1">
              <span>This Over: <strong className="text-emerald-400 font-mono tracking-wider">{match.currentOver}</strong></span>
              <span>{match.target || match.requiredRunRate}</span>
            </div>
          )}
        </div>

        {/* Odds Markets Buttons Column */}
        <div className="md:col-span-6 flex flex-col space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex justify-between px-1">
            <span>Match Winner (1X2)</span>
            <span className="text-cyan-400/80">Click odd to bet</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* 1 / Home Win */}
            <button
              onClick={() => onSelectOdd({
                matchId: match.id,
                matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                marketKey: 'matchWinner',
                marketName: 'Match Winner',
                outcomeKey: 'home',
                selectionName: match.homeTeam,
                odds: match.markets.matchWinner.home
              })}
              className={`p-2 rounded-lg text-center transition-all flex flex-col items-center justify-center border ${
                isSelected('matchWinner', 'home')
                  ? 'bg-gradient-to-b from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-[#152332] hover:bg-[#1b2d40] border-[#223549] text-gray-200'
              }`}
            >
              <span className="text-[10px] font-bold text-gray-400 truncate w-full">1 ({match.homeTeam.split(' ')[0]})</span>
              <span className="text-sm font-extrabold text-cyan-300 font-gaming">
                {match.markets.matchWinner.home.toFixed(2)}
              </span>
            </button>

            {/* Draw if available (football) */}
            {match.markets.matchWinner.draw ? (
              <button
                onClick={() => onSelectOdd({
                  matchId: match.id,
                  matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                  marketKey: 'matchWinner',
                  marketName: 'Match Winner',
                  outcomeKey: 'draw',
                  selectionName: 'Draw (X)',
                  odds: match.markets.matchWinner.draw
                })}
                className={`p-2 rounded-lg text-center transition-all flex flex-col items-center justify-center border ${
                  isSelected('matchWinner', 'draw')
                    ? 'bg-gradient-to-b from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-[#152332] hover:bg-[#1b2d40] border-[#223549] text-gray-200'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400">X (Draw)</span>
                <span className="text-sm font-extrabold text-cyan-300 font-gaming">
                  {match.markets.matchWinner.draw.toFixed(2)}
                </span>
              </button>
            ) : (
              // Extra secondary market (like Over/Under)
              match.markets.totalRuns && (
                <button
                  onClick={() => onSelectOdd({
                    matchId: match.id,
                    matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                    marketKey: 'totalRuns',
                    marketName: `Over ${match.markets.totalRuns.target} Runs`,
                    outcomeKey: 'over',
                    selectionName: `Over ${match.markets.totalRuns.target}`,
                    odds: match.markets.totalRuns.over
                  })}
                  className={`p-2 rounded-lg text-center transition-all flex flex-col items-center justify-center border ${
                    isSelected('totalRuns', 'over')
                      ? 'bg-gradient-to-b from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg'
                      : 'bg-[#152332] hover:bg-[#1b2d40] border-[#223549] text-gray-200'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-400 truncate w-full">Over {match.markets.totalRuns.target}</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-gaming">
                    {match.markets.totalRuns.over.toFixed(2)}
                  </span>
                </button>
              )
            )}

            {/* 2 / Away Win */}
            <button
              onClick={() => onSelectOdd({
                matchId: match.id,
                matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                marketKey: 'matchWinner',
                marketName: 'Match Winner',
                outcomeKey: 'away',
                selectionName: match.awayTeam,
                odds: match.markets.matchWinner.away
              })}
              className={`p-2 rounded-lg text-center transition-all flex flex-col items-center justify-center border ${
                isSelected('matchWinner', 'away')
                  ? 'bg-gradient-to-b from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-[#152332] hover:bg-[#1b2d40] border-[#223549] text-gray-200'
              }`}
            >
              <span className="text-[10px] font-bold text-gray-400 truncate w-full">2 ({match.awayTeam.split(' ')[0]})</span>
              <span className="text-sm font-extrabold text-cyan-300 font-gaming">
                {match.markets.matchWinner.away.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
