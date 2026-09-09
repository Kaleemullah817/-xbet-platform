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
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WalletModal({ isOpen, onClose, user, transactions = [], onUpdateUser }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'history' | 'myRequests'
  const [method, setMethod] = useState('EasyPaisa');
  const [amount, setAmount] = useState('2500');
  const [senderNumber, setSenderNumber] = useState('');
  const [tid, setTid] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  
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
      .then(data => setMyRequests(data))
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

  const currentAccount = adminAccounts[method] || adminAccounts.EasyPaisa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f1b29] border border-[#1f344a] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#182a3c] bg-[#0c1622]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-gaming tracking-wide">
                1X-BET CASHIER & DEPOSIT
              </h3>
              <p className="text-[11px] text-gray-400">
                Current Balance: <strong className="text-emerald-400">{user?.balance?.toLocaleString()} PKR</strong>
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
        <div className="grid grid-cols-3 p-2 bg-[#09111a] border-b border-[#182a3c] gap-1 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('deposit'); setFeedback(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Deposit (Proof)</span>
          </button>

          <button
            onClick={() => { setActiveTab('myRequests'); setFeedback(null); fetchUserRequests(); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'myRequests'
                ? 'bg-[#182b3e] text-cyan-300 shadow-md border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Requests ({myRequests.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setFeedback(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-[#182b3e] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ledger</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-200' 
                : 'bg-red-950/90 border border-red-500/60 text-red-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

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

          {activeTab === 'myRequests' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400 font-medium">
                Here you can track your submitted deposits and approval status by the admin:
              </div>

              {myRequests.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">
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
                        <span className="font-bold text-white text-sm">{req.amount.toLocaleString()} PKR</span>
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
