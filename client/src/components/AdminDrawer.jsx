import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Trophy, 
  Zap, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Check, 
  Trash2, 
  Eye, 
  Edit3,
  Copy,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDrawer({ 
  isOpen, 
  onClose, 
  matches = [], 
  onUpdateMatches,
  onUpdateUser 
}) {
  if (!isOpen) return null;

  const [adminTab, setAdminTab] = useState('deposits'); // 'deposits' | 'accounts' | 'matches'
  const [depositRequests, setDepositRequests] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [previewImage, setPreviewImage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [copiedTid, setCopiedTid] = useState(null);

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

  useEffect(() => {
    fetchRequests();
    fetchAccounts();
  }, [isOpen]);

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

  const handleApproveDeposit = async (requestId) => {
    try {
      const res = await fetch('/api/admin/deposit-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.5 }
      });

      setNotification({ type: 'success', text: data.message });
      fetchRequests();
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleRejectDeposit = async (requestId) => {
    const reason = prompt('Enter reason for rejection (e.g. TID mismatch, SMS not received):', 'Payment TID not found in account');
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

      setNotification({ type: 'success', text: 'Payment account numbers updated for all users!' });
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
        payload.status = '2nd Inning (Overs: 16.1)';
      } else if (selectedMatch.sport === 'football') {
        const home = parseInt(selectedMatch.homeScore || '0', 10);
        const away = parseInt(selectedMatch.awayScore || '0', 10);
        if (type === 'HOME_GOAL') {
          payload.homeScore = (home + 1).toString();
        } else if (type === 'AWAY_GOAL') {
          payload.awayScore = (away + 1).toString();
        }
        payload.status = '82\' (2nd Half)';
      }

      const res = await fetch('/api/admin/match/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to trigger score');

      setNotification({ type: 'success', text: `Live score event triggered!` });
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

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
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

  const pendingCount = depositRequests.filter(r => r.status === 'PENDING').length;
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0a121c] border-l border-amber-500/30 shadow-2xl flex flex-col animate-slide-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#0e1927] border-b border-[#1b2d42]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white font-gaming tracking-wide">
              ADMINISTRATOR CONTROL PANEL
            </h3>
            <p className="text-[10px] text-amber-400 font-semibold">Deposit Approvals & Platform Settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#16273b] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="grid grid-cols-3 p-2 bg-[#080e16] border-b border-[#182737] gap-1 text-xs font-bold">
        <button
          onClick={() => { setAdminTab('deposits'); setNotification(null); fetchRequests(); }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            adminTab === 'deposits'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Deposits</span>
          {pendingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setAdminTab('accounts'); setNotification(null); }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            adminTab === 'accounts'
              ? 'bg-[#182b3e] text-cyan-300 shadow-md border border-cyan-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>My Numbers</span>
        </button>

        <button
          onClick={() => { setAdminTab('matches'); setNotification(null); }}
          className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            adminTab === 'matches'
              ? 'bg-[#182b3e] text-amber-300 shadow-md border border-amber-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Match Control</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
        {notification && (
          <div className={`p-3 rounded-xl flex items-center space-x-2 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-200'
              : 'bg-red-950/90 border border-red-500/60 text-red-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.text}</span>
          </div>
        )}

        {/* TAB 1: DEPOSIT REQUESTS APPROVAL */}
        {adminTab === 'deposits' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                User Deposit Submissions ({depositRequests.length})
              </span>
              <button
                onClick={fetchRequests}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Refresh List
              </button>
            </div>

            {depositRequests.length === 0 ? (
              <div className="text-center py-12 bg-[#0e1824] rounded-2xl border border-[#1a2d40] text-gray-400">
                <Smartphone className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="font-semibold text-xs text-gray-300">No deposit requests yet</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  When users send money and submit screenshots, they will appear here for one-click approval.
                </p>
              </div>
            ) : (
              depositRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    req.status === 'PENDING'
                      ? 'bg-[#101e2d] border-amber-500/50 shadow-lg'
                      : req.status === 'APPROVED'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-emerald-400 font-gaming">
                        +{req.amount.toLocaleString()} PKR
                      </span>
                      <span className="text-[10px] bg-[#16273b] text-cyan-300 font-bold px-2 py-0.5 rounded">
                        {req.method}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : req.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-[#09111a] p-2.5 rounded-xl border border-[#172535] text-[11px] mb-3">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Player:</span>
                      <strong className="text-white font-bold">{req.username}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Sender Number:</span>
                      <strong className="text-cyan-400 font-mono">{req.senderNumber}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">TID (Transaction ID):</span>
                      <div className="flex items-center space-x-1.5">
                        <strong className="text-amber-300 font-mono font-bold tracking-wider">{req.tid}</strong>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(req.tid);
                            setCopiedTid(req.tid);
                            setTimeout(() => setCopiedTid(null), 1500);
                          }}
                          className="text-gray-400 hover:text-white"
                          title="Copy TID to verify against SMS"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedTid === req.tid && <span className="text-[9px] text-emerald-400">Copied!</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Submitted:</span>
                      <span className="text-gray-300">{new Date(req.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Screenshot Thumbnail */}
                  {req.screenshot ? (
                    <div className="mb-3">
                      <span className="text-[10px] text-gray-400 font-semibold block mb-1">Receipt Screenshot:</span>
                      <div 
                        onClick={() => setPreviewImage(req.screenshot)}
                        className="relative h-28 w-full rounded-xl overflow-hidden border border-[#20344a] cursor-pointer group bg-black"
                      >
                        <img
                          src={req.screenshot}
                          alt="Receipt"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-1 text-white font-bold transition-opacity">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">Click to view full screenshot</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 italic mb-2">No screenshot attached</div>
                  )}

                  {/* Approve / Reject Actions */}
                  {req.status === 'PENDING' ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleApproveDeposit(req.id)}
                        className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>APPROVE & CREDIT</span>
                      </button>

                      <button
                        onClick={() => handleRejectDeposit(req.id)}
                        className="py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 italic">
                      Processed at: {new Date(req.processedAt || req.createdAt).toLocaleTimeString()}
                      {req.notes && ` (Note: ${req.notes})`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: EDIT PAYMENT NUMBERS */}
        {adminTab === 'accounts' && (
          <div className="space-y-4">
            <div className="text-xs text-gray-300 font-medium">
              Update the EasyPaisa and JazzCash numbers shown to users on the deposit screen:
            </div>

            {/* EasyPaisa Box */}
            <div className="p-3.5 bg-[#0f1b29] rounded-xl border border-emerald-500/30 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                <span>🟢 EasyPaisa Account</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Account Title (Name):</label>
                <input
                  type="text"
                  value={paymentAccounts.EasyPaisa.accountTitle}
                  onChange={(e) => setPaymentAccounts({
                    ...paymentAccounts,
                    EasyPaisa: { ...paymentAccounts.EasyPaisa, accountTitle: e.target.value }
                  })}
                  className="w-full bg-[#0a121a] border border-[#1f344a] rounded-lg px-3 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Mobile / Account Number:</label>
                <input
                  type="text"
                  value={paymentAccounts.EasyPaisa.accountNumber}
                  onChange={(e) => setPaymentAccounts({
                    ...paymentAccounts,
                    EasyPaisa: { ...paymentAccounts.EasyPaisa, accountNumber: e.target.value }
                  })}
                  className="w-full bg-[#0a121a] border border-[#1f344a] rounded-lg px-3 py-1.5 text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>

            {/* JazzCash Box */}
            <div className="p-3.5 bg-[#0f1b29] rounded-xl border border-red-500/30 space-y-2">
              <div className="font-bold text-red-400 flex items-center space-x-1.5">
                <span>🔴 JazzCash Account</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Account Title (Name):</label>
                <input
                  type="text"
                  value={paymentAccounts.JazzCash.accountTitle}
                  onChange={(e) => setPaymentAccounts({
                    ...paymentAccounts,
                    JazzCash: { ...paymentAccounts.JazzCash, accountTitle: e.target.value }
                  })}
                  className="w-full bg-[#0a121a] border border-[#1f344a] rounded-lg px-3 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Mobile / Account Number:</label>
                <input
                  type="text"
                  value={paymentAccounts.JazzCash.accountNumber}
                  onChange={(e) => setPaymentAccounts({
                    ...paymentAccounts,
                    JazzCash: { ...paymentAccounts.JazzCash, accountNumber: e.target.value }
                  })}
                  className="w-full bg-[#0a121a] border border-[#1f344a] rounded-lg px-3 py-1.5 text-red-400 font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleSaveAccounts}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl transition-all shadow-lg shadow-cyan-600/30"
            >
              SAVE UPDATED PAYMENT ACCOUNTS
            </button>
          </div>
        )}

        {/* TAB 3: MATCHES & SCORES */}
        {adminTab === 'matches' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-300 uppercase tracking-wider text-[11px] block">
                Select Active Match:
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-[#111e2d] border border-[#20344b] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.sport.toUpperCase()}] {m.homeTeam} vs {m.awayTeam} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedMatch && (
              <>
                <div className="bg-[#0f1b29] p-4 rounded-xl border border-[#1b2f44] space-y-3">
                  <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Trigger Live Events</span>
                    <span className="text-amber-400 font-normal">{selectedMatch.sportName}</span>
                  </div>

                  {selectedMatch.sport === 'cricket' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleScoreEvent('FOUR')}
                        className="p-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 rounded-xl font-bold transition-all"
                      >
                        🏏 Hit 4 Runs
                      </button>
                      <button
                        onClick={() => handleScoreEvent('SIX')}
                        className="p-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 rounded-xl font-bold transition-all"
                      >
                        🔥 Hit 6 Runs
                      </button>
                      <button
                        onClick={() => handleScoreEvent('WICKET')}
                        className="p-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 rounded-xl font-bold transition-all"
                      >
                        ⚡ Wicket!
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleScoreEvent('HOME_GOAL')}
                        className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold transition-all"
                      >
                        ⚽ {selectedMatch.homeTeam} Goal
                      </button>
                      <button
                        onClick={() => handleScoreEvent('AWAY_GOAL')}
                        className="p-2.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 rounded-xl font-bold transition-all"
                      >
                        ⚽ {selectedMatch.awayTeam} Goal
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-[#121822] p-4 rounded-xl border border-amber-500/40 space-y-3">
                  <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Declare Winner & Settle Bets</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Instantly settle active user bets for this match and disburse winnings to the wallet.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleSettle(selectedMatch.homeTeam)}
                      className="py-3 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl transition-all truncate shadow-md"
                    >
                      Win: {selectedMatch.homeTeam}
                    </button>
                    <button
                      onClick={() => handleSettle(selectedMatch.awayTeam)}
                      className="py-3 px-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl transition-all truncate shadow-md"
                    >
                      Win: {selectedMatch.awayTeam}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Full Screenshot Modal Preview */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-[#0c1520] p-2 rounded-2xl border border-cyan-500/50 shadow-2xl">
            <img
              src={previewImage}
              alt="Payment Receipt Large"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="text-center text-xs text-gray-400 mt-2 font-medium">
              Click anywhere to close preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
