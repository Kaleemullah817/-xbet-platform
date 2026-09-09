import { state } from '../state/store.js';

// Admin pre-programmed crash queue (10 slots)
export let customCrashSlots = Array(10).fill('');

export function getCustomCrashSlots() {
  return customCrashSlots;
}

export function setCustomCrashSlots(newSlots) {
  if (Array.isArray(newSlots)) {
    customCrashSlots = newSlots.slice(0, 10).map(v => (v !== undefined && v !== null ? v.toString().trim() : ''));
    while (customCrashSlots.length < 10) customCrashSlots.push('');
  }
  return customCrashSlots;
}

export function startCrashEngine(io) {
  const crashState = state.crashState;

  function generateCrashPoint() {
    // 1. Check if admin pre-programmed a crash multiplier in the 10 slots
    for (let i = 0; i < customCrashSlots.length; i++) {
      const val = parseFloat(customCrashSlots[i]);
      if (!isNaN(val) && val >= 1.00) {
        const chosen = Number(val.toFixed(2));
        console.log(`[Aviator Admin Override] Slot #${i + 1} activated: crashing at exactly ${chosen}x!`);
        customCrashSlots[i] = ''; // Clear slot once used
        io.emit('crash_slots_update', customCrashSlots);
        return chosen;
      }
    }

    // 2. Default 95% RTP realistic crash distribution if slots are empty
    const rand = Math.random();
    if (rand < 0.06) return 1.00 + Number((Math.random() * 0.15).toFixed(2)); // Instant crash 1.00 - 1.15
    if (rand < 0.60) return 1.15 + Number((Math.random() * 1.85).toFixed(2)); // 1.15 - 3.00
    if (rand < 0.88) return 3.00 + Number((Math.random() * 5.00).toFixed(2)); // 3.00 - 8.00
    return 8.00 + Number((Math.random() * 20.00).toFixed(2)); // Big rocket 8.00 - 28.00+
  }

  function startNewRound() {
    crashState.status = 'STARTING';
    crashState.multiplier = 1.00;
    crashState.countdown = 5;
    crashState.roundId += 1;
    crashState.crashPoint = generateCrashPoint();

    // Generate random AI bot bets for live multiplayer feel
    const botNames = ['Dragon_99', 'CryptoKing', 'Speedy_Bet', 'VipRider', 'Alpha_Max', 'LuckyPak'];
    crashState.activeBets = botNames.slice(0, Math.floor(Math.random() * 3) + 3).map((name, i) => ({
      id: `bot_${crashState.roundId}_${i}`,
      user: name,
      amount: [200, 500, 1000, 2500, 5000][Math.floor(Math.random() * 5)],
      cashedOut: false,
      cashoutMultiplier: null,
      autoCashout: Number((1.2 + Math.random() * 4.0).toFixed(2))
    }));

    const countdownInterval = setInterval(() => {
      crashState.countdown -= 1;
      io.emit('crash_state', { ...crashState });

      if (crashState.countdown <= 0) {
        clearInterval(countdownInterval);
        launchPlane();
      }
    }, 1000);
  }

  function launchPlane() {
    crashState.status = 'FLYING';
    const startTime = Date.now();

    const flightInterval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      // Exponential curve: 1.00 * e^(0.065 * t^1.2)
      const current = 1.00 * Math.exp(0.06 * Math.pow(elapsedSec, 1.25));
      crashState.multiplier = Number(current.toFixed(2));

      // Bot auto-cashouts
      crashState.activeBets.forEach(bet => {
        if (!bet.cashedOut && bet.autoCashout && crashState.multiplier >= bet.autoCashout) {
          bet.cashedOut = true;
          bet.cashoutMultiplier = bet.autoCashout;
        }
      });

      if (crashState.multiplier >= crashState.crashPoint) {
        // Crashed!
        clearInterval(flightInterval);
        crashState.status = 'CRASHED';
        crashState.multiplier = crashState.crashPoint;
        crashState.history.unshift(crashState.crashPoint);
        if (crashState.history.length > 15) crashState.history.pop();

        io.emit('crash_state', { ...crashState });

        // Wait 3 seconds before next round
        setTimeout(startNewRound, 3000);
      } else {
        io.emit('crash_tick', {
          multiplier: crashState.multiplier,
          status: crashState.status,
          activeBets: crashState.activeBets
        });
      }
    }, 70);
  }

  // Initial launch
  startNewRound();
}

export function placeCrashBet(userBet) {
  const crashState = state.crashState;
  if (crashState.status !== 'STARTING') {
    throw new Error('Bets are only accepted before takeoff!');
  }
  const bet = {
    id: `user_${crashState.roundId}_${Date.now()}`,
    user: userBet.username || 'You',
    isUser: true,
    amount: userBet.amount,
    cashedOut: false,
    cashoutMultiplier: null
  };
  crashState.activeBets.unshift(bet);
  return bet;
}

export function cashoutCrashBet(betId) {
  const crashState = state.crashState;
  if (crashState.status !== 'FLYING') {
    throw new Error('Plane is not flying!');
  }
  const bet = crashState.activeBets.find(b => b.id === betId);
  if (!bet) throw new Error('Bet not found');
  if (bet.cashedOut) throw new Error('Already cashed out');

  bet.cashedOut = true;
  bet.cashoutMultiplier = crashState.multiplier;
  return bet;
}
