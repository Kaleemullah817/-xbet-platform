import express from 'express';
import { state } from '../state/store.js';
import { placeCrashBet, cashoutCrashBet, getCustomCrashSlots, setCustomCrashSlots } from '../engines/crashEngine.js';
import { settleMatchOutcome } from '../engines/settlementEngine.js';
import { sendOtpEmail, verifyOtpCode, getOtpLogs, getSmtpConfig, updateSmtpConfig } from '../engines/emailService.js';
import { fetchRealWorldSports, getRealSportsStatus } from '../engines/realSportsEngine.js';

export function createApiRouter(io) {
  const router = express.Router();

  // 0a1. Auth: Send Email Verification OTP
  router.post('/auth/send-otp', async (req, res) => {
    const { username, phone, email, password } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ error: 'Please enter a valid Pakistani mobile number (e.g. 03001234567)' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required for OTP verification' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if account exists
    const existing = state.users.find(u => 
      u.phone === phone.trim() || 
      u.username.toLowerCase() === username.trim().toLowerCase() ||
      (u.email && u.email.toLowerCase() === email.trim().toLowerCase())
    );
    if (existing) {
      return res.status(400).json({ error: 'An account with this mobile number, username, or email already exists!' });
    }

    try {
      const result = await sendOtpEmail({
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password
      });

      // Broadcast OTP event to Admin Panel
      io.emit('new_otp_log', {
        email: result.email,
        username,
        otp: result.otp,
        timestamp: Date.now()
      });

      res.json({
        success: true,
        message: `6-digit verification code sent to ${email}! Check your inbox.`,
        email: result.email,
        otp: result.otp, // Also returned for immediate test assist
        deliveryStatus: result.deliveryStatus
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
    }
  });

  // 0a2. Auth: Verify OTP & Complete Registration
  router.post('/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
    }

    try {
      const record = verifyOtpCode(email, otp);

      // Successfully verified! Create real user account
      const user = state.registerUser({
        username: record.username,
        phone: record.phone,
        email: record.email || email,
        password: record.password
      });

      // Mark email as verified
      user.emailVerified = true;

      // Broadcast to Admin Panel in real time!
      io.emit('new_user_registered', user);
      io.emit('users_list_update', state.getAllUsers());

      res.json({
        success: true,
        message: 'Email successfully verified! Welcome to 1X-BET.',
        user
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 0a3. Direct register (fallback)
  router.post('/auth/register', (req, res) => {
    const { username, phone, email, password } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ error: 'Please enter a valid Pakistani mobile number (e.g. 03001234567)' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
      const user = state.registerUser({
        username: username.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        password
      });

      io.emit('new_user_registered', user);
      io.emit('users_list_update', state.getAllUsers());

      res.json({
        success: true,
        message: 'Account registered successfully!',
        user
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Get OTP logs
  router.get('/admin/otp-logs', (req, res) => {
    res.json(getOtpLogs());
  });

  // Admin: SMTP Config
  router.get('/admin/smtp-config', (req, res) => {
    res.json(getSmtpConfig());
  });

  router.post('/admin/smtp-config', (req, res) => {
    const updated = updateSmtpConfig(req.body);
    res.json({ success: true, config: updated });
  });

  // Admin: 10 Aviator Crash Control Slots
  router.get('/admin/crash-slots', (req, res) => {
    res.json(getCustomCrashSlots());
  });

  router.post('/admin/crash-slots', (req, res) => {
    const { slots } = req.body;
    const updated = setCustomCrashSlots(slots);
    io.emit('crash_slots_update', updated);
    res.json({ success: true, slots: updated });
  });

  // Real World Sports Feed Endpoints
  router.get('/admin/real-sports-status', (req, res) => {
    res.json(getRealSportsStatus());
  });

  router.post('/admin/refresh-real-sports', async (req, res) => {
    try {
      const matches = await fetchRealWorldSports(io);
      res.json({ success: true, count: matches.length, matches });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 0b. Auth: Login
  router.post('/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Mobile number/username and password are required' });
    }

    try {
      const user = state.loginUser(identifier, password);
      res.json({
        success: true,
        message: `Welcome back, ${user.username}!`,
        user
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 1. Get current user & wallet stats
  router.get('/me', (req, res) => {
    const requestedUserId = req.headers['x-user-id'];
    const user = state.getUser(requestedUserId);
    res.json({
      user,
      transactions: state.transactions.filter(t => !t.userId || t.userId === user?.id)
    });
  });

  // 1a. Admin: Get all registered users
  router.get('/admin/users', (req, res) => {
    res.json(state.getAllUsers());
  });

  // 1a2. Admin: Adjust User Balance
  router.post('/admin/users/adjust-balance', (req, res) => {
    const { userId, amount, reason } = req.body;
    try {
      const result = state.adjustUserBalance(userId, parseFloat(amount), reason);
      io.emit('user_update', state.getUser(userId));
      io.emit('users_list_update', state.getAllUsers());
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 1a3. Admin: Toggle User Block/Active Status
  router.post('/admin/users/toggle-block', (req, res) => {
    const { userId } = req.body;
    try {
      const updatedUser = state.toggleUserStatus(userId);
      io.emit('users_list_update', state.getAllUsers());
      res.json({ success: true, user: updatedUser });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 1b. Get Active Payment Accounts for user to deposit
  router.get('/payment-accounts', (req, res) => {
    res.json(state.getAdminPaymentAccounts());
  });

  // 1c. Submit Deposit Proof (Sender Number, TID, Screenshot)
  router.post('/wallet/deposit-request', (req, res) => {
    const { amount, method, senderNumber, tid, screenshot } = req.body;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount < 100) {
      return res.status(400).json({ error: 'Minimum deposit is 100 PKR' });
    }
    if (!tid || tid.trim().length < 6) {
      return res.status(400).json({ error: 'Please provide a valid Transaction ID (TID)' });
    }
    if (!senderNumber) {
      return res.status(400).json({ error: 'Please enter your sender mobile / account number' });
    }

    const request = state.addDepositRequest({
      amount: numAmount,
      method: method || 'EasyPaisa',
      senderNumber,
      tid: tid.trim(),
      screenshot: screenshot || null
    });

    // Notify admin in real time
    io.emit('new_deposit_request', request);
    io.emit('deposit_requests_update', state.getDepositRequests());

    res.json({
      success: true,
      message: 'Deposit request submitted successfully! Admin will verify and credit your balance shortly.',
      request
    });
  });

  // 1d. Get user's deposit requests
  router.get('/wallet/my-deposits', (req, res) => {
    const all = state.getDepositRequests();
    const userReqs = all.filter(r => r.userId === state.getUser().id);
    res.json(userReqs);
  });

  // 1e. Admin: Get all deposit requests
  router.get('/admin/deposit-requests', (req, res) => {
    res.json(state.getDepositRequests());
  });

  // 1f. Admin: Approve deposit request
  router.post('/admin/deposit-requests/approve', (req, res) => {
    const { requestId } = req.body;
    const result = state.approveDepositRequest(requestId);
    if (!result) {
      return res.status(400).json({ error: 'Request not found or already processed' });
    }

    // Broadcast balance and requests updates
    io.emit('user_update', state.getUser());
    io.emit('deposit_requests_update', state.getDepositRequests());

    res.json({
      success: true,
      message: `Deposit #${requestId} approved! ${result.request.amount} PKR added to ${result.request.username}'s account.`,
      result
    });
  });

  // 1g. Admin: Reject deposit request
  router.post('/admin/deposit-requests/reject', (req, res) => {
    const { requestId, reason } = req.body;
    const result = state.rejectDepositRequest(requestId, reason);
    if (!result) {
      return res.status(400).json({ error: 'Request not found or already processed' });
    }

    io.emit('deposit_requests_update', state.getDepositRequests());

    res.json({
      success: true,
      message: `Deposit #${requestId} rejected.`,
      result
    });
  });

  // 1h. Admin: Update payment accounts (EasyPaisa/JazzCash numbers)
  router.post('/admin/payment-accounts', (req, res) => {
    const { accounts } = req.body;
    if (!accounts) return res.status(400).json({ error: 'Accounts data missing' });

    const updated = state.updateAdminPaymentAccounts(accounts);
    io.emit('payment_accounts_update', updated);

    res.json({ success: true, accounts: updated });
  });

  // 2. Direct Deposit (Instant demo / bypass)
  router.post('/wallet/deposit', (req, res) => {
    const { amount, method } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    state.updateBalance(numAmount);
    const tx = state.addTransaction('DEPOSIT', method || 'EasyPaisa', numAmount);
    
    // Broadcast user balance update
    io.emit('user_update', state.getUser());

    res.json({
      success: true,
      newBalance: state.getUser().balance,
      transaction: tx
    });
  });

  // 3. Withdrawal Simulation
  router.post('/wallet/withdraw', (req, res) => {
    const { amount, method, accountDetails } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    if (numAmount > state.getUser().balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    state.updateBalance(-numAmount);
    const tx = state.addTransaction('WITHDRAWAL', `${method || 'Bank Transfer'} (${accountDetails || 'Default Account'})`, numAmount);

    io.emit('user_update', state.getUser());

    res.json({
      success: true,
      newBalance: state.getUser().balance,
      transaction: tx
    });
  });

  // 4. Get Matches
  router.get('/matches', (req, res) => {
    res.json(state.getMatches());
  });

  // 5. Place Bet (Single or Accumulator)
  router.post('/bets/place', (req, res) => {
    const { type, stake, selections, matchId, matchTitle, marketName, selectionName, odds } = req.body;
    const numStake = parseFloat(stake);

    if (!numStake || numStake < 10) {
      return res.status(400).json({ error: 'Minimum bet stake is 10 PKR' });
    }
    if (numStake > state.getUser().balance) {
      return res.status(400).json({ error: 'Insufficient balance. Please deposit first!' });
    }

    // Deduct stake from balance
    state.updateBalance(-numStake);
    state.addTransaction('BET_STAKE', 'Sportsbook Wager', -numStake);

    let betRecord;
    if (type === 'ACCUMULATOR') {
      const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1);
      betRecord = state.addBet({
        type: 'ACCUMULATOR',
        selections: selections.map(s => ({ ...s, status: 'PENDING' })),
        totalOdds: Number(totalOdds.toFixed(2)),
        stake: numStake,
        potentialPayout: Number((numStake * totalOdds).toFixed(2))
      });
    } else {
      // Single Bet
      betRecord = state.addBet({
        type: 'SINGLE',
        matchId,
        matchTitle,
        marketName,
        selectionName,
        odds: Number(odds),
        stake: numStake,
        potentialPayout: Number((numStake * odds).toFixed(2))
      });
    }

    // Notify user update & bets update
    io.emit('user_update', state.getUser());
    io.emit('bets_update', state.getBets(state.getUser().id));

    res.json({
      success: true,
      bet: betRecord,
      newBalance: state.getUser().balance
    });
  });

  // 6. Get User Bets
  router.get('/bets/my', (req, res) => {
    res.json(state.getBets(state.getUser().id));
  });

  // 7. Early Cashout Bet
  router.post('/bets/cashout', (req, res) => {
    const { betId } = req.body;
    const bet = state.bets.find(b => b.id === betId);
    if (!bet || bet.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Bet cannot be cashed out' });
    }

    // Calculate cashout offer (e.g. 80-90% of current value)
    const cashoutAmount = Number((bet.stake * 0.88).toFixed(2));
    bet.status = 'CASHED_OUT';
    bet.settledAt = Date.now();
    bet.actualPayout = cashoutAmount;

    state.updateBalance(cashoutAmount);
    state.addTransaction('CASHOUT', `Early Cashout (${bet.matchTitle || 'Combo'})`, cashoutAmount);

    io.emit('user_update', state.getUser());
    io.emit('bets_update', state.getBets(state.getUser().id));

    res.json({
      success: true,
      cashoutAmount,
      newBalance: state.getUser().balance
    });
  });

  // 8. Aviator / Crash Bet Placement
  router.post('/crash/bet', (req, res) => {
    const { amount } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      return res.status(400).json({ error: 'Min stake 10 PKR' });
    }
    if (numAmount > state.getUser().balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    try {
      state.updateBalance(-numAmount);
      state.addTransaction('CRASH_BET', 'Aviator Stake', -numAmount);

      const bet = placeCrashBet({
        username: state.getUser().username,
        amount: numAmount
      });

      io.emit('user_update', state.getUser());
      res.json({ success: true, bet });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. Aviator / Crash Cashout
  router.post('/crash/cashout', (req, res) => {
    const { betId } = req.body;
    try {
      const bet = cashoutCrashBet(betId);
      const payout = Number((bet.amount * bet.cashoutMultiplier).toFixed(2));
      state.updateBalance(payout);
      state.addTransaction('CRASH_WIN', `Aviator Won (${bet.cashoutMultiplier}x)`, payout);

      io.emit('user_update', state.getUser());
      res.json({
        success: true,
        bet,
        payout,
        newBalance: state.getUser().balance
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 10. Admin Endpoints: Update Match Live Score / Event
  router.post('/admin/match/event', (req, res) => {
    const { matchId, homeScore, awayScore, status, currentOver } = req.body;
    const match = state.getMatch(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (homeScore !== undefined) match.homeScore = homeScore;
    if (awayScore !== undefined) match.awayScore = awayScore;
    if (status !== undefined) match.status = status;
    if (currentOver !== undefined) match.currentOver = currentOver;

    io.emit('matches_update', state.getMatches());
    res.json({ success: true, match });
  });

  // 11. Admin Endpoints: Settle Match Outcome
  router.post('/admin/match/settle', (req, res) => {
    const { matchId, winningOutcome } = req.body;
    const result = settleMatchOutcome(matchId, winningOutcome, io);
    res.json(result);
  });

  return router;
}
