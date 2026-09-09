import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Settings, 
  Trophy, 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Eye, 
  Copy, 
  Save, 
  Plus, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Mail,
  KeyRound,
  Plane,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminPortal({ onBackToSite, socket, matches = [], onUpdateMatches, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('deposits'); // 'deposits' | 'accounts' | 'matches' | 'users' | 'otps' | 'crash'
  const [depositRequests, setDepositRequests] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [otpLogs, setOtpLogs] = useState([]);
  const [crashSlots, setCrashSlots] = useState(Array(10).fill(''));
  const [smtpSettings, setSmtpSettings] = useState({
    host: 'smtp.gmail.com',
    port: 465,
    user: '',
    pass: '',
    from: '1X-BET Security <security@1xbet.global>'
  });
  const [copiedTid, setCopiedTid] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [paymentAccounts, setPaymentAccounts] = useState({
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
  });

  const [adjustAmount, setAdjustAmount] = useState('5000');

  useEffect(() => {
    fetchRequests();
    fetchAccounts();
    fetchUsers();
    fetchCrashSlots();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleSlotsSync = (updatedSlots) => {
      if (Array.isArray(updatedSlots)) {
        setCrashSlots(updatedSlots);
      }
    };
    socket.on('crash_slots_update', handleSlotsSync);
    return () => socket.off('crash_slots_update', handleSlotsSync);
  }, [socket]);

  const fetchCrashSlots = () => {
    fetch('/api/admin/crash-slots')
      .then(res => res.json())
      .then(data => setCrashSlots(data))
      .catch(err => console.error(err));
  };

  const handleSaveCrashSlots = async (slotsToSave = crashSlots) => {
    try {
      const res = await fetch('/api/admin/crash-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slotsToSave })
      });
      if (res.ok) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setNotification({ type: 'success', text: '🎯 10 Aviator Crash Slots saved! Game will crash at these exact numbers.' });
        fetchCrashSlots();
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSlotChange = (index, value) => {
    const updated = [...crashSlots];
    updated[index] = value;
    setCrashSlots(updated);
  };

  const handleClearSlot = (index) => {
    const updated = [...crashSlots];
    updated[index] = '';
    setCrashSlots(updated);
  };

  const applyPresetAndSave = (presetSlots, presetName) => {
    setCrashSlots(presetSlots);
    handleSaveCrashSlots(presetSlots);
    setNotification({ type: 'success', text: `Applied preset: "${presetName}" and saved to Aviator engine!` });
  };

  const fetchUsers = () => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setRegisteredUsers(data))
      .catch(err => console.error(err));
  };

  const fetchRequests = () => {
    fetch('/api/admin/deposit-requests')
      .then(res => res.json())
      .then(data => setDepositRequests(data))
      .catch(err => console.error(err));
  };

  const fetchAccounts = () => {
    fetch('/api/payment-accounts')
      .then(res => res.json())
      .then(data => setPaymentAccounts(data))
      .catch(err => console.error(err));
  };

  const fetchOtpLogs = () => {
    fetch('/api/admin/otp-logs')
      .then(res => res.json())
      .then(data => setOtpLogs(data))
      .catch(err => console.error(err));
  };

  const fetchSmtp = () => {
    fetch('/api/admin/smtp-config')
      .then(res => res.json())
      .then(data => setSmtpSettings(data))
      .catch(err => console.error(err));
  };

  const handleSaveSmtp = async () => {
    try {
      const res = await fetch('/api/admin/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings)
      });
      if (res.ok) {
        setNotification({ type: 'success', text: 'SMTP Email Configuration saved successfully!' });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const res = await fetch('/api/admin/deposit-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      setNotification({ type: 'success', text: data.message });
      fetchRequests();
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Enter reason for rejection (e.g. TID not found on SMS, Amount mismatch):', 'TID not received');
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/deposit-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');

      setNotification({ type: 'info', text: data.message });
      fetchRequests();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSaveAccounts = async () => {
    try {
      const res = await fetch('/api/admin/payment-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: paymentAccounts })
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Save failed');

      setNotification({ type: 'success', text: 'Payment Accounts updated successfully! All users will see these updated numbers.' });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleScoreEvent = async (type) => {
    const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];
    if (!selectedMatch) return;
    try {
      let payload = { matchId: selectedMatch.id };

      if (selectedMatch.sport === 'cricket') {
        let curOver = selectedMatch.currentOver || '';
        let ball = type === 'SIX' ? '6' : type === 'FOUR' ? '4' : type === 'WICKET' ? 'W' : '1';
        payload.currentOver = curOver + ' ' + ball;
        payload.status = '2nd Inning (Overs: 16.2)';
      } else if (selectedMatch.sport === 'football') {
        const home = parseInt(selectedMatch.homeScore || '0', 10);
        const away = parseInt(selectedMatch.awayScore || '0', 10);
        if (type === 'HOME_GOAL') payload.homeScore = (home + 1).toString();
        else if (type === 'AWAY_GOAL') payload.awayScore = (away + 1).toString();
        payload.status = '84\' (2nd Half)';
      }

      await fetch('/api/admin/match/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setNotification({ type: 'success', text: `Live score event updated on match!` });
      if (onUpdateMatches) onUpdateMatches();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSettle = async (winningTeam) => {
    const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];
    if (!selectedMatch) return;
    try {
      const res = await fetch('/api/admin/match/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          winningOutcome: winningTeam
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Settlement failed');

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      setNotification({
        type: 'success',
        text: `Match settled! Winner: ${winningTeam}. Settled ${data.settledCount} bet(s)!`
      });
      if (onUpdateMatches) onUpdateMatches();
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleManualBalanceAdjust = async (amountDelta) => {
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountDelta,
          method: 'Admin Balance Adjustment'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to adjust balance');

      setNotification({ type: 'success', text: `Balance updated successfully! New balance: ${data.newBalance} PKR` });
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const pendingDeposits = depositRequests.filter(r => r.status === 'PENDING');
  const approvedDeposits = depositRequests.filter(r => r.status === 'APPROVED');
  const totalApprovedAmount = approvedDeposits.reduce((acc, r) => acc + (r.amount || 0), 0);
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  return (
    <div className="min-h-screen bg-[#070d14] text-gray-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="bg-[#0b1420] border-b border-[#18283b] px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xl">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToSite}
            className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white bg-[#121f2f] hover:bg-[#182b40] px-3 py-2 rounded-xl transition-colors border border-[#1e344d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go To Betting Website</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-base font-black text-white font-gaming tracking-wide flex items-center gap-2">
                1X-BET ADMIN DASHBOARD
                <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded uppercase">ROOT ACCESS</span>
              </h1>
              <p className="text-[11px] text-gray-400">Manage deposits, payment accounts, matches, and payouts</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#101c2a] border border-[#1b2f44] px-3.5 py-1.5 rounded-xl flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-300">Server: Online</span>
          </div>

          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300">
            <span>Admin: SuperAgent</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-[#0a121c] border-r border-[#162536] p-3 space-y-1.5 select-none flex flex-col justify-between">
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('deposits'); setNotification(null); fetchRequests(); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'deposits'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-gray-300 hover:bg-[#121e2d] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-4 h-4" />
                <span>Deposit Approvals</span>
              </div>
              {pendingDeposits.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                  {pendingDeposits.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('accounts'); setNotification(null); fetchAccounts(); }}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'accounts'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-[#121e2d] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Payment Accounts (Tills)</span>
            </button>

            <button
              onClick={() => { setActiveTab('matches'); setNotification(null); }}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'matches'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-[#121e2d] hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Matches & Live Odds</span>
            </button>

            <button
              onClick={() => { setActiveTab('users'); setNotification(null); fetchUsers(); }}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-[#121e2d] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Balance Manager</span>
            </button>

            <button
              onClick={() => { setActiveTab('otps'); setNotification(null); fetchOtpLogs(); fetchSmtp(); }}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'otps'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-[#121e2d] hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email OTPs & Mailer</span>
            </button>

            <button
              onClick={() => { setActiveTab('crash'); setNotification(null); fetchCrashSlots(); }}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'crash'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-300 hover:bg-[#121e2d] hover:text-white'
              }`}
            >
              <Plane className="w-4 h-4 text-red-400" />
              <span>Aviator 10 Slots Rig</span>
            </button>
          </div>

          <div className="p-3 bg-[#0d1622] rounded-xl border border-[#1b2b3d] text-center space-y-1">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">Real Money Agent Mode</span>
            <p className="text-[10px] text-gray-400">EasyPaisa & JazzCash TID Verification Active</p>
          </div>
        </aside>

        {/* Center Dashboard View */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {notification && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200 shadow-lg'
                : 'bg-red-950/90 border border-red-500 text-red-200 shadow-lg'
            }`}>
              <span>{notification.text}</span>
              <button onClick={() => setNotification(null)}><XCircle className="w-4 h-4" /></button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0e1824] border border-[#1a2d42] p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pending Approvals</span>
                <div className="text-2xl font-black text-amber-400 font-gaming mt-0.5">{pendingDeposits.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#0e1824] border border-[#1a2d42] p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Approved Deposits</span>
                <div className="text-2xl font-black text-emerald-400 font-gaming mt-0.5">{totalApprovedAmount.toLocaleString()} PKR</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#0e1824] border border-[#1a2d42] p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Player Balance</span>
                <div className="text-2xl font-black text-cyan-400 font-gaming mt-0.5">{user?.balance?.toLocaleString()} PKR</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#0e1824] border border-[#1a2d42] p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Active Matches</span>
                <div className="text-2xl font-black text-purple-400 font-gaming mt-0.5">{matches.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* TAB 1: DEPOSITS APPROVAL QUEUE */}
          {activeTab === 'deposits' && (
            <div className="bg-[#0e1824] border border-[#1a2d42] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#182a3e] pb-3">
                <div>
                  <h3 className="text-base font-black text-white font-gaming tracking-wide">
                    DEPOSIT REQUESTS & SCREENSHOT APPROVALS
                  </h3>
                  <p className="text-xs text-gray-400">
                    Verify the sender number and TID against your EasyPaisa/JazzCash SMS, check the screenshot, and approve!
                  </p>
                </div>
                <button
                  onClick={fetchRequests}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#142334] hover:bg-[#1b2f46] text-xs font-bold text-gray-300 rounded-xl transition-colors border border-[#1e354e]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {depositRequests.length === 0 ? (
                <div className="text-center py-16 text-gray-500 space-y-2">
                  <Smartphone className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm font-semibold text-gray-300">No deposit requests submitted yet.</p>
                  <p className="text-xs text-gray-500">
                    Go to the website, click Deposit, submit an EasyPaisa or JazzCash receipt, and it will appear here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {depositRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        req.status === 'PENDING'
                          ? 'bg-[#122132] border-amber-500/60 shadow-xl'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-red-950/20 border-red-500/30'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Info Column */}
                        <div className="lg:col-span-4 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-black text-emerald-400 font-gaming">
                              +{req.amount.toLocaleString()} PKR
                            </span>
                            <span className="text-xs bg-[#1a2e44] text-cyan-300 font-bold px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                              {req.method}
                            </span>
                          </div>
                          <div className="text-xs text-gray-300">
                            Player: <strong className="text-white">{req.username}</strong>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Submitted: {new Date(req.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Sender & TID Column */}
                        <div className="lg:col-span-4 bg-[#09111b] p-3 rounded-xl border border-[#162738] space-y-1 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Sender Number:</span>
                            <strong className="text-white font-mono text-sm">{req.senderNumber}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Transaction ID (TID):</span>
                            <div className="flex items-center space-x-2">
                              <strong className="text-amber-300 font-mono font-bold tracking-wider text-sm">{req.tid}</strong>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(req.tid);
                                  setCopiedTid(req.tid);
                                  setTimeout(() => setCopiedTid(null), 1500);
                                }}
                                className="text-gray-400 hover:text-white"
                                title="Copy TID"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {copiedTid === req.tid && <span className="text-[10px] text-emerald-400">Copied!</span>}
                            </div>
                          </div>
                        </div>

                        {/* Screenshot Column */}
                        <div className="lg:col-span-2">
                          {req.screenshot ? (
                            <div
                              onClick={() => setPreviewImage(req.screenshot)}
                              className="relative h-20 w-full rounded-xl overflow-hidden border border-[#1f3750] cursor-pointer group bg-black"
                            >
                              <img src={req.screenshot} alt="Receipt" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-[#09111b] rounded-xl border border-[#162738] text-[10px] text-gray-500 italic">
                              No screenshot attached
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Column */}
                        <div className="lg:col-span-2 flex flex-col space-y-2">
                          {req.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>APPROVE</span>
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center space-x-1"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>REJECT</span>
                              </button>
                            </>
                          ) : (
                            <span className={`py-1.5 px-3 rounded-xl text-center font-black text-xs uppercase ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {req.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENT NUMBERS (TILLS) */}
          {activeTab === 'accounts' && (
            <div className="bg-[#0e1824] border border-[#1a2d42] rounded-2xl p-5 shadow-xl space-y-5 max-w-3xl">
              <div>
                <h3 className="text-base font-black text-white font-gaming tracking-wide">
                  YOUR OFFICIAL EASYPAISA & JAZZCASH NUMBERS
                </h3>
                <p className="text-xs text-gray-400">
                  Enter your real mobile account numbers. When users go to Deposit, they will see these exact details!
                </p>
              </div>

              {/* EasyPaisa Form */}
              <div className="p-4 bg-[#111e2b] rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <span>🟢 EasyPaisa Official Account</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">Account Title (Name):</label>
                    <input
                      type="text"
                      value={paymentAccounts.EasyPaisa?.accountTitle || ''}
                      onChange={(e) => setPaymentAccounts({
                        ...paymentAccounts,
                        EasyPaisa: { ...paymentAccounts.EasyPaisa, accountTitle: e.target.value }
                      })}
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">EasyPaisa Mobile Number:</label>
                    <input
                      type="text"
                      value={paymentAccounts.EasyPaisa?.accountNumber || ''}
                      onChange={(e) => setPaymentAccounts({
                        ...paymentAccounts,
                        EasyPaisa: { ...paymentAccounts.EasyPaisa, accountNumber: e.target.value }
                      })}
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* JazzCash Form */}
              <div className="p-4 bg-[#111e2b] rounded-2xl border border-red-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <span>🔴 JazzCash Official Account</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">Account Title (Name):</label>
                    <input
                      type="text"
                      value={paymentAccounts.JazzCash?.accountTitle || ''}
                      onChange={(e) => setPaymentAccounts({
                        ...paymentAccounts,
                        JazzCash: { ...paymentAccounts.JazzCash, accountTitle: e.target.value }
                      })}
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">JazzCash Mobile Number:</label>
                    <input
                      type="text"
                      value={paymentAccounts.JazzCash?.accountNumber || ''}
                      onChange={(e) => setPaymentAccounts({
                        ...paymentAccounts,
                        JazzCash: { ...paymentAccounts.JazzCash, accountNumber: e.target.value }
                      })}
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-red-400 font-mono font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveAccounts}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl text-sm shadow-xl shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE PAYMENT ACCOUNTS</span>
              </button>
            </div>
          )}

          {/* TAB 3: MATCHES & ODDS */}
          {activeTab === 'matches' && (
            <div className="bg-[#0e1824] border border-[#1a2d42] rounded-2xl p-5 shadow-xl space-y-5 max-w-4xl">
              <div>
                <h3 className="text-base font-black text-white font-gaming tracking-wide">
                  SPORTSBOOK CONTROLLER & BET SETTLEMENTS
                </h3>
                <p className="text-xs text-gray-400">
                  Select a match to trigger live goals/wickets or settle match winners to automatically pay out bets!
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">Select Match:</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-[#111e2d] border border-[#20344b] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                >
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.sport.toUpperCase()}] {m.homeTeam} vs {m.awayTeam} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatch && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Event triggers */}
                  <div className="p-4 bg-[#111e2b] rounded-xl border border-[#1b2f44] space-y-3">
                    <span className="font-bold text-white text-xs block uppercase tracking-wider">
                      Trigger Match Events
                    </span>
                    {selectedMatch.sport === 'cricket' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleScoreEvent('FOUR')}
                          className="py-2.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold"
                        >
                          🏏 Hit 4
                        </button>
                        <button
                          onClick={() => handleScoreEvent('SIX')}
                          className="py-2.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold"
                        >
                          🔥 Hit 6
                        </button>
                        <button
                          onClick={() => handleScoreEvent('WICKET')}
                          className="py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold"
                        >
                          ⚡ Wicket
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleScoreEvent('HOME_GOAL')}
                          className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
                        >
                          ⚽ {selectedMatch.homeTeam} Goal
                        </button>
                        <button
                          onClick={() => handleScoreEvent('AWAY_GOAL')}
                          className="py-2.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold"
                        >
                          ⚽ {selectedMatch.awayTeam} Goal
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Settle Bets */}
                  <div className="p-4 bg-[#121822] rounded-xl border border-amber-500/40 space-y-3">
                    <span className="font-bold text-amber-400 text-xs block uppercase tracking-wider">
                      Declare Winner & Payout Bets
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSettle(selectedMatch.homeTeam)}
                        className="py-3 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black rounded-xl text-xs truncate shadow-md"
                      >
                        Win: {selectedMatch.homeTeam}
                      </button>
                      <button
                        onClick={() => handleSettle(selectedMatch.awayTeam)}
                        className="py-3 px-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-black rounded-xl text-xs truncate shadow-md"
                      >
                        Win: {selectedMatch.awayTeam}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REGISTERED USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-[#0e1824] border border-[#1a2d42] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#182a3e] pb-3">
                <div>
                  <h3 className="text-base font-black text-white font-gaming tracking-wide flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    REGISTERED BETTING PLAYERS ({registeredUsers.length})
                  </h3>
                  <p className="text-xs text-gray-400">
                    All accounts created on your platform. You can monitor balances, view mobile numbers, and adjust funds.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search player or phone..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="bg-[#121f2f] border border-[#1f374e] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={fetchUsers}
                    className="p-2 bg-[#142334] hover:bg-[#1b2f46] text-gray-300 rounded-xl border border-[#1e354e]"
                    title="Refresh user list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#09111b] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#182737]">
                    <tr>
                      <th className="p-3">Player / ID</th>
                      <th className="p-3">Mobile Number</th>
                      <th className="p-3">Registered Date</th>
                      <th className="p-3">Real Balance</th>
                      <th className="p-3">Total Deposited</th>
                      <th className="p-3">Bets Placed</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152435]">
                    {registeredUsers
                      .filter(u => {
                        if (!userSearchQuery.trim()) return true;
                        const q = userSearchQuery.toLowerCase();
                        return (
                          u.username?.toLowerCase().includes(q) ||
                          u.phone?.includes(q) ||
                          u.id?.toLowerCase().includes(q)
                        );
                      })
                      .map((usr) => (
                        <tr key={usr.id} className="hover:bg-[#12202f] transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                                {usr.username ? usr.username[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span>{usr.username}</span>
                                <span className="block text-[10px] text-gray-500 font-mono">{usr.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 font-mono font-bold text-cyan-300">
                            {usr.phone || 'N/A'}
                          </td>

                          <td className="p-3 text-gray-400">
                            {new Date(usr.createdAt).toLocaleDateString()} {new Date(usr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          <td className="p-3 font-extrabold text-emerald-400 font-gaming text-sm">
                            {usr.balance?.toLocaleString()} PKR
                          </td>

                          <td className="p-3 font-bold text-gray-300">
                            {usr.totalDeposited?.toLocaleString()} PKR
                          </td>

                          <td className="p-3 font-semibold text-gray-400">
                            {usr.totalBetsCount || usr.totalBetsPlaced || 0}
                          </td>

                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              usr.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {usr.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={async () => {
                                  const amt = prompt(`Enter amount in PKR to add to ${usr.username}:`, '1000');
                                  if (!amt || isNaN(parseFloat(amt))) return;
                                  try {
                                    const res = await fetch('/api/admin/users/adjust-balance', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ userId: usr.id, amount: parseFloat(amt), reason: 'Admin Top-Up' })
                                    });
                                    if (res.ok) {
                                      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
                                      setNotification({ type: 'success', text: `Added ${amt} PKR to ${usr.username}'s account!` });
                                      fetchUsers();
                                      if (onUpdateUser) onUpdateUser();
                                    }
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                +Credit
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/admin/users/toggle-block', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ userId: usr.id })
                                    });
                                    if (res.ok) {
                                      fetchUsers();
                                      setNotification({ type: 'info', text: `Status updated for ${usr.username}` });
                                    }
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                  usr.status === 'ACTIVE'
                                    ? 'bg-red-600/20 hover:bg-red-600/40 text-red-300 border-red-500/40'
                                    : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border-blue-500/40'
                                }`}
                              >
                                {usr.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: EMAIL OTPS & SMTP CONFIGURATION */}
          {activeTab === 'otps' && (
            <div className="space-y-6">
              {/* Live OTP Verification Codes Queue */}
              <div className="bg-[#0e1824] border border-[#1a2d42] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#182a3e] pb-3">
                  <div>
                    <h3 className="text-base font-black text-white font-gaming tracking-wide flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-emerald-400" />
                      LIVE GENERATED REGISTRATION OTPS ({otpLogs.length})
                    </h3>
                    <p className="text-xs text-gray-400">
                      When players register, their 6-digit email confirmation codes show up here in real time.
                    </p>
                  </div>

                  <button
                    onClick={fetchOtpLogs}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-[#142334] hover:bg-[#1b2f46] text-xs font-bold text-gray-300 rounded-xl transition-colors border border-[#1e354e]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Codes</span>
                  </button>
                </div>

                {otpLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    No OTP verification codes generated yet. When users submit the registration form, codes will appear here!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#09111b] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#182737]">
                        <tr>
                          <th className="p-3">Player / Target Email</th>
                          <th className="p-3">Mobile Number</th>
                          <th className="p-3">6-Digit OTP Code</th>
                          <th className="p-3">Dispatched At</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Delivery Mode</th>
                          <th className="p-3 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#152435]">
                        {otpLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#12202f] transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-white">{log.username}</div>
                              <span className="text-[11px] text-cyan-300 font-mono">{log.email}</span>
                            </td>

                            <td className="p-3 font-mono font-bold text-gray-300">
                              {log.phone || 'N/A'}
                            </td>

                            <td className="p-3">
                              <span className="font-black text-emerald-400 font-mono text-base tracking-widest bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-600/40">
                                {log.otp}
                              </span>
                            </td>

                            <td className="p-3 text-gray-400 text-[11px]">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </td>

                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                log.status === 'VERIFIED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              }`}>
                                {log.status}
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="text-[10px] bg-[#16273b] text-gray-300 px-2 py-0.5 rounded font-mono">
                                {log.deliveryStatus}
                              </span>
                            </td>

                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(log.otp);
                                  setNotification({ type: 'success', text: `OTP ${log.otp} copied to clipboard!` });
                                }}
                                className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                Copy OTP
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SMTP Email Server Configuration Card */}
              <div className="bg-[#0e1824] border border-[#1a2d42] rounded-2xl p-5 shadow-xl space-y-4 max-w-2xl">
                <div>
                  <h3 className="text-base font-black text-white font-gaming tracking-wide flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    REAL GMAIL / SMTP SERVER SETTINGS
                  </h3>
                  <p className="text-xs text-gray-400">
                    Agar aap chahte hain ke verification emails real Gmail inbox par jayen, toh apna Gmail address aur App Password yahan enter karein:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">SMTP Server Host:</label>
                    <input
                      type="text"
                      value={smtpSettings.host}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">SMTP Port:</label>
                    <input
                      type="number"
                      value={smtpSettings.port}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value, 10) })}
                      placeholder="465"
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Your Gmail / Sender Email:</label>
                    <input
                      type="email"
                      value={smtpSettings.user}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                      placeholder="yourbettingemail@gmail.com"
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Gmail App Password (16-char):</label>
                    <input
                      type="password"
                      value={smtpSettings.pass}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full bg-[#081018] border border-[#1f374e] rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSmtp}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all"
                >
                  SAVE SMTP EMAIL SETTINGS
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: 10 EMPTY CRASH SLOTS CONTROLLER (AVIATOR RIGGING) */}
          {activeTab === 'crash' && (
            <div className="space-y-6">
              {/* Header & Status Card */}
              <div className="bg-gradient-to-r from-[#180d12] via-[#1a121d] to-[#0c1624] border border-rose-900/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                        <Plane className="w-6 h-6 transform -rotate-45" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white font-gaming tracking-wide flex items-center gap-2">
                          AVIATOR 10-SLOT CRASH RIG CONTROLLER
                          <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            EXACT MULTIPLIER CONTROL
                          </span>
                        </h2>
                        <p className="text-xs text-gray-400">
                          10 Empty Slots: Yahan aap jo number likhenge (e.g. <span className="text-red-400 font-mono font-bold">1.05</span>, <span className="text-amber-400 font-mono font-bold">1.20</span>, <span className="text-cyan-400 font-mono font-bold">2.50</span>, <span className="text-purple-400 font-mono font-bold">10.00</span>), Aviator game agle round mein <span className="text-emerald-400 font-bold underline">theek usi number par crash</span> karegi!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time active target indicator */}
                  {(() => {
                    const nextIdx = crashSlots.findIndex(s => s !== '' && !isNaN(parseFloat(s)) && parseFloat(s) >= 1.00);
                    return nextIdx !== -1 ? (
                      <div className="bg-red-950/80 border border-red-500/60 px-4 py-2.5 rounded-xl flex items-center space-x-3 shadow-lg shadow-red-900/30">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                        <div>
                          <div className="text-[10px] text-red-300 uppercase font-black tracking-wider">Next Round Crash Target:</div>
                          <div className="text-lg font-black text-white font-mono flex items-center gap-1.5">
                            <span className="text-red-400">Slot #{nextIdx + 1}:</span>
                            <span className="text-amber-300 underline font-black">{parseFloat(crashSlots[nextIdx]).toFixed(2)}x</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#101c2a] border border-[#1d3249] px-4 py-2.5 rounded-xl flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">Standard Flight Mode</div>
                          <div className="text-xs font-bold text-cyan-300">Random 95% RTP (No Slots Queued)</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Preset Fast Actions */}
                <div className="mt-5 pt-4 border-t border-[#2d1b28] flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-400 mr-2 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-rose-400" />
                    Quick Strategy Presets:
                  </span>

                  <button
                    onClick={() => applyPresetAndSave(['1.05', '1.02', '1.10', '1.03', '1.08', '1.04', '1.12', '1.01', '1.06', '1.15'], 'House Win Trap (1.01x - 1.15x)')}
                    className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900/90 text-red-300 border border-red-600/50 rounded-xl text-xs font-black transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    <span>💀 Sab Bust Karein (1.02x - 1.15x)</span>
                  </button>

                  <button
                    onClick={() => applyPresetAndSave(['5.00', '8.50', '12.00', '3.80', '18.00', '25.00', '6.20', '35.00', '10.50', '50.00'], 'Mega Rocket (5x - 50x)')}
                    className="px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-600/50 rounded-xl text-xs font-black transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    <span>🚀 Mega Rocket (5x - 50x)</span>
                  </button>

                  <button
                    onClick={() => applyPresetAndSave(['2.20', '4.50', '1.03', '1.08', '3.10', '1.02', '5.80', '1.04', '1.15', '1.01'], 'Bait & Trap')}
                    className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-600/50 rounded-xl text-xs font-black transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    <span>🎣 Bait & Trap (2x, 5x, phir 1.02x)</span>
                  </button>

                  <button
                    onClick={() => applyPresetAndSave(Array(10).fill(''), 'Clear All Slots')}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Clear All 10 Slots</span>
                  </button>
                </div>
              </div>

              {/* 10 Empty Whole / Slots Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white font-gaming tracking-wide flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-400" />
                    10 EMPTY WHOLE / CRASH MULTIPLIER SLOTS:
                  </h3>
                  <span className="text-xs text-gray-400">
                    Sequential Order: Round 1 uses Slot #1, Round 2 uses Slot #2, and so forth.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {crashSlots.map((val, idx) => {
                    const numVal = parseFloat(val);
                    const isConfigured = !isNaN(numVal) && numVal >= 1.00;
                    
                    // Check if this is the next one to be consumed
                    const firstConfiguredIdx = crashSlots.findIndex(s => s !== '' && !isNaN(parseFloat(s)) && parseFloat(s) >= 1.00);
                    const isNextTarget = firstConfiguredIdx === idx;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between space-y-3 relative overflow-hidden ${
                          isNextTarget
                            ? 'bg-gradient-to-b from-[#241018] to-[#12080d] border-red-500 shadow-xl shadow-red-600/20 ring-1 ring-red-500'
                            : isConfigured
                            ? 'bg-[#0f1926] border-cyan-500/40 shadow-lg'
                            : 'bg-[#0a121c] border-[#18283b] hover:border-gray-600'
                        }`}
                      >
                        {/* Slot Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs font-gaming tracking-wider text-gray-300 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-[#18283c] flex items-center justify-center text-[10px] text-white font-mono font-bold">
                              {idx + 1}
                            </span>
                            SLOT #{idx + 1}
                          </span>

                          {isNextTarget ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-600 text-white tracking-widest animate-pulse">
                              NEXT IN LINE
                            </span>
                          ) : isConfigured ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                              QUEUED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-gray-900 text-gray-500">
                              EMPTY (RANDOM)
                            </span>
                          )}
                        </div>

                        {/* Input Whole / Slot */}
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="1.00"
                            max="1000.00"
                            placeholder="Khali (Auto)"
                            value={val}
                            onChange={(e) => handleSlotChange(idx, e.target.value)}
                            className={`w-full bg-[#050b11] border rounded-xl py-2.5 pl-3.5 pr-8 text-lg font-black font-mono tracking-wider transition-colors outline-none ${
                              isNextTarget
                                ? 'border-red-500/80 text-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                                : isConfigured
                                ? 'border-cyan-500/60 text-cyan-300 focus:border-cyan-400'
                                : 'border-[#1b2f44] text-gray-300 focus:border-gray-400'
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 font-mono pointer-events-none">
                            x
                          </span>
                        </div>

                        {/* Quick Preset Multiplier Chips for this single slot */}
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <button
                            onClick={() => handleSlotChange(idx, '1.05')}
                            className="px-1.5 py-0.5 bg-[#142232] hover:bg-red-950 hover:text-red-300 text-gray-400 rounded font-mono font-bold transition-colors"
                          >
                            1.05x
                          </button>
                          <button
                            onClick={() => handleSlotChange(idx, '1.20')}
                            className="px-1.5 py-0.5 bg-[#142232] hover:bg-amber-950 hover:text-amber-300 text-gray-400 rounded font-mono font-bold transition-colors"
                          >
                            1.20x
                          </button>
                          <button
                            onClick={() => handleSlotChange(idx, '2.00')}
                            className="px-1.5 py-0.5 bg-[#142232] hover:bg-cyan-950 hover:text-cyan-300 text-gray-400 rounded font-mono font-bold transition-colors"
                          >
                            2.00x
                          </button>
                          <button
                            onClick={() => handleSlotChange(idx, '5.00')}
                            className="px-1.5 py-0.5 bg-[#142232] hover:bg-purple-950 hover:text-purple-300 text-gray-400 rounded font-mono font-bold transition-colors"
                          >
                            5.00x
                          </button>
                          <button
                            onClick={() => handleSlotChange(idx, '10.00')}
                            className="px-1.5 py-0.5 bg-[#142232] hover:bg-emerald-950 hover:text-emerald-300 text-gray-400 rounded font-mono font-bold transition-colors"
                          >
                            10x
                          </button>
                          {val !== '' && (
                            <button
                              onClick={() => handleClearSlot(idx)}
                              className="px-1.5 py-0.5 bg-red-950/60 hover:bg-red-900 text-red-400 rounded font-mono font-bold ml-auto"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="bg-[#0b1420] border border-[#1a2c40] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    LIVE AVIATOR ENGINE SYNC ACTIVE
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Slots save hote hi Aviator game server mein update ho jayenge. Jab round khatam hoga, use hua slot khali ho jayega aur agla slot number lag jayega!
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={fetchCrashSlots}
                    className="px-4 py-3 bg-[#132233] hover:bg-[#1a2e45] text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 border border-[#1e344f]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => handleSaveCrashSlots(crashSlots)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>SAVE & ACTIVATE 10 CRASH SLOTS</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Full Screenshot Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-[#0c1520] p-2 rounded-2xl border border-cyan-500 shadow-2xl">
            <img src={previewImage} alt="Full Receipt" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="text-center text-xs text-gray-400 mt-2 font-medium">Click anywhere to close preview</div>
          </div>
        </div>
      )}
    </div>
  );
}
