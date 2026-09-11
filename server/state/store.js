import { v4 as uuidv4 } from 'uuid';

// In-memory persistent state store for 1xBet Web Platform
class AppState {
  constructor() {
    this.users = [
      {
        id: 'usr_1001',
        username: 'Player_777',
        phone: '03001234567',
        email: 'player@1xbet.com',
        password: 'password123',
        balance: 0.00, // Real betting: starts at 0 until deposit approved
        currency: 'PKR',
        vipLevel: 'Standard Member',
        status: 'ACTIVE',
        createdAt: Date.now() - 86400000,
        totalBetsPlaced: 0,
        totalWinnings: 0
      }
    ];

    // Current active session user
    this.currentUserId = 'usr_1001';

    this.transactions = [
      {
        id: 'tx_init_1',
        type: 'DEPOSIT',
        method: 'EasyPaisa',
        amount: 10000.00,
        status: 'COMPLETED',
        timestamp: Date.now() - 3600000
      },
      {
        id: 'tx_init_2',
        type: 'BONUS',
        method: 'Welcome Bonus',
        amount: 2500.00,
        status: 'COMPLETED',
        timestamp: Date.now() - 3500000
      }
    ];

    this.adminPaymentAccounts = {
      EasyPaisa: {
        accountTitle: 'Shahid Khan',
        accountNumber: '0317-7229994',
        instructions: 'EasyPaisa app se Send Money karein. Phir 11 digit TID aur payment screenshot yahan submit karein.'
      },
      JazzCash: {
        accountTitle: 'Shahid Khan',
        accountNumber: '0302-1234567',
        instructions: 'JazzCash app se Send Money karein. Phir 12 digit TID aur payment screenshot yahan submit karein.'
      },
      BankTransfer: {
        accountTitle: 'Shahid Khan',
        accountNumber: 'PK12MEZN00012345678901',
        bankName: 'Meezan Bank Ltd',
        instructions: 'Direct bank transfer karein aur transaction receipt attach karein.'
      }
    };

    this.depositRequests = [];

    this.matches = [
      {
        id: 'cricket_psl_01',
        sport: 'cricket',
        sportName: 'Cricket',
        league: 'Pakistan Super League (PSL)',
        homeTeam: 'Lahore Qalandars',
        awayTeam: 'Karachi Kings',
        isLive: true,
        status: '2nd Inning (Overs: 14.3)',
        homeScore: '178/5 (20.0)',
        awayScore: '132/3 (14.3)',
        target: 'Target: 179',
        requiredRunRate: '8.54 RPO',
        currentOver: '1 4 . 2 1w 6',
        startTime: 'Live Now',
        markets: {
          matchWinner: {
            home: 1.82,
            away: 2.05
          },
          totalRuns: {
            target: 185.5,
            over: 1.90,
            under: 1.88
          },
          nextOverRuns: {
            overNumber: 15,
            runsLine: 9.5,
            over: 1.85,
            under: 1.95
          },
          topBatter: {
            lahore: 2.10,
            karachi: 1.95
          }
        },
        stats: {
          wickets: '5 vs 3',
          sixes: '7 vs 5',
          fours: '14 vs 11'
        }
      },
      {
        id: 'cricket_ipl_02',
        sport: 'cricket',
        sportName: 'Cricket',
        league: 'Indian Premier League (IPL)',
        homeTeam: 'Mumbai Indians',
        awayTeam: 'Chennai Super Kings',
        isLive: true,
        status: '1st Inning (Overs: 9.4)',
        homeScore: '89/2 (9.4)',
        awayScore: 'Yet to bat',
        target: 'Batting first',
        requiredRunRate: 'Current RR: 9.20',
        currentOver: '4 . 1 1 2 .',
        startTime: 'Live Now',
        markets: {
          matchWinner: {
            home: 1.65,
            away: 2.25
          },
          totalRuns: {
            target: 198.5,
            over: 1.84,
            under: 1.96
          },
          nextOverRuns: {
            overNumber: 10,
            runsLine: 10.5,
            over: 1.80,
            under: 2.00
          }
        }
      },
      {
        id: 'football_ucl_01',
        sport: 'football',
        sportName: 'Football',
        league: 'UEFA Champions League',
        homeTeam: 'Real Madrid',
        awayTeam: 'Manchester City',
        isLive: true,
        status: '68\' (2nd Half)',
        homeScore: '2',
        awayScore: '1',
        startTime: 'Live Now',
        markets: {
          matchWinner: {
            home: 1.55,
            draw: 3.40,
            away: 4.80
          },
          totalGoals: {
            target: 3.5,
            over: 1.72,
            under: 2.10
          },
          bothTeamsToScore: {
            yes: 1.25,
            no: 3.80
          },
          nextGoal: {
            home: 2.20,
            none: 3.10,
            away: 2.45
          }
        },
        stats: {
          shotsOnTarget: '6 vs 7',
          possession: '46% vs 54%',
          corners: '4 vs 8'
        }
      },
      {
        id: 'football_epl_02',
        sport: 'football',
        sportName: 'Football',
        league: 'English Premier League',
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        isLive: true,
        status: '34\' (1st Half)',
        homeScore: '0',
        awayScore: '0',
        startTime: 'Live Now',
        markets: {
          matchWinner: {
            home: 2.30,
            draw: 3.20,
            away: 2.90
          },
          totalGoals: {
            target: 2.5,
            over: 1.95,
            under: 1.85
          }
        },
        stats: {
          shotsOnTarget: '2 vs 3',
          possession: '51% vs 49%'
        }
      },
      {
        id: 'tennis_wimbledon_01',
        sport: 'tennis',
        sportName: 'Tennis',
        league: 'Grand Slam Championship',
        homeTeam: 'Carlos Alcaraz',
        awayTeam: 'Novak Djokovic',
        isLive: true,
        status: 'Set 3 (Game 4-3, 30-15)',
        homeScore: '6-4, 4-6, 4',
        awayScore: '4-6, 6-4, 3',
        startTime: 'Live Now',
        markets: {
          matchWinner: {
            home: 1.70,
            away: 2.15
          },
          totalSets: {
            target: 4.5,
            over: 1.30,
            under: 3.20
          }
        }
      },
      {
        id: 'upcoming_pak_ind',
        sport: 'cricket',
        sportName: 'Cricket',
        league: 'ICC Champions Trophy',
        homeTeam: 'Pakistan',
        awayTeam: 'India',
        isLive: false,
        status: 'Starts Tomorrow, 14:00 PKT',
        homeScore: '-',
        awayScore: '-',
        startTime: 'Tomorrow 14:00',
        markets: {
          matchWinner: {
            home: 2.10,
            away: 1.75
          },
          totalRuns: {
            target: 310.5,
            over: 1.90,
            under: 1.90
          }
        }
      },
      {
        id: 'upcoming_el_clasico',
        sport: 'football',
        sportName: 'Football',
        league: 'Spanish La Liga',
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        isLive: false,
        status: 'Starts Saturday 20:00',
        homeScore: '-',
        awayScore: '-',
        startTime: 'Sat 20:00',
        markets: {
          matchWinner: {
            home: 2.25,
            draw: 3.40,
            away: 2.80
          }
        }
      }
    ];

    this.bets = [
      {
        id: 'bet_live_01',
        userId: 'usr_1001',
        username: 'Player_777',
        phone: '03001234567',
        isRealPlayer: true,
        gameCategory: 'Sportsbook Live',
        gameTitle: 'Lahore Qalandars vs Karachi Kings',
        matchTitle: 'Lahore Qalandars vs Karachi Kings',
        marketName: 'Match Winner',
        selectionName: 'Lahore Qalandars',
        type: 'SINGLE',
        odds: 1.85,
        stake: 2500.00,
        potentialPayout: 4625.00,
        actualPayout: 0,
        status: 'ACTIVE',
        placedAt: Date.now() - 120000,
        settledAt: null
      },
      {
        id: 'bet_live_02',
        userId: 'usr_1001',
        username: 'Player_777',
        phone: '03001234567',
        isRealPlayer: true,
        gameCategory: 'Aviator Crash',
        gameTitle: 'Aviator Supersonic Jet (Round #101)',
        matchTitle: 'Aviator Supersonic Jet',
        marketName: 'Takeoff Multiplier',
        selectionName: 'Cashed out @ 2.85x',
        type: 'CRASH',
        odds: 2.85,
        stake: 1000.00,
        potentialPayout: 2850.00,
        actualPayout: 2850.00,
        status: 'WON',
        placedAt: Date.now() - 480000,
        settledAt: Date.now() - 420000
      },
      {
        id: 'bet_live_03',
        userId: 'usr_kamran_99',
        username: 'Kamran_Khan',
        phone: '0312-9988112',
        isRealPlayer: true,
        gameCategory: 'Sportsbook Live',
        gameTitle: 'Chelsea vs Hull City',
        matchTitle: 'Chelsea vs Hull City',
        marketName: 'Match Winner (1X2)',
        selectionName: 'Chelsea',
        type: 'SINGLE',
        odds: 2.17,
        stake: 5000.00,
        potentialPayout: 10850.00,
        actualPayout: 0,
        status: 'ACTIVE',
        placedAt: Date.now() - 900000,
        settledAt: null
      },
      {
        id: 'bet_live_04',
        userId: 'usr_sultan_7',
        username: 'Sultan_Vip',
        phone: '0345-5551234',
        isRealPlayer: true,
        gameCategory: 'Casino - Mines',
        gameTitle: '1X-Mines Turbo (5x5 Grid)',
        matchTitle: '1X-Mines Turbo',
        marketName: '3 Mines Mode',
        selectionName: '5 Gems Revealed',
        type: 'SINGLE',
        odds: 1.95,
        stake: 1500.00,
        potentialPayout: 2925.00,
        actualPayout: 2925.00,
        status: 'WON',
        placedAt: Date.now() - 1500000,
        settledAt: Date.now() - 1470000
      },
      {
        id: 'bet_live_05',
        userId: 'usr_ali_raza',
        username: 'Ali_Raza_PK',
        phone: '0333-7711223',
        isRealPlayer: true,
        gameCategory: 'Casino - Roulette',
        gameTitle: 'European Roulette 0-36',
        matchTitle: 'European Roulette',
        marketName: 'Color Bet',
        selectionName: 'Red (1-18)',
        type: 'SINGLE',
        odds: 2.00,
        stake: 800.00,
        potentialPayout: 1600.00,
        actualPayout: 0,
        status: 'ACTIVE',
        placedAt: Date.now() - 300000,
        settledAt: null
      }
    ];

    // Aviator / Crash Game State
    this.crashState = {
      roundId: 101,
      status: 'STARTING', // STARTING, RUNNING, CRASHED
      multiplier: 1.00,
      crashPoint: 2.45,
      countdown: 5,
      activeBets: [
        { id: 'cb_1', user: 'Alex_Pro', amount: 500, cashedOut: false, cashoutMultiplier: null },
        { id: 'cb_2', user: 'Sultan_Bet', amount: 1200, cashedOut: false, cashoutMultiplier: null },
        { id: 'cb_3', user: 'LuckyStar', amount: 200, cashedOut: false, cashoutMultiplier: null }
      ],
      history: [1.25, 3.40, 1.08, 14.82, 2.15, 1.90, 5.60, 1.12, 4.30]
    };
  }

  getUser(userId = null) {
    const id = userId || this.currentUserId;
    const u = this.users.find(user => user.id === id) || this.users[0];
    if (!u) return null;
    const { password, ...safeUser } = u;
    return safeUser;
  }

  getUserRaw(userId = null) {
    const id = userId || this.currentUserId;
    return this.users.find(user => user.id === id) || this.users[0];
  }

  registerUser({ username, phone, email, password }) {
    const existing = this.users.find(u => 
      u.phone === phone || 
      u.username.toLowerCase() === username.toLowerCase() ||
      (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );
    if (existing) {
      throw new Error('An account with this mobile number or username already exists!');
    }

    const newUser = {
      id: 'usr_' + (1000 + this.users.length + 1),
      username,
      phone,
      email: email || `${username.toLowerCase()}@player.bet`,
      password: password || '123456',
      balance: 0.00, // Real betting: new accounts start at 0 PKR
      currency: 'PKR',
      vipLevel: 'Standard Member',
      status: 'ACTIVE',
      createdAt: Date.now(),
      totalBetsPlaced: 0,
      totalWinnings: 0
    };

    this.users.unshift(newUser);
    this.currentUserId = newUser.id;

    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  loginUser(identifier, password) {
    const clean = identifier.trim().toLowerCase();
    const u = this.users.find(user => 
      user.phone === clean || 
      user.username.toLowerCase() === clean || 
      (user.email && user.email.toLowerCase() === clean)
    );
    if (!u) {
      throw new Error('Account not found with this mobile number or username');
    }
    if (u.password !== password) {
      throw new Error('Incorrect password');
    }
    if (u.status === 'BLOCKED') {
      throw new Error('This account has been suspended by administration');
    }

    this.currentUserId = u.id;
    const { password: _, ...safeUser } = u;
    return safeUser;
  }

  getAllUsers() {
    return this.users.map(({ password, ...safeUser }) => {
      const userDeposits = this.depositRequests.filter(r => r.userId === safeUser.id && r.status === 'APPROVED');
      const totalDeposited = userDeposits.reduce((sum, d) => sum + d.amount, 0);
      const userBets = this.bets.filter(b => b.userId === safeUser.id);
      return {
        ...safeUser,
        totalDeposited,
        totalBetsCount: userBets.length
      };
    });
  }

  adjustUserBalance(userId, deltaAmount, reason = 'Admin Adjustment') {
    const u = this.users.find(user => user.id === userId);
    if (!u) throw new Error('User not found');

    u.balance = Math.max(0, Number((u.balance + deltaAmount).toFixed(2)));
    const tx = this.addTransaction('ADMIN_ADJUST', reason, deltaAmount);
    return { user: this.getUser(userId), transaction: tx };
  }

  toggleUserStatus(userId) {
    const u = this.users.find(user => user.id === userId);
    if (!u) throw new Error('User not found');
    u.status = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    return this.getUser(userId);
  }

  updateBalance(deltaAmount, userId = null) {
    const u = this.getUserRaw(userId);
    if (u) {
      u.balance = Math.max(0, Number((u.balance + deltaAmount).toFixed(2)));
      return u.balance;
    }
    return 0;
  }

  addTransaction(type, method, amount) {
    const tx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type,
      method,
      amount: Number(amount),
      status: 'COMPLETED',
      timestamp: Date.now()
    };
    this.transactions.unshift(tx);
    return tx;
  }

  getMatches() {
    return this.matches;
  }

  setMatches(newMatches) {
    if (Array.isArray(newMatches) && newMatches.length > 0) {
      this.matches = newMatches;
    }
    return this.matches;
  }

  getMatch(id) {
    return this.matches.find(m => m.id === id);
  }

  updateMatch(id, updates) {
    const match = this.getMatch(id);
    if (match) {
      Object.assign(match, updates);
    }
    return match;
  }

  getBets(userId) {
    return this.bets.filter(b => b.userId === userId);
  }

  getAllBets() {
    return this.bets;
  }

  addBet(betData, userId = null) {
    const id = userId || this.currentUserId;
    const u = this.getUserRaw(id);
    
    // Auto-detect game category if not specified
    let category = betData.gameCategory;
    const title = betData.gameTitle || betData.matchTitle || 'Sportsbook Match';
    if (!category) {
      const lower = title.toLowerCase();
      if (lower.includes('aviator') || lower.includes('crash')) category = 'Aviator Crash';
      else if (lower.includes('mines')) category = 'Casino - Mines';
      else if (lower.includes('plinko')) category = 'Casino - Plinko';
      else if (lower.includes('dice')) category = 'Casino - Dice';
      else if (lower.includes('wheel')) category = 'Casino - Spin Wheel';
      else if (lower.includes('slot')) category = 'Casino - Slots';
      else if (lower.includes('roulette')) category = 'Casino - Roulette';
      else if (lower.includes('blackjack')) category = 'Casino - Blackjack';
      else if (lower.includes('teen patti') || lower.includes('teen_patti')) category = 'Casino - Teen Patti';
      else if (lower.includes('andar bahar') || lower.includes('andar_bahar')) category = 'Casino - Andar Bahar';
      else category = 'Sportsbook Live';
    }

    const bet = {
      id: 'bet_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      userId: id,
      username: u ? u.username : (betData.username || 'Player'),
      phone: u ? u.phone : (betData.phone || '0300-***'),
      isRealPlayer: betData.isRealPlayer !== undefined ? betData.isRealPlayer : true,
      gameCategory: category,
      gameTitle: title,
      matchTitle: title,
      marketName: betData.marketName || 'Standard Market',
      selectionName: betData.selectionName || 'Standard Selection',
      type: betData.type || 'SINGLE',
      odds: Number(betData.odds || 1.85),
      stake: Number(betData.stake || 0),
      potentialPayout: Number(betData.potentialPayout || (betData.stake * (betData.odds || 1.85)).toFixed(2)),
      actualPayout: betData.actualPayout || 0,
      status: betData.status || 'ACTIVE',
      placedAt: Date.now(),
      settledAt: betData.settledAt || null,
      ...betData
    };

    this.bets.unshift(bet);
    if (this.bets.length > 200) this.bets.pop();
    if (u) u.totalBetsPlaced += 1;
    return bet;
  }

  settleBet(betId, won, actualMultiplier = null) {
    const bet = this.bets.find(b => b.id === betId);
    if (!bet || bet.status !== 'ACTIVE') return null;

    bet.status = won ? 'WON' : 'LOST';
    bet.settledAt = Date.now();
    const u = this.getUserRaw(bet.userId);
    if (won) {
      const payout = actualMultiplier ? Number((bet.stake * actualMultiplier).toFixed(2)) : bet.potentialPayout;
      bet.actualPayout = payout;
      this.updateBalance(payout, bet.userId);
      if (u) u.totalWinnings += payout;
      this.addTransaction('WIN', 'Bet Payout', payout);
    } else {
      bet.actualPayout = 0;
    }
    return bet;
  }

  getAdminPaymentAccounts() {
    return this.adminPaymentAccounts;
  }

  updateAdminPaymentAccounts(accounts) {
    this.adminPaymentAccounts = { ...this.adminPaymentAccounts, ...accounts };
    return this.adminPaymentAccounts;
  }

  addDepositRequest(reqData) {
    const user = this.getUser(reqData.userId);
    const req = {
      id: 'dep_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: user ? user.id : this.currentUserId,
      username: user ? user.username : 'Player',
      amount: Number(reqData.amount),
      method: reqData.method,
      senderNumber: reqData.senderNumber,
      tid: reqData.tid,
      screenshot: reqData.screenshot || null,
      status: 'PENDING', // PENDING, APPROVED, REJECTED
      createdAt: Date.now(),
      processedAt: null,
      notes: ''
    };
    this.depositRequests.unshift(req);
    return req;
  }

  getDepositRequests() {
    return this.depositRequests;
  }

  approveDepositRequest(requestId) {
    const req = this.depositRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'PENDING') return null;

    req.status = 'APPROVED';
    req.processedAt = Date.now();

    // Credit target user balance
    this.updateBalance(req.amount, req.userId);
    const tx = this.addTransaction('DEPOSIT', `${req.method} (TID: ${req.tid})`, req.amount);

    return { request: req, transaction: tx, newBalance: this.getUser(req.userId).balance };
  }

  rejectDepositRequest(requestId, reason = 'Invalid TID or Screenshot') {
    const req = this.depositRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'PENDING') return null;

    req.status = 'REJECTED';
    req.processedAt = Date.now();
    req.notes = reason;

    return { request: req };
  }
}

export const state = new AppState();
