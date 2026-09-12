import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  CircleDot, 
  Compass, 
  Calendar, 
  Star,
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  X
} from 'lucide-react';

export default function SportsSidebar({ 
  selectedSport, 
  setSelectedSport, 
  filterMode, 
  setFilterMode,
  searchQuery,
  setSearchQuery,
  matches = [],
  isCollapsed: externalIsCollapsed,
  setIsCollapsed: externalSetIsCollapsed
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const setIsCollapsed = externalSetIsCollapsed !== undefined ? externalSetIsCollapsed : setInternalCollapsed;

  const sports = [
    { id: 'all', name: 'All Sports', icon: '🌐', count: matches.length },
    { id: 'cricket', name: 'Cricket', icon: '🏏', count: matches.filter(m => m.sport === 'cricket').length, isHot: true },
    { id: 'football', name: 'Football', icon: '⚽', count: matches.filter(m => m.sport === 'football').length, isHot: true },
    { id: 'tennis', name: 'Tennis', icon: '🎾', count: matches.filter(m => m.sport === 'tennis').length },
    { id: 'basketball', name: 'Basketball', icon: '🏀', count: matches.filter(m => m.sport === 'basketball').length },
    { id: 'esports', name: 'Esports (CS / Dota)', icon: '🎮', count: 0 },
    { id: 'table_tennis', name: 'Table Tennis', icon: '🏓', count: 0 }
  ];

  const topLeagues = [
    { name: 'Pakistan Super League (PSL)', sport: 'cricket', flag: '🇵🇰' },
    { name: 'Indian Premier League (IPL)', sport: 'cricket', flag: '🇮🇳' },
    { name: 'UEFA Champions League', sport: 'football', flag: '🇪🇺' },
    { name: 'English Premier League', sport: 'football', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Grand Slam Championship', sport: 'tennis', flag: '🏆' }
  ];

  // When MINIMIZED / COLLAPSED to side:
  if (isCollapsed) {
    return (
      <aside className="w-11 sm:w-12 bg-[#0d1622] border-r border-[#1a2b3d] flex flex-col items-center py-3 select-none h-[calc(100vh-64px)] sticky top-16 z-20 shrink-0 transition-all duration-300">
        {/* Expand Arrow Button */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 flex items-center justify-center transition-all shadow-lg active:scale-95 group mb-4"
          title="Expand Matches & Sports Sidebar"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Quick Sports Icon Strip */}
        <div className="flex flex-col items-center space-y-3 text-sm">
          {sports.slice(0, 5).map((sport) => (
            <button
              key={sport.id}
              onClick={() => {
                setSelectedSport(sport.id);
                setIsCollapsed(false);
              }}
              className={`p-1.5 rounded-lg text-sm hover:bg-[#152332] transition-transform hover:scale-110 ${
                selectedSport === sport.id ? 'bg-cyan-500/20 ring-1 ring-cyan-400' : ''
              }`}
              title={`${sport.name} (${sport.count})`}
            >
              {sport.icon}
            </button>
          ))}
        </div>

        {/* Rotated Vertical Label */}
        <div className="flex-1 flex items-center justify-center py-6">
          <span className="text-[10px] font-black tracking-widest text-cyan-400/70 uppercase [writing-mode:vertical-rl] rotate-180 select-none">
            {filterMode === 'live' ? '🔴 LIVE' : 'MATCHES'}
          </span>
        </div>

        {/* Bottom Expand Trigger */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-[#152332] transition-colors"
          title="Click to expand"
        >
          <Filter className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // When FULLY EXPANDED:
  return (
    <aside className="w-64 bg-[#0d1622] border-r border-[#1a2b3d] flex flex-col h-[calc(100vh-64px)] sticky top-16 select-none z-20 shrink-0 transition-all duration-300">
      {/* Minimize Header Bar with Arrow */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#182737] bg-[#09111b]">
        <span className="text-xs font-black text-white font-gaming tracking-wide flex items-center space-x-1.5">
          <Trophy className="w-4 h-4 text-cyan-400" />
          <span>SPORTS & MATCHES</span>
        </span>
        
        {/* Minimize Arrow Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#142334] hover:bg-[#1c334d] text-cyan-400 hover:text-cyan-200 border border-cyan-500/30 text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
          title="Minimize sidebar to side"
        >
          <span>Hide</span>
          <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* Search match input */}
      <div className="p-3 border-b border-[#182737]">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131f2d] border border-[#20344a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter Pills (All Matches / Live Only) */}
        <div className="grid grid-cols-2 gap-1.5 mt-2.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`text-xs py-1.5 px-2 rounded-md font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                : 'bg-[#152332] text-gray-400 hover:text-white'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilterMode('live')}
            className={`text-xs py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center space-x-1 ${
              filterMode === 'live'
                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30'
                : 'bg-[#152332] text-gray-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            <span>Live Only</span>
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Top Championships Section */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span className="flex items-center">
              <Star className="w-3.5 h-3.5 text-amber-400 mr-1.5 inline" />
              Top Championships
            </span>
          </div>
          <div className="space-y-0.5">
            {topLeagues.map((league, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedSport(league.sport);
                  setSearchQuery(league.name);
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-[#16273b] hover:text-white cursor-pointer transition-colors group"
              >
                <span className="flex items-center truncate">
                  <span className="mr-2 text-sm">{league.flag}</span>
                  <span className="truncate group-hover:text-cyan-400">{league.name}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Sports Categories */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Sports Categories
          </div>
          <div className="space-y-1">
            {sports.map((sport) => {
              const isSelected = selectedSport === sport.id;
              return (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-500/50 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-[#152332] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{sport.icon}</span>
                    <span>{sport.name}</span>
                    {sport.isHot && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 px-1 py-0.2 rounded font-bold">
                        HOT
                      </span>
                    )}
                  </div>
                  {sport.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-cyan-500 text-black' : 'bg-[#1e2f42] text-gray-300'
                    }`}>
                      {sport.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Promo Banner */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-blue-950/80 to-purple-950/80 border border-cyan-500/20 text-center">
          <span className="text-xs font-bold text-amber-300 block mb-1">⚡ EXPRESS ACCUMULATOR</span>
          <p className="text-[11px] text-gray-300 mb-2">
            Get +15% bonus payout on 3+ combo match selections!
          </p>
          <div className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded font-semibold inline-block">
            Auto-applied in Bet Slip
          </div>
        </div>
      </div>
    </aside>
  );
}
