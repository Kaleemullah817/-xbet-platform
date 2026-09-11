import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CheckCircle2, 
  Copy, 
  UploadCloud, 
  Clock, 
  AlertCircle, 
  FileText,
  Eye,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WalletModal({ isOpen, onClose, user, transactions = [], onUpdateUser }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'myRequests' | 'history'
  const [method, setMethod] = useState('EasyPaisa');
  const [amount, setAmount] = useState('2500');
  const [senderNumber, setSenderNumber] = useState('');
  const [tid, setTid] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Withdrawal state
  const [withdrawMethod, setWithdrawMethod] = useState('EasyPaisa');
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountTitle, setWithdrawAccountTitle] = useState('');
  const [withdrawSuccessModal, setWithdrawSuccessModal] = useState(null);
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [requestsFilter, setRequestsFilter] = useState('all'); // 'all' | 'deposits' | 'withdrawals'
  
  const [adminAccounts, setAdminAccounts] = useState({
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

  const [myRequests, setMyRequests] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch admin accounts and user requests
  useEffect(() => {
    fetch('/api/payment-accounts')
      .then(res => res.json())
      .then(data => setAdminAccounts(data))
      .catch(err => console.error(err));

    fetchUserRequests();
  }, [isOpen]);

  const fetchUserRequests = () => {
    fetch('/api/wallet/my-deposits')
      .then(res => res.json())
      .then(data => setMyRequests(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch('/api/wallet/my-withdrawals')
      .then(res => res.json())
      .then(data => setMyWithdrawals(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDepositProof = async () => {
    setFeedback(null);
    if (!amount || parseFloat(amount) < 100) {
      setFeedback({ type: 'error', text: 'Min deposit amount is 100 PKR' });
      return;
    }
    if (!senderNumber.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your sender mobile / account number' });
      return;
    }
    if (!tid.trim() || tid.trim().length < 6) {
      setFeedback({ type: 'error', text: 'Please enter a valid Transaction ID (TID)' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          senderNumber,
          tid,
          screenshot
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit proof');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setFeedback({
        type: 'success',
        text: 'Deposit proof submitted! Admin will verify and approve your funds shortly.'
      });
      setTid('');
      setScreenshot(null);
      setScreenshotPreview(null);
      fetchUserRequests();
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitWithdrawal = async () => {
    setFeedback(null);
    const numAmount = parseFloat(withdrawAmount);
    if (!numAmount || numAmount < 100) {
      setFeedback({ type: 'error', text: 'Minimum withdrawal amount is 100 PKR' });
      return;
    }
    if ((user?.balance || 0) < numAmount) {
      setFeedback({ type: 'error', text: `Insufficient balance! Your current balance is ${(user?.balance || 0).toLocaleString()} PKR` });
      return;
    }
    if (!withdrawAccountNumber.trim() || withdrawAccountNumber.trim().length < 8) {
      setFeedback({ type: 'error', text: 'Please enter a valid mobile or bank account number' });
      return;
    }
    if (!withdrawAccountTitle.trim() || withdrawAccountTitle.trim().length < 2) {
      setFeedback({ type: 'error', text: 'Please enter the Account Title (Name as registered)' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          method: withdrawMethod,
          accountNumber: withdrawAccountNumber.trim(),
          accountTitle: withdrawAccountTitle.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal request');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });

      setWithdrawSuccessModal({
        ...data.request,
        whatsappLink: data.whatsappLink,
        whatsappNumber: data.whatsappNumber || '03177229994',
        whatsappPrompt: data.whatsappPrompt || 'Withdraw in review contact on 03177229994 whatsapp'
      });

      fetchUserRequests();
      if (onUpdateUser) onUpdateUser();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAccount = adminAccounts[method] || adminAccounts.EasyPaisa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f1b29] border border-[#1f344a] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#182a3c] bg-[#0c1622]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-gaming tracking-wide flex items-center space-x-2">
                <span>1X-BET CASHIER</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-sans font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Instant Service
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Current Balance: <strong className="text-emerald-400 font-mono text-xs">{user?.balance?.toLocaleString()} PKR</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#152435] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 p-1.5 bg-[#09111a] border-b border-[#182a3c] gap-1 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('deposit'); setFeedback(null); setWithdrawSuccessModal(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => { setActiveTab('withdraw'); setFeedback(null); setWithdrawSuccessModal(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => { setActiveTab('myRequests'); setFeedback(null); setWithdrawSuccessModal(null); fetchUserRequests(); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'myRequests'
                ? 'bg-[#182b3e] text-cyan-300 shadow-md border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Requests ({myRequests.length + myWithdrawals.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setFeedback(null); setWithdrawSuccessModal(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'history'
                ? 'bg-[#182b3e] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 shadow-md' 
                : 'bg-red-950/90 border border-red-500/60 text-red-200 shadow-md'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: DEPOSIT PROOF */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  1. Choose Payment Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setMethod('EasyPaisa')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-2.5 ${
                      method === 'EasyPaisa'
                        ? 'bg-[#14283b] border-emerald-500 text-white shadow-md'
                        : 'bg-[#101b27] border-[#1c2e42] text-gray-300 hover:bg-[#142232]'
                    }`}
                  >
                    <span className="text-xl">🟢</span>
                    <div>
                      <div className="text-xs font-bold">EasyPaisa</div>
                      <div className="text-[9px] text-emerald-400 font-semibold">Active Account</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setMethod('JazzCash')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-2.5 ${
                      method === 'JazzCash'
                        ? 'bg-[#14283b] border-red-500 text-white shadow-md'
                        : 'bg-[#101b27] border-[#1c2e42] text-gray-300 hover:bg-[#142232]'
                    }`}
                  >
                    <span className="text-xl">🔴</span>
                    <div>
                      <div className="text-xs font-bold">JazzCash</div>
                      <div className="text-[9px] text-red-400 font-semibold">Active Account</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setMethod('BankTransfer')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-2.5 ${
                      method === 'BankTransfer'
                        ? 'bg-[#14283b] border-cyan-500 text-white shadow-md'
                        : 'bg-[#101b27] border-[#1c2e42] text-gray-300 hover:bg-[#142232]'
                    }`}
                  >
                    <span className="text-xl">🏛️</span>
                    <div>
                      <div className="text-xs font-bold">Bank Wire</div>
                      <div className="text-[9px] text-cyan-400 font-semibold">Meezan Bank</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Account Details Box with Copy button */}
              <div className="bg-gradient-to-br from-[#122336] to-[#162a3f] p-4 rounded-xl border border-cyan-500/40 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide">
                    2. Official Deposit Account
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                    VERIFIED AGENT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#0b1420] p-3 rounded-lg border border-[#1b2f44]">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Account Title:</span>
                    <strong className="text-white font-bold">{currentAccount?.accountTitle}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Account / Mobile Number:</span>
                    <div className="flex items-center space-x-2">
                      <strong className="text-emerald-400 font-mono font-bold text-sm tracking-wide">
                        {currentAccount?.accountNumber}
                      </strong>
                      <button
                        onClick={() => handleCopy(currentAccount?.accountNumber)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-[#1a2d42] rounded transition-colors"
                        title="Copy account number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {copied && (
                  <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
                    ✓ Account number copied to clipboard!
                  </span>
                )}

                <p className="text-[11px] text-gray-300 mt-2 italic">
                  💡 {currentAccount?.instructions}
                </p>
              </div>

              {/* Deposit Amount */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-gray-300 font-bold">3. Amount Sent (PKR):</span>
                  <span className="text-emerald-400 font-semibold">Min: 100 PKR</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0a121a] border border-[#20344a] rounded-xl px-4 py-2.5 text-base font-extrabold text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {['1000', '2500', '5000', '10000'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="py-1 bg-[#142332] hover:bg-[#1a2d40] rounded-lg text-xs font-bold text-gray-300 border border-[#1e344a] transition-colors"
                    >
                      +{Number(val).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Number and TID inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">
                    Your Sender Mobile Number:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full bg-[#0a121a] border border-[#20344a] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">
                    Transaction ID (TID):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24598712345"
                    value={tid}
                    onChange={(e) => setTid(e.target.value)}
                    className="w-full bg-[#0a121a] border border-[#20344a] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Screenshot Upload Box */}
              <div>
                <label className="font-bold text-gray-300 text-xs block mb-1">
                  Upload Payment Screenshot / Receipt:
                </label>
                <div className="border-2 border-dashed border-[#23384e] hover:border-cyan-500/60 rounded-xl p-3 text-center cursor-pointer bg-[#0b1420] transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {screenshotPreview ? (
                    <div className="flex items-center justify-center space-x-3">
                      <img
                        src={screenshotPreview}
                        alt="Proof Preview"
                        className="h-16 w-28 object-cover rounded-lg border border-cyan-500"
                      />
                      <span className="text-xs text-emerald-400 font-bold">Screenshot Attached ✓ (Click to change)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2 space-y-1">
                      <UploadCloud className="w-6 h-6 text-cyan-400" />
                      <span className="text-xs text-gray-300 font-semibold">
                        Click or drag & drop payment screenshot here
                      </span>
                      <span className="text-[10px] text-gray-500">Supports PNG, JPG, JPEG</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Proof Button */}
              <button
                onClick={handleSubmitDepositProof}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Submitting Receipt...' : `SUBMIT PAYMENT PROOF (${amount} PKR)`}
              </button>
            </div>
          )}

          {/* TAB 2: WITHDRAWAL / CASHOUT */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              {withdrawSuccessModal ? (
                /* Dedicated Success Card matching user prompt */
                <div className="bg-gradient-to-br from-[#0c231a] to-[#0a1827] border-2 border-emerald-500/80 p-5 rounded-2xl text-center space-y-4 shadow-2xl animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-400/80">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                      WITHDRAWAL REQUEST SUBMITTED
                    </span>
                    <h3 className="text-lg font-black text-white font-gaming">
                      {withdrawSuccessModal.amount?.toLocaleString()} PKR Held for Processing
                    </h3>
                  </div>

                  {/* USER REQUESTED EXACT NOTIFICATION BANNER */}
                  <div className="p-4 bg-[#07131a] rounded-xl border-2 border-amber-500/80 shadow-lg text-left space-y-1">
                    <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wide">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>OFFICIAL STATUS NOTIFICATION:</span>
                    </div>
                    <p className="text-sm sm:text-base font-extrabold text-amber-300 leading-snug">
                      withdraw in review contact on 03177229994 whatsapp
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Apka withdrawal review main hai. Admin se WhatsApp par rabta kar ke foran payment clear karwayen.
                    </p>
                  </div>

                  {/* Details summary */}
                  <div className="bg-[#0b1522] p-3 rounded-xl border border-[#1b2d42] text-xs space-y-1.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Channel:</span>
                      <strong className="text-cyan-300">{withdrawSuccessModal.method}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number:</span>
                      <strong className="text-emerald-400 font-mono">{withdrawSuccessModal.accountNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Title:</span>
                      <strong className="text-white">{withdrawSuccessModal.accountTitle}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID:</span>
                      <strong className="text-gray-400 font-mono text-[11px]">{withdrawSuccessModal.id}</strong>
                    </div>
                  </div>

                  {/* Clickable WhatsApp Deep Link Button */}
                  <a
                    href={withdrawSuccessModal.whatsappLink || `https://wa.me/923177229994?text=${encodeURIComponent(
                      `Salam Admin, Maine 1X-BET se ${withdrawSuccessModal.amount} PKR ka withdrawal request bheja hai.\nUser: ${user?.username}\nAccount: ${withdrawSuccessModal.accountNumber} (${withdrawSuccessModal.accountTitle})\nMethod: ${withdrawSuccessModal.method}\nReq: ${withdrawSuccessModal.id}\nPlease review and approve.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black text-sm rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>Open WhatsApp (0317-7229994)</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>

                  <div className="flex justify-center space-x-4 pt-1">
                    <button
                      onClick={() => {
                        setWithdrawSuccessModal(null);
                        setActiveTab('myRequests');
                        setRequestsFilter('withdrawals');
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline transition-colors"
                    >
                      View All My Requests →
                    </button>
                    <button
                      onClick={() => setWithdrawSuccessModal(null)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      New Request
                    </button>
                  </div>
                </div>
              ) : (
                /* Withdrawal Input Form */
                <div className="space-y-4">
                  {/* Top Notice matching prompt */}
                  <div className="p-3.5 bg-gradient-to-r from-[#172619] to-[#0e1d2c] rounded-xl border border-emerald-500/50 flex items-start space-x-3 shadow-md">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-extrabold text-white text-[12px] flex items-center space-x-2">
                        <span>Withdraw In Review Notice</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                          WhatsApp Support
                        </span>
                      </div>
                      <p className="text-emerald-300 font-bold">
                        Withdraw in review contact on 03177229994 whatsapp
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Funds are dispatched directly to your EasyPaisa, JazzCash, or Bank via WhatsApp verification.
                      </p>
                    </div>
                  </div>

                  {/* 1. Payment Method Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      1. Receiving Account Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => setWithdrawMethod('EasyPaisa')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
                          withdrawMethod === 'EasyPaisa'
                            ? 'bg-[#14283b] border-emerald-500 text-white shadow-md'
                            : 'bg-[#101b27] border-[#1c2e42] text-gray-300 hover:bg-[#142232]'
                        }`}
                      >
                        <span className="text-xl">🟢</span>
                        <div>
                          <div className="text-xs font-bold">EasyPaisa</div>
                          <div className="text-[9px] text-emerald-400 font-semibold">Instant Cashout</div>
                        </div>
                      </div>

                      <div
                        onClick={() => setWithdrawMethod('JazzCash')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
                          withdrawMethod === 'JazzCash'
                            ? 'bg-[#14283b] border-red-500 text-white shadow-md'
                            : 'bg-[#101b27] border-[#1c2e42] text-gray-300 hover:bg-[#142232]'
                        }`}
                      >
                        <span className="text-xl">🔴</span>
                        <div>
                          <div className="text-xs font-bold">JazzCash</div>
                          <div className="text-[9px] text-red-400 font-semibold">Instant Cashout</div>
                        </div>
                      </div>

                      <div
                        onClick={() => setWithdrawMethod('BankTransfer')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
                          withdrawMethod === 'BankTransfer'
                            ? 'bg-[#14283b] border-cyan-500 text-white shadow-md'
                            : 'bg-[#101b27] border-[#1c2e42] text-gray-300 hover:bg-[#142232]'
                        }`}
                      >
                        <span className="text-xl">🏛️</span>
                        <div>
                          <div className="text-xs font-bold">Bank Wire</div>
                          <div className="text-[9px] text-cyan-400 font-semibold">All Pak Banks</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Amount Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-gray-300 font-bold">2. Withdrawal Amount (PKR):</span>
                      <span className="text-gray-400">
                        Available: <strong className="text-emerald-400 font-mono">{(user?.balance || 0).toLocaleString()} PKR</strong>
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="Enter amount to cash out"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-[#0a121a] border border-[#20344a] rounded-xl px-4 py-2.5 text-base font-extrabold text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {['500', '1000', '2500', '5000'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setWithdrawAmount(val)}
                          className="py-1 bg-[#142332] hover:bg-[#1a2d40] rounded-lg text-xs font-bold text-gray-300 border border-[#1e344a] transition-colors"
                        >
                          {Number(val).toLocaleString()} PKR
                        </button>
                      ))}
                    </div>
                    {user?.balance > 0 && (
                      <button
                        onClick={() => setWithdrawAmount(String(user?.balance || 0))}
                        className="mt-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                      >
                        <span>⚡ Withdraw All Balance ({(user?.balance || 0).toLocaleString()} PKR)</span>
                      </button>
                    )}
                  </div>

                  {/* 3. Receiving Account Details */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      3. Your Receiving Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-gray-300 block mb-1">
                          Account / Mobile Number:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 03001234567 or IBAN"
                          value={withdrawAccountNumber}
                          onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                          className="w-full bg-[#0a121a] border border-[#20344a] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-300 block mb-1">
                          Account Title (Exact Name):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Muhammad Ali"
                          value={withdrawAccountTitle}
                          onChange={(e) => setWithdrawAccountTitle(e.target.value)}
                          className="w-full bg-[#0a121a] border border-[#20344a] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitWithdrawal}
                    disabled={isProcessing || (user?.balance || 0) < 100}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>
                      {isProcessing ? 'Submitting Withdrawal...' : `REQUEST WITHDRAWAL (${withdrawAmount || 0} PKR)`}
                    </span>
                  </button>

                  {/* WhatsApp Prompt reminder button */}
                  <div className="text-center pt-1">
                    <a
                      href="https://wa.me/923177229994?text=Salam%20Admin,%20Mujhe%20withdrawal%20ke%20bare%20main%20maloomat%20chahiye."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Direct WhatsApp Helpline: 0317-7229994</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY REQUESTS (DEPOSITS & WITHDRAWALS) */}
          {activeTab === 'myRequests' && (
            <div className="space-y-3">
              {/* Filter Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 bg-[#09111b] p-1 rounded-xl border border-[#162738] text-xs">
                  <button
                    onClick={() => setRequestsFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      requestsFilter === 'all' ? 'bg-[#192f46] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({myRequests.length + myWithdrawals.length})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('withdrawals')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      requestsFilter === 'withdrawals' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Withdrawals ({myWithdrawals.length})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('deposits')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      requestsFilter === 'deposits' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Deposits ({myRequests.length})
                  </button>
                </div>

                <button
                  onClick={fetchUserRequests}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#142334] transition-colors"
                  title="Refresh"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>

              {/* WITHDRAWAL REQUESTS LIST */}
              {(requestsFilter === 'all' || requestsFilter === 'withdrawals') && myWithdrawals.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                    Withdrawal Requests ({myWithdrawals.length})
                  </span>
                  {myWithdrawals.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-[#101c2a] rounded-xl border border-amber-500/30 flex flex-col space-y-2.5 text-xs shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-amber-400 text-sm font-gaming">
                            -{req.amount.toLocaleString()} PKR
                          </span>
                          <span className="text-[10px] bg-[#1a2d42] text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                            {req.method}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            : req.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                        }`}>
                          {req.status === 'IN_REVIEW' ? '⏳ In Review' : req.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 bg-[#09111b] p-2.5 rounded-lg border border-[#162738]">
                        <div>Account: <strong className="text-gray-200 font-mono">{req.accountNumber}</strong></div>
                        <div>Title: <strong className="text-white">{req.accountTitle}</strong></div>
                        <div>Time: {new Date(req.createdAt).toLocaleTimeString()}</div>
                        <div>ID: {req.id.slice(-6)}</div>
                      </div>

                      {/* Prompt banner & WhatsApp link */}
                      <div className="p-2 bg-[#09161a] rounded-lg border border-emerald-500/40 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-[11px]">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>withdraw in review contact on 03177229994 whatsapp</span>
                        </div>
                        <a
                          href={`https://wa.me/923177229994?text=${encodeURIComponent(
                            `Salam Admin! Maine 1X-BET se ${req.amount} PKR ka withdrawal request bheja hai.\nUser: ${user?.username}\nAccount: ${req.accountNumber} (${req.accountTitle})\nReq ID: ${req.id}\nPlease clear my payment.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] rounded-lg shrink-0 flex items-center space-x-1 shadow transition-all"
                        >
                          <span>WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DEPOSIT REQUESTS LIST */}
              {(requestsFilter === 'all' || requestsFilter === 'deposits') && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-cyan-400 tracking-wider block">
                    Deposit Requests ({myRequests.length})
                  </span>
                  {myRequests.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-xs">
                      No deposit requests submitted yet.
                    </div>
                  ) : (
                    myRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-[#111e2b] rounded-xl border border-[#1d3247] flex flex-col space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">+{req.amount.toLocaleString()} PKR</span>
                            <span className="text-[10px] bg-[#182b3d] text-cyan-300 px-2 py-0.5 rounded font-bold">
                              {req.method}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : req.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                          }`}>
                            {req.status === 'PENDING' ? '⏳ Pending Approval' : req.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 bg-[#0c1520] p-2 rounded-lg">
                          <div>Sender: <strong className="text-gray-200">{req.senderNumber}</strong></div>
                          <div>TID: <strong className="text-cyan-400 font-mono">{req.tid}</strong></div>
                          <div>Time: {new Date(req.createdAt).toLocaleTimeString()}</div>
                          <div>ID: {req.id.slice(-6)}</div>
                        </div>

                        {req.screenshot && (
                          <div className="flex items-center space-x-2 text-[10px] text-cyan-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Screenshot attached</span>
                          </div>
                        )}

                        {req.notes && (
                          <div className="text-[10px] text-red-400 bg-red-950/30 p-1.5 rounded">
                            Note: {req.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {myRequests.length === 0 && myWithdrawals.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-xs">
                  No requests submitted yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSACTION LEDGER */}
          {activeTab === 'history' && (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">No transactions recorded yet.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-[#111e2b] rounded-xl border border-[#1b2f43] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{tx.method}</span>
                      <span className="text-[10px] text-gray-400">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-black font-gaming ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()}`} PKR
                      </span>
                      <span className="block text-[9px] uppercase font-bold text-gray-400">{tx.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
