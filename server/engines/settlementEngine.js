import { state } from '../state/store.js';

export function settleMatchOutcome(matchId, winningOutcome, io) {
  const match = state.getMatch(matchId);
  if (!match) return { success: false, message: 'Match not found' };

  // Mark match finished
  match.isLive = false;
  match.status = `Finished - Winner: ${winningOutcome}`;

  const userBets = state.getBets(state.getUser().id);
  const settledList = [];

  userBets.forEach(bet => {
    if (bet.status === 'ACTIVE') {
      let isWin = false;
      if (bet.type === 'SINGLE' && bet.matchId === matchId) {
        if (bet.selectionName.toLowerCase().includes(winningOutcome.toLowerCase())) {
          isWin = true;
        }
        const settledBet = state.settleBet(bet.id, isWin);
        settledList.push(settledBet);
      } else if (bet.type === 'ACCUMULATOR' && bet.selections) {
        // Accumulator checking
        const leg = bet.selections.find(s => s.matchId === matchId);
        if (leg) {
          leg.status = leg.selectionName.toLowerCase().includes(winningOutcome.toLowerCase()) ? 'WON' : 'LOST';
          // Check if all legs settled
          const anyLost = bet.selections.some(s => s.status === 'LOST');
          const allWon = bet.selections.every(s => s.status === 'WON');
          if (anyLost) {
            const settledBet = state.settleBet(bet.id, false);
            settledList.push(settledBet);
          } else if (allWon) {
            const settledBet = state.settleBet(bet.id, true);
            settledList.push(settledBet);
          }
        }
      }
    }
  });

  // Broadcast updates
  if (io) {
    io.emit('matches_update', state.getMatches());
    io.emit('user_update', state.getUser());
    io.emit('bets_update', state.getBets(state.getUser().id));
  }

  return { success: true, match, settledCount: settledList.length, settledList };
}
