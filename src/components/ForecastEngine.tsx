import { useState, useEffect } from "react";
import { User } from "../types";
import { 
  TrendingUp, TrendingDown, HelpCircle, Sparkles, AlertTriangle, 
  CheckCircle2, LineChart as ChartIcon, Gauge, Loader, Info
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell 
} from "recharts";

interface ForecastEngineProps {
  user: User;
}

export default function ForecastEngine({ user }: ForecastEngineProps) {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [healthText, setHealthText] = useState("");
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  // Analytical stats derived
  const overspends = forecastData.map(d => d.overspentProb) || [];
  const maxOverspendRate = overspends.length > 0 ? Math.max(...overspends) : 45;

  useEffect(() => {
    fetchProjections();
  }, [user.role, user.balance]);

  const fetchProjections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/forecast/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: user.role,
          currentBalance: user.balance
        })
      });
      const data = await res.json();
      setForecastData(data.forecastData || []);
      setHealthText(data.healthText || "");
      setBudgetWarning(data.studentBudgetWarning || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900">
      
      {/* Page Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
          <TrendingUp className="h-6 w-6 text-[#7B61FF]" /> My Budget Forecast
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">Predicting your monthly spending, budget limits, and saving indicators for the next six months.</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader className="h-8 w-8 text-[#7B61FF] animate-spin" />
          <span className="font-sans text-xs uppercase animate-pulse">Calculating savings and budget predictions...</span>
        </div>
      ) : (
        <>
          {/* Main Forecast Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
            {/* Overspending Probability status */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] uppercase dark:text-gray-400 text-slate-500 font-sans flex items-center gap-1"><Gauge className="h-3 ml-0.5" /> OVERSPEND WARNINGS</span>
                <h3 className="font-sans font-bold text-lg dark:text-white text-slate-900">Chances of going over budget</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl font-mono font-extrabold text-[#7B61FF]">{maxOverspendRate}%</span>
                  <span className="text-xs dark:text-gray-500 text-slate-400 font-sans uppercase font-bold">POSSIBLE SPIKES</span>
                </div>
                <p className="text-xs dark:text-gray-400 text-slate-500 leading-normal font-sans">
                  Usually occurs during dynamic leisure transactions or premium weekend shopping bills.
                </p>
              </div>
 
              {/* Mini Status line */}
              <div className="w-full dark:bg-white/5 bg-black/5 h-2 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-gradient-to-r from-[#7B61FF] to-[#FF4D4D]" style={{ width: `${maxOverspendRate}%` }} />
              </div>
            </div>
 
            {/* Student or Pro Budget Limit Warning */}
            {user.role === "student" ? (
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/10 backdrop-blur-md flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase text-[#FF4D4D] font-sans flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 animate-bounce" /> BUDGET ALERT
                  </span>
                  <h3 className="font-sans font-bold text-lg dark:text-white text-slate-900">Budget Limit Warning</h3>
                  <p className="text-xs dark:text-gray-300 text-slate-600 leading-relaxed font-sans">{budgetWarning || "Trajectory indicates student allowance could fully expire exactly 8 days before end-of-semester billing."}</p>
                </div>
                
                <div className="text-[11px] font-sans dark:text-gray-400 text-slate-500 bg-red-950/40 border border-red-500/10 p-3 rounded-lg leading-snug">
                  <strong>Expected Overdraft:</strong> ₹1,300<br />
                  <strong>Recommended Saving Tips:</strong> Keep plans on check & limit food delivery orders.
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/10 backdrop-blur-md flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase text-[#FF4D4D] font-sans flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-[#FF4D4D]" /> BUDGET LIMIT WARNING
                  </span>
                  <h3 className="font-sans font-bold text-lg dark:text-white text-slate-900">Budget Limit Warning</h3>
                  <p className="text-xs dark:text-gray-300 text-slate-600 leading-relaxed font-sans">
                    Your spending velocity indicates a mild risk of exceeding the predefined ₹12,000 professional discretionary threshold on dynamic transactions.
                  </p>
                </div>
                
                <div className="text-[11px] font-sans dark:text-gray-400 text-slate-500 bg-red-950/20 border border-red-500/10 p-3 rounded-lg leading-snug">
                  <strong>Expected Risk:</strong> Overspending on premium restaurant bills & weekend shopping<br />
                  <strong>Action Plan:</strong> Set dynamic limit locks on luxury categories to secure high credit health.
                </div>
              </div>
            )}
 
          </div>

          {/* Futuristic Area charts showing Future Expense vs Proactive Savings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md lg:col-span-2">
              <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase mb-6 flex items-center gap-2">
                <ChartIcon className="h-4 w-4 text-[#7B61FF]" /> Expected Spending vs Savings Goals (₹)
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7B61FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSav" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E38C" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00E38C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0c1328", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Estimated Spending" dataKey="expenses" stroke="#7B61FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                    <Area type="monotone" name="Expected Savings" dataKey="savings" stroke="#00E38C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSav)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overspending peak bar chart */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md">
              <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase mb-6">
                Monthly Overbudget Risk (%)
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <YAxis unit="%" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0c1328", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar name="Risk Indicator" dataKey="overspentProb" fill="#FF4D4D" radius={[6, 6, 0, 0]}>
                      {forecastData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.overspentProb > 45 ? "#FF4D4D" : "#7B61FF"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
