import { state } from '../state/store.js';

export function startOddsEngine(io) {
  setInterval(() => {
    const matches = state.getMatches().filter(m => m.isLive);
    if (matches.length === 0) return;

    // Pick 1-2 random live matches to update slightly
    matches.forEach(match => {
      // 50% chance to update this match this tick
      if (Math.random() < 0.45) {
        if (match.sport === 'cricket') {
          // Parse current over
          const overTokens = match.currentOver.split(' ');
          const ballOutcomes = ['1', '2', '.', '4', '1', '6', 'W', '.'];
          const newBall = ballOutcomes[Math.floor(Math.random() * ballOutcomes.length)];
          
          if (overTokens.length >= 6) {
            match.currentOver = newBall;
          } else {
            match.currentOver += ' ' + newBall;
          }

          // Fluctuate matchWinner odds slightly (+- 0.02 to 0.08)
          const delta = (Math.random() * 0.08 - 0.04);
          let homeOdds = Math.max(1.10, Math.min(9.50, Number((match.markets.matchWinner.home + delta).toFixed(2))));
          let awayOdds = Math.max(1.10, Math.min(9.50, Number((2.8 - (homeOdds - 1.5) * 0.7).toFixed(2))));

          match.markets.matchWinner.home = homeOdds;
          match.markets.matchWinner.away = awayOdds;
        } else if (match.sport === 'football') {
          // Advance minute
          const currentMinMatch = match.status.match(/^(\d+)'/);
          if (currentMinMatch) {
            const currentMin = parseInt(currentMinMatch[1], 10);
            if (currentMin < 90) {
              match.status = `${currentMin + 1}' (2nd Half)`;
            }
          }

          // Fluctuate odds
          const delta = (Math.random() * 0.06 - 0.03);
          let homeOdds = Math.max(1.05, Math.min(8.00, Number((match.markets.matchWinner.home + delta).toFixed(2))));
          match.markets.matchWinner.home = homeOdds;
          if (match.markets.matchWinner.draw) {
            match.markets.matchWinner.draw = Math.max(1.50, Number((match.markets.matchWinner.draw + (Math.random() * 0.04 - 0.02)).toFixed(2)));
          }
        }
      }
    });

    // Broadcast updated matches list to all connected clients
    io.emit('matches_update', state.getMatches());
  }, 2500);
}
