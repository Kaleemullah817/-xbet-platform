import React, { useState } from 'react';
import { Flame, Sparkles, Trophy, Play, Star, ArrowLeft, Gamepad2, Layers, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

// Import all 9 interactive casino components
import MinesGame from './casino/MinesGame';
import PlinkoGame from './casino/PlinkoGame';
import DiceGame from './casino/DiceGame';
import DailyWheelModal from './casino/DailyWheelModal';
import SlotsGame from './casino/SlotsGame';
import RouletteGame from './casino/RouletteGame';
import BlackjackGame from './casino/BlackjackGame';
import TeenPattiGame from './casino/TeenPattiGame';
import AndarBaharGame from './casino/AndarBaharGame';

export default function CasinoLobby({ onSwitchToCrash, user, onUpdateUser }) {
  const [activeGame, setActiveGame] = useState(null); // null | 'mines' | 'plinko' | 'dice' | 'wheel' | 'slots' | 'roulette' | 'blackjack' | 'teen_patti' | 'andar_bahar'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'quick' | 'cards' | 'table' | 'slots'

  const allGames = [
    {
      id: 'crash',
      title: 'Aviator Crash',
      category: 'quick',
      categoryLabel: 'Quick Game',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80',
      badge: 'HOT #1',
      badgeColor: 'bg-red-600',
      description: 'Real-time rocket flight with 10-slot exact crash multiplier rig!'
    },
    {
      id: 'mines',
      title: '1X-Mines Turbo',
      category: 'quick',
      categoryLabel: 'Quick Game',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
      badge: 'HIGH RTP',
      badgeColor: 'bg-emerald-600',
      description: '5x5 grid of gems & hidden bombs. Cash out your profit anytime!'
    },
    {
      id: 'plinko',
      title: 'Plinko Master',
      category: 'quick',
      categoryLabel: 'Quick Game',
      image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
      badge: 'UP TO 16X',
      badgeColor: 'bg-amber-600',
      description: 'Drop balls through the pyramid into multiplier buckets!'
    },
    {
      id: 'dice',
      title: 'Dice High Roller',
      category: 'quick',
      categoryLabel: 'Quick Game',
      image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop&q=80',
      badge: '98X JACKPOT',
      badgeColor: 'bg-cyan-600',
      description: 'Set your target number and roll over or under for huge wins!'
    },
    {
      id: 'wheel',
      title: 'Daily Lucky Spin Wheel',
      category: 'slots',
      categoryLabel: 'Daily Bonus',
      image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
      badge: 'FREE DAILY SPIN',
      badgeColor: 'bg-yellow-500 text-black',
      description: 'Spin every 24 hours to win up to 5,000 PKR instantly!'
    },
    {
      id: 'slots',
      title: '3-in-1 Classic Slot Machine',
      category: 'slots',
      categoryLabel: 'Slot Games',
      image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=500&auto=format&fit=crop&q=80',
      badge: '3 THEMES',
      badgeColor: 'bg-purple-600',
      description: 'Lucky 777 Fruits, Pharaoh’s Gold & Dragon Wilds with up to 80x payouts!'
    },
    {
      id: 'roulette',
      title: 'European Roulette',
      category: 'table',
      categoryLabel: 'Table Game',
      image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
      badge: '36X PAYOUT',
      badgeColor: 'bg-rose-600',
      description: 'European 0-36 wheel with Red/Black, Even/Odd, and straight numbers!'
    },
    {
      id: 'blackjack',
      title: 'Blackjack Classic 21',
      category: 'cards',
      categoryLabel: 'Card Game',
      image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&auto=format&fit=crop&q=80',
      badge: 'NATURAL 3:2',
      badgeColor: 'bg-emerald-700',
      description: 'Beat the dealer to 21 with Hit, Stand, and authentic casino rules!'
    },
    {
      id: 'teen_patti',
      title: 'Teen Patti 20-20',
      category: 'cards',
      categoryLabel: 'Card Game',
      image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=500&auto=format&fit=crop&q=80',
      badge: 'DESI FAVORITE',
      badgeColor: 'bg-red-700',
      description: 'Desi 3-card showdown. Bet on Player A, Player B, or 8x Tie!'
    },
    {
      id: 'andar_bahar',
      title: 'Andar Bahar Traditional',
      category: 'cards',
      categoryLabel: 'Card Game',
      image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop&q=80',
      badge: 'TRADITIONAL',
      badgeColor: 'bg-amber-600',
      description: 'Match the center Joker card on Andar or Bahar for instant doubling!'
    }
  ];

  // If a game is active, render its interactive screen
  if (activeGame === 'mines') {
    return <MinesGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'plinko') {
    return <PlinkoGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'dice') {
    return <DiceGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'wheel') {
    return <DailyWheelModal onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'slots') {
    return <SlotsGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'roulette') {
    return <RouletteGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'blackjack') {
    return <BlackjackGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'teen_patti') {
    return <TeenPattiGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }
  if (activeGame === 'andar_bahar') {
    return <AndarBaharGame onBack={() => setActiveGame(null)} user={user} onUpdateUser={onUpdateUser} />;
  }

  const filteredGames = selectedCategory === 'all'
    ? allGames
    : allGames.filter(g => g.category === selectedCategory);

  const handleLaunchGame = (gameId) => {
    if (gameId === 'crash') {
      onSwitchToCrash();
    } else {
      setActiveGame(gameId);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto bg-[#070e17]">
      {/* Featured Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 via-purple-900 to-blue-900 p-6 md:p-8 border border-amber-400/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-300/40 px-3 py-1 rounded-full text-amber-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>10 FULL PLAYABLE CASINO TITLES</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white font-gaming tracking-tight">
            1X-CASINO SUITE
          </h1>
          <p className="text-sm text-gray-200">
            Play real-time Aviator crash, Mines, Plinko, Dice, 3 Slots, European Roulette, Blackjack, Teen Patti, Andar Bahar, and spin the Daily Lucky Wheel!
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onSwitchToCrash}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-red-600/30 active:scale-95 transition-all flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH AVIATOR (HOT)</span>
            </button>
            <button
              onClick={() => setActiveGame('mines')}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center space-x-2"
            >
              <span>💎 PLAY MINES TURBO</span>
            </button>
            <button
              onClick={() => setActiveGame('wheel')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>FREE LUCKY WHEEL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All 10 Games' },
          { id: 'quick', label: 'Quick & Crash' },
          { id: 'cards', label: 'Card Games (Desi & VIP)' },
          { id: 'table', label: 'Table Games' },
          { id: 'slots', label: 'Slots & Bonus Wheel' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-bold'
                : 'bg-[#101b27] text-gray-400 hover:text-white hover:bg-[#162536]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Casino Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGames.map((g) => (
          <div
            key={g.id}
            onClick={() => handleLaunchGame(g.id)}
            className="group relative rounded-2xl overflow-hidden border border-[#1d3145] bg-[#0e1724] hover:border-cyan-400/60 transition-all cursor-pointer shadow-lg hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="h-40 overflow-hidden relative">
              <img
                src={g.image}
                alt={g.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1724] via-[#0e1724]/40 to-transparent"></div>
              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md ${g.badgeColor}`}>
                {g.badge}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{g.categoryLabel}</span>
                <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                  {g.title}
                </h4>
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                  {g.description}
                </p>
              </div>

              <button className="w-full py-2.5 bg-[#142333] group-hover:bg-cyan-500 group-hover:text-black text-cyan-300 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY NOW</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
