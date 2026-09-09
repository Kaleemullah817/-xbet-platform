import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import SportsSidebar from './components/SportsSidebar';
import MatchCard from './components/MatchCard';
import BetSlip from './components/BetSlip';
import CrashGame from './components/CrashGame';
import CasinoLobby from './components/CasinoLobby';
import WalletModal from './components/WalletModal';
import AdminDrawer from './components/AdminDrawer';
import AdminPortal from './components/AdminPortal';
import AuthModal from './components/AuthModal';
import { Flame, Trophy, Activity, Filter, Search } from 'lucide-react';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [selectedBets, setSelectedBets] = useState([]);
  const [crashState, setCrashState] = useState({
    status: 'STARTING',
    multiplier: 1.00,
    countdown: 5,
    roundId: 101,
    activeBets: [],
    history: [1.25, 3.40, 1.08, 14.82, 2.15]
  });

  const [activeTab, setActiveTab] = useState('sports'); // 'sports' | 'live' | 'crash' | 'casino'
  const [selectedSport, setSelectedSport] = useState('all');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'live'
  const [searchQuery, setSearchQuery] = useState('');

  const [viewMode, setViewMode] = useState(
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'admin' : 'player'
  );
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');

  useEffect(() => {
    const handlePopState = () => {
      setViewMode(window.location.pathname.startsWith('/admin') ? 'admin' : 'player');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize Socket.io connection & initial API fetches
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    // Initial load through REST
    fetchInitialData();

    // Socket Event Listeners
    newSocket.on('init_state', (data) => {
      if (data.user) setUser(data.user);
      if (data.matches) setMatches(data.matches);
      if (data.bets) setMyBets(data.bets);
      if (data.crashState) setCrashState(data.crashState);
    });

    newSocket.on('user_update', (updatedUser) => {
      setUser(updatedUser);
    });

    newSocket.on('matches_update', (updatedMatches) => {
      setMatches(updatedMatches);
    });

    newSocket.on('bets_update', (updatedBets) => {
      setMyBets(updatedBets);
    });

    newSocket.on('crash_state', (state) => {
      setCrashState(state);
    });

    newSocket.on('crash_tick', (tick) => {
      setCrashState(prev => ({
        ...prev,
        multiplier: tick.multiplier,
        status: tick.status,
        activeBets: tick.activeBets || prev.activeBets
      }));
    });

    return () => newSocket.disconnect();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [userRes, matchesRes, betsRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/matches'),
        fetch('/api/bets/my')
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setTransactions(userData.transactions || []);
      }
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }
      if (betsRes.ok) {
        const betsData = await betsRes.json();
        setMyBets(betsData);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  // Toggle selection on Bet Slip
  const handleSelectOdd = (oddSelection) => {
    setSelectedBets(prev => {
      const existsIndex = prev.findIndex(
        b => b.matchId === oddSelection.matchId && b.marketKey === oddSelection.marketKey && b.outcomeKey === oddSelection.outcomeKey
      );

      if (existsIndex > -1) {
        // Toggle off
        return prev.filter((_, i) => i !== existsIndex);
      } else {
        // Replace existing selection for the same match & market if different outcome
        const filtered = prev.filter(
          b => !(b.matchId === oddSelection.matchId && b.marketKey === oddSelection.marketKey)
        );
        return [...filtered, oddSelection];
      }
    });
  };

  const handleRemoveBet = (index) => {
    setSelectedBets(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearBets = () => {
    setSelectedBets([]);
  };

  const handleCashout = async (betId) => {
    try {
      const res = await fetch('/api/bets/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cashout');

      fetchInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter matches based on sidebar selections and search
  const filteredMatches = matches.filter(match => {
    if (activeTab === 'live' && !match.isLive) return false;
    if (filterMode === 'live' && !match.isLive) return false;
    if (selectedSport !== 'all' && match.sport !== selectedSport) return false;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchText = `${match.homeTeam} ${match.awayTeam} ${match.league} ${match.sportName}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  if (viewMode === 'admin') {
    return (
      <AdminPortal
        onBackToSite={() => {
          setViewMode('player');
          window.history.pushState({}, '', '/');
        }}
        socket={socket}
        matches={matches}
        onUpdateMatches={fetchInitialData}
        user={user}
        onUpdateUser={fetchInitialData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1119] text-gray-100 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWallet={() => {
          if (!user) {
            setAuthMode('register');
            setIsAuthOpen(true);
          } else {
            setIsWalletOpen(true);
          }
        }}
        onToggleAdmin={() => {
          setViewMode('admin');
          window.history.pushState({}, '', '/admin');
        }}
        isAdminOpen={false}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sports Navigation Sidebar */}
        <SportsSidebar
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          matches={matches}
        />

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#0b131d]">
          {activeTab === 'crash' ? (
            <CrashGame
              crashState={crashState}
              user={user}
              onUpdateUser={fetchInitialData}
            />
          ) : activeTab === 'casino' ? (
            <CasinoLobby
              onSwitchToCrash={() => setActiveTab('crash')}
              user={user}
              onUpdateUser={fetchInitialData}
            />
          ) : (
            // Sports & Live Feed
            <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto w-full">
              {/* Promotional Hero Banner */}
              <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900 via-cyan-900 to-[#0c1b2b] p-6 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>SUPER MATCH OF THE DAY</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white font-gaming tracking-wide">
                    PSL & CHAMPIONS TROPHY SPECIAL
                  </h2>
                  <p className="text-xs text-gray-300 max-w-lg">
                    Highest live odds on Lahore Qalandars, Karachi Kings, Real Madrid and Manchester City with instant payouts!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSport('cricket');
                    setActiveTab('sports');
                  }}
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all whitespace-nowrap"
                >
                  BET ON CRICKET
                </button>
              </div>

              {/* Feed Header */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-extrabold text-white font-gaming tracking-wider uppercase">
                    {activeTab === 'live' ? '🔥 Live In-Play Matches' : `${selectedSport.toUpperCase()} FIXTURES`}
                  </h3>
                  <span className="text-xs bg-[#16293c] text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {filteredMatches.length} Matches
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Odds update live every 2s</span>
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-3">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-16 bg-[#0e1824] rounded-2xl border border-[#1a2d40] text-gray-400 space-y-2">
                    <p className="font-semibold text-sm">No matches found for your filter.</p>
                    <p className="text-xs text-gray-500">Try changing the sport or search query.</p>
                  </div>
                ) : (
                  filteredMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onSelectOdd={handleSelectOdd}
                      selectedBets={selectedBets}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Bet Slip & Bets History Sidebar */}
        <BetSlip
          selectedBets={selectedBets}
          onRemoveBet={handleRemoveBet}
          onClearBets={handleClearBets}
          myBets={myBets}
          user={user}
          onBetPlaced={fetchInitialData}
          onCashout={handleCashout}
        />
      </div>

      {/* Wallet Deposit/Withdrawal Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        user={user}
        transactions={transactions}
        onUpdateUser={fetchInitialData}
      />

      {/* User Registration and Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          fetchInitialData();
        }}
      />

      {/* Admin Test Control Drawer */}
      <AdminDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        matches={matches}
        onUpdateMatches={fetchInitialData}
        onUpdateUser={fetchInitialData}
      />
    </div>
  );
}
