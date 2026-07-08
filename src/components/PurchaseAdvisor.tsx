import React, { useState } from "react";
import { 
  Sparkles, HelpCircle, BadgeCheck, AlertTriangle, ArrowRight,
  TrendingDown, ShoppingCart, Loader, DollarSign, Info, Cpu 
} from "lucide-react";
import { PurchaseReport } from "../types";
import { serpApiService } from "../services/api";

export default function PurchaseAdvisor() {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PurchaseReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !price) return;
    setLoading(true);
    setError(null);

    try {
      const data = await serpApiService.queryGoogleShopping(productName, price, purpose);
      console.log('PurchaseAdvisor response', data);
      setReport(data);
    } catch (err: any) {
      console.error('PurchaseAdvisor error', err);
      setError(err?.message || "Failed to analyze purchase affordability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900 font-sans">
      
      {/* Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
          <ShoppingCart className="h-6 w-6 text-[#00C6FF]" /> AI DISCRETIONARY PURCHASE ADVISOR
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-mono mt-1 uppercase">Pre-spending asset impact evaluation • Auditing affordability, savings vectors, and goal horizons.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Input parameters form */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00C6FF]" /> AUDIT DISCRETIONARY Outlay
          </h3>
          <p className="text-xs dark:text-gray-400 text-slate-500 leading-relaxed font-sans">
            Nexus evaluates the catalog cost against goals, cash reserves, and searches alternative portals to prevent impulse buying wastage.
          </p>

          <form onSubmit={handleAudit} className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Product Model Name</label>
              <input
                type="text" required value={productName} onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Sony WH-1000XM5, iPad Pro"
                className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#00C6FF] transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Catalog Price (₹)</label>
              <input
                type="number" required value={price} onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 29999"
                className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#00C6FF] transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Core Purchase Purpose</label>
              <textarea
                required value={purpose} onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Daily coding focus / online classes lectures music listening"
                rows={3}
                className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#00C6FF] transition-all resize-none"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#00C6FF] text-black font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin text-black" />
              ) : (
                <>
                  <Cpu className="h-4 w-4" /> Analyze Purchase Affordability
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit result reports paper */}
        <div className="lg:col-span-2 p-6 rounded-2xl dark:bg-[#0c1328] bg-white border dark:border-white/5 border-black/5 space-y-6">
          <h3 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase">
            AUDIT DECISION FILE & COMPARATIVE CHANNELS
          </h3>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="h-4 w-4 text-[#FF4D4D] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Analysis Interrupted</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3">
              <Loader className="h-8 w-8 text-[#00C6FF] animate-spin" />
              <span className="font-mono text-xs uppercase animate-pulse">Running liquidity projection matrices...</span>
            </div>
          ) : report ? (
            <div className="space-y-6 animate-fade-in">

              {/* Header metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b dark:border-white/5 border-black/5 pb-4">
                <div className="text-center p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5">
                  <span className="text-[10px] font-mono dark:text-gray-500 text-slate-400 uppercase block">Affordability Score</span>
                  <span className={`text-4xl font-mono font-extrabold ${report.score > 75 ? "text-[#00E38C]" : report.score > 45 ? "text-[#FF9F43]" : "text-[#FF4D4D]"}`}>
                    {report.score}/100
                  </span>
                  <span className="text-[9px] uppercase font-mono dark:text-gray-400 text-slate-500 block mt-1.5">
                    {report.score > 75 ? "BUY APPROVED" : "HOLD ADVISED"}
                  </span>
                </div>
                
                <div className="col-span-2 space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase">Affordability Verdict:</span>
                    <p className="dark:text-gray-300 text-slate-600 font-medium">{report.affordability}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase">Savings Vector Impact:</span>
                    <p className="dark:text-gray-400 text-slate-500">{report.savingsImpact}</p>
                  </div>
                </div>
              </div>

              {/* Goal effect and Advisor recomendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 space-y-1.5">
                  <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase block">LOCKED GOALS REPERCUSSION</span>
                  <p className="dark:text-gray-300 text-slate-600 leading-relaxed">{report.goalImpact}</p>
                </div>
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/10 space-y-1.5">
                  <span className="text-[10px] font-mono text-[#00C6FF] uppercase block flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-pulse" /> ADVISOR DIRECT PROTOCOL
                  </span>
                  <p className="dark:text-gray-300 text-slate-600 leading-relaxed font-sans">{report.aiRecommendation}</p>
                </div>
              </div>

              {/* Alternative items google shopping table */}
              {report.alternatives && report.alternatives.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 space-y-3">
                  <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase block">SerpAPI Shopping comparative models</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.alternatives.map((alt, i) => (
                      <div key={i} className="p-3 rounded-lg dark:bg-[#0d1326] bg-slate-50 border dark:border-white/5 border-black/5 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold dark:text-white text-slate-900 block">{alt.name}</span>
                          <span className="text-[10px] dark:text-gray-500 text-slate-400 font-mono mt-0.5">Google Shopping Listing</span>
                        </div>
                        <span className="font-mono font-bold text-[#00E38C]">
                          ₹{typeof alt.price === 'number' ? alt.price.toLocaleString() : alt.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-72 border border-dashed dark:border-white/5 border-black/5 rounded-xl flex flex-col items-center justify-center text-center text-xs dark:text-gray-500 text-slate-400 px-6 gap-2">
              <Info className="h-6 w-6 text-gray-600" />
              Specify discretionary product details on the left parameters panel to compute financial repercussions.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
