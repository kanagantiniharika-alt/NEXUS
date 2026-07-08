import React, { useState, useEffect } from "react";
import { User } from "../types";
import { 
  GraduationCap, Sparkles, BookOpen, CircleDollarSign, Loader, 
  Users, Check, Coffee, ArrowRight, Trash2, HelpCircle, PiggyBank,
  AlertCircle
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

// Types for our local state
interface CampusExpense {
  id: string;
  description: string;
  category: "Canteen & Tea" | "Textbooks & Rentals" | "Printouts & Xerox" | "Lab & Event Fees" | "Hostel Utility Spit";
  amount: number;
  date: string;
}

interface StudentModeProps {
  setActiveTab?: (tab: string) => void;
  user?: User;
}

export default function StudentMode({ setActiveTab, user }: StudentModeProps) {
  // Pocket Money & Allowances state
  const [pocketMoney, setPocketMoney] = useState<number>(user?.balance || 6000);
  const [spentOnCampus, setSpentOnCampus] = useState<number>(1450);

  // Sync pocket money when user balance changes
  useEffect(() => {
    if (user?.balance !== undefined) {
      setPocketMoney(user.balance);
    }
  }, [user?.balance]);

  // Campus mini expenditures log (preloaded with generic campus examples)
  const [campusExpenses, setCampusExpenses] = useState<CampusExpense[]>([
    { id: "e1", description: "Samosas and Ginger Chai", category: "Canteen & Tea", amount: 120, date: "Today, 10:15 AM" },
    { id: "e2", description: "Xerox - Operating Systems Lab Notes", category: "Printouts & Xerox", amount: 80, date: "Yesterday, 3:00 PM" },
    { id: "e3", description: "Semester DBMS textbook rent", category: "Textbooks & Rentals", amount: 450, date: "18 Jun, 4:20 PM" },
    { id: "e4", description: "Annual Hackathon registration share", category: "Lab & Event Fees", amount: 300, date: "15 Jun, 11:00 AM" }
  ]);

  // New mini expense form input
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<CampusExpense["category"]>("Canteen & Tea");
  const [newAmt, setNewAmt] = useState("");



  // Campus Hack AI mentor state
  const [mentorQuery, setMentorQuery] = useState("");
  const [mentorOutput, setMentorOutput] = useState("");
  const [loadingMentor, setLoadingMentor] = useState(false);

  useEffect(() => {
    // Welcome message tailored for campus life
    setMentorOutput(`Hey there, scholar! 🎓 I am your Campus Saving Advisor. I can help you find cheap textbook hacks, optimize food spend at the canteen, calculate fair shares for shared dorm flats, and plan local pocket cash reserves. Tap any quick option below or ask me a custom question!`);
  }, []);

  // Quick prompt presets for simple interactions
  const handlePresetQuestion = async (preset: string) => {
    setLoadingMentor(true);
    setMentorQuery(preset);
    try {
      const res = await fetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `As a college student with pocket money wallet ₹${pocketMoney}, answer this dynamic campus cost question creatively with solid tips: "${preset}"`,
          userRole: "student",
          currentBalance: pocketMoney,
          userName: user?.name || "Scholar",
          userIncome: user?.income || 10000,
          userFinanceScore: user?.financeScore || 78
        })
      });
      const data = await res.json();
      setMentorOutput(data.response);
    } catch (err) {
      console.error(err);
      setMentorOutput("Oops, looks like the campus server line is busy! Try asking again in a few seconds.");
    } finally {
      setLoadingMentor(false);
    }
  };

  const handleCustomQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorQuery) return;
    setLoadingMentor(true);
    const originalQuery = mentorQuery;
    setMentorOutput("");

    try {
      const res = await fetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `As a college student with pocket money ₹${pocketMoney} and current spent ₹${spentOnCampus}, advise on this student/academic finance question: "${originalQuery}"`,
          userRole: "student",
          currentBalance: pocketMoney,
          userName: user?.name || "Scholar",
          userIncome: user?.income || 10000,
          userFinanceScore: user?.financeScore || 78
        })
      });
      const data = await res.json();
      setMentorOutput(data.response);
      setMentorQuery("");
    } catch (err) {
      console.error(err);
      setMentorOutput("Local wifi networks are lagging slightly. Give it another try!");
    } finally {
      setLoadingMentor(false);
    }
  };

  // Add a campus mini expenditure
  const handleAddCampusExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmt || isNaN(parseFloat(newAmt))) return;
    const cost = parseFloat(newAmt);
    const newExp: CampusExpense = {
      id: `campus_${Date.now()}`,
      description: newDesc,
      category: newCat,
      amount: cost,
      date: "Just now"
    };
    setCampusExpenses([newExp, ...campusExpenses]);
    setSpentOnCampus(prev => prev + cost);
    setNewDesc("");
    setNewAmt("");
  };

  // Delete a logged campus spend
  const handleDeleteCampusExpense = (id: string, amount: number) => {
    setCampusExpenses(campusExpenses.filter(e => e.id !== id));
    setSpentOnCampus(prev => Math.max(0, prev - amount));
  };

  const categoryTotals = campusExpenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => (b.amount as number) - (a.amount as number));

  const expenseGroupKeys: Record<CampusExpense['category'], string> = {
    "Canteen & Tea": "Food & Drinks",
    "Textbooks & Rentals": "Books & Rentals",
    "Printouts & Xerox": "Stationery & Printing",
    "Lab & Event Fees": "Events & Campus Fees",
    "Hostel Utility Spit": "Hostel & Utilities",
  };

  const groupedTotals = campusExpenses.reduce<Record<string, number>>((acc, expense) => {
    const group = expenseGroupKeys[expense.category] || expense.category;
    acc[group] = (acc[group] || 0) + expense.amount;
    return acc;
  }, {});

  const groupedChartData = Object.entries(groupedTotals)
    .map(([group, amount]) => ({ group, amount }))
    .sort((a, b) => (b.amount as number) - (a.amount as number));

  const categoryColorMap: Record<string, string> = {
    "Canteen & Tea": "#00E38C",
    "Textbooks & Rentals": "#7B61FF",
    "Printouts & Xerox": "#FFB547",
    "Lab & Event Fees": "#FF5C8A",
    "Hostel Utility Spit": "#3B82F6",
  };

  // Quick stats
  const remainingPocketReserve = pocketMoney - spentOnCampus;
  const currentStatusLabel = remainingPocketReserve < 1000 
    ? "Low Reserve Alert" 
    : remainingPocketReserve < 3000 
    ? "Budget Cautious" 
    : "Safe Scholar";

  return (
    <div className="space-y-8 dark:text-white text-slate-900">

      {/* Modern Banner Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#00C6FF]/10 rounded-lg text-[#00C6FF]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-sans font-extrabold tracking-tight">
              CAMPUS LIFE
            </h2>
          </div>
          <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">
            Dedicated college companion for tracking canteen cost boxes, textbook rentals, printing costs, and campus expenses.
          </p>
        </div>

        {/* Dynamic Campus Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/2 border dark:border-white/5 border-black/5 text-right">
            <span className="text-[9px] dark:text-gray-500 text-slate-400 font-mono block uppercase">COLLEGIATE OUTLAY HEALTH</span>
            <span className="text-xs font-mono font-bold text-[#00C6FF]">{currentStatusLabel}</span>
          </div>
        </div>
      </div>

      {/* Grid Zone 1: Campus Wallet Stat & Mini Log Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pocket Cash Dashboard */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2 mb-4">
              <CircleDollarSign className="h-4 w-4 text-[#00E38C]" /> Pocket Cash & Campus Limit
            </h3>

            <div className="space-y-4">
              {/* Pocket Money Display & Adjustment */}
              <div className="p-4 rounded-xl bg-white/1 border dark:border-white/5 border-black/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="dark:text-gray-400 text-slate-500 font-sans">Monthly Pocket Margin</span>
                  <button 
                    onClick={() => {
                      const value = prompt("Set your monthly student pocket money reserve:", pocketMoney.toString());
                      if (value && !isNaN(parseFloat(value))) setPocketMoney(parseFloat(value));
                    }}
                    className="text-[10px] font-mono text-[#00C6FF] hover:underline"
                  >
                    Set Goal Limit
                  </button>
                </div>
                <div className="text-2xl font-mono font-bold dark:text-white text-slate-900">
                  ₹{pocketMoney.toLocaleString()}
                </div>
              </div>

              {/* Status breakdown metrics */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-xl dark:bg-[#0d1326] bg-slate-50 border dark:border-white/5 border-black/5">
                  <span className="text-[9px] dark:text-gray-500 text-slate-400 font-mono uppercase block">Logged Campus Spent</span>
                  <span className="text-sm font-mono font-bold text-[#FF4D4D]">₹{spentOnCampus.toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-xl dark:bg-[#0d1326] bg-slate-50 border dark:border-white/5 border-black/5">
                  <span className="text-[9px] dark:text-gray-500 text-slate-400 font-mono uppercase block">Left to spend</span>
                  <span className="text-sm font-mono font-bold text-[#00E38C]">₹{remainingPocketReserve.toLocaleString()}</span>
                </div>
              </div>

              {/* Graphical mini indicator */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-[10px] dark:text-gray-400 text-slate-500">
                  <span>Usage of Pocket Cash</span>
                  <span>{((spentOnCampus / (pocketMoney || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-200/60 dark:bg-white/5 rounded-full overflow-hidden border dark:border-white/10 border-black/10">
                  <div 
                    className={`h-full transition-all duration-500 ${remainingPocketReserve < 1000 ? "bg-[#FF4D4D]" : "bg-[#00E38C]"}`}
                    style={{ width: `${Math.min(100, (spentOnCampus / (pocketMoney || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t dark:border-white/5 border-black/5 text-[10px] dark:text-gray-400 text-slate-500 flex items-start gap-2">
            <PiggyBank className="h-3.5 w-3.5 text-[#00C6FF] shrink-0 mt-0.5" />
            <span>This keeps track of your liquid cash pool for campus. Overall credit cards or salary savings are isolated.</span>
          </div>
        </div>

        {/* Campus expenditures list (Avoid duplicates / strictly limited categories) */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b dark:border-white/5 border-black/5 pb-3">
            <div>
              <h3 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase">
                Campus Mini-Spent Log
              </h3>
              <p className="text-[10px] dark:text-gray-500 text-slate-400">Only tracking minor expenditures in the college campus domain.</p>
            </div>
            <span className="text-xs font-mono dark:text-gray-400 text-slate-500 font-bold dark:bg-white/5 bg-black/5 px-2.5 py-1 rounded-lg">
              {campusExpenses.length} Micro Spends
            </span>
          </div>

          {/* Form to log student-specific campus spend */}
          <form onSubmit={handleAddCampusExpense} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              type="text"
              required
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="e.g. Samosas & tea, Xerox packet"
              className="dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#EF4444]"
            />
            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value as CampusExpense["category"])}
              className="dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-2 py-2 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#FACC15]"
            >
              <option value="Canteen & Tea">Canteen & Tea</option>
              <option value="Textbooks & Rentals">Textbooks & Rentals</option>
              <option value="Printouts & Xerox">Printouts & Xerox</option>
              <option value="Lab & Event Fees">Lab & Event Fees</option>
              <option value="Hostel Utility Spit">Hostel Utility Split</option>
            </select>
            <div className="flex gap-2">
              <input 
                type="number"
                required
                value={newAmt}
                onChange={e => setNewAmt(e.target.value)}
                placeholder="Cost ₹"
                className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#EF4444]"
              />
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#EF4444] to-[#FACC15] dark:text-white text-slate-900 font-semibold text-xs whitespace-nowrap cursor-pointer hover:opacity-90"
              >
                Log Spend
              </button>
            </div>
          </form>

          {/* Mini-spends scrollable listing */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {campusExpenses.length === 0 ? (
              <div className="text-center py-6 text-xs dark:text-gray-500 text-slate-400">No campus expenditures logged yet. Add above!</div>
            ) : (
              campusExpenses.map(item => (
                <div key={item.id} className="p-3.5 rounded-xl dark:bg-[#0d1326] bg-slate-50 border dark:border-white/5 border-black/5 flex justify-between items-center hover:dark:border-white/10 border-black/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/3 rounded-lg dark:text-gray-400 text-slate-500">
                      <Coffee className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-200 block">{item.description}</span>
                      <span className="text-[9px] font-mono text-[#7B61FF] bg-[#7B61FF]/10 px-1.5 py-0.5 rounded uppercase font-semibold">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-mono font-bold dark:text-white text-slate-900 block">₹{item.amount.toLocaleString()}</span>
                      <span className="text-[8px] dark:text-gray-500 text-slate-400 block">{item.date}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteCampusExpense(item.id, item.amount)}
                      className="p-1.5 rounded bg-red-400/5 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Category expense breakdown chart */}
          <div className="mt-6 p-4 rounded-3xl bg-[#0c162d] border dark:border-white/5 border-black/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
              <div>
                <h4 className="text-xs uppercase tracking-[0.3em] dark:text-gray-500 text-slate-400 font-mono">Category Breakdown</h4>
                <p className="text-[11px] dark:text-gray-400 text-slate-500">Visualize campus spend by expense category and grouped student costs.</p>
              </div>
              <span className="text-[11px] text-[#00E38C] font-semibold">Total ₹{spentOnCampus.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_180px] gap-4">
              <div className="h-60">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="#ffffff0f" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={45} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ background: '#01081d', borderColor: '#334155', borderRadius: 12 }} itemStyle={{ color: '#fff' }} />
                      <Bar dataKey="amount" radius={[12, 12, 0, 0]} barSize={24}>
                        {categoryChartData.map((entry, index) => {
                          const colors = ['#00E38C', '#7B61FF', '#FFB547', '#FF5C8A', '#3B82F6'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs dark:text-gray-500 text-slate-400">Add a campus expense to see the breakdown chart.</div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-3xl bg-[#07101f] border dark:border-white/5 border-black/5">
                <div>
                  <h5 className="text-[10px] uppercase tracking-[0.35em] dark:text-gray-500 text-slate-400 font-mono">Grouped Totals</h5>
                  <p className="text-[11px] dark:text-gray-400 text-slate-500 mt-1">Review categories grouped into broader student spending buckets.</p>
                </div>
                {groupedChartData.map(item => (
                  <div key={item.group} className="flex items-center justify-between gap-3 text-[11px] text-gray-200">
                    <span className="font-medium dark:text-gray-300 text-slate-600">{item.group}</span>
                    <span className="font-semibold dark:text-white text-slate-900">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-3 border-t dark:border-white/10 border-black/10 text-[11px] dark:text-gray-400 text-slate-500">
                  {groupedChartData.length === 0 ? "Log campus expenses to populate the grouped totals." : "Totals update live as you add or remove campus spends."}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Grid Zone 2: AI Campus Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campus Advice & AI Board */}
        <div className="glass-panel p-6 flex flex-col justify-between lg:col-span-3">
          <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
            <h3 className="text-xs font-mono tracking-wider text-[#EF4444] uppercase flex items-center gap-1.5 border-b dark:border-white/5 border-black/5 pb-2.5">
              <Sparkles className="h-4 w-4 text-[#EF4444] animate-pulse" /> Campus Saving Cost Advisor
            </h3>

            {loadingMentor ? (
              <div className="h-32 flex flex-col items-center justify-center gap-2 text-xs dark:text-gray-500 text-slate-400">
                <Loader className="h-5 w-5 text-[#EF4444] animate-spin" />
                <span className="font-mono uppercase animate-pulse text-[9px]">Computing optimal college cost savings...</span>
              </div>
            ) : (
              <div className="text-xs dark:text-gray-300 text-slate-600 leading-normal font-sans border-l-2 border-[#EF4444] pl-3.5 space-y-2 whitespace-pre-line py-1">
                {mentorOutput ? mentorOutput.replace(/\*/g, "") : ""}
              </div>
            )}

            {/* Quick Presets Section */}
            <div className="border-t dark:border-white/5 border-black/5 pt-3.5">
              <span className="text-[9px] uppercase font-mono dark:text-gray-500 text-slate-400 block mb-2 font-semibold">Tap a common campus saving challenge:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetQuestion("How to save on costly textbooks this semester?")}
                  className="w-full text-left p-2 rounded-lg bg-white/2 hover:dark:bg-white/5 bg-black/5 transition-all text-[10px] dark:text-gray-300 text-slate-600 flex items-center gap-2 font-sans border dark:border-white/5 border-black/5 cursor-pointer"
                >
                  <ArrowRight className="h-3 w-3 text-[#FACC15]" /> Costly Textbook Hacks & Rentals
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetQuestion("What is the best way to budget foods with classmate hostel rooms?")}
                  className="w-full text-left p-2 rounded-lg bg-white/2 hover:dark:bg-white/5 bg-black/5 transition-all text-[10px] dark:text-gray-300 text-slate-600 flex items-center gap-2 font-sans border dark:border-white/5 border-black/5 cursor-pointer"
                >
                  <ArrowRight className="h-3 w-3 text-[#FACC15]" /> Canteen vs Meal-kit Budgeting
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetQuestion("Cheap ways to manage local transit around campus?")}
                  className="w-full text-left p-2 rounded-lg bg-white/2 hover:dark:bg-white/5 bg-black/5 transition-all text-[10px] dark:text-gray-300 text-slate-600 flex items-center gap-2 font-sans border dark:border-white/5 border-black/5 cursor-pointer"
                >
                  <ArrowRight className="h-3 w-3 text-[#FACC15]" /> Campus Local Transit / Bicycle Pools
                </button>
              </div>
            </div>
          </div>

          {/* Ask Custom Campus Question Form */}
          <form onSubmit={handleCustomQuery} className="relative mt-4 pt-4 border-t dark:border-white/5 border-black/5">
            <input
              type="text"
              value={mentorQuery}
              onChange={e => setMentorQuery(e.target.value)}
              placeholder="Ask saving hack (e.g. rent cycle, cheap print out)"
              className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl pl-3 pr-20 py-2.5 text-xs focus:outline-none focus:border-[#EF4444] transition-all"
            />
            <button
              type="submit"
              disabled={loadingMentor || !mentorQuery}
              className="absolute right-1.5 bottom-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-tr from-[#EF4444] to-[#FACC15] dark:text-white text-slate-900 font-bold text-[10px] cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              Ask Coach
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
