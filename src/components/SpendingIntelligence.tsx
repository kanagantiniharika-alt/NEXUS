import { useState, useEffect } from "react";
import { User, Transaction } from "../types";
import { 
  PiggyBank, ShoppingBag, TrendingUp, UserCheck,
  Sparkles, Compass, Heart, Smile, Percent, Tv, Utensils, Gift,
  Award, RefreshCw, HelpCircle, AlertCircle, Loader, Landmark, Check, Bell
} from "lucide-react";
import { serpApiService } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

interface SpendingProps {
  user: User;
  onUpdateUser?: (fields: Partial<User>) => void;
}

interface Archetype {
  title: string;
  oneLiner: string;
  recommendation: string;
  riskLevel: "Low" | "Moderate" | "High";
  tagline: string;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
}

const renderFormattedText = (text: string) => {
  if (!text) return "";
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

export default function SpendingIntelligence({ user, onUpdateUser }: SpendingProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "quiz">("analysis");

  // Trend analysis states
  const [trendData, setTrendData] = useState<any>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Quiz interactive state
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Dynamic AI-Generated Tips loaded live
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  // Spend notifications toggler states
  const [toggleLoading, setToggleLoading] = useState(false);
  const spendAlertsEnabled = !!user.spendAlertsEnabled;

  const handleToggleSpendAlerts = async () => {
    setToggleLoading(true);
    const nextState = !spendAlertsEnabled;
    try {
      const res = await fetch("/api/user/spend-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && onUpdateUser) {
          onUpdateUser({ spendAlertsEnabled: data.spendAlertsEnabled });
          window.dispatchEvent(new Event("notifications-updated"));
        }
      }
    } catch (e) {
      console.error("Failed to toggle category alerting limits:", e);
    } finally {
      setToggleLoading(false);
    }
  };

  const archetypes: Record<string, Archetype> = {
    SmartSaver: {
      title: "Smart Saver",
      oneLiner: "You treat saving money like a game you intend to win! You compare prices and always think ahead.",
      recommendation: "Keep up the amazing habits! Just remember to occasionally treat yourself to a small reward—you've earned it.",
      riskLevel: "Low",
      tagline: "The Future Champion",
      icon: PiggyBank,
      color: "#00E38C",
      borderColor: "border-[#00E38C]/30",
      bgColor: "bg-[#00E38C]/5"
    },
    ImpulsiveBuyer: {
      title: "Impulsive Buyer",
      oneLiner: "You see it, you love it, you buy it instantly! Late-night online shopping scrolling is your sweet spot.",
      recommendation: "Try our '72-Hour Rule'—leave items in your cart for three full days before checking out to confirm you actually need them.",
      riskLevel: "High",
      tagline: "The Vibe Buyer",
      icon: ShoppingBag,
      color: "#FF4D4D",
      borderColor: "border-[#FF4D4D]/30",
      bgColor: "bg-[#FF4D4D]/5"
    },
    BalancedSpender: {
      title: "Balanced Spender",
      oneLiner: "You strike a flawless balance between enjoying your everyday purchases and putting side clean savings.",
      recommendation: "Outstanding balance! Continue doing exactly what you're doing. Adjust your goals only when your income or rent changes.",
      riskLevel: "Low",
      tagline: "The Master of Balance",
      icon: UserCheck,
      color: "#00C6FF",
      borderColor: "border-[#00C6FF]/30",
      bgColor: "bg-[#00C6FF]/5"
    },
    DealHunter: {
      title: "Deal Hunter",
      oneLiner: "You live for discount codes, cashback vouchers, and clearance sales. You never premium-pay full price!",
      recommendation: "Be careful not to buy things *simply* because they have a discount coupon. Ask yourself if you would buy it at full price.",
      riskLevel: "Low",
      tagline: "The Coupon Whiz",
      icon: Percent,
      color: "#FF9F43",
      borderColor: "border-[#FF9F43]/30",
      bgColor: "bg-[#FF9F43]/5"
    },
    ExperienceSeeker: {
      title: "Experience Seeker",
      oneLiner: "You spend on beautiful memories rather than physical things—dining out, concerts, trips, and coffee shop dates.",
      recommendation: "Memories are priceless! To protect your emergency fund, allocate a fixed 'Fun Time' envelope budget each month.",
      riskLevel: "Moderate",
      tagline: "The Memory Maker",
      icon: Compass,
      color: "#7B61FF",
      borderColor: "border-[#7B61FF]/30",
      bgColor: "bg-[#7B61FF]/5"
    },
    ConvenienceShopper: {
      title: "Convenience Shopper",
      oneLiner: "Fast shipping, quick taxi rides, and ready-made meals—you easily pay extra to save valuable time and effort.",
      recommendation: "Small service fees and delivery surcharges add up faster than you think. Try walking short distances or meal prepping.",
      riskLevel: "Moderate",
      tagline: "The Time Saver",
      icon: Smile,
      color: "#FF73CA",
      borderColor: "border-[#FF73CA]/30",
      bgColor: "bg-[#FF73CA]/5"
    },
    SilentSubscriber: {
      title: "Silent Subscriber",
      oneLiner: "You collect movie streaming apps, gaming packs, and premium music trials but sometimes forget to open them.",
      recommendation: "Take 5 minutes today to scroll through your subscription history and cancel at least one unused app or channel.",
      riskLevel: "Moderate",
      tagline: "The Subscription Collector",
      icon: Tv,
      color: "#00FFC2",
      borderColor: "border-[#00FFC2]/30",
      bgColor: "bg-[#00FFC2]/5"
    },
    GenerousGiver: {
      title: "Generous Giver",
      oneLiner: "You love buying sweet gifts for family, treating your best friends, and helping out classmates in need.",
      recommendation: "It's wonderful to support others! Just make sure to fill your own budget boxes first before treating everyone around you.",
      riskLevel: "Moderate",
      tagline: "The Heart of Gold",
      icon: Heart,
      color: "#FF4D8C",
      borderColor: "border-[#FF4D8C]/30",
      bgColor: "bg-[#FF4D8C]/5"
    },
    TechCollector: {
      title: "Tech Collector",
      oneLiner: "You absolutely love to own the latest smartphone, cool mechanical keyboards, and shiny computer accessories.",
      recommendation: "Try looking for certified pre-owned or refurbished gear, and sell your old gadgets first to help cover upgrade costs.",
      riskLevel: "High",
      tagline: "The Gadget Lover",
      icon: Award,
      color: "#FFDF00",
      borderColor: "border-[#FFDF00]/30",
      bgColor: "bg-[#FFDF00]/5"
    },
    FoodieFanatic: {
      title: "Foodie Fanatic",
      oneLiner: "Gourmet dishes, quick delivery food, café runs, and snacks occupy a gold-medal territory in your wallet.",
      recommendation: "Try doing fun group cooking classes with friends. It cuts down café dining bills while being incredibly entertaining!",
      riskLevel: "Moderate",
      tagline: "The Flavor Explorer",
      icon: Utensils,
      color: "#00E38C",
      borderColor: "border-[#00E38C]/30",
      bgColor: "bg-[#00E38C]/5"
    }
  };

  const quizQuestions = [
    {
      question: "When you receive your monthly pocket money or a paycheck, what do you usually do first?",
      options: [
        { text: "Put a clean portion instantly into my savings box!", type: "SmartSaver" },
        { text: "Treat myself to a fun weekend trip, café date, or concert!", type: "ExperienceSeeker" },
        { text: "Browse online shops for trending items or cool accessories!", type: "ImpulsiveBuyer" },
        { text: "Map out my essential bills and planned purchases carefully.", type: "BalancedSpender" }
      ]
    },
    {
      question: "How do you feel about discount codes, clearance sales, and shopping coupons?",
      options: [
        { text: "I love them! I will search for hours to find a valid discount code.", type: "DealHunter" },
        { text: "They're nice, but I only buy things I had already planned to get.", type: "BalancedSpender" },
        { text: "I end up buying extra items just because they are marked 50% off!", type: "ImpulsiveBuyer" },
        { text: "I prefer paying for fast delivery over wasting time seeking coupons.", type: "ConvenienceShopper" }
      ]
    },
    {
      question: "What is that one category that secretly gobbles up most of your spending funds?",
      options: [
        { text: "Café visits, snack deliveries, coffee runs, and restaurant menus.", type: "FoodieFanatic" },
        { text: "Online memberships, video streaming channels, and app subscriptions.", type: "SilentSubscriber" },
        { text: "Buying nice gifts for my loved ones or treating friends.", type: "GenerousGiver" },
        { text: "New computer gear, gaming gadgets, or tech accessories.", type: "TechCollector" }
      ]
    }
  ];

  useEffect(() => {
    fetchTxs();
    fetchTips();
    fetchTrendAnalysis();
  }, []);

  const fetchTrendAnalysis = async () => {
    setTrendLoading(true);
    try {
      const data = await serpApiService.querySpendingTrends();
      setTrendData(data);
    } catch (e) {
      console.error("Failed to load spending trend analysis:", e);
    } finally {
      setTrendLoading(false);
    }
  };

  const fetchTips = async () => {
    setTipsLoading(true);
    try {
      const res = await fetch("/api/spending/insights");
      const data = await res.json();
      setTips(data.tips || []);
    } catch (e) {
      console.error("Failed to load live spending tips:", e);
      setTips([
        "Establish a 'Pocket Money Buffer' of **₹1,000** in your wallet structure that you never touch except for extreme emergencies.",
        "Leaving cart items for 72 hours before checking out cuts down impulse shopping in **Shopping** category by up to 60%!",
        "Your continuous subscription cost is active. Pruning just one minor entertainment channel raises your compound savings velocity."
      ]);
    } finally {
      setTipsLoading(false);
    }
  };

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryMetrics = () => {
    const categories: Record<string, number> = {
      Food: 0, Shopping: 0, Travel: 0, Bills: 0, Education: 0, Healthcare: 0, Entertainment: 0
    };
    let total = 0;
    transactions.forEach(tx => {
      if (categories[tx.category] !== undefined) {
        categories[tx.category] += tx.amount;
        total += tx.amount;
      }
    });

    return Object.keys(categories).map(cat => ({
      name: cat,
      amount: categories[cat],
      percent: total > 0 ? Math.round((categories[cat] / total) * 100) : 0
    })).sort((a,b) => b.amount - a.amount);
  };

  const evaluatePersonality = () => {
    if (quizResult && archetypes[quizResult]) {
      return archetypes[quizResult];
    }

    const metrics = getCategoryMetrics();
    const topCategory = metrics[0];

    if (!topCategory || topCategory.amount === 0) {
      return archetypes.BalancedSpender;
    }

    switch (topCategory.name) {
      case "Shopping":
        return topCategory.percent > 25 ? archetypes.ImpulsiveBuyer : archetypes.DealHunter;
      case "Food":
        return archetypes.FoodieFanatic;
      case "Entertainment":
        return archetypes.SilentSubscriber;
      case "Travel":
        return archetypes.ExperienceSeeker;
      case "Education":
        return archetypes.SmartSaver;
      case "Bills":
        return archetypes.ConvenienceShopper;
      default:
        return archetypes.BalancedSpender;
    }
  };

  const currentPersonality = evaluatePersonality();
  const IconComponent = currentPersonality.icon;

  const handleQuizAnswer = (type: string) => {
    const newAnswers = [...quizAnswers, type];
    setQuizAnswers(newAnswers);

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      const tallies: Record<string, number> = {};
      let maxType = type;
      let maxCount = 0;

      newAnswers.forEach(ans => {
        tallies[ans] = (tallies[ans] || 0) + 1;
        if (tallies[ans] > maxCount) {
          maxCount = tallies[ans];
          maxType = ans;
        }
      });

      setQuizResult(maxType);
      setQuizStep(quizStep + 1);
    }
  };

  const restartQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900">

      {/* Header section */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6 text-left">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5 bg-gradient-to-r from-white via-[#00C6FF] to-[#7B61FF] bg-clip-text text-transparent">
          <Smile className="h-6 w-6 text-[#00E38C]" /> Your Money Vibe
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">A simple, friendly way to understand your personal spending style, learn custom tricks to save, and take a quick personality quiz!</p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 p-1 dark:bg-white/5 bg-black/5 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${activeTab === "analysis" ? "bg-[#00C6FF] text-black" : "dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900"}`}
        >
          My Style Analysis
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${activeTab === "quiz" ? "bg-[#7B61FF] dark:text-white text-slate-900" : "dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900"}`}
        >
          Money Style Quiz
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "analysis" ? (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >

            {/* Dynamic Spend excess notification toggler */}
            <div className="lg:col-span-3 p-5 rounded-3xl dark:bg-[#0c1328] dark:bg-white/5 bg-black/50 border dark:border-white/5 border-black/5 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C6FF]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex gap-4 items-start relative z-10">
                <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                  spendAlertsEnabled 
                    ? "bg-[#00C6FF]/10 text-[#00C6FF] border border-[#00C6FF]/20" 
                    : "dark:bg-white/5 bg-black/5 dark:text-gray-400 text-slate-500 border dark:border-white/5 border-black/5"
                }`}>
                  <Bell className={`h-5 w-5 ${spendAlertsEnabled ? "animate-pulse text-[#00C6FF]" : ""}`} />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest dark:text-white text-slate-900 flex items-center gap-2">
                    Dynamic Category Excess Toggler
                    {spendAlertsEnabled && (
                      <span className="text-[10px] bg-emerald-500/10 text-[#00E38C] px-2 py-0.5 rounded-md font-sans font-bold border border-emerald-500/10">
                        ACTIVE MONITORING
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans mt-1 leading-relaxed">
                    Automatically alert via the Navbar bell system if spending in any category exceeds the 3-month rolling average by more than <strong className="text-[#00C6FF] font-mono">20%</strong>.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center shrink-0 relative z-10">
                <button
                  type="button"
                  onClick={handleToggleSpendAlerts}
                  disabled={toggleLoading}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    spendAlertsEnabled ? "bg-[#00C6FF]" : "dark:bg-white/10 bg-black/10"
                  } ${toggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      spendAlertsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Spotify Wrapped Card Design */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-0.5 rounded-3xl bg-gradient-to-tr from-[#00C6FF] via-[#7B61FF] to-[#FF4D8C] relative overflow-hidden group transition-all duration-300"
            >
              <div className="dark:bg-[#0c1328] bg-white/95 p-6 rounded-[22px] h-full flex flex-col justify-between relative text-left">
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#7B61FF]/10 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-[#00C6FF]/10 to-transparent blur-3xl pointer-events-none" />

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-mono dark:text-gray-400 text-slate-500 tracking-widest px-2.5 py-1 rounded dark:bg-white/5 bg-black/5 inline-block">YOUR MONEY VIBE STYLE</span>
                    {quizResult && (
                      <span className="text-[8px] font-bold text-[#00E38C] uppercase tracking-wider bg-[#00E38C]/10 px-2 py-0.5 rounded border border-[#00E38C]/20 flex items-center gap-1">
                        <Gift className="h-2 w-2" /> Quiz Match
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono dark:text-gray-500 text-slate-400 uppercase block tracking-wider mb-2">YOUR SPENDING PERSONALITY MATCH</span>
                    
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-16 w-16 rounded-2xl flex items-center justify-center p-[1px]" style={{ background: `linear-gradient(135deg, ${currentPersonality.color}, #070B16)` }}>
                        <div className="h-full w-full dark:bg-[#0c1328] bg-white rounded-[14px] flex items-center justify-center animate-pulse" style={{ color: currentPersonality.color }}>
                          <IconComponent className="h-8 w-8" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xl font-sans font-black tracking-tight block dark:text-white text-slate-900">{currentPersonality.title}</span>
                        <span className="text-[11px] font-mono font-medium block uppercase tracking-wider" style={{ color: currentPersonality.color }}>{currentPersonality.tagline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 block uppercase tracking-wider">YOUR SPENDING HABIT</span>
                      <p className="text-sm text-gray-200 mt-1 leading-relaxed font-sans">{currentPersonality.oneLiner}</p>
                    </div>

                    <div className="p-3.5 bg-white/[0.02] border dark:border-white/5 border-black/5 rounded-xl">
                      <span className="text-[9px] font-mono dark:text-gray-400 text-slate-500 block uppercase tracking-wider font-semibold">ADVISER RECOMMENDATION</span>
                      <p className="text-xs dark:text-gray-300 text-slate-600 mt-1 leading-relaxed font-sans">{currentPersonality.recommendation}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t dark:border-white/5 border-black/5 flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 block uppercase tracking-wider">ALERT RISK LEVEL</span>
                    <span className={`text-xs font-bold font-sans uppercase mt-0.5 inline-block px-2.5 py-0.5 rounded-full border ${
                      currentPersonality.riskLevel === "Low" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                      currentPersonality.riskLevel === "Moderate" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                    }`}>
                      {currentPersonality.riskLevel} Risk
                    </span>
                  </div>
                  
                  {quizResult && (
                    <button 
                      onClick={restartQuiz}
                      className="text-[10px] font-sans font-semibold dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Reset Quiz
                    </button>
                  )}
                </div>

              </div>
            </motion.div>

            {/* Quick categories stats */}
            <div className="p-6 rounded-3xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md lg:col-span-2 space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-sans font-bold dark:text-white text-slate-900 uppercase tracking-wider">Active Spending Folders</h3>
                  <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans">A clean breakdown of where your money went in plain, easy English.</p>
                </div>
                <span className="text-[9px] font-sans text-[#00C6FF] bg-[#00C6FF]/10 px-2.5 py-1 rounded-full font-bold">UPDATED LIVE</span>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs dark:text-gray-400 text-slate-500 gap-2 font-sans">
                  <Loader className="h-5 w-5 animate-spin text-[#00C6FF]" /> Calculating spends...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCategoryMetrics().map((cat, idx) => (
                    <motion.div 
                      key={cat.name} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="p-4 rounded-2xl dark:bg-[#0d1326] bg-slate-50/60 border dark:border-white/5 border-black/5 flex flex-col justify-between hover:dark:border-white/10 border-black/10 transition-colors"
                    >
                      <div className="flex justify-between items-center text-xs dark:text-gray-400 text-slate-500 font-sans">
                        <span className="font-semibold dark:text-white text-slate-900">{cat.name}</span>
                        <span className="font-mono text-[10px] dark:text-gray-400 text-slate-500">{cat.percent}% of total</span>
                      </div>
                      
                      <div className="mt-3.5 h-2 bg-slate-200/60 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-[#00C6FF] to-[#7B61FF]" 
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/[0.02]">
                        <span className="text-xs font-mono font-bold text-[#00C6FF]">₹{cat.amount.toLocaleString()}</span>
                        <span className="text-[9px] dark:text-gray-500 text-slate-400 font-sans uppercase">Total Spent</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Real-time Spending Trend Analyzer */}
            <div className="lg:col-span-3 p-6 rounded-3xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b dark:border-white/5 border-black/5 pb-4">
                <div>
                  <h3 className="text-sm font-sans font-extrabold dark:text-white text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C6FF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C6FF]"></span>
                    </span>
                    NEXUS Trend Intelligence Pulse
                  </h3>
                  <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans mt-0.5 font-medium">Comparing active June spendings against your 3-month rolling budget baseline via Gemini.</p>
                </div>
                <button
                  onClick={fetchTrendAnalysis}
                  disabled={trendLoading}
                  className="self-start sm:self-center text-[10px] font-mono font-bold uppercase text-[#00C6FF] hover:text-[#7B61FF] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 px-3 py-1.5 rounded-lg border dark:border-white/5 border-black/5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {trendLoading ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span>Recalculate Trend</span>
                </button>
              </div>

              {trendLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-xs dark:text-gray-400 text-slate-500 gap-3 font-sans">
                  <Loader className="h-8 w-8 animate-spin text-[#00C6FF]" />
                  <span className="animate-pulse font-medium dark:text-gray-400 text-slate-500">Consulting Gemini spending trend analyzer...</span>
                </div>
              ) : trendData ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left block - KPI summary & 4-Month histogram bars */}
                  <div className="md:col-span-5 dark:bg-[#0c1328] bg-white/60 border dark:border-white/5 border-black/5 rounded-2xl p-5 flex flex-col justify-between space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/[0.01] border dark:border-white/5 border-black/5 rounded-xl">
                        <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase tracking-widest block font-bold">Active Spend (June)</span>
                        <span className="text-lg font-mono font-bold dark:text-white text-slate-900 mt-1 block">₹{trendData.currentMonthSpend?.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-white/[0.01] border dark:border-white/5 border-black/5 rounded-xl">
                        <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase tracking-widest block font-bold">3-Mo Rolling Avg</span>
                        <span className="text-lg font-mono font-bold dark:text-gray-300 text-slate-600 mt-1 block">₹{Math.round(trendData.threeMonthRollingAverage || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl p-4 border bg-gradient-to-r from-white/[0.01] to-white/[0.03] flex items-center justify-between gap-4"
                         style={{ borderColor: trendData.statusColor === "red" ? "rgba(255, 77, 77, 0.2)" : trendData.statusColor === "yellow" ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 227, 140, 0.2)" }}>
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase block tracking-wider font-extrabold">Status Index</span>
                        <span className="text-[11px] font-sans font-bold text-gray-200 block leading-snug">{trendData.summary}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 border ${
                        trendData.statusColor === "red" ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" :
                        trendData.statusColor === "yellow" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/20"
                      }`}>
                        {trendData.varianceLabel}
                      </span>
                    </div>

                    {/* Mini-Histogram */}
                    <div className="space-y-2 text-left">
                      <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase block tracking-wider font-extrabold">4-Month Expenditure Timeline</span>
                      <div className="flex items-end justify-between gap-2.5 pt-4 px-2">
                        {Object.entries(trendData.comparisonHistory || {}).reverse().map(([monthName, value]: any) => {
                          const maxValue = Math.max(...Object.values(trendData.comparisonHistory || { June: 1 }) as any);
                          const heightPct = maxValue > 0 ? (value / maxValue) * 80 : 0;
                          const isCurrent = monthName.startsWith("June");
                          return (
                            <div key={monthName} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                              <span className="text-[9px] font-mono font-bold text-[#00C6FF] opacity-0 group-hover:opacity-100 transition-all">₹{Math.round(value/1000)}k</span>
                              <motion.div 
                                className="w-full rounded-t-md relative"
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(10, heightPct)}px` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                style={{ 
                                  background: isCurrent 
                                    ? "linear-gradient(185deg, #00C6FF, #7B61FF)" 
                                    : "rgba(255, 255, 255, 0.08)"
                                }}>
                                {isCurrent && (
                                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-[#00C6FF]" />
                                )}
                              </motion.div>
                              <span className={`text-[9px] font-sans font-semibold tracking-tight uppercase ${isCurrent ? 'text-[#00C6FF]' : 'dark:text-gray-500 text-slate-400'}`}>
                                {monthName.split(" ")[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Right block - Category comparative percentages & Dynamic Gemini Insights */}
                  <div className="md:col-span-7 space-y-6 flex flex-col justify-between text-left">
                    <div className="space-y-3.5">
                      <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase block tracking-wider font-extrabold">Folder Variances (Vs Group Baseline)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {trendData.categoryComparison?.slice(0, 4).map((c: any) => {
                          const currentVal = typeof c.currentAmount === 'number' ? c.currentAmount : (c.current ?? 0);
                          const averageVal = typeof c.averageAmount === 'number' ? c.averageAmount : (c.previous ?? 0);
                          const varianceVal = typeof c.differencePercent === 'number' 
                            ? c.differencePercent 
                            : (averageVal > 0 ? Math.round(((currentVal - averageVal) / averageVal) * 100) : 0);
                          const isOver = varianceVal > 0;
                          
                          return (
                            <div key={c.category} className="p-3 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 flex items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <span className="font-semibold dark:text-white text-slate-900 block">{c.category}</span>
                                <span className="text-[9px] dark:text-gray-400 text-slate-500 font-mono block">₹{currentVal.toLocaleString()} vs avg ₹{averageVal.toLocaleString()}</span>
                              </div>
                              <span className={`text-[9.5px] font-mono font-bold shrink-0 ${isOver ? 'text-red-400' : varianceVal < 0 ? 'text-[#00E38C]' : 'dark:text-gray-400 text-slate-500'}`}>
                                {isOver ? "▲" : varianceVal < 0 ? "▼" : ""} {Math.abs(varianceVal)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-tr from-[#7B61FF]/5 to-[#00C6FF]/5 border border-white/[0.06] space-y-3 relative overflow-hidden flex-1 flex flex-col justify-center">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C6FF]/5 rounded-full blur-2xl pointer-events-none" />
                      <span className="text-[9px] font-mono text-[#00C6FF] tracking-wider uppercase block font-extrabold flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-[#00C6FF] animate-pulse" /> Gemini Real-Time Trend Diagnostics
                      </span>
                      <div className="space-y-2.5">
                        {trendData.insights?.map((insight: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed dark:text-gray-300 text-slate-600">
                            <span className="h-4.5 w-4.5 rounded-full dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 text-[9px] font-mono dark:text-gray-400 text-slate-500 flex items-center justify-center shrink-0 border dark:border-white/5 border-black/5 mt-0.5 font-bold">
                              {idx + 1}
                            </span>
                            <p className="font-sans">
                              {renderFormattedText(insight)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-8 text-center text-xs dark:text-gray-400 text-slate-500">
                  Failed to retrieve analysis. Click Recalculate to try again.
                </div>
              )}
            </div>

          </motion.div>
        ) : (
          /* The Money Vibe Quiz */
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto p-8 rounded-3xl dark:bg-[#0c1328] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#7B61FF]/5 to-transparent blur-3xl pointer-events-none" />

            {quizStep < quizQuestions.length ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#7B61FF] font-semibold uppercase">MONEY QUIZ • QUESTION {quizStep + 1} OF {quizQuestions.length}</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(stepIndex => (
                      <div 
                        key={stepIndex} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          stepIndex === quizStep ? "bg-[#7B61FF] w-4" : "dark:bg-white/10 bg-black/10 w-1.5"
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-sans font-bold dark:text-white text-slate-900 tracking-tight leading-snug">
                  {quizQuestions[quizStep].question}
                </h3>

                <div className="space-y-3.5 pt-2">
                  {quizQuestions[quizStep].options.map((opt, optIdx) => (
                    <motion.button
                      key={optIdx}
                      whileHover={{ scale: 1.01, border: "1px solid rgba(123, 97, 255, 0.4)", backgroundColor: "rgba(123, 97, 255, 0.05)" }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleQuizAnswer(opt.type)}
                      className="w-full p-4 rounded-xl border dark:border-white/5 border-black/5 dark:bg-[#070B16] bg-slate-50 text-left text-xs font-medium dark:text-gray-300 text-slate-600 hover:dark:text-white text-slate-900 transition-all duration-200 cursor-pointer flex items-center gap-3 group"
                    >
                      <span className="h-6 w-6 rounded-lg dark:bg-white/5 bg-black/5 group-hover:bg-[#7B61FF]/10 text-[10px] font-mono dark:text-gray-400 text-slate-500 group-hover:dark:text-white text-slate-900 flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed font-sans">{opt.text}</span>
                    </motion.button>
                  ))}
                </div>

              </div>
            ) : (
              /* Quiz Results block */
              <div className="text-center space-y-6 py-6">
                <div className="h-14 w-14 rounded-full bg-[#00E38C]/15 border border-[#00E38C]/20 flex items-center justify-center mx-auto text-[#00E38C]">
                  <Check className="h-6 w-6" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-sans font-black tracking-tight dark:text-white text-slate-900">Your results are ready!</h3>
                  <p className="text-xs dark:text-gray-400 text-slate-500 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                    We compiled your answers and matched them perfectly to your unique Spending Archetype.
                  </p>
                </div>

                {quizResult && archetypes[quizResult] && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className={`p-6 rounded-2xl border text-left max-w-md mx-auto ${archetypes[quizResult].borderColor} ${archetypes[quizResult].bgColor} space-y-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center dark:text-white text-slate-900 shrink-0" style={{ color: archetypes[quizResult].color }}>
                        {(() => {
                          const ItemIcon = archetypes[quizResult].icon;
                          return <ItemIcon className="h-5 w-5" />;
                        })()}
                      </div>
                      <div>
                        <span className="text-[9px] font-mono dark:text-gray-400 text-slate-500 uppercase tracking-widest block leading-none">YOUR PERSONALITY MATCH</span>
                        <span className="text-lg font-sans font-extrabold dark:text-white text-slate-900 block mt-1">{archetypes[quizResult].title}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-200 font-sans leading-relaxed">
                      {archetypes[quizResult].oneLiner}
                    </p>

                    <div className="p-3 dark:bg-[#0c1328] bg-white/80 border dark:border-white/5 border-black/5 rounded-xl">
                      <span className="text-[9px] font-mono text-[#00C6FF] font-semibold uppercase block">ADVICE PREVIEW</span>
                      <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans mt-0.5 leading-relaxed">{archetypes[quizResult].recommendation}</p>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4 flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setActiveTab("analysis");
                      setQuizStep(0);
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] dark:text-white text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    View My Profile Analysis
                  </button>
                  <button
                    onClick={restartQuiz}
                    className="px-4 py-2 rounded-xl border dark:border-white/10 border-black/10 hover:dark:bg-white/5 bg-black/5 dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 text-xs font-semibold font-sans transition-colors cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spending Tips block */}
      <div className="p-6 rounded-3xl bg-[#080d1a]/85 border dark:border-white/5 border-black/5 backdrop-blur-xl space-y-4 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E38C]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00E38C] animate-pulse" /> NEXUS AI Spending Advice
          </h3>
          <button 
            onClick={fetchTips}
            disabled={tipsLoading}
            className="text-[9px] font-mono font-bold uppercase text-[#00C6FF] hover:text-[#7B61FF] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 px-2.5 py-1 rounded-lg border dark:border-white/5 border-black/5 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {tipsLoading ? (
              <Loader className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <RefreshCw className="h-2.5 w-2.5" />
            )}
            <span>Refresh AI</span>
          </button>
        </div>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans">A personalized suite of financial strategies generated on-demand matching your transactions and active folders:</p>

        {tipsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs dark:text-gray-400 text-slate-500 gap-2 font-sans">
            <Loader className="h-5 w-5 animate-spin text-[#00C6FF]" /> Running Spend Optimizer...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tips.map((tip, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -3, border: "1px solid rgba(0, 227, 140, 0.3)" }}
                className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 flex items-start gap-3 hover:dark:border-white/10 border-black/10 transition-all duration-300"
              >
                <div className="h-7 w-7 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0 text-[#00E38C] text-xs font-bold font-mono">
                  0{idx + 1}
                </div>
                <span className="text-xs dark:text-gray-300 text-slate-600 leading-relaxed font-sans">{renderFormattedText(tip)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
