import React, { useState } from 'react';
import { Wallet, PlusCircle, Bell, User, Shield, Flame, Activity, Plane, Trophy, Settings } from 'lucide-react';

export default function Header({ 
  user, 
  activeTab, 
  setActiveTab, 
  onOpenWallet, 
  onToggleAdmin, 
  onSecretAdminTrigger,
  isAdminOpen,
  onOpenAuth
}) {
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    setActiveTab('sports');
    const now = Date.now();
    if (now - lastClickTime < 1200) {
      const count = logoClicks + 1;
      if (count >= 5) {
        setLogoClicks(0);
        if (onSecretAdminTrigger) onSecretAdminTrigger();
      } else {
        setLogoClicks(count);
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c1520] border-b border-[#1c2c3e] shadow-xl">
      {/* Top micro-bar */}
      <div className="hidden md:flex justify-between items-center px-6 py-1 text-xs text-brand-textMuted bg-[#090f17] border-b border-[#162332]">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            1X-BET Live Betting Server: Online
          </span>
          <span>•</span>
          <span>24/7 VIP Customer Support</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-yellow-400 font-medium">Promo: 100% Welcome Bonus Active</span>
          <span>•</span>
          <span>Currency: <strong className="text-white">{user?.currency || 'PKR'}</strong></span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Logo and primary navigation */}
        <div className="flex items-center space-x-6">
          <div 
            onClick={handleLogoClick} 
            className="cursor-pointer flex items-center space-x-2 group select-none"
            title="1X-BET Global"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              1X
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-wider text-white font-gaming">
                BET<span className="text-cyan-400">.GLOBAL</span>
              </span>
              <span className="text-[10px] text-cyan-400/80 uppercase font-semibold tracking-widest -mt-1">
                Official Sportsbook
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#121e2c] p-1 rounded-xl border border-[#1d3045]">
            <button
              onClick={() => setActiveTab('sports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'sports' 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-[#1a2b3e]'
              }`}
            >
              <Trophy className="w-4 h-4 text-cyan-300" />
              <span>SPORTS</span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'live' 
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-[#1a2b3e]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>LIVE IN-PLAY</span>
            </button>

            <button
              onClick={() => setActiveTab('crash')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'crash' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-[#1a2b3e]'
              }`}
            >
              <Plane className="w-4 h-4 text-purple-300 animate-pulse" />
              <span>AVIATOR CRASH</span>
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded font-bold uppercase">HOT</span>
            </button>

            <button
              onClick={() => setActiveTab('casino')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'casino' 
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-[#1a2b3e]'
              }`}
            >
              <Flame className="w-4 h-4 text-yellow-400" />
              <span>CASINO</span>
            </button>
          </nav>
        </div>

        {/* Right User Actions & Wallet Balance */}
        <div className="flex items-center space-x-3">
          {/* Wallet Balance Widget */}
          <div 
            onClick={onOpenWallet}
            className="flex items-center space-x-3 bg-gradient-to-r from-[#122131] to-[#16273b] hover:from-[#16273b] hover:to-[#1b314a] px-3.5 py-1.5 rounded-xl border border-cyan-500/30 cursor-pointer transition-all shadow-inner group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Main Balance</span>
              <span className="text-base font-extrabold text-emerald-400 font-gaming">
                {user ? user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} <span className="text-xs text-white">{user?.currency || 'PKR'}</span>
              </span>
            </div>
            <button className="ml-1 bg-emerald-500 hover:bg-emerald-400 text-black px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-md hover:shadow-emerald-500/30 transition-all">
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deposit</span>
            </button>
          </div>

          {/* User Profile / Register Buttons */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div 
                onClick={() => onOpenAuth('login')}
                className="hidden sm:flex items-center space-x-2.5 bg-[#121e2c] border border-[#1d3045] px-3 py-1.5 rounded-xl cursor-pointer hover:border-cyan-500/40"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {user.username ? user.username[0].toUpperCase() : 'P'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-200">{user.username}</span>
                  <span className="text-[9px] text-cyan-400 font-mono">
                    {user.phone || '0300-***'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[#142232] hover:bg-[#1a2d42] text-gray-300 border border-[#1e344a] transition-colors"
                title="Create a new account"
              >
                +New Acc
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-200 hover:text-white bg-[#142334] hover:bg-[#1a2e44] border border-[#1f3750] transition-colors"
              >
                LOG IN
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 rounded-xl text-xs font-black text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                REGISTRATION
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar - Visible on mobile/tablet / Android APK */}
      <div className="lg:hidden flex items-center px-2.5 py-1.5 bg-[#09111a] border-t border-[#162536] overflow-x-auto gap-1.5 text-xs font-bold scrollbar-none select-none">
        <button
          onClick={() => setActiveTab('sports')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'sports'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white bg-[#101b27]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-cyan-300" />
          <span>SPORTS</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'live'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white bg-[#101b27]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>LIVE IN-PLAY</span>
        </button>

        <button
          onClick={() => setActiveTab('crash')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'crash'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white bg-[#101b27]'
          }`}
        >
          <Plane className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          <span>AVIATOR</span>
          <span className="text-[9px] bg-red-500 text-white px-1 py-0.2 rounded font-black">HOT</span>
        </button>

        {/* CASINO BUTTON - PROMINENT GOLDEN GLOW */}
        <button
          onClick={() => setActiveTab('casino')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-black ${
            activeTab === 'casino'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
              : 'text-amber-300 hover:text-amber-200 bg-[#1e190b] border border-amber-500/50'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>🎰 CASINO (10 GAMES)</span>
        </button>
      </div>
    </header>
  );
}
