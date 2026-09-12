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
import AdminAuthModal from './components/AdminAuthModal';
import { Flame, Trophy, Activity, Filter, Search, Plane, Wallet, Layers, ChevronRight, ChevronLeft, X } from 'lucide-react';

function getStoredUser() {
  try {
    const saved = localStorage.getItem('xbet_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(getStoredUser);
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [isMobileBetSlipOpen, setIsMobileBetSlipOpen] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    typeof window !== 'undefined' && sessionStorage.getItem('1x_admin_auth') === 'true'
  );
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState(
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && sessionStorage.getItem('1x_admin_auth') === 'true'
      ? 'admin'
      : 'player'
  );

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        const isAuth = sessionStorage.getItem('1x_admin_auth') === 'true';
        if (isAuth) {
          setIsAdminAuthenticated(true);
          setViewMode('admin');
        } else {
          setViewMode('player');
          setIsAdminAuthModalOpen(true);
        }
      } else {
        setViewMode('player');
      }
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSecretAdminTrigger = () => {
    const isAuth = sessionStorage.getItem('1x_admin_auth') === 'true';
    if (isAuth) {
      setIsAdminAuthenticated(true);
      setViewMode('admin');
      window.history.pushState({}, '', '/admin');
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminAuthModalOpen(false);
    setViewMode('admin');
    window.history.pushState({}, '', '/admin');
  };

  // Initialize Socket.io connection & initial API fetches
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    // Initial load through REST
    fetchInitialData();

    newSocket.on('connect', () => {
      const stored = getStoredUser();
      if (stored?.id) {
        newSocket.emit('auth_user', { userId: stored.id });
      }
    });

    // Socket Event Listeners
    newSocket.on('init_state', (data) => {
      const stored = getStoredUser();
      if (!stored && data.user) {
        setUser(data.user);
        localStorage.setItem('xbet_user', JSON.stringify(data.user));
      }
      if (data.matches) setMatches(data.matches);
      if (data.bets && !stored) setMyBets(data.bets);
      if (data.crashState) setCrashState(data.crashState);
    });

    newSocket.on('user_update', (updatedUser) => {
      const stored = getStoredUser();
      if (!stored || (updatedUser && updatedUser.id === stored.id)) {
        setUser(updatedUser);
        if (updatedUser) {
          localStorage.setItem('xbet_user', JSON.stringify(updatedUser));
        }
      }
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
      const stored = getStoredUser();
      const currentId = stored?.id;
      const headers = currentId ? { 'x-user-id': currentId } : {};

      const [userRes, matchesRes, betsRes] = await Promise.all([
        fetch('/api/me', { headers }),
        fetch('/api/matches'),
        fetch('/api/bets/my', { headers })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setUser(userData.user);
          localStorage.setItem('xbet_user', JSON.stringify(userData.user));
        }
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

  if (viewMode === 'admin' && isAdminAuthenticated) {
    return (
      <AdminPortal
        onBackToSite={() => {
          setViewMode('player');
          window.history.pushState({}, '', '/');
        }}
        onLockAdmin={() => {
          sessionStorage.removeItem('1x_admin_auth');
          setIsAdminAuthenticated(false);
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
        onToggleAdmin={handleSecretAdminTrigger}
        onSecretAdminTrigger={handleSecretAdminTrigger}
        isAdminOpen={false}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sports Navigation Sidebar (Visible for Sports & Live) */}
        {(activeTab === 'sports' || activeTab === 'live') && (
          <SportsSidebar
            selectedSport={selectedSport}
            setSelectedSport={setSelectedSport}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            matches={matches}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

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
            <div className="p-3 md:p-6 space-y-4 max-w-5xl mx-auto w-full">
              {/* Mobile Quick Filter Toggle */}
              <div className="lg:hidden flex items-center justify-between pb-1">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="px-3 py-1.5 bg-[#142232] hover:bg-[#1a2d42] text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                >
                  {isSidebarCollapsed ? (
                    <>
                      <Filter className="w-3.5 h-3.5" />
                      <span>All Matches & Leagues</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                      <span>Hide Sidebar</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Live odds</span>
                </div>
              </div>

              {/* Promotional Hero Banner */}
              <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900 via-cyan-900 to-[#0c1b2b] p-5 md:p-6 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>SUPER MATCH OF THE DAY</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-black text-white font-gaming tracking-wide">
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
                  className="w-full md:w-auto px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all whitespace-nowrap"
                >
                  BET ON CRICKET
                </button>
              </div>

              {/* Feed Header */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm md:text-base font-extrabold text-white font-gaming tracking-wider uppercase">
                    {activeTab === 'live' ? '🔥 Live In-Play Matches' : `${selectedSport.toUpperCase()} FIXTURES`}
                  </h3>
                  <span className="text-xs bg-[#16293c] text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {filteredMatches.length} Matches
                  </span>
                </div>

                <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Odds update live every 2s</span>
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-3 pb-16 lg:pb-4">
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

        {/* Right Bet Slip & Bets History Sidebar (Desktop XL) */}
        <BetSlip
          selectedBets={selectedBets}
          onRemoveBet={handleRemoveBet}
          onClearBets={handleClearBets}
          myBets={myBets}
          user={user}
          onBetPlaced={fetchInitialData}
          onCashout={handleCashout}
          isMobile={false}
        />
      </div>

      {/* Mobile Floating Bet Slip Trigger */}
      {selectedBets.length > 0 && !isMobileBetSlipOpen && (
        <button
          onClick={() => setIsMobileBetSlipOpen(true)}
          className="xl:hidden fixed bottom-16 right-4 z-40 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 border border-white/40 active:scale-95 transition-all"
        >
          <Layers className="w-4 h-4 text-black" />
          <span className="text-xs uppercase tracking-wider font-extrabold">Bet Slip</span>
          <span className="bg-black text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
            {selectedBets.length}
          </span>
        </button>
      )}

      {/* Mobile Bet Slip Modal */}
      {isMobileBetSlipOpen && (
        <BetSlip
          selectedBets={selectedBets}
          onRemoveBet={handleRemoveBet}
          onClearBets={handleClearBets}
          myBets={myBets}
          user={user}
          onBetPlaced={fetchInitialData}
          onCashout={handleCashout}
          isMobile={true}
          onClose={() => setIsMobileBetSlipOpen(false)}
        />
      )}

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden sticky bottom-0 z-40 bg-[#080d14]/95 backdrop-blur-md border-t border-[#1a2d40] px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setActiveTab('sports');
            setFilterMode('all');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'sports'
              ? 'text-cyan-400 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold">Sports</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('live');
            setFilterMode('live');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'live'
              ? 'text-cyan-400 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <Activity className="w-4 h-4 mb-0.5" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
          </div>
          <span className="text-[10px] font-bold">Live</span>
        </button>

        {/* Casino - Big & Prominently Highlighted */}
        <button
          onClick={() => setActiveTab('casino')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'casino'
              ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-400 font-black border border-amber-500/50 shadow-lg shadow-amber-500/20 scale-105'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}
        >
          <span className="text-base leading-none">🎰</span>
          <span className="text-[10px] font-black tracking-wider text-amber-300">CASINO</span>
        </button>

        <button
          onClick={() => setActiveTab('crash')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'crash'
              ? 'text-cyan-400 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Plane className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold">Aviator</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setAuthMode('login');
              setIsAuthOpen(true);
            } else {
              setIsWalletOpen(true);
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all"
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold">Cashier</span>
        </button>

        <button
          onClick={() => setIsMobileBetSlipOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <Layers className="w-4 h-4 mb-0.5" />
          {selectedBets.length > 0 && (
            <span className="absolute top-0.5 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center justify-center">
              {selectedBets.length}
            </span>
          )}
          <span className="text-[10px] font-bold">Slip</span>
        </button>
      </nav>

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

      {/* Secret Admin Master PIN Gateway Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          if (window.location.pathname.startsWith('/admin')) {
            window.history.pushState({}, '', '/');
          }
        }}
        onSuccess={handleAdminAuthSuccess}
      />
    </div>
  );
}
