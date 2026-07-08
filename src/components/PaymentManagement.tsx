import React, { useState, useEffect } from "react";
import { 
  CreditCard, Building, ShieldCheck, Wallet, Plus, Trash2, 
  Loader, Check, ArrowDownLeft, AlertCircle, Sparkles, Cpu, 
  ExternalLink, Key, RefreshCw, X, Smartphone, ArrowUpRight,
  Download, FileSpreadsheet, Snowflake, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "../types";

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  name: string;
  issuer: string;
  lastFour: string;
  expiry?: string;
  holder: string;
  addedAt: string;
  isFrozen?: boolean;
}

interface PaymentManagementProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
}

export default function PaymentManagement({ user, onUpdateBalance }: PaymentManagementProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Topup State
  const [topupAmount, setTopupAmount] = useState<string>("");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'none' | 'handshake' | 'otp' | 'clearing' | 'success'>('none');
  const [otpValue, setOtpValue] = useState("");
  const [simulatedGatewayTx, setSimulatedGatewayTx] = useState<any>(null);

  // Add Card State
  const [addMode, setAddMode] = useState<'none' | 'card' | 'bank' | 'csv'>('none');
  const [csvUploading, setCsvUploading] = useState(false);
  const [cardHolder, setCardHolder] = useState(user.name);
  const [cardNumber, setCardNumber] = useState("");
  const [cardIssuer, setCardIssuer] = useState("VISA");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardName, setCardName] = useState("");

  // Add Bank State
  const [bankHolder, setBankHolder] = useState(user.name);
  const [bankName, setBankName] = useState("");
  const [bankIssuer, setBankIssuer] = useState("SBI");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  // Record keeping transactions list & loading
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const sampleTransactions: any[] = [
    {
      id: "TXN-1001",
      date: "2026-06-18",
      merchant: "Nexus Coffee Lab",
      category: "Food",
      amount: 580,
      location: "Mumbai, IN",
      riskScore: 12,
      riskStatus: "low",
      riskReason: "Routine dining transaction"
    },
    {
      id: "TXN-1002",
      date: "2026-06-17",
      merchant: "Axis Pay Utility",
      category: "Bills",
      amount: 1840,
      location: "Online Gateway",
      riskScore: 22,
      riskStatus: "medium",
      riskReason: "Recurring utility payment"
    },
    {
      id: "TXN-1003",
      date: "2026-06-16",
      merchant: "Metro Travel Hub",
      category: "Travel",
      amount: 1300,
      location: "New Delhi, IN",
      riskScore: 18,
      riskStatus: "low",
      riskReason: "Commuter booking for work"
    }
  ];

  useEffect(() => {
    fetchPaymentMethods();
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (e) {
      console.error("Failed to fetch transaction registry for manual CSV export:", e);
    } finally {
      setTxLoading(false);
    }
  };

  const handleExportCSV = () => {
    const ledger = transactions.length > 0 ? transactions : sampleTransactions;
    if (ledger.length === 0) return;
    
    if (transactions.length === 0) {
      showTemporarySuccess("No personal transactions found. Exporting a sample ledger report. Add your own records to include them in the CSV.");
    }

    // Explicit columns
    const headers = ["Transaction ID", "Date", "Merchant", "Category", "Amount (INR)", "Location", "Risk Score (%)", "Risk Status", "Security Flag / Reason"];
    
    // Sanitize and escape commas/quotes in merchants & reasons
    const rows = ledger.map(t => [
      t.id,
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.category,
      t.amount,
      `"${(t.location || 'Online Gateway').replace(/"/g, '""')}"`,
      t.riskScore,
      t.riskStatus,
      `"${(t.riskReason || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NEXUS_Ledger_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showTemporarySuccess("CSV report downloaded successfully with 6-7 months of transaction history.");
  };

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      // API returns { methods: [...] }, extract the array
      const methods = Array.isArray(data) ? data : (data.methods || []);
      setPaymentMethods(methods);
      if (methods && methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
    } catch (e) {
      console.error(e);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 12 || !cardExpiry || !cardName) {
      setErrorMsg("Please provide accurate card credentials. Double check expiry format (MM/YY).");
      return;
    }

    try {
      setErrorMsg(null);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "card",
          name: cardName,
          issuer: cardIssuer,
          lastFour: cardNumber.slice(-4),
          expiry: cardExpiry,
          holder: cardHolder
        })
      });

      if (!res.ok) throw new Error("Could not add payment index.");
      await res.json();
      await fetchPaymentMethods();
      showTemporarySuccess(`Successfully mapped card: ${cardIssuer} and index credentials.`);
      setAddMode('none');
      setCardNumber("");
      setCardExpiry("");
      setCardName("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit ledger registry.");
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || bankAccountNumber.length < 8) {
      setErrorMsg("Please inputs a valid bank name & account layout (minimum 8 characters).");
      return;
    }

    try {
      setErrorMsg(null);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bank",
          name: bankName,
          issuer: bankIssuer,
          lastFour: bankAccountNumber.slice(-4),
          holder: bankHolder
        })
      });

      if (!res.ok) throw new Error("Could not map routing node.");
      await res.json();
      await fetchPaymentMethods();
      showTemporarySuccess(`Linked Bank Node: ${bankIssuer} Savings Account successfully.`);
      setAddMode('none');
      setBankName("");
      setBankAccountNumber("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to bind direct billing node.");
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!window.confirm("Disconnect this linked billing method? Verification tokens will be purged.")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPaymentMethods(prev => {
          const updated = prev.filter(p => p.id !== id);
          if (selectedMethodId === id && updated.length > 0) {
            setSelectedMethodId(updated[0].id);
          }
          return updated;
        });
        showTemporarySuccess("Purged ledger token from active device vault.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFreeze = async (id: string) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/payments/${id}/toggle-freeze`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, isFrozen: data.isFrozen } : p));
        showTemporarySuccess(data.isFrozen ? "Card Temporarily Frozen successfully!" : "Card Unfrozen successfully!");
      } else {
        setErrorMsg("Failed to adjust freeze lock status.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to contact payment vault secure service.");
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCSV(file);
  };

  const processCSV = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Invalid file type. Please upload a standard comma-separated ledger file (.csv).");
      return;
    }

    setCsvUploading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error("Empty standard content detected.");

        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) throw new Error("The selected CSV file has reference headers but zero data logs.");

        // Simple header mapping
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
        const dateIdx = headers.findIndex(h => h.includes("date") || h.includes("time"));
        const merchantIdx = headers.findIndex(h => h.includes("merchant") || h.includes("pay") || h.includes("source"));
        const categoryIdx = headers.findIndex(h => h.includes("category") || h.includes("type"));
        const amountIdx = headers.findIndex(h => h.includes("amount") || h.includes("cost") || h.includes("inr"));
        const locationIdx = headers.findIndex(h => h.includes("location") || h.includes("geo") || h.includes("city"));

        const parsedTxs: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              parts.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          parts.push(current.trim());

          if (parts.length === 0 || parts.every(p => !p)) continue;

          const dateVal = dateIdx !== -1 && parts[dateIdx] ? parts[dateIdx].replace(/['"]+/g, '') : new Date().toISOString().slice(0, 10);
          const merchantVal = merchantIdx !== -1 && parts[merchantIdx] ? parts[merchantIdx].replace(/['"]+/g, '') : "Imported Merchant Gateway";
          const categoryVal = categoryIdx !== -1 && parts[categoryIdx] ? parts[categoryIdx].replace(/['"]+/g, '') : "Bills";
          const amountStr = amountIdx !== -1 && parts[amountIdx] ? parts[amountIdx].replace(/[^\d.]/g, '') : "150";
          const amountVal = parseFloat(amountStr) || 150;
          const locationVal = locationIdx !== -1 && parts[locationIdx] ? parts[locationIdx].replace(/['"]+/g, '') : "Online Gateway";

          parsedTxs.push({
            date: dateVal,
            merchant: merchantVal,
            category: categoryVal,
            amount: amountVal,
            location: locationVal
          });
        }

        if (parsedTxs.length === 0) {
          throw new Error("No valid transactions could be parsed from the uploaded CSV.");
        }

        const res = await fetch("/api/transactions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: parsedTxs })
        });

        if (!res.ok) throw new Error("Bulk ledger synchronizer rejected the payload.");
        const result = await res.json();

        showTemporarySuccess(`Reconciled successfully! Imported ${parsedTxs.length} entries from CSV and adjusted main balance.`);
        setAddMode('none');
        onUpdateBalance(result.balance);
        fetchTransactions();
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "An error occurred while processing CSV rows.");
      } finally {
        setCsvUploading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg("FileReader error. Could not upload the specified CSV document.");
      setCsvUploading(false);
    };
    reader.readAsText(file);
  };

  // Manual wallet core top up orchestration sequence
  const startWalletTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) {
      setErrorMsg("Please identify a valid quantum balance input.");
      return;
    }

    const activeMethod = paymentMethods.find(m => m.id === selectedMethodId);
    if (activeMethod?.isFrozen) {
      setErrorMsg("Operation Blocked: This card/account is currently FROZEN. Please unfreeze it in Saved Wallet Channels first.");
      return;
    }

    setErrorMsg(null);
    setGatewayStep('handshake');
    setTopupLoading(true);

    // Simulated Handshake
    await new Promise(r => setTimeout(r, 1200));
    setGatewayStep('otp');
    setTopupLoading(false);
  };

  const authorizeGatewayCharge = async () => {
    if (!otpValue || otpValue.length < 4) {
      setErrorMsg("Invalid sandbox verification passcode. Try 1234 or any 4 digit token.");
      return;
    }

    setTopupLoading(true);
    setErrorMsg(null);
    setGatewayStep('clearing');

    // Simulated Clearing
    await new Promise(r => setTimeout(r, 1500));

    try {
      const activeMethod = paymentMethods.find(m => m.id === selectedMethodId);
      const res = await fetch("/api/payments/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(topupAmount),
          account_id: selectedMethodId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gateway session failed to authorize.");

      // Success
      setGatewayStep('success');
      onUpdateBalance(data.balance);
      setSimulatedGatewayTx(data.transaction);
      showTemporarySuccess(`Durable Balance updated! Added ₹${parseFloat(topupAmount).toLocaleString()} successfully.`);
      
      await new Promise(r => setTimeout(r, 1500));
      // Cleanup
      setGatewayStep('none');
      setTopupAmount("");
      setOtpValue("");
    } catch (err: any) {
      setGatewayStep('none');
      setErrorMsg(err.message || "An error occurred with direct ledger deposits.");
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900 max-w-6xl mx-auto">
      
      {/* Title block */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-[#00E38C]" /> Secure Payment Manager & Topup
          </h2>
          <p className="text-xs dark:text-gray-400 text-slate-500 font-sans">
            Configure sandboxed credit cards and direct routing bank nodes to handle instant balance additions and ledger integration.
          </p>
        </div>

        {/* Global Security Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={txLoading || transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E38C]/10 hover:bg-[#00E38C]/20 text-[#00E38C] border border-[#00E38C]/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
            title="Download full account history in standard Comma-Separated Values format"
          >
            <Download className="h-3.5 w-3.5 text-[#00E38C]" />
            <span>Export Transactions (.csv)</span>
          </button>

          <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[#00E38C] font-mono">
            <ShieldCheck className="h-4 w-4 text-[#00E38C]" /> Sandbox SSL Certified
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Adding & Managing Instruments (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-[#00C6FF]" /> SAVED WALLET CHANNELS ({paymentMethods.length})
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => { setAddMode('card'); setErrorMsg(null); }}
                className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  addMode === 'card' ? "bg-[#00C6FF]/20 border-[#00C6FF] dark:text-white text-slate-900" : "dark:bg-white/5 bg-black/5 dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600 hover:dark:bg-white/10 bg-black/10"
                }`}
              >
                <Plus className="h-3 w-3 text-[#00C6FF]" /> Save Card
              </button>
              <button
                onClick={() => { setAddMode('bank'); setErrorMsg(null); }}
                className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  addMode === 'bank' ? "bg-[#7B61FF]/20 border-[#7B61FF] dark:text-white text-slate-900" : "dark:bg-white/5 bg-black/5 dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600 hover:dark:bg-white/10 bg-black/10"
                }`}
              >
                <Plus className="h-3 w-3 text-[#7B61FF]" /> Link Bank
              </button>
              <button
                onClick={() => { setAddMode('csv'); setErrorMsg(null); }}
                className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  addMode === 'csv' ? "bg-[#00E38C]/20 border-[#00E38C] dark:text-white text-slate-900" : "dark:bg-white/5 bg-black/5 dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600 hover:dark:bg-white/10 bg-black/10"
                }`}
              >
                <Plus className="h-3 w-3 text-[#00E38C]" /> Upload CSV
              </button>
            </div>
          </div>

          {/* Form to Add Dynamic Card */}
          {addMode === 'card' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-[#00C6FF]/20 space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] dark:text-gray-400 text-slate-500 uppercase tracking-wider font-mono font-bold flex items-center gap-1"><Cpu className="h-3.5 w-3.5 text-[#00C6FF]" /> SECURE DEBIT / CREDIT CARD VAULT</span>
                <button onClick={() => setAddMode('none')} className="dark:text-gray-500 text-slate-400 hover:dark:text-white text-slate-900"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleAddCard} className="grid grid-cols-2 gap-3.5 pt-2 text-xs">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Custom Display Name (e.g. My Pocket Card)</label>
                  <input
                    type="text" required value={cardName} onChange={e => setCardName(e.target.value)}
                    placeholder="Premium ICICI Ruby Card"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Card Issuer Brand</label>
                  <select
                    value={cardIssuer} onChange={e => setCardIssuer(e.target.value)}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                  >
                    <option value="VISA">VISA Net</option>
                    <option value="MASTERCARD">MasterCard Elite</option>
                    <option value="RUPAY">RuPay Core</option>
                    <option value="SBI Network">SBI Cards</option>
                    <option value="ICICI Bank">ICICI Direct</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Holder Name</label>
                  <input
                    type="text" required value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Card Number (16 Digits)</label>
                  <input
                    type="text" required maxLength={16} placeholder="4532890123458902"
                    value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Expiry Date (MM/YY)</label>
                  <input
                    type="text" required placeholder="08/29" maxLength={5}
                    value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 pt-2">
                  <button type="submit" className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] text-black font-sans font-bold text-xs hover:opacity-95 transition-all text-center">
                    Register Secure Device Card Key
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Form to Add Dynamic Bank Account */}
          {addMode === 'bank' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-[#7B61FF]/20 space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] dark:text-gray-400 text-slate-500 uppercase tracking-wider font-mono font-bold flex items-center gap-1"><Building className="h-3.5 w-3.5 text-[#7B61FF]" /> ROUTE DIRECT BANK ACCOUNT</span>
                <button onClick={() => setAddMode('none')} className="dark:text-gray-500 text-slate-400 hover:dark:text-white text-slate-900"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleAddBank} className="grid grid-cols-2 gap-3.5 pt-2 text-xs">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Account Description label</label>
                  <input
                    type="text" required value={bankName} onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Salary Premium Savings"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Account Bank Institution</label>
                  <select
                    value={bankIssuer} onChange={e => setBankIssuer(e.target.value)}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                  >
                    <option value="SBI">SBI State Bank of India</option>
                    <option value="HDFC">HDFC Bank Limited</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                    <option value="AXIS">Axis Bank Limited</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Primary Account Holder</label>
                  <input
                    type="text" required value={bankHolder} onChange={e => setBankHolder(e.target.value)}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Account Number (Full Routing)</label>
                  <input
                    type="text" required placeholder="503901928092"
                    value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="col-span-2 pt-2">
                  <button type="submit" className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#00E38C] text-black font-sans font-bold text-xs hover:opacity-95 transition-all text-center">
                    Link Bank Account Securely
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* CSV File Upload Section */}
          {addMode === 'csv' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-[#00E38C]/20 space-y-4"
              id="csv-file-uploader-panel"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] dark:text-gray-400 text-slate-500 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-[#00E38C]" /> CSV CARD STATEMENT STATEMENT IMPORT
                </span>
                <button onClick={() => setAddMode('none')} className="dark:text-gray-500 text-slate-400 hover:dark:text-white text-slate-900"><X className="h-4 w-4" /></button>
              </div>

              <div className="text-[11px] dark:text-gray-400 text-slate-500 font-sans leading-relaxed space-y-2">
                <p>
                  Upload your monthly card ledger statement in standard **CSV format** to automatically ingest transaction records and reconcile active account balance levels:
                </p>
                <div className="p-3 bg-black/40 border dark:border-white/5 border-black/5 rounded-xl text-[10px] font-mono leading-normal dark:text-gray-300 text-slate-600">
                  <span className="dark:text-gray-500 text-slate-400 font-sans block mb-1 uppercase tracking-wider text-[9px]">Standard Expected CSV Format (with or without headers):</span>
                  <code>Date, Merchant, Category, Amount, Location</code> <br />
                  <code>2026-06-15, Amazon Fashion, Shopping, 2500, Bangalore</code> <br />
                  <code>2026-06-16, Hostel Dining, Food, 350, Delhi</code>
                </div>
              </div>

              {/* Drag and Drop Container */}
              <div className="border border-dashed dark:border-white/10 border-black/10 rounded-2xl p-6 hover:border-[#00E38C]/40 bg-black/20 hover:bg-black/40 transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer relative group">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={csvUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className={`p-3.5 rounded-full ${csvUploading ? "bg-[#00E38C]/15 text-[#00E38C]" : "dark:bg-white/5 bg-black/5 dark:text-gray-400 text-slate-500 group-hover:dark:text-white text-slate-900 transition-colors"}`}>
                  {csvUploading ? <Loader className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold dark:text-white text-slate-900">
                    {csvUploading ? "Analyzing & Ingesting ledger records..." : "Drag and drop statement, or click to browse"}
                  </p>
                  <p className="text-[10px] dark:text-gray-500 text-slate-400">Supports standard ledger CSV statements up to 10MB</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Core Display List of active accounts */}
          {loading ? (
            <div className="py-12 text-center text-xs dark:text-gray-500 text-slate-400 flex items-center justify-center gap-1.5 font-mono">
              <Loader className="h-4 w-4 animate-spin text-[#00E38C]" /> UNWRAPPING ENCRYPTED VAULT PAYMENTS...
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="border border-dashed dark:border-white/5 border-black/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.01]">
              <div className="p-3.5 rounded-full dark:bg-white/5 bg-black/5 dark:text-gray-500 text-slate-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <p className="text-xs dark:text-gray-400 text-slate-500 max-w-sm font-sans">
                No active billing channels configured. Setup a Debit Card or Bank link to manage direct sandbox topup sweeps.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map(m => {
                const isCard = m.type === 'card';
                return (
                  <div 
                    key={m.id} 
                    className={`nexus-wallet-card relative rounded-2xl p-5 border text-left flex flex-col justify-between overflow-hidden transition-all duration-300 min-h-[170px] ${
                      m.isFrozen
                        ? "bg-gradient-to-br from-[#1c0c0c] to-[#0d0909] border-red-500/30 hover:border-red-500/50"
                        : isCard 
                          ? "bg-gradient-to-br from-[#0c1a2f] to-[#070b16] border-[#00C6FF]/10 hover:border-[#00C6FF]/35" 
                          : "bg-gradient-to-br from-[#121327] to-[#070b16] border-[#7B61FF]/10 hover:border-[#7B61FF]/35"
                    }`}
                  >
                    {/* Visual glowing chip */}
                    <div className="absolute right-4 bottom-4 opacity-[0.03] pointer-events-none">
                      {isCard ? <CreditCard className="h-28 w-28" /> : <Building className="h-28 w-28" />}
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg dark:text-white text-slate-900 ${m.isFrozen ? "bg-red-500/10" : isCard ? "bg-cyan-500/10" : "bg-purple-500/10"}`}>
                          {m.isFrozen ? (
                            <Snowflake className="h-4.5 w-4.5 text-red-400 animate-spin" style={{ animationDuration: '6s' }} />
                          ) : isCard ? (
                            <CreditCard className="h-4.5 w-4.5 text-[#00C6FF]" />
                          ) : (
                            <Building className="h-4.5 w-4.5 text-[#7B61FF]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-mono font-bold dark:text-gray-400 text-slate-500 block">{m.issuer}</span>
                            {m.isFrozen && (
                              <span className="px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-mono text-[8px] font-bold uppercase tracking-widest">Frozen</span>
                            )}
                          </div>
                          <span className="font-sans font-extrabold text-sm dark:text-white text-slate-900 leading-tight">{m.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleToggleFreeze(m.id)}
                          className={`p-1.5 rounded cursor-pointer transition-colors ${
                            m.isFrozen 
                              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" 
                              : "dark:bg-white/5 bg-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/10 bg-black/10 hover:dark:text-white text-slate-900"
                          }`}
                          title={m.isFrozen ? "Unfreeze card statement" : "Temporarily freeze card safety lock"}
                        >
                          <Snowflake className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMethod(m.id)}
                          className="dark:text-gray-500 text-slate-400 hover:text-red-400 p-1.5 dark:bg-white/5 bg-black/5 rounded hover:bg-red-500/15 cursor-pointer shrink-0"
                          title="Purge method"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      {/* Account layout or generic number info */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono dark:text-gray-500 text-slate-400 block uppercase">
                          {isCard ? "CARD NUMBER" : "ROUTING NODE"}
                        </span>
                        {isCard && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-[#00C6FF]">EXP: {m.expiry}</span>}
                      </div>

                      <div className="font-mono text-base font-bold dark:text-gray-300 text-slate-600 flex items-center gap-1.5">
                        {isCard ? (
                          <>•••• •••• •••• <span className={`text-lg ${m.isFrozen ? "text-red-400 line-through" : "dark:text-white text-slate-900"}`}>{m.lastFour}</span></>
                        ) : (
                          <>•••• •••• <span className={`text-lg ${m.isFrozen ? "text-red-400 line-through" : "dark:text-white text-slate-900"}`}>{m.lastFour}</span></>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] dark:text-gray-500 text-slate-400 font-mono">
                        <span>HOLDER: {m.holder.toUpperCase()}</span>
                        <span className={m.isFrozen ? "text-red-400 font-bold" : ""}>
                          {m.isFrozen ? "❄️ CARD SECURED & FROZEN" : "SAVED IN NEXUS SECURE"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Mock Payment-Gateway transaction portal (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl p-6 bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-6">
            
            {/* Wallet Quick Status */}
            <div className="p-4 rounded-xl bg-[#090e1c] border dark:border-white/5 border-black/5 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-[#00E38C]/10 to-[#00C6FF]/15 text-[#00E38C] rounded-xl border border-[#00E38C]/15">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 block leading-none mb-1">MAIN BALANCE WALLET</span>
                  <span className="font-sans font-extrabold text-[#00E38C] text-xl leading-none">
                    ₹{user.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20 py-1 px-2.5 rounded-full uppercase">
                Active Pool
              </span>
            </div>

            {/* Simulated Checkout Block */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-sans font-bold tracking-widest text-[#00E38C] uppercase flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" /> INITIATE SECURE TOP-UP
                </h4>
                <p className="text-[11px] dark:text-gray-400 text-slate-500 leading-normal">
                  Add custom cash assets to your digital main wallet. Selected financial gateways will authorize the transaction in Sandbox SSL Mode.
                </p>
              </div>

              {gatewayStep === 'none' ? (
                <form onSubmit={startWalletTopup} className="space-y-4">
                  {/* Amount entry */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400">Fund Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs dark:text-gray-500 text-slate-400 font-bold">₹</span>
                      <input
                        type="number" required placeholder="e.g. 5000"
                        value={topupAmount} onChange={e => { setTopupAmount(e.target.value); setErrorMsg(null); }}
                        className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl pl-8 pr-4 py-3 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00E38C]"
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex gap-1.5 pt-1">
                      {[1000, 5000, 10000, 25000].map(p => (
                        <button
                          key={p} type="button"
                          onClick={() => { setTopupAmount(p.toString()); setErrorMsg(null); }}
                          className={`px-2.5 py-1 text-[10px] rounded font-mono font-semibold transition-all border cursor-pointer ${
                            topupAmount === p.toString() ? "bg-[#00E38C]/20 border-[#00E38C] text-[#00E38C]" : "dark:bg-white/5 bg-black/5 border-transparent dark:text-gray-400 text-slate-500 hover:dark:bg-white/10 bg-black/10"
                          }`}
                        >
                          +₹{p.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Select Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400">Source Billing Node</label>
                    {paymentMethods.length === 0 ? (
                      <div className="text-[11px] text-[#FF9F43] py-2 bg-[#FF9F43]/5 border border-[#FF9F43]/15 px-3 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Link an account on the left first to authenticate transfers.</span>
                      </div>
                    ) : (
                      <select
                        value={selectedMethodId} onChange={e => setSelectedMethodId(e.target.value)}
                        className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-3 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF]"
                      >
                        {paymentMethods.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.issuer} - {m.name} (*{m.lastFour})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-[#FF4D4D] text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#00E38C] text-xs rounded-xl flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={paymentMethods.length === 0}
                    className="w-full py-3 rounded-xl bg-[#00E38C] text-black font-sans font-bold text-xs transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-2"
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" /> Transmit Ledger Credits (Top-up)
                  </button>
                </form>
              ) : (
                /* Interactive Step by Step Gateway Simulation Card */
                <div className="p-5 rounded-2xl bg-black/40 border dark:border-white/10 border-black/10 space-y-4 text-center">
                  
                  {gatewayStep === 'handshake' && (
                    <div className="space-y-4 py-4">
                      <Loader className="h-8 w-8 text-[#00C6FF] animate-spin mx-auto" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-mono font-bold uppercase tracking-wider dark:text-white text-slate-900">GATEWAY HANDSHAKE</h5>
                        <p className="text-[10px] dark:text-gray-500 text-slate-400 max-w-xs mx-auto">
                          Creating security payloads and validating ledger routing coordinates with VISA protocol.
                        </p>
                      </div>
                    </div>
                  )}

                  {gatewayStep === 'otp' && (
                    <div className="space-y-4">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
                        <Key className="h-5 w-5 text-yellow-400 animate-pulse" />
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="text-xs font-mono font-bold uppercase tracking-wider dark:text-white text-slate-900">ENTER VERIFICATION ONE-TIME PIN</h5>
                        <p className="text-[10px] dark:text-gray-400 text-slate-500">
                          A simulated 4-digit token is generated for user <strong>alex</strong>. Please complete confirmation.
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto">
                        <input
                          type="password" maxLength={4} placeholder="e.g. 1234"
                          value={otpValue} onChange={e => { setOtpValue(e.target.value.replace(/\D/g,'')); setErrorMsg(null); }}
                          className="w-full text-center dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 font-mono placeholder-gray-700 tracking-widest focus:outline-none focus:border-yellow-400"
                        />
                        <span className="text-[9px] text-yellow-400/80 mt-1.5 block font-mono">Demo Hint: type '1234' or any four numbers</span>
                      </div>

                      {errorMsg && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 text-[#FF4D4D] text-[10px] rounded-lg">
                          {errorMsg}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button" onClick={authorizeGatewayCharge}
                          className="flex-1 py-2 px-4 rounded-xl bg-yellow-400 text-black font-sans font-bold text-xs cursor-pointer hover:opacity-90"
                        >
                          Confirm Token (Submit)
                        </button>
                        <button
                          type="button" onClick={() => { setGatewayStep('none'); setOtpValue(""); }}
                          className="py-2 px-4 rounded-xl dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 text-xs font-semibold dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {gatewayStep === 'clearing' && (
                    <div className="space-y-4 py-4">
                      <Loader className="h-8 w-8 text-[#00E38C] animate-spin mx-auto" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00E38C]">COMMITING BANK RECONCILIATION</h5>
                        <p className="text-[10px] dark:text-gray-400 text-slate-500 max-w-xs mx-auto">
                          Clearing credit records and dispatching real-time ledger balance updating webhook call...
                        </p>
                      </div>
                    </div>
                  )}

                  {gatewayStep === 'success' && (
                    <div className="space-y-4 py-2">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-[#00E38C]">
                        <Check className="h-6 w-6" />
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="text-xs font-sans font-bold uppercase tracking-wider text-[#00E38C]">TRANSACTION AUTHORIZED</h5>
                        <h6 className="text-lg font-mono font-bold dark:text-white text-slate-900">+₹{(parseFloat(topupAmount) || 0).toLocaleString()}</h6>
                        <p className="text-[10px] dark:text-gray-500 text-slate-400 max-w-xs mx-auto">
                          Secure ledger sync finalized. Your main wallet balance is synchronized with new funds.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Sandbox Security Audit Log */}
            <div className="pt-4 border-t dark:border-white/5 border-black/5 space-y-2">
              <span className="text-[9px] font-mono tracking-wider font-semibold dark:text-gray-500 text-slate-400 block">SECURE TELEMETRY LOGGER:</span>
              <div className="bg-black/60 rounded-xl p-3 border dark:border-white/5 border-black/5 font-mono text-[9px] dark:text-gray-400 text-slate-500 leading-normal max-h-[110px] overflow-y-auto space-y-1.5 scrollbar-thin">
                <div className="dark:text-gray-500 text-slate-400">[{new Date().toLocaleTimeString()}] Secure device certificate valid (OpenSSL-3.2).</div>
                {paymentMethods.length > 0 ? (
                  <div className="text-[#00C6FF]">[{new Date().toLocaleTimeString()}] Fetched {paymentMethods.length} payment devices from local keystore.</div>
                ) : (
                  <div className="text-yellow-500">[{new Date().toLocaleTimeString()}] Zero active cards found inside local keystore.</div>
                )}
                {simulatedGatewayTx && (
                  <div className="text-[#00E38C] leading-snug">
                    [{new Date().toLocaleTimeString()}] Webhook trigger success! ID: {simulatedGatewayTx.id} <br />
                    Amount: ₹{simulatedGatewayTx.amount.toLocaleString()} | source: {simulatedGatewayTx.location}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Dynamic Exporter Segment */}
      <div className="mt-10 p-6 rounded-3xl bg-[#080d1a] border dark:border-white/5 border-black/5 space-y-5 relative overflow-hidden" id="nexus-csv-exporter">
        {/* Soft layout background element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C6FF]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-white/5 border-black/5 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-sans font-extrabold tracking-wide dark:text-white text-slate-900 uppercase flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#00E38C]" /> Manual Record Ledger & CSV Exporter
            </h3>
            <p className="text-xs dark:text-gray-400 text-slate-500 font-sans">
              Consistently logging records offline prevents sudden trace deletions and helps students and professionals audit compound budgets.
            </p>
          </div>
          
          <button
            onClick={handleExportCSV}
            disabled={txLoading || transactions.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00C6FF] to-[#00E38C] text-black font-sans font-bold text-xs hover:scale-102 hover:shadow-lg hover:shadow-[#00C6FF]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:scale-100"
          >
            <Download className="h-4 w-4" />
            <span>Export Transaction History (.csv)</span>
          </button>
        </div>

        {/* Info Grid Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[10px] dark:text-gray-500 text-slate-400 uppercase font-mono tracking-widest block font-bold">Total History Range</span>
            <span className="text-sm font-bold dark:text-white text-slate-900 font-mono">7 Active Months</span>
            <span className="text-[10px] dark:text-gray-400 text-slate-500 font-sans">November 2025 – June 2026</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[10px] dark:text-gray-500 text-slate-400 uppercase font-mono tracking-widest block font-bold">Synced Database Log Count</span>
            <span className="text-sm font-bold text-[#00E38C] font-mono">{transactions.length} Transactions</span>
            <span className="text-[10px] dark:text-gray-400 text-slate-500 font-sans">Auto-seeded local emulator</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 flex flex-col justify-between space-y-1.5">
            <span className="text-[10px] dark:text-gray-500 text-slate-400 uppercase font-mono tracking-widest block font-bold">Relational DBMS Schema</span>
            <span className="text-sm font-bold text-[#00C6FF] font-mono">SQLite / PG / MySQL Model</span>
            <span className="text-[10px] dark:text-gray-400 text-slate-500 font-sans">Fully normalized references</span>
          </div>
        </div>

        {/* Small Data Preview table */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-sans tracking-widest text-slate-500 font-bold px-1 flex items-center justify-between">
            <span>PREVIEWING ACTIVE LEDGER BLOCKS</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={txLoading || transactions.length === 0}
                className="text-[10px] font-mono text-[#00E38C] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-40"
              >
                <Download className="h-3 w-3" /> Export Ledger (.csv)
              </button>
              <span className="text-gray-600">|</span>
              <span className="text-[10px] font-mono normal-case dark:text-gray-400 text-slate-500">Showing top 4 logs</span>
            </div>
          </div>

          {txLoading ? (
            <div className="py-6 text-center text-xs dark:text-gray-400 text-slate-500 font-sans flex items-center justify-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-[#00C6FF]" /> Synchronizing ledger archive...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center text-xs dark:text-gray-500 text-slate-400 font-sans">
              No transactions present to compile. Add ledger activity or link payment networks.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border dark:border-white/5 border-black/5 bg-black/30">
              <table className="w-full text-left border-collapse text-[11px] font-sans">
                <thead>
                  <tr className="border-b dark:border-white/5 border-black/5 bg-white/[0.02] dark:text-gray-400 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Merchant</th>
                    <th className="p-3">Category</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-3 text-center">Threat Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {transactions.slice(0, 4).map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-all dark:text-gray-300 text-slate-600">
                      <td className="p-3 font-mono text-[9px] text-slate-500">{tx.id}</td>
                      <td className="p-3 dark:text-gray-400 text-slate-500">{tx.date}</td>
                      <td className="p-3 font-bold dark:text-white text-slate-900">{tx.merchant}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-400 font-extrabold">₹{tx.amount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] leading-tight font-bold font-mono ${
                          tx.riskScore > 50 
                            ? "bg-red-500/10 text-[#FF4D4D] border border-red-500/20" 
                            : tx.riskScore > 20 
                            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/10" 
                            : "bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/10"
                        }`}>
                          {tx.riskStatus} ({tx.riskScore}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
