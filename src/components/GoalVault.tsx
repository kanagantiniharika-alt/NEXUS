import React, { useState, useEffect } from "react";
import { 
  Target, Sparkles, PlusCircle, CheckCircle2, ChevronRight, 
  HelpCircle, Trash2, Loader, ArrowUpRight, TrendingUp, Wallet,
  Smartphone, CreditCard, Building, Check, X, AlertCircle, RefreshCw,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User, FinancialGoal, Transaction } from "../types";

const renderFormattedText = (text: string) => {
  if (!text || typeof text !== 'string') return "";
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-[#00C6FF]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

interface GoalVaultProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
}

export default function GoalVault({ user, onUpdateBalance }: GoalVaultProps) {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Friend split history inside empty space
  const [friendHistory, setFriendHistory] = useState<any[]>([]);
  const [friendHistoryLoading, setFriendHistoryLoading] = useState(false);

  // Goal Creation Forms State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadlineMonths, setDeadlineMonths] = useState("");
  const [category, setCategory] = useState("Laptop Fund");

  // Deposit Section State
  const [activeDepositGoalId, setActiveDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositSource, setDepositSource] = useState<'wallet' | 'upi' | 'card' | 'netbanking'>('upi');
  const [depositLimitError, setDepositLimitError] = useState<string | null>(null);

  // Secure Gateway Simulation State
  const [simulationStep, setSimulationStep] = useState<'empty' | 'initializing' | 'authorizing' | 'success'>('empty');

  // Dynamic AI-Generated Goals Accelerator Advice
  const [goalInsights, setGoalInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Transaction metrics for overspending check
  const [foodSpent, setFoodSpent] = useState(0);
  const [shoppingSpent, setShoppingSpent] = useState(0);

  // Visual Milestones Celebration State
  const [celebration, setCelebration] = useState<{
    percentage: number;
    goalName: string;
    category: string;
  } | null>(null);

  // Confetti Particle state helper
  const confettiColors = ["#00C6FF", "#00E38C", "#7B61FF", "#FF4D8C", "#FF9F43", "#FFE066"];
  const confettiShapes = ["circle" as const, "square" as const, "triangle" as const];

  const generateConfettiParticles = () => {
    return Array.from({ length: 80 }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 15 + 5;
      return {
        id: idx,
        x: Math.random() * 100,
        y: -10,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: Math.random() * 8 + 6,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.4,
        duration: Math.random() * 2.5 + 2,
        driftX: Math.cos(angle) * velocity,
        shape: confettiShapes[Math.floor(Math.random() * confettiShapes.length)]
      };
    });
  };

  useEffect(() => {
    fetchGoals();
    fetchGoalInsights();
    fetchTransactionsAndCalculate();
    fetchFriendHistory();
  }, []);

  const fetchFriendHistory = async () => {
    setFriendHistoryLoading(true);
    try {
      const res = await fetch("/api/friendsplit/history");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFriendHistory(data.history || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch friend history in GoalVault:", err);
    } finally {
      setFriendHistoryLoading(false);
    }
  };

  const handleSettleFriend = async (settlementId: string) => {
    try {
      const res = await fetch(`/api/friendsplit/settle/${settlementId}`, {
        method: 'PUT'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchFriendHistory();
        }
      }
    } catch (e) {
      console.error("Failed to settle friend in GoalVault:", e);
    }
  };

  const fetchTransactionsAndCalculate = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const txs: Transaction[] = await res.json();
        let fSum = 0;
        let sSum = 0;
        txs.forEach(t => {
          if (t.category === "Food") fSum += t.amount;
          if (t.category === "Shopping") sSum += t.amount;
        });
        setFoodSpent(fSum);
        setShoppingSpent(sSum);
      }
    } catch (err) {
      console.error("Failed to fetch transactions for insights:", err);
    }
  };

  const fetchGoalInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/goals/insights");
      const data = await res.json();
      setGoalInsights(data.insights || []);
    } catch (e) {
      console.error("Failed to fetch goals insights:", e);
      setGoalInsights([
        "Keep your savings engine active. Consistently locking small savings can accelerate active milestones by up to **2.4 weeks** earlier than planned.",
        "Set up automated monthly sweeps directly from your income to maintain a high predictability score close to **95%+**."
      ]);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (Array.isArray(data)) {
        const normalized = data.map((g: any) => ({
          ...g,
          savedAmount: typeof g.savedAmount === "number" ? g.savedAmount : (g.currentAmount ?? 0)
        }));
        setGoals(normalized);
      } else {
        setGoals([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadlineMonths) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetAmount: parseFloat(targetAmount),
          deadlineMonths: parseInt(deadlineMonths),
          category
        })
      });
      const data = await res.json();
      const normalizedGoal = {
        ...data,
        savedAmount: typeof data.savedAmount === "number" ? data.savedAmount : (data.currentAmount ?? 0)
      };
      setGoals(prev => [normalizedGoal, ...prev]);

      setName("");
      setTargetAmount("");
      setDeadlineMonths("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectQuickAmount = (amount: number) => {
    setDepositAmount(amount.toString());
    setDepositLimitError(null);
  };

  const handleInitiateDeposit = async (goalId: string) => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      setDepositLimitError("Please input a valid positive payment sum.");
      return;
    }

    if (depositSource === 'wallet' && user.balance < amt) {
      setDepositLimitError(`Insufficient funds in Main Wallet. Your balance is ₹${user.balance.toLocaleString()}.`);
      return;
    }

    setDepositLimitError(null);
    
    setSimulationStep('initializing');
    await new Promise(r => setTimeout(r, 900));
    setSimulationStep('authorizing');
    await new Promise(r => setTimeout(r, 1200));

    try {
      const res = await fetch(`/api/goals/${goalId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          source: depositSource
        })
      });

      const responseData = await res.json();
      if (!res.ok) {
        setDepositLimitError(responseData.error || "Failed to finalize deposit.");
        setSimulationStep('empty');
        return;
      }

      setSimulationStep('success');
      await new Promise(r => setTimeout(r, 1200));

      onUpdateBalance(responseData.balance);

      const originalGoal = goals.find(g => g.id === goalId);
      if (originalGoal) {
        const oldSaved = typeof originalGoal.savedAmount === "number" ? originalGoal.savedAmount : (originalGoal.currentAmount ?? 0);
        const newSaved = typeof responseData.goal.savedAmount === "number" ? responseData.goal.savedAmount : (responseData.goal.currentAmount ?? 0);
        const oldPercent = Math.min(100, Math.round((oldSaved / originalGoal.targetAmount) * 100));
        const newPercent = Math.min(100, Math.round((newSaved / responseData.goal.targetAmount) * 100));
        
        const milestones = [100, 75, 50, 25];
        const reachedMilestone = milestones.find(m => newPercent >= m && oldPercent < m);
        if (reachedMilestone) {
          setCelebration({
            percentage: reachedMilestone,
            goalName: responseData.goal.name,
            category: responseData.goal.category
          });
        }
      }

      const updatedGoal = {
        ...responseData.goal,
        savedAmount: typeof responseData.goal.savedAmount === "number" ? responseData.goal.savedAmount : (responseData.goal.currentAmount ?? 0)
      };

      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));

      setSimulationStep('empty');
      setActiveDepositGoalId(null);
      setDepositAmount("");
      fetchGoals();
    } catch (err) {
      console.error(err);
      setDepositLimitError("An external API error occurred. Please verify connections.");
      setSimulationStep('empty');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to close this Locked savings vault? Placed assets will return to your general pool.")) return;
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId));
        if (activeDepositGoalId === goalId) {
          setActiveDepositGoalId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAIInsightForGoal = (goal: FinancialGoal) => {
    const saved = typeof goal.savedAmount === "number" ? goal.savedAmount : (goal.currentAmount ?? 0);
    const target = goal.targetAmount || 1;
    const progressPercent = Math.min(100, Math.round((saved / target) * 100));
    const categories = {
      "Laptop Fund": {
        emoji: "💻",
        badge: "Hardware Horizon",
        theme: "Your laptop fund is currently orbiting a delayed shipment."
      },
      "Higher Studies": {
        emoji: "🎓",
        badge: "Scholarship Sprint",
        theme: "Your next semester feels much closer with every disciplined deposit."
      },
      "Travel Fund": {
        emoji: "✈️",
        badge: "Flight Path",
        theme: "Your travel goal is booking a future you can actually afford."
      },
      "Emergency Fund": {
        emoji: "🛡️",
        badge: "Safety Buffer",
        theme: "A stronger safety net means less drama when life throws surprises."
      },
      "Certification Fund": {
        emoji: "📚",
        badge: "Skill Stack",
        theme: "Investing in certifications today buys more earning power tomorrow."
      }
    } as const;

    const categoryInfo = categories[goal.category as keyof typeof categories] || {
      emoji: "🔮",
      badge: "Goal Pulse",
      theme: "This vault is one smart habit away from a breakthrough."
    };

    if (progressPercent >= 100) {
      return {
        emoji: "🏆",
        message: `${categoryInfo.emoji} ${categoryInfo.badge} complete — your vault is full. Ready to redeem the reward? 🎉`,
        suggestion: "Finalize the purchase or move savings into your next high-priority goal.",
        status: "success"
      };
    }

    if (foodSpent > 12000 || foodSpent > (user.income * 0.15)) {
      return {
        emoji: "🍔",
        message: `${categoryInfo.theme} Meanwhile, your food spend is stealing runway space from the goal.`,
        suggestion: "Trim one meal delivery and reroute that cash into the vault this week.",
        status: "warning"
      };
    }

    if (shoppingSpent > 8000 || shoppingSpent > (user.income * 0.10)) {
      return {
        emoji: "🛍️",
        message: `${categoryInfo.theme} Your shopping cart is auditioning for a role in delayed gratification.`,
        suggestion: "Pause non-essential buys for 72 hours and let the goal catch up.",
        status: "warning"
      };
    }

    if (goal.probability < 50) {
      return {
        emoji: "📉",
        message: `${categoryInfo.emoji} ${categoryInfo.badge} is under pressure. Current probability is too low for a confident arrival.`,
        suggestion: "Increase the monthly contribution or extend the deadline slightly to improve stability.",
        status: "warning"
      };
    }

    return {
      emoji: categoryInfo.emoji,
      message: `${categoryInfo.theme} You are on a clean path — just one consistent deposit away from serious momentum.`,
      suggestion: "Add a smart deposit sweep to incrementally accelerate this goal.",
      status: "stable"
    };
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900">

      {/* Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6 text-left">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
          <Target className="h-6 w-6 text-[#00E38C]" /> Smart Savings Vaults
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">
          Lock money away automatically or deposit manually using multiple flexible payment systems like UPI, Cards, NetBanking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: Provisioning form & Friend Expense history */}
        <div className="space-y-6 col-span-1">
          {/* Create new Goal form */}
          <div className="rounded-2xl p-6 bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-5 h-fit text-left">
            <div className="space-y-1">
              <h3 className="text-xs font-sans font-bold tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-[#00C6FF]" /> PROVISION NEW VAULT GOAL
              </h3>
              <p className="text-xs dark:text-gray-400 text-slate-500 font-sans leading-relaxed">
                Define your financial targets. Nexus automated systems map optimal monthly goals and lifestyle adjustments.
              </p>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Goal Name</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Higher Education UPSC Prep"
                  className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 placeholder-gray-600 focus:outline-none focus:border-[#00C6FF] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Target sum (₹)</label>
                  <input
                    type="number" required value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                    placeholder="e.g. 40000"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 placeholder-gray-600 focus:outline-none focus:border-[#00C6FF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Term length</label>
                  <input
                    type="number" required value={deadlineMonths} onChange={e => setDeadlineMonths(e.target.value)}
                    placeholder="e.g. 6 (months)"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 placeholder-gray-600 focus:outline-none focus:border-[#00C6FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider dark:text-gray-500 text-slate-400 block mb-1">Objective category</label>
                <select
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#00C6FF] dark:text-white text-slate-900"
                >
                  <option value="Laptop Fund">Laptop Fund</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Travel Fund">Travel Fund</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Certification Fund">Certification Fund</option>
                </select>
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#00E38C] text-black font-semibold text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#00E38C]/10"
              >
                {isSubmitting ? (
                  <Loader className="h-3.5 w-3.5 animate-spin text-black" />
                ) : (
                  <>
                    <Target className="h-3.5 w-3.5" /> Initialize Saving Goal
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Friend Splitter History Card */}
          <div className="rounded-2xl p-6 bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-4 text-left">
            <div className="flex items-center justify-between border-b dark:border-white/5 border-black/5 pb-2">
              <h3 className="text-xs font-sans font-bold tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00C6FF]" /> ROOMMATE SPLIT LEDGER
              </h3>
              <button
                onClick={fetchFriendHistory}
                disabled={friendHistoryLoading}
                className="text-[9px] font-mono font-bold uppercase text-[#00C6FF] hover:text-[#00E38C] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 px-2 py-0.5 rounded border dark:border-white/5 border-black/5 transition-all flex items-center gap-1 cursor-pointer"
              >
                {friendHistoryLoading ? <Loader className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
              </button>
            </div>

            {friendHistoryLoading && friendHistory.length === 0 ? (
              <div className="py-8 text-center text-xs dark:text-gray-400 text-slate-500 flex items-center justify-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-[#00C6FF]" /> Synchronizing...
              </div>
            ) : friendHistory.length === 0 ? (
              <p className="text-[11px] dark:text-gray-500 text-slate-400 font-sans leading-relaxed">
                No roommate split history found. Open the Friend Splitter page to initialize a new meal, tea, or rent tab!
              </p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {friendHistory.slice(0, 4).map((expense: any) => {
                  return (
                    <div key={expense.id} className="p-3.5 rounded-xl dark:bg-[#030712] bg-white/40 border dark:border-white/5 border-black/5 space-y-3 hover:dark:border-white/10 border-black/10 transition-all">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-sans font-bold text-xs dark:text-white text-slate-900 leading-snug">{expense.title}</h4>
                          <span className="text-[9px] dark:text-gray-400 text-slate-500 font-sans block">
                            Paid by <strong className="dark:text-white text-slate-900">{expense.paidBy}</strong>
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#00C6FF] whitespace-nowrap">₹{(expense.totalAmount ?? 0).toLocaleString()}</span>
                      </div>

                      <div className="space-y-1.5 pt-1.5 border-t border-white/[0.03]">
                        {(expense.settlements || []).map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-[10px] font-sans gap-2">
                            <span className="dark:text-gray-400 text-slate-500 truncate max-w-[120px]">{s.from} → {s.to}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono dark:text-gray-300 text-slate-600">₹{(s.amount ?? 0).toLocaleString()}</span>
                              {s.isSettled ? (
                                <span className="text-[8px] font-mono font-bold text-[#00E38C] bg-[#00E38C]/10 px-1 py-0.2 rounded border border-[#00E38C]/20">SETTLED</span>
                              ) : (
                                <button
                                  onClick={() => handleSettleFriend(s.id)}
                                  className="text-[8px] font-sans font-bold text-[#00C6FF] hover:dark:text-white text-slate-900 bg-[#00C6FF]/10 hover:bg-[#00C6FF]/20 px-1.5 py-0.5 rounded border border-[#00C6FF]/20 cursor-pointer"
                                >
                                  Settle
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Display Goals Active list */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold tracking-wide dark:text-gray-400 text-slate-500 uppercase">
              ACTIVE SAVINGS VAULTS ({goals.length})
            </h3>
            <span className="text-[10px] font-sans font-bold dark:bg-white/5 bg-black/5 py-1 px-2.5 rounded-full dark:text-gray-400 text-slate-500 flex items-center gap-1.5">
              Available Balance: <span className="text-[#00E38C]">₹{user.balance.toLocaleString()}</span>
            </span>
          </div>

          {loading ? (
            <div className="py-24 flex justify-center text-xs dark:text-gray-400 text-slate-500 gap-1.5 items-center">
              <Loader className="h-4 w-4 animate-spin text-[#00E38C]" /> Reading goal vaults secure chips...
            </div>
          ) : goals.length === 0 ? (
            <div className="h-72 border border-dashed dark:border-white/5 border-black/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="dark:bg-white/5 bg-black/5 p-4 rounded-full">
                <Target className="h-6 w-6 dark:text-slate-400 text-slate-500" />
              </div>
              <p className="text-xs dark:text-gray-500 text-slate-400 max-w-sm leading-relaxed">
                No active savings goals detected. Setup a target amount, like a Laptop Fund or Certification goal, inside the provisioning panel to start locking money!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {goals.map(g => {
                const saved = typeof g.savedAmount === "number" ? g.savedAmount : (g.currentAmount ?? 0);
                const target = g.targetAmount || 1;
                const percentSaved = Math.min(100, Math.round((saved / target) * 100));
                const isDepositActive = activeDepositGoalId === g.id;

                // Calculate remaining term in months dynamically
                const getMonthsRemaining = (deadlineStr?: string) => {
                  if (!deadlineStr) return 12;
                  const deadlineDate = new Date(deadlineStr);
                  const now = new Date();
                  const diffTime = deadlineDate.getTime() - now.getTime();
                  if (isNaN(diffTime) || diffTime <= 0) return 1;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return Math.max(1, Math.ceil(diffDays / 30));
                };

                const term = g.deadlineMonths ?? getMonthsRemaining(g.deadline);
                const monthlyNeeded = g.monthlySavingsNeeded ?? Math.max(0, Math.round((target - saved) / term));

                return (
                  <div key={g.id} className="p-6 rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 space-y-4 shadow-xl relative overflow-hidden transition-all duration-300 hover:dark:border-white/10 border-black/10">
                    
                    {/* Title and feasibility metrics */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.03] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-sans font-bold uppercase bg-[#00C6FF]/10 px-2 py-0.5 rounded text-[#00C6FF]">
                            {g.category}
                          </span>
                          <span className="text-[9px] font-sans font-bold uppercase dark:bg-white/5 bg-black/5 px-2 py-0.5 rounded dark:text-gray-400 text-slate-500 border dark:border-white/5 border-black/5">
                            {percentSaved}% Completed
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-sm dark:text-white text-slate-900">{g.name}</h4>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-sans font-bold dark:text-gray-500 text-slate-400 block">AI Probability</span>
                          <span className={`text-xs font-sans font-bold ${(g.probability ?? 80) > 85 ? "text-[#00E38C]" : "text-[#FF9F43]"}`}>
                            {g.probability ?? 80}% Achievable
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-sans font-bold dark:text-gray-500 text-slate-400 block">Suggested Monthly</span>
                          <span className="text-xs font-sans font-bold text-[#00E38C]">
                            ₹{monthlyNeeded.toLocaleString()}/mo
                          </span>
                        </div>

                        <button 
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-2 rounded-lg dark:text-gray-500 text-slate-400 hover:text-[#FF4D4D] hover:bg-red-500/10 cursor-pointer transition-all"
                          title="Archive goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Goal progress lines and Interactive Milestone Badges */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-sans font-bold">
                        <span className="dark:text-gray-300 text-slate-600">Saved: <span className="text-[#00E38C]">₹{saved.toLocaleString()}</span></span>
                        <span className="dark:text-gray-400 text-slate-500">Target: ₹{target.toLocaleString()} ({term} mo)</span>
                      </div>

                      <div className="h-2.5 dark:bg-white/5 bg-black/5 rounded-full overflow-hidden relative">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-[#00E38C] to-[#00C6FF]" 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentSaved}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>

                      <div className="space-y-1.5 pt-1 text-left">
                        <span className="text-[9px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block">Goal Vault Milestones</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[25, 50, 75, 100].map(m => {
                            const reached = percentSaved >= m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setCelebration({
                                    percentage: m,
                                    goalName: g.name,
                                    category: g.category
                                  });
                                }}
                                className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                                  reached 
                                    ? "bg-gradient-to-br from-[#00C6FF]/10 to-[#00E38C]/10 border-[#00C6FF]/35 dark:text-white text-slate-900 hover:border-[#00E38C] hover:shadow-[0_0_8px_rgba(0,198,255,0.15)] hover:scale-[1.03]" 
                                    : "bg-white/[0.01] dark:border-white/5 border-black/5 text-gray-600 cursor-not-allowed opacity-50"
                                }`}
                                disabled={!reached}
                                title={reached ? `Celebrate your ${m}% milestone achievement!` : `Locked until progress reaches ${m}%`}
                              >
                                <div className="absolute top-0 right-0 w-8 h-8 bg-[#00C6FF]/5 rounded-full blur-sm pointer-events-none" />
                                <div className="flex items-center justify-between w-full relative z-10">
                                  <span className={`text-[10px] font-mono font-bold ${reached ? "text-[#00C6FF]" : "text-gray-600"}`}>
                                    {m}%
                                  </span>
                                  <Sparkles className={`h-3 w-3 ${reached ? "text-[#00E38C] group-hover:scale-125 transition-transform" : "text-gray-600"}`} />
                                </div>
                                <span className={`text-[8.5px] font-sans font-bold uppercase mt-1 relative z-10 ${reached ? "text-[#00E38C]" : "text-gray-600"}`}>
                                  {reached ? "REPLAY" : "LOCKED"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const insight = getAIInsightForGoal(g);
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className={`p-4 rounded-3xl border text-left transition-all duration-300 ${
                            insight.status === "success" 
                              ? "bg-gradient-to-r from-emerald-500/[0.08] to-emerald-500/[0.02] border-emerald-500/20 text-[#00E38C]" 
                              : insight.status === "warning"
                              ? "bg-gradient-to-r from-red-500/[0.08] to-red-500/[0.02] border-red-500/20 text-red-300" 
                              : "dark:bg-[#090d1c] bg-white/80 dark:border-white/10 border-black/10 text-gray-200"
                          }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl leading-none">{insight.emoji}</span>
                              <div>
                                <div className="text-[9px] uppercase tracking-[0.28em] font-mono text-slate-500 mb-1">AI Insight • {g.category}</div>
                                <p className="text-sm font-semibold dark:text-white text-slate-900 leading-snug">{insight.message}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.28em] ${
                              insight.status === "success" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/15" : insight.status === "warning" ? "bg-red-500/10 text-red-300 border border-red-500/15" : "dark:bg-white/5 bg-black/5 text-slate-300 border dark:border-white/10 border-black/10"
                            }`}>
                              {insight.status === "success" ? "On Track" : insight.status === "warning" ? "Review Needed" : "Steady"}
                            </span>
                          </div>
                          <div className="mt-3 text-[10px] leading-relaxed text-slate-300 border-t dark:border-white/10 border-black/10 pt-3">
                            <span className="font-semibold dark:text-white text-slate-900 uppercase tracking-[0.24em]">Suggested action:</span> {insight.suggestion}
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* AI compiled advice text (Savings Recommendation) */}
                    {g.savingsPlan && (
                      <div className="p-3.5 rounded-xl bg-[#090e1c] border dark:border-white/5 border-black/5 flex gap-2.5 items-start">
                        <Sparkles className="h-4 w-4 text-[#00E38C] shrink-0 mt-0.5 animate-pulse" />
                        <div className="space-y-0.5 text-xs dark:text-gray-300 text-slate-600 leading-relaxed font-sans">
                          <strong className="dark:text-white text-slate-900 block font-sans text-[10px] uppercase tracking-wide">Savings Recommendation:</strong>
                          {g.savingsPlan}
                        </div>
                      </div>
                    )}

                    {/* Deposit Actions */}
                    <div className="pt-2 flex flex-col gap-4">
                      {!isDepositActive ? (
                        <button
                          onClick={() => {
                            setActiveDepositGoalId(g.id);
                            setDepositAmount("");
                            setDepositLimitError(null);
                          }}
                          className="px-4 py-2.5 rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 hover:border-[#00E38C]/20 hover:bg-[#00E38C]/5 text-xs font-sans font-semibold dark:text-white text-slate-900 cursor-pointer transition-all flex items-center justify-center gap-1.5 w-full md:w-auto"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#00E38C]" /> Deposit Money & Save
                        </button>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-5 rounded-xl bg-[#080d19] border dark:border-white/10 border-black/10 space-y-4 relative"
                        >
                          <button 
                            onClick={() => setActiveDepositGoalId(null)}
                            className="absolute top-3 right-3 dark:text-gray-500 text-slate-400 hover:dark:text-white text-slate-900 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-1.5 text-xs font-sans font-bold dark:text-white text-slate-900 uppercase">
                            <Wallet className="h-4 w-4 text-[#00C6FF]" /> 
                            Secure Money Deposit Portal
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-sans font-bold dark:text-gray-500 text-slate-400 tracking-wider">Quick Pick Preset</span>
                            <div className="flex flex-wrap gap-2">
                              {[500, 1000, 2000, 5000].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => selectQuickAmount(val)}
                                  className={`px-3.5 py-2 text-xs font-sans font-bold rounded-lg border cursor-pointer transition-all ${
                                    depositAmount === val.toString()
                                      ? "bg-[#00E38C]/10 border-[#00E38C] text-[#00E38C]"
                                      : "dark:bg-white/5 bg-black/5 border-transparent dark:text-gray-300 text-slate-600 hover:dark:bg-white/10 bg-black/10"
                                  }`}
                                >
                                  ₹{val.toLocaleString()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-sans font-bold dark:text-gray-500 text-slate-400 tracking-wider">Custom Deposit Amount (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-2.5 text-xs dark:text-gray-500 text-slate-400 font-bold font-sans">₹</span>
                              <input
                                type="number"
                                placeholder="Enter custom amount"
                                value={depositAmount}
                                onChange={e => {
                                  setDepositAmount(e.target.value);
                                  setDepositLimitError(null);
                                }}
                                className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl pl-8 pr-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF]"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-sans font-bold dark:text-gray-500 text-slate-400 tracking-wider block">Select Secure Payment Channel</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setDepositSource('upi')}
                                className={`p-3 text-left rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                  depositSource === 'upi'
                                    ? "bg-[#00C6FF]/10 border-[#00C6FF] dark:text-white text-slate-900"
                                    : "bg-white/[0.02] dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/5 bg-black/5"
                                }`}
                              >
                                <Smartphone className="h-4 w-4 text-[#00C6FF] shrink-0" />
                                <div className="text-xs">
                                  <div className="font-bold">Instant UPI (GPay/PhonePe)</div>
                                  <div className="text-[9px] dark:text-gray-500 text-slate-400 font-sans">Scan payload redirect hook</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDepositSource('card')}
                                className={`p-3 text-left rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                  depositSource === 'card'
                                    ? "bg-[#00C6FF]/10 border-[#00C6FF] dark:text-white text-slate-900"
                                    : "bg-white/[0.02] dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/5 bg-black/5"
                                }`}
                              >
                                <CreditCard className="h-4 w-4 text-[#7B61FF] shrink-0" />
                                <div className="text-xs">
                                  <div className="font-bold">Credit/Debit Card</div>
                                  <div className="text-[9px] dark:text-gray-500 text-slate-400 font-sans">Visa, Mastercard, RuPay</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDepositSource('netbanking')}
                                className={`p-3 text-left rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                  depositSource === 'netbanking'
                                    ? "bg-[#00C6FF]/10 border-[#00C6FF] dark:text-white text-slate-900"
                                    : "bg-white/[0.02] dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/5 bg-black/5"
                                }`}
                              >
                                <Building className="h-4 w-4 text-[#FF9F43] shrink-0" />
                                <div className="text-xs">
                                  <div className="font-bold">Net Banking Instant</div>
                                  <div className="text-[9px] dark:text-gray-500 text-slate-400 font-sans">Secure Direct Bank Sweep</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDepositSource('wallet')}
                                className={`p-3 text-left rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                  depositSource === 'wallet'
                                    ? "bg-[#00E38C]/10 border-[#00E38C] dark:text-white text-slate-900"
                                    : "bg-white/[0.02] dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:bg-white/5 bg-black/5"
                                }`}
                              >
                                <Wallet className="h-4 w-4 text-[#00E38C] shrink-0" />
                                <div className="text-xs">
                                  <div className="font-bold">Deduct Main Wallet</div>
                                  <div className="text-[9px] dark:text-gray-500 text-slate-400 font-sans">Balance: ₹{user.balance.toLocaleString()}</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          {depositLimitError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-[#FF4D4D] text-xs rounded-xl flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span>{depositLimitError}</span>
                            </div>
                          )}

                          <div className="text-[10px] font-sans dark:text-gray-500 text-slate-400 leading-normal bg-white/[0.01] p-3 rounded-xl border dark:border-white/5 border-black/5">
                            {depositSource === 'wallet' ? (
                              <span>This operation will transfer <strong className="dark:text-white text-slate-900">₹{(parseFloat(depositAmount) || 0).toLocaleString()}</strong> directly from your active balance into your locked savings. Your public net balance will reduce appropriately.</span>
                            ) : (
                              <span>Using an external provider. This simulates a real <strong className="dark:text-white text-slate-900">{depositSource.toUpperCase()}</strong> transaction. The funds will be securely verified by reserve algorithms and added directly into the locked goals without reducing your main wallet balance.</span>
                            )}
                          </div>

                          {simulationStep === 'empty' ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleInitiateDeposit(g.id)}
                                className="px-5 py-3 rounded-xl bg-[#00E38C] text-black font-sans font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-1.5"
                              >
                                <Check className="h-4 w-4" /> Finalize Deposit Setup
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveDepositGoalId(null)}
                                className="px-4 py-3 rounded-xl dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 text-xs font-sans font-bold dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-white/[0.02] border dark:border-white/5 border-black/5 flex flex-col items-center justify-center text-center space-y-3">
                              <Loader className="h-6 w-6 text-[#00C6FF] animate-spin" />
                              <div className="space-y-1">
                                <div className="text-xs font-sans font-bold dark:text-white text-slate-900 uppercase tracking-wider">
                                  {simulationStep === 'initializing' && "Contacting Financial Gateway..."}
                                  {simulationStep === 'authorizing' && `Authorizing Transmitting of ₹${(parseFloat(depositAmount) || 0).toLocaleString()}...`}
                                  {simulationStep === 'success' && "Secure Deposit Authorized!"}
                                </div>
                                <p className="text-[10px] dark:text-gray-500 text-slate-400">
                                  {simulationStep === 'initializing' && "Handshaking with bank ledger systems (UPI/VISA protocol)..."}
                                  {simulationStep === 'authorizing' && `Tokenizing ledger credits under secure vault certificate...`}
                                  {simulationStep === 'success' && "Asset records synchronized. Closing portal..."}
                                </p>
                              </div>
                            </div>
                          )}

                        </motion.div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* AI Milestone Accelerator Advice */}
      <div className="p-6 rounded-3xl bg-[#080d1a]/85 border dark:border-white/5 border-black/5 backdrop-blur-xl space-y-4 relative overflow-hidden mt-8 text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C6FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00E38C] animate-pulse" /> NEXUS AI Milestone Accelerator
          </h3>
          <button 
            onClick={fetchGoalInsights}
            disabled={insightsLoading}
            className="text-[9px] font-mono font-bold uppercase text-[#00C6FF] hover:text-[#7B61FF] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 px-2.5 py-1 rounded-lg border dark:border-white/5 border-black/5 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {insightsLoading ? (
              <Loader className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <RefreshCw className="h-2.5 w-2.5" />
            )}
            <span>Refresh AI</span>
          </button>
        </div>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans">Strategic savings and compound vectors generated live by Gemini based on your main balance and current vault goals:</p>

        {insightsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs dark:text-gray-400 text-slate-500 gap-2 font-sans">
            <Loader className="h-5 w-5 animate-spin text-[#00C6FF]" /> Compiling compound statistics...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalInsights.map((ins, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -3, border: "1px solid rgba(0, 227, 140, 0.3)" }}
                className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 flex items-start gap-4 hover:dark:border-white/10 border-black/10 transition-all duration-300"
              >
                <div className="h-7 w-7 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0 text-[#00E38C] text-xs font-bold font-mono">
                  {idx + 1}
                </div>
                <span className="text-xs dark:text-gray-300 text-slate-600 leading-relaxed font-sans">{renderFormattedText(ins)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confetti Celebration Overlay */}
      <AnimatePresence>
        {celebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#040812]/90 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {generateConfettiParticles().map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ 
                    y: -50, 
                    x: `${p.x}vw`, 
                    rotate: p.rotation,
                    opacity: 1
                  }}
                  animate={{ 
                    y: "110vh", 
                    x: `${p.x + (Math.random() * 20 - 10)}vw`,
                    rotate: p.rotation + 720,
                    opacity: [1, 1, 0.8, 0]
                  }}
                  transition={{ 
                    duration: p.duration, 
                    delay: p.delay, 
                    ease: "linear",
                    repeat: 0
                  }}
                  className="absolute"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    borderRadius: p.shape === "circle" ? "50%" : p.shape === "triangle" ? "0" : "2px",
                    borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : "none",
                    borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : "none",
                    borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : "none",
                    backgroundColor: p.shape === "triangle" ? "transparent" : p.color,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative max-w-md w-full rounded-3xl bg-[#090e1c] border dark:border-white/10 border-black/10 p-8 text-center shadow-3xl overflow-hidden"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00E38C]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00C6FF]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-[#00C6FF] to-[#00E38C] p-[1.5px] shadow-[0_0_30px_rgba(0,198,255,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#050811] flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Sparkles className="h-10 w-10 text-[#00E38C]" />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#00C6FF] bg-[#00C6FF]/15 px-3 py-1 rounded-full border border-[#00C6FF]/20">
                    Milestone Reached! ({celebration.percentage}%)
                  </span>
                  <p className="text-[11px] font-mono font-bold text-[#00E38C] uppercase tracking-wider pt-2">
                    {celebration.category}
                  </p>
                  <h3 className="text-xl font-sans font-bold dark:text-white text-slate-900 mt-1 leading-snug">
                    {celebration.goalName}
                  </h3>
                </div>

                <div className="py-2.5 px-4 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 space-y-1">
                  <p className="text-xs dark:text-gray-400 text-slate-500 font-sans leading-relaxed">
                    Sensational financial focus! Reaching the <strong className="dark:text-white text-slate-900 font-extrabold">{celebration.percentage}%</strong> landmark moves this target closer to absolute achievement vectors.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCelebration(null)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00C6FF] to-[#00E38C] hover:from-[#00E38C] hover:to-[#00C6FF] text-black font-sans font-bold text-xs transition-all tracking-wider uppercase cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00E38C]/10"
                >
                  Spectacular!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
