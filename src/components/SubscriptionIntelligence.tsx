import { useState, useEffect } from "react";
import { 
  Sparkles, ShieldCheck, Trash2, ArrowUpRight, ShieldAlert,
  Loader, RefreshCw, Layers, CheckCircle2, ChevronRight, HelpCircle
} from "lucide-react";
import { Subscription } from "../types";

export default function SubscriptionIntelligence() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCancels, setActiveCancels] = useState<Record<string, boolean>>({});
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newInterval, setNewInterval] = useState<"monthly" | "yearly">("monthly");
  const [newCategory, setNewCategory] = useState("Entertainment");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", { credentials: 'include' });
      const data = await res.json();
      setSubs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    setFormError(null);
    setSuccessMessage(null);
    if (!newName.trim() || !newCost.trim() || Number(newCost) <= 0) {
      setFormError("Please provide a valid subscription name and monthly cost.");
      return;
    }

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          cost: Number(newCost),
          billing_interval: newInterval,
          category: newCategory
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || `Request failed with status ${res.status}`);
      }

      setSubs(prev => [data, ...prev]);
      setNewName("");
      setNewCost("");
      setNewInterval("monthly");
      setNewCategory("Entertainment");
      setSuccessMessage("Subscription created and saved successfully.");
    } catch (error: any) {
      setFormError(error?.message || "Unable to create subscription.");
      console.error(error);
    }
  };

  // Calculations
  const activeSubs = subs.filter(s => !activeCancels[s.id]);
  const monthlyCost = activeSubs.reduce((sum, s) => {
    const cost = typeof s.cost === 'string' ? parseFloat(s.cost) : (s.cost || 0);
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);
  const annualCost = monthlyCost * 12;
  const totalSavingsPotential = activeSubs.reduce((sum, s) => {
    const savings = typeof s.savingsPotential === 'string' ? parseFloat(s.savingsPotential) : (s.savingsPotential || 0);
    return sum + (isNaN(savings) ? 0 : savings);
  }, 0);

  const toggleCancel = (subId: string) => {
    setActiveCancels(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900">

      {/* Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
          <Layers className="h-6 w-6 text-[#FF9F43]" /> My Subscription Tracker
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">Easily track recurring bills, find subscriptions you forgot about, and see where you can save.</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader className="h-6 w-6 animate-spin text-[#FF9F43]" />
          <span className="font-sans text-xs uppercase animate-pulse">Loading subscriptions...</span>
        </div>
      ) : (
        <>
          {/* Top Calculations Counters widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md">
              <span className="text-[10px] uppercase dark:text-gray-500 text-slate-400 font-sans">Monthly Subscriptions</span>
              <div className="text-3xl font-mono font-extrabold dark:text-white text-slate-900 mt-1.5">₹{monthlyCost.toLocaleString()}</div>
              <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans mt-2">Active plans: {activeSubs.length}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md">
              <span className="text-[10px] uppercase dark:text-gray-500 text-slate-400 font-sans">Projected Yearly Cost</span>
              <div className="text-3xl font-mono font-bold text-[#FF9F43] mt-1.5">₹{annualCost.toLocaleString()}</div>
              <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans mt-2">Yearly cost based on your current plans.</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-tr from-[#00E38C]/15 to-transparent border border-[#00E38C]/20 backdrop-blur-md">
              <span className="text-[10px] uppercase text-[#00E38C] font-sans">Potential Yearly Savings</span>
              <div className="text-3xl font-mono font-extrabold text-[#00E38C] mt-1.5">₹{(totalSavingsPotential * 12).toLocaleString()}</div>
              <p className="text-[11px] text-[#00E38C]/80 font-sans mt-2">Save easily by shifting to smarter, cheaper plans.</p>
            </div>

          </div>

          <div className="p-6 rounded-2xl dark:bg-[#0d1326] bg-slate-50 border dark:border-white/5 border-black/5 mb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold dark:text-white text-slate-900">Create New Subscription</h3>
                <p className="text-xs dark:text-gray-400 text-slate-500 mt-1">Add a recurring subscription and save it into the database.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Subscription Name"
                className="w-full p-3 rounded-xl dark:bg-[#070B16] bg-slate-50 border dark:border-white/5 border-black/5 dark:text-white text-slate-900 text-sm"
              />
              <input
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Monthly Cost"
                type="number"
                min="0"
                className="w-full p-3 rounded-xl dark:bg-[#070B16] bg-slate-50 border dark:border-white/5 border-black/5 dark:text-white text-slate-900 text-sm"
              />
              <select
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value as "monthly" | "yearly")}
                className="w-full p-3 rounded-xl dark:bg-[#070B16] bg-slate-50 border dark:border-white/5 border-black/5 dark:text-white text-slate-900 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category"
                className="w-full p-3 rounded-xl dark:bg-[#070B16] bg-slate-50 border dark:border-white/5 border-black/5 dark:text-white text-slate-900 text-sm"
              />
            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {formError}
              </div>
            )}
            {successMessage && (
              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-200">
                {successMessage}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <button
                onClick={createSubscription}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] text-black font-bold text-sm"
              >
                Add Subscription
              </button>
              <button
                onClick={fetchSubs}
                className="px-5 py-3 rounded-2xl border dark:border-white/10 border-black/10 text-xs dark:text-white text-slate-900 dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 transition"
              >
                Refresh List
              </button>
            </div>
          </div>

          {/* Subscriptions Grid Ledger */}
          <div className="p-6 rounded-2xl dark:bg-[#0c1328] bg-white border dark:border-white/5 border-black/5">
            <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase mb-6">
              Active Subscriptions & Save Simulator
            </h3>

            <div className="space-y-4">
              {subs.map(sub => {
                const isCancelled = activeCancels[sub.id];
                return (
                  <div 
                    key={sub.id} 
                    className={`p-5 rounded-xl border transition-all ${
                      isCancelled 
                        ? "bg-red-950/10 border-red-500/15 opacity-40" 
                        : "dark:bg-[#0d1326] bg-slate-50 dark:border-white/5 border-black/5 hover:dark:border-white/10 border-black/10"
                    } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isCancelled ? "bg-red-500/10 text-red-400" : "bg-[#FF9F43]/10 text-[#FF9F43]"
                      }`}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-sans font-bold text-sm ${isCancelled ? "line-through dark:text-gray-500 text-slate-400" : "dark:text-white text-slate-900"}`}>
                            {sub.name}
                          </h4>
                          <span className="text-[10px] font-sans dark:bg-white/5 bg-black/5 px-2 py-0.5 rounded dark:text-gray-400 text-slate-500 uppercase">
                            {sub.category}
                          </span>
                        </div>
                        <p className="text-xs dark:text-gray-400 text-slate-500 leading-relaxed font-sans">{sub.recommendation}</p>
                      </div>
                    </div>

                    {/* Costing on right */}
                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right font-mono">
                        <span className="text-sm font-semibold block dark:text-white text-slate-900">₹{sub.cost}/mo</span>
                        <span className="text-[10px] dark:text-gray-500 text-slate-400 block">₹{sub.cost * 12}/yr</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCancel(sub.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                            isCancelled 
                              ? "dark:bg-white/5 bg-black/5 border border-transparent dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" 
                              : "bg-red-500/10 border border-red-500/20 text-[#FF4D4D] hover:bg-red-500/20"
                          }`}
                        >
                          {isCancelled ? "Keep Plan" : "Simulate Cancel"}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Advisory recommendations box */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5">
        <div className="flex gap-4 items-start text-xs">
          <CheckCircle2 className="h-5 w-5 text-[#00E38C] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-sans font-bold dark:text-white text-slate-900 uppercase">Subscription Savings Suggestions</h4>
            <p className="dark:text-gray-400 text-slate-500 leading-relaxed font-sans">
              We recommend checking movie, music, and software bills. Simulating cancellations on services ones you don't use often, or converting monthly payments to yearly deals can save you up to 45% on subscription costs. Try playing with the Simulator buttons above to preview safe cancel adjustments!
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
