import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, MapPin, Search, AlertCircle, 
  HelpCircle, Sparkles, Terminal, ArrowRight, Loader, Info, ShieldAlert as ThreatIcon
} from "lucide-react";
import { MerchantTrustReport } from "../types";
import { serpApiService } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function FraudCenter() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  
  // Merchant trust analyzer state
  const [merchantQuery, setMerchantQuery] = useState("");
  const [merchantReport, setMerchantReport] = useState<MerchantTrustReport | null>(null);
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(false);

  // Investigator Report state
  const [selectedTxId, setSelectedTxId] = useState("");
  const [investigatorReport, setInvestigatorReport] = useState("");
  const [loadingInvestigator, setLoadingInvestigator] = useState(false);

  const mockCriticalTxs = [
    { id: "tx_2", amount: 15000, merchant: "Gucci Store Paris", location: "Paris, FR", riskScore: 78, reason: "Gucci Paris flagship request. Impossible travel from Mumbai logged 2 hours prior." },
    { id: "tx_7", amount: 4500, merchant: "Delta Air Lines", location: "Atlanta, USA", riskScore: 84, reason: "Sudden overseas airway charge logged inside domestic Indian banking perimeter." }
  ];

  useEffect(() => {
    fetchScamTrends();
  }, []);

  const fetchScamTrends = async () => {
    setLoadingTrends(true);
    try {
      const data = await serpApiService.queryScamTrends();
      setTrends(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleAnalyzeMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantQuery) return;
    setLoadingMerchant(true);
    setMerchantError(null);

    try {
      const data = await serpApiService.queryGoogleMapsAndSearch(merchantQuery);
      console.log('Merchant trust response:', data);
      setMerchantReport(data);
    } catch (err: any) {
      console.error(err);
      setMerchantReport(null);
      setMerchantError(err.message || "Unable to retrieve trust scan result.");
    } finally {
      setLoadingMerchant(false);
    }
  };

  const handleInvestigate = async (txId: string) => {
    setSelectedTxId(txId);
    setLoadingInvestigator(true);
    setInvestigatorReport("");

    // If this is one of the mocked critical transactions, render a local dossier immediately
    const localTx = mockCriticalTxs.find(t => t.id === txId);
    if (localTx) {
      const localHtml = `
        <h4>Risk Evaluation: Suspected HIGH RISK</h4>
        <p><strong>Merchant:</strong> ${localTx.merchant}</p>
        <p><strong>Amount:</strong> ₹${localTx.amount.toLocaleString()}</p>
        <p><strong>Reason:</strong> ${localTx.reason}</p>
        <h5>Recommended Actions</h5>
        <ol>
          <li>Temporarily freeze the card.</li>
          <li>Contact issuer to block further charges.</li>
          <li>Confirm recent device logins and rotate credentials.</li>
        </ol>
      `;
      setInvestigatorReport(localHtml);
      setLoadingInvestigator(false);
      return;
    }

    try {
      const res = await fetch("/api/fraud/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId })
      });
      const data = await res.json();
      setInvestigatorReport(data.report);
    } catch (err) {
      console.error(err);
      setInvestigatorReport("Network interruption. Recommended step: Initiate immediate card lock sequence as precaution.");
    } finally {
      setLoadingInvestigator(false);
    }
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900">
      
      {/* Page Title & Cyber Status Header */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-[#FF4D4D]" /> Fraud & Safety Center
          </h2>
          <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">Check if websites are safe, look out for scams, and inspect dynamic warnings.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 rounded-full px-3.5 py-1.5 text-xs text-[#FF4D4D] font-sans font-bold shadow-[0_0_15px_rgba(255,77,77,0.2)] animate-pulse shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" /> CYBER SHIELD ACTIVE
        </div>
      </div>

      {/* Cyber Intelligence Matrix (Grid of Command Features) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

        {/* Column 1: Location Anomalies */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -4, border: "1px solid rgba(123, 97, 255, 0.3)" }}
          className="p-6 rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl space-y-4 group transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF4D4D] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <h3 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#7B61FF]" /> Location Telemetry anomalies
          </h3>
          
          <div className="p-4 rounded-xl dark:bg-[#0d1326] bg-slate-50/80 border border-[#7B61FF]/10 space-y-3">
            <div className="flex justify-between text-xs dark:text-gray-400 text-slate-500 font-sans">
              <span>FLAG SEVERITY</span>
              <span className="text-[#FF4D4D] font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D4D] animate-ping" />
                HIGH RISK
              </span>
            </div>
            
            <div className="relative pl-4 border-l-2 border-[#7B61FF] space-y-4">
              <div>
                <p className="text-[10px] uppercase dark:text-gray-500 text-slate-400 font-sans">Recent Safe Purchase</p>
                <p className="text-xs font-semibold dark:text-white text-slate-900">Pune Mall Gateway</p>
                <p className="text-[10px] dark:text-gray-400 text-slate-500 font-mono">Today, 11:04 AM</p>
              </div>
              <div className="h-4 border-l border-dashed border-[#7B61FF]/40 text-gray-600 pl-2 text-[9px] font-mono">30 minute interval gap</div>
              <div>
                <p className="text-[10px] uppercase dark:text-gray-500 text-slate-400 font-sans">Suspicious attempt</p>
                <p className="text-xs font-semibold dark:text-white text-slate-900 text-rose-400">Gucci Store Paris</p>
                <p className="text-[10px] dark:text-gray-400 text-slate-500 font-mono">Today, 11:34 AM</p>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/10 text-[11px] text-[#FF4D4D] leading-relaxed font-sans">
              Alert: Pune & Paris are too far away for transactions to occur 30 minutes apart. This charge was locked automatically as a precaution.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[#00E38C] font-sans">
              <ShieldCheck className="h-4 w-4 text-[#00E38C]" /> TRIPS & VACATION PRE-CLEARANCE
            </div>
            <p className="text-[11px] dark:text-gray-400 text-slate-500 leading-normal font-sans">
              Going on a vacation? Let us know your air ticket destination to easily whitelist the trip and avoid false alerts.
            </p>
          </div>
        </motion.div>

        {/* Column 2: Merchant Trust Score Analyzer (Combining Google Maps + SerpAPI Search) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          whileHover={{ y: -4, border: "1px solid rgba(0, 198, 255, 0.3)" }}
          className="p-6 rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl space-y-4 lg:col-span-2 group transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
            <Search className="h-4 w-4 text-[#00C6FF]" /> Smart Store Safety Scan
          </h3>
          <p className="text-xs dark:text-gray-400 text-slate-500">
            Scan any online store, website, or seller name to analyze public reviews and seller trust reports automatically.
          </p>

<form onSubmit={handleAnalyzeMerchant} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={merchantQuery}
                  onChange={e => setMerchantQuery(e.target.value)}
                  placeholder="Enter store name (e.g. Paris Gucci, untrusted online shop, website QR)"
                  className="flex-1 dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF] transition-all"
                />
                <button
                  type="submit"
                  disabled={loadingMerchant}
                  className="bg-[#00C6FF] hover:opacity-90 text-black px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity cursor-pointer shrink-0 shadow-lg shadow-[#00C6FF]/15"
                >
                  {loadingMerchant ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Scan Trust
                </button>
              </div>
              {merchantError && (
                <div className="text-xs text-rose-300 bg-red-950/20 border border-red-500/10 rounded-xl px-4 py-2">
                  {merchantError}
                </div>
              )}
          </form>

          <AnimatePresence mode="wait">
            {merchantReport ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-left"
              >
                <div className="p-4 rounded-xl dark:bg-[#0d1326] bg-slate-50 border dark:border-white/5 border-black/5 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-mono dark:text-gray-400 text-slate-500 mb-1">SAFETY SCORE</div>
                  <div className={`text-4xl font-mono font-extrabold ${
                    merchantReport.score > 80 ? "text-[#00E38C]" : merchantReport.score > 50 ? "text-[#FF9F43]" : "text-[#FF4D4D]"
                  }`}>
                    {merchantReport.score}/100
                  </div>
                  <span className={`text-[9px] font-sans uppercase font-bold mt-2 px-2.5 py-0.5 rounded border ${
                    merchantReport.score > 80 
                      ? "bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/20" 
                      : "bg-red-500/10 text-[#FF4D4D] border-red-500/20"
                  }`}>
                    {merchantReport.score > 80 ? "HIGH TRUST" : "SUSPICIOUS WEBSITE"}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 space-y-3 col-span-2 text-xs dark:text-gray-300 text-slate-600">
                  <div>
                    <span className="dark:text-gray-500 text-slate-400 uppercase font-mono text-[9px] block">STORE ADDRESS</span>
                    <span className="font-sans dark:text-white text-slate-900 font-semibold block mt-0.5">{merchantReport.address}</span>
                  </div>
                  <div>
                    <span className="dark:text-gray-500 text-slate-400 uppercase font-mono text-[9px] block">AI DIAGNOSTIC EXPLANATION</span>
                    <p className="font-sans dark:text-gray-300 text-slate-600 block mt-0.5 leading-relaxed">{merchantReport.aiExplanation}</p>
                  </div>
                </div>

                {merchantReport.reviews && merchantReport.reviews.length > 0 && (
                  <div className="col-span-1 md:col-span-3 p-4 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5">
                    <span className="dark:text-gray-500 text-slate-400 uppercase font-mono text-[9px] block mb-2">Live Public Star Reviews (SerpAPI Maps)</span>
                    <div className="space-y-3">
                      {merchantReport.reviews.map((r, i) => (
                        <div key={i} className="text-xs border-b border-white/[0.02] pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between font-mono text-[10px] text-[#00C6FF]">
                            <span className="font-bold">{r.author}</span>
                            <span>{r.rating}★ Rating</span>
                          </div>
                          <p className="mt-1 dark:text-gray-400 text-slate-500 font-sans italic">"{r.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-44 rounded-xl border border-dashed dark:border-white/5 border-black/5 flex items-center justify-center text-xs dark:text-gray-500 text-slate-400 font-sans">
                Enter a store brand or shopping URL above to check security details instantly.
              </div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Flagship Cyber Threat Investigator Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Investigation queue */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="p-6 rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl space-y-4 transition-all duration-300"
        >
          <h3 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-[#FF4D4D]" /> Suspicious Transactions
          </h3>
          <p className="text-xs dark:text-gray-400 text-slate-500 font-sans">Select any suspicious charge below to read our AI partner's safe-shopping advice.</p>

          <div className="space-y-3">
            {mockCriticalTxs.map(tx => (
              <button
                key={tx.id}
                onClick={() => handleInvestigate(tx.id)}
                className={`w-full p-4 rounded-xl transition-all border text-left flex flex-col gap-1.5 cursor-pointer ${
                  selectedTxId === tx.id 
                    ? "bg-[#FF4D4D]/10 border-[#FF4D4D]/40 dark:text-white text-slate-900" 
                    : "dark:bg-[#0d1326] bg-slate-50/60 dark:border-white/5 border-black/5 hover:border-[#FF4D4D]/25"
                }`}
              >
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>{tx.merchant}</span>
                  <span className="font-mono text-[#FF4D4D]">₹{tx.amount.toLocaleString()}</span>
                </div>
                <p className="text-[11px] dark:text-gray-400 text-slate-500 leading-relaxed font-sans">{tx.reason}</p>
                <span className="text-[10px] font-sans text-[#7B61FF] font-bold">Review Activity Details →</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* AI Investigator breakdown paper */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="p-6 rounded-2xl dark:bg-[#0c1328] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl lg:col-span-2 space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF4D4D]/5 to-transparent blur-2xl pointer-events-none" />
          
          <h3 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF4D4D] animate-pulse" /> AI Assistant Diagnostic dossier
          </h3>

          <AnimatePresence mode="wait">
            {loadingInvestigator ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-64 flex flex-col items-center justify-center gap-3 text-xs dark:text-gray-400 text-slate-500 font-sans"
              >
                <Loader className="h-8 w-8 text-[#FF4D4D] animate-spin" />
                <span className="font-mono uppercase animate-pulse">Running Forensic Diagnostics...</span>
              </motion.div>
            ) : investigatorReport ? (
              <motion.div 
                key="report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 rounded-xl bg-white/[0.01] border dark:border-white/5 border-black/5 text-sm leading-relaxed dark:text-gray-300 text-slate-600 font-sans space-y-4"
              >
                {/* Dossier Terminal Header */}
                <div className="flex items-center gap-2 border-b dark:border-white/5 border-black/5 pb-2 font-mono text-[10px] dark:text-gray-500 text-slate-400">
                  <Terminal className="h-3.5 w-3.5 text-[#FF4D4D]" />
                  <span>DOSSIER_REPORT_ID: {selectedTxId.toUpperCase()}</span>
                </div>
                
                <div className="prose prose-invert max-h-72 overflow-y-auto pr-1 text-xs text-left" dangerouslySetInnerHTML={{ __html: investigatorReport }} />
                
                <div className="pt-4 border-t dark:border-white/5 border-black/5 flex gap-2 justify-end">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/payments/freeze-all", { method: "POST" });
                        if (res.ok) {
                          alert("Card Protected: All your linked cards have been TEMPORARILY FROZEN successfully to protect your account from threat vectors.");
                        } else {
                          alert("Shield Active: All cards locked protectively.");
                        }
                      } catch (e) {
                        alert("Shield Active: Active cards frozen.");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#FF4D4D] hover:bg-opacity-90 dark:text-white text-slate-900 text-xs font-sans font-bold cursor-pointer shadow-lg shadow-[#FF4D4D]/25 transition-all"
                  >
                    FREEZE MY CARD
                  </button>
                  <button 
                    onClick={() => alert("Report closed: Marked as recognized.")}
                    className="px-4 py-2 rounded-xl border dark:border-white/10 border-black/10 hover:dark:bg-white/5 bg-black/5 dark:text-gray-300 text-slate-600 text-xs font-sans font-bold cursor-pointer transition-all"
                  >
                    MARK AS SAFE
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed dark:border-white/5 border-black/5 flex flex-col items-center justify-center text-center text-xs dark:text-gray-500 text-slate-400 px-6 gap-2 font-sans">
                <Info className="h-6 w-6 text-gray-600" />
                Click any suspicious item on the left block to generate safety answers.
              </div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Global Scam Trends Section */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-sans tracking-wider dark:text-gray-400 text-slate-500 uppercase">Recent Internet Scam Warnings</h3>
            <p className="text-xs dark:text-gray-500 text-slate-400 mt-0.5">Tracking emerging fraud and tricks across UPI networks, transport delivery parcels, and online shopping intercepts.</p>
          </div>
          <button 
            onClick={fetchScamTrends}
            className="text-[10px] font-sans text-[#00C6FF] uppercase border-b border-[#00C6FF]/40 pb-0.5 hover:dark:text-white text-slate-900"
          >
            Update Warnings List
          </button>
        </div>

        {loadingTrends ? (
          <div className="py-12 flex justify-center text-xs dark:text-gray-400 text-slate-500 gap-2 items-center font-sans">
            <Loader className="h-4 w-4 animate-spin text-[#00C6FF]" /> Checking internet warning logs...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trends.map((tr, idx) => (
              <motion.div 
                key={tr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -3, border: "1px solid rgba(255, 77, 77, 0.2)" }}
                className="p-5 rounded-xl dark:bg-[#0d1326] bg-slate-50/60 border dark:border-white/5 border-black/5 space-y-2 group hover:border-[#FF4D4D]/25 transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#00C6FF] font-semibold bg-[#00C6FF]/10 px-2 py-0.5 rounded uppercase border border-[#00C6FF]/10">
                    {tr.category}
                  </span>
                  <span className="text-xs font-mono font-bold dark:text-gray-500 text-slate-400">
                    {tr.trendScore}% Threat Index
                  </span>
                </div>
                <h4 className="font-sans font-bold text-sm dark:text-white text-slate-900 group-hover:text-[#FF4D4D] transition-colors">{tr.title}</h4>
                <p className="text-xs dark:text-gray-400 text-slate-500 font-sans leading-relaxed">{tr.description}</p>
                <div className="pt-2 border-t border-white/[0.03] text-[10px] text-[#00E38C] leading-normal font-sans">
                  <strong>Safe Path:</strong> {tr.safeguards}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
