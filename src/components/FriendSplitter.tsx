import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Trash2, Loader, ArrowRight, Check, CheckCircle2, 
  History, TrendingUp, TrendingDown, DollarSign, Wallet, RefreshCw, AlertCircle, HelpCircle
} from 'lucide-react';
import * as fs from '../services/friendsplit';

type FriendInput = {
  name: string;
  percent?: string;
  amount?: string;
};

type ExpenseMember = {
  name: string;
  owesAmount: number;
  isSettled: boolean;
};

type ExpenseResult = {
  id?: string;
  title: string;
  totalAmount: number;
  paidBy: string;
  splitMode: string;
  createdAt?: string;
  members: ExpenseMember[];
  settlements: Array<{ id: string; from: string; to: string; amount: number; isSettled: boolean }>;
};

export default function FriendSplitter() {
  const [title, setTitle] = useState('Campus Samosas & Chai');
  const [total, setTotal] = useState<number>(300);
  const [paidBy, setPaidBy] = useState('You');
  const [friends, setFriends] = useState<FriendInput[]>([{ name: 'Rahul' }, { name: 'Ananya' }]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExpenseResult | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<ExpenseResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchHistory();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const r = await fs.getFriendAnalytics();
      if (r.success) setAnalytics(r);
    } catch (e) {
      console.error("Failed to fetch splitting analytics:", e);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await fs.getFriendHistory();
      if (r.success) {
        setHistory(r.history || []);
      }
    } catch (e) {
      console.error("Failed to fetch splitting history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const addFriend = () => {
    setFriends([...friends, { name: '' }]);
  };

  const removeFriend = (i: number) => {
    const c = friends.slice();
    c.splice(i, 1);
    setFriends(c);
  };

  const updateFriend = (i: number, key: keyof FriendInput, val: string) => {
    const c = friends.slice();
    c[i] = { ...c[i], [key]: val };
    setFriends(c);
  };

  const preview = () => {
    const n = friends.length + 1; // include payer
    if (splitMode === 'equal') {
      const share = +(total / n).toFixed(2);
      const members: ExpenseMember[] = [
        { name: paidBy, owesAmount: share, isSettled: true },
        ...friends.map(f => ({ name: f.name || 'Anonymous', owesAmount: share, isSettled: false }))
      ];
      setResult({
        title,
        totalAmount: total,
        paidBy,
        splitMode,
        members,
        settlements: members.filter(m => m.name !== paidBy).map((m, idx) => ({
          id: `temp_${idx}`,
          from: m.name,
          to: paidBy,
          amount: m.owesAmount,
          isSettled: false
        }))
      });
    } else {
      // custom mode calculations
      const members: ExpenseMember[] = [{ name: paidBy, owesAmount: 0, isSettled: true }];
      let totalAlloc = 0;
      friends.forEach(f => {
        const amt = f.amount ? parseFloat(f.amount) : f.percent ? (parseFloat(f.percent) / 100) * total : 0;
        const owes = +amt.toFixed(2);
        members.push({ name: f.name || 'Anonymous', owesAmount: owes, isSettled: false });
        totalAlloc += amt;
      });
      const payerOwes = +(total - totalAlloc).toFixed(2);
      members[0].owesAmount = payerOwes;
      
      setResult({
        title,
        totalAmount: total,
        paidBy,
        splitMode,
        members,
        settlements: members.filter(m => m.name !== paidBy && m.owesAmount > 0).map((m, idx) => ({
          id: `temp_${idx}`,
          from: m.name,
          to: paidBy,
          amount: m.owesAmount,
          isSettled: false
        }))
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const payload = {
      title,
      total_amount: total,
      paid_by: paidBy,
      split_mode: splitMode,
      members: friends.map(f => ({
        name: f.name,
        contribution_percent: f.percent ? parseFloat(f.percent) : undefined,
        contribution_amount: f.amount ? parseFloat(f.amount) : undefined
      }))
    };

    try {
      const r = await fs.createFriendExpense(payload);
      if (r.success) {
        setResult(r.expense);
        setTitle('Campus Samosas & Chai');
        setTotal(300);
        setFriends([{ name: 'Rahul' }, { name: 'Ananya' }]);
        setSplitMode('equal');
        await fetchAnalytics();
        await fetchHistory();
        return;
      }
      setErrorMessage(r.error || r.detail || 'Expense creation failed.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Unable to create expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (settlementId: string) => {
    try {
      const r = await fs.settleFriendSettlement(settlementId);
      if (r.success) {
        await fetchHistory();
        await fetchAnalytics();
      }
    } catch (e) {
      console.error("Failed to settle settlement:", e);
    }
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900 text-left">
      {/* Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
          <Users className="h-6 w-6 text-[#00C6FF]" /> Friend Expense Splitter
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">
          Instantly split canteen food tabs, textbooks, rent or hostel expenses with room buddies using equal shares or custom weighted contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section - Split Provision & Relationship Statistics */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Create Split Card */}
          <div className="rounded-2xl p-6 bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-sans font-bold tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#00C6FF]" /> INITIALIZE NEW EXPENSE SPLIT
              </h3>
              <p className="text-xs dark:text-gray-400 text-slate-500 font-sans leading-relaxed">
                Add friends and compute shares. Settlements update real-time across student ledgers.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Expense Title</label>
                <input
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Canteen Samosas"
                  className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 placeholder-gray-600 focus:outline-none focus:border-[#00C6FF] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Total Tab (₹)</label>
                  <input
                    type="number" required value={total || ''} onChange={e => setTotal(parseFloat(e.target.value) || 0)}
                    placeholder="300" min="1"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 placeholder-gray-600 focus:outline-none focus:border-[#00C6FF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Paid By</label>
                  <input
                    type="text" required value={paidBy} onChange={e => setPaidBy(e.target.value)}
                    placeholder="You"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 placeholder-gray-600 focus:outline-none focus:border-[#00C6FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Split Strategy</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button" onClick={() => setSplitMode('equal')}
                    className={`py-2 px-3 text-xs font-sans font-bold rounded-xl border transition-all ${
                      splitMode === 'equal'
                        ? 'bg-[#00C6FF]/10 border-[#00C6FF] text-[#00C6FF]'
                        : 'dark:bg-[#070B16] bg-slate-50 dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/5 bg-black/5'
                    }`}
                  >
                    Equal Share
                  </button>
                  <button
                    type="button" onClick={() => setSplitMode('custom')}
                    className={`py-2 px-3 text-xs font-sans font-bold rounded-xl border transition-all ${
                      splitMode === 'custom'
                        ? 'bg-[#00C6FF]/10 border-[#00C6FF] text-[#00C6FF]'
                        : 'dark:bg-[#070B16] bg-slate-50 dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/5 bg-black/5'
                    }`}
                  >
                    Custom Weight
                  </button>
                </div>
              </div>

              {/* Friends List Input */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block">Buddies Included</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {friends.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                      <input
                        type="text" required value={f.name} onChange={e => updateFriend(i, 'name', e.target.value)}
                        placeholder={`Roommate ${i + 1}`}
                        className="flex-1 dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF]"
                      />
                      {splitMode === 'custom' && (
                        <input
                          type="number" value={f.percent || ''} onChange={e => updateFriend(i, 'percent', e.target.value)}
                          placeholder="%"
                          className="w-14 dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-2 py-2 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF] text-center"
                        />
                      )}
                      {splitMode === 'custom' && (
                        <input
                          type="number" value={f.amount || ''} onChange={e => updateFriend(i, 'amount', e.target.value)}
                          placeholder="₹"
                          className="w-20 dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-2 py-2 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF] text-center"
                        />
                      )}
                      <button
                        type="button" onClick={() => removeFriend(i)}
                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                <button
                  type="button" onClick={addFriend}
                  className="px-3 py-2 text-xs font-mono font-bold text-[#00C6FF] hover:text-[#00E38C] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 rounded-xl border dark:border-white/5 border-black/5 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Room Buddy
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button" onClick={preview}
                  className="px-4 py-3 rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 hover:dark:bg-white/10 bg-black/10 text-xs font-sans font-bold dark:text-gray-300 text-slate-600 hover:dark:text-white text-slate-900 cursor-pointer transition-all flex-1"
                >
                  Preview Shares
                </button>
                <button
                  type="submit" disabled={loading}
                  className="px-4 py-3 rounded-xl bg-[#00C6FF] text-black font-sans font-extrabold text-xs cursor-pointer hover:opacity-95 transition-opacity flex-1 flex items-center justify-center gap-1.5 shadow-lg shadow-[#00C6FF]/10"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 text-black" /> Initialize Split
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Relationship Metrics Snappy Snapshot */}
          <div className="rounded-2xl p-6 bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-sans font-bold tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center justify-between">
              <span>TACTICAL RELATIONSHIP METRICS</span>
              <Users className="h-4 w-4 text-[#00C6FF]" />
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="dark:bg-[#030712] dark:bg-white/5 bg-black/50 p-3 rounded-xl border dark:border-white/5 border-black/5 flex flex-col justify-center items-center">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-[#00E38C]" /> Total Lent
                </span>
                <span className="text-sm font-mono font-bold text-[#00E38C] mt-1">
                  ₹{analytics?.total_lent?.toLocaleString() ?? '0'}
                </span>
              </div>

              <div className="dark:bg-[#030712] dark:bg-white/5 bg-black/50 p-3 rounded-xl border dark:border-white/5 border-black/5 flex flex-col justify-center items-center">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" /> Total Borrowed
                </span>
                <span className="text-sm font-mono font-bold text-red-400 mt-1">
                  ₹{analytics?.total_borrowed?.toLocaleString() ?? '0'}
                </span>
              </div>

              <div className="dark:bg-[#030712] dark:bg-white/5 bg-black/50 p-3 rounded-xl border dark:border-white/5 border-black/5 flex flex-col justify-center items-center">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase">Pending Settle</span>
                <span className="text-sm font-mono font-bold text-[#00C6FF] mt-1">
                  ₹{analytics?.pending?.toLocaleString() ?? '0'}
                </span>
              </div>

              <div className="dark:bg-[#030712] dark:bg-white/5 bg-black/50 p-3 rounded-xl border dark:border-white/5 border-black/5 flex flex-col justify-center items-center">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase">Top Buddy tab</span>
                <span className="text-xs font-sans font-bold dark:text-gray-300 text-slate-600 mt-1 truncate max-w-full">
                  {analytics?.most_frequent_partner ?? 'None'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Section - Live Results & Split History Ledger */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Preview Snapshot */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-2xl bg-[#00C6FF]/5 border border-[#00C6FF]/15 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono tracking-widest text-[#00C6FF] uppercase font-bold">LIVE CALCULATION SCHEME</span>
                    <h4 className="font-sans font-bold text-base dark:text-white text-slate-900 mt-0.5">{result.title}</h4>
                    <span className="text-xs dark:text-gray-400 text-slate-500 font-sans">Paid by <strong className="dark:text-white text-slate-900">{result.paidBy}</strong> • Total <strong className="dark:text-white text-slate-900">₹{result.totalAmount}</strong></span>
                  </div>
                  <button onClick={() => setResult(null)} className="text-xs dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 px-2 py-1 rounded dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 font-mono">
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 space-y-1.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider font-extrabold">Individual Shares</span>
                    <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                      {result.members.map((m, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-mono">
                          <span className="dark:text-gray-400 text-slate-500">{m.name}</span>
                          <span className="text-[#00E38C] font-bold">₹{m.owesAmount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 space-y-1.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider font-extrabold">Proposed Settlements</span>
                    <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                      {result.settlements.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-2 font-mono">No settlements needed.</div>
                      ) : (
                        result.settlements.map((s, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-mono items-center">
                            <span className="dark:text-gray-400 text-slate-500 truncate max-w-[120px]">{s.from} → {s.to}</span>
                            <span className="text-[#00C6FF] font-bold">₹{s.amount}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Listing Ledger */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b dark:border-white/5 border-black/5 pb-3">
              <h3 className="text-xs font-sans font-bold tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
                <History className="h-4 w-4 text-[#00C6FF]" /> FRIEND SPLITTING LEDGER LOGS
              </h3>
              <button
                onClick={() => { fetchHistory(); fetchAnalytics(); }}
                disabled={historyLoading}
                className="text-[9px] font-mono font-bold uppercase text-[#00C6FF] hover:text-[#00E38C] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 px-2 py-1 rounded border dark:border-white/5 border-black/5 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {historyLoading ? <Loader className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                <span>RELOAD</span>
              </button>
            </div>

            {historyLoading && history.length === 0 ? (
              <div className="py-24 flex justify-center text-xs dark:text-gray-400 text-slate-500 gap-1.5 items-center font-sans">
                <Loader className="h-4 w-4 animate-spin text-[#00C6FF]" /> Synchronizing friend accounts ledger chips...
              </div>
            ) : history.length === 0 ? (
              <div className="h-80 border border-dashed dark:border-white/5 border-black/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="dark:bg-white/5 bg-black/5 p-4 rounded-full">
                  <Users className="h-6 w-6 dark:text-slate-400 text-slate-500" />
                </div>
                <p className="text-xs dark:text-gray-500 text-slate-400 max-w-sm leading-relaxed font-sans">
                  No active split transactions recorded yet. Fill out the provisioning form on the left to spin up your very first bill split.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((expense) => {
                  const hasUnsettled = expense.settlements.some(s => !s.isSettled);

                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 rounded-2xl bg-[#090D1C]/80 border dark:border-white/5 border-black/5 space-y-4 shadow-xl hover:dark:border-white/10 border-black/10 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-sans font-bold text-sm dark:text-white text-slate-900">{expense.title}</h4>
                          <span className="text-[10px] dark:text-gray-400 text-slate-500 font-sans">
                            Paid by <strong className="dark:text-white text-slate-900">{expense.paidBy}</strong> on {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : 'Today'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Total tab</span>
                          <span className="text-sm font-mono font-bold text-[#00C6FF]">₹{expense.totalAmount?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Members list */}
                      <div className="pt-1.5 text-left space-y-1.5">
                        <span className="text-[8px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block">Splitting matrix shares</span>
                        <div className="flex flex-wrap gap-2">
                          {expense.members.map((m, idx) => (
                            <div
                              key={idx}
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-sans flex items-center gap-1.5 ${
                                m.isSettled 
                                  ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                                  : 'bg-white/[0.01] dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600'
                              }`}
                            >
                              <span className="font-semibold">{m.name}:</span>
                              <span className="font-mono font-bold">₹{m.owesAmount}</span>
                              {m.isSettled ? <Check className="h-3 w-3 text-emerald-400" /> : <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Outstanding Settlements */}
                      <div className="p-3 dark:bg-[#030712] dark:bg-white/5 bg-black/50 border dark:border-white/5 border-black/5 rounded-xl space-y-2">
                        <span className="text-[8px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block">Ledger Settlement Pipelines</span>
                        
                        <div className="space-y-2">
                          {expense.settlements.map((s) => (
                            <div key={s.id} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-sans dark:text-gray-400 text-slate-500">{s.from}</span>
                                <span className="text-[9.5px] font-mono text-slate-500">owes</span>
                                <span className="font-sans dark:text-white text-slate-900 font-semibold">{s.to}</span>
                                <span className="text-[#00C6FF] font-mono font-black pl-1">₹{s.amount}</span>
                              </div>

                              {s.isSettled ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1 uppercase tracking-wide">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> SETTLED
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSettle(s.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#00C6FF]/10 hover:bg-[#00C6FF]/20 border border-[#00C6FF]/30 hover:border-[#00C6FF] text-[9.5px] font-sans font-bold text-[#00C6FF] hover:dark:text-white text-slate-900 cursor-pointer transition-all uppercase"
                                >
                                  Settle Debt
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
