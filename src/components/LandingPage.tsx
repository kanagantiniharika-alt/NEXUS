import React, { useState, useEffect } from "react";
import { ShieldAlert, TrendingUp, Cpu, Target, Sparkles, GraduationCap, Briefcase, User as UserIcon, Mail, Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LandingPageProps {
  onLaunch: (user: any) => void;
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "professional">("professional");
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  // Generate subtle background floating particles
  useEffect(() => {
    const generated = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -20,
    }));
    setParticles(generated);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp 
        ? { name, email, password, role: selectedRole } 
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let data: any = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Invalid server response: ${text}`);
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `Authentication failed (${res.status})`);
      }

      if (data.success && data.user) {
         onLaunch(data.user);
      } else {
        throw new Error("Terminal access verification failed.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] dark:text-white text-slate-900 selection:bg-[#00F5D4]/30 relative overflow-hidden font-sans">
      
      {/* Animated Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Futuristic Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-[#06B6D4]/10 to-transparent blur-[120px] pointer-events-none z-0 animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-[#7B61FF]/10 to-transparent blur-[120px] pointer-events-none z-0 animate-pulse duration-[12s]" />

      {/* Floating Particles System */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-[#00F5D4]/20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Premium Header Nav */}
      <header className="relative z-10 border-b dark:border-white/5 border-black/5 bg-[#020617]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Dynamically assembling logo icon */}
            <motion.div 
              initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="h-10 w-10 rounded-xl bg-linear-to-tr from-[#00F5D4] via-[#00D4FF] to-[#7B61FF] p-[1.5px] shadow-lg shadow-[#00F5D4]/10"
            >
              <div className="h-full w-full bg-[#020617] rounded-[10px] flex items-center justify-center">
                <Cpu className="h-5 w-5 text-[#00F5D4]" />
              </div>
            </motion.div>
            <motion.span 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-sans font-extrabold text-2xl tracking-tight bg-linear-to-r from-white via-[#00D4FF] to-[#7B61FF] bg-clip-text text-transparent"
            >
              NEXUS
            </motion.span>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 text-xs font-mono dark:text-gray-500 text-slate-400"
          >
            <span className="h-2 w-2 rounded-full bg-[#00F5D4] animate-ping" />
            GATEWAY ONLINE [STABLE]
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-12 pb-24 flex flex-col items-center">
        
        {/* Flagship Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F5D4]/20 bg-[#00F5D4]/5 text-xs font-mono text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.05)]"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          NEXUS OPERATING SYSTEM • BUILD V3.0
        </motion.div>

        {/* Elegant Text Reveal */}
        <div className="mt-8 overflow-hidden">
          <motion.h1 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="text-center text-5xl md:text-7xl font-sans font-extrabold tracking-tight leading-none dark:text-white text-slate-900 max-w-4xl"
          >
            Create a premium, cinematic <br />
            <span className="bg-linear-to-r from-[#00F5D4] via-[#00D4FF] to-[#7B61FF] bg-clip-text text-transparent">
              splash screen experience.
            </span>
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-base md:text-lg dark:text-slate-400 text-slate-500 max-w-2xl leading-relaxed"
        >
          Launch Nexus with a black, glowing visual gateway built from neon strands, metallic depth, and cinematic motion for a stunning first impression.
        </motion.p>

        {/* Form Container with Neon Border Hover Glow */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.4 }}
          className="mt-12 w-full max-w-lg p-px rounded-3xl dark:bg-white/5 bg-black/5 hover:bg-linear-to-r hover:from-[#00F5D4]/30 hover:via-[#00D4FF]/20 hover:to-[#7B61FF]/30 transition-all duration-500 shadow-2xl"
        >
          <div className="bg-[#0f172a]/95 rounded-[23px] p-8 text-center relative overflow-hidden backdrop-blur-3xl">
            {/* Micro glow ornaments */}
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-[#00F5D4]/5 blur-xl" />
            
            <h3 className="font-sans font-extrabold text-2xl tracking-tight dark:text-white text-slate-900 mb-2">
              {isSignUp ? "Initialize Secure Workspace" : "Access Personal Console"}
            </h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mb-6">
              {isSignUp ? "Select your operational profile role to begin ledger sweeps." : "Identify secure credentials to sync database assets."}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Role Selection Tabs */}
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4 text-left">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={`p-4 rounded-xl flex flex-col items-start gap-2 border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      selectedRole === "student" 
                        ? "border-[#00F5D4] bg-[#00F5D4]/10 dark:text-white text-slate-900 shadow-[0_0_15px_rgba(0,245,212,0.08)]" 
                        : "dark:border-white/5 border-black/5 dark:bg-[#030712] bg-white text-slate-500 hover:text-slate-300 hover:dark:border-white/10 border-black/10"
                    }`}
                  >
                    <GraduationCap className={`h-5 w-5 transition-transform group-hover:scale-110 ${selectedRole === "student" ? "text-[#00F5D4]" : "text-slate-500"}`} />
                    <div>
                      <span className="text-xs font-bold block">Academic Mode</span>
                      <span className="text-[9px] text-slate-600 block">Stipends, category limits</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("professional")}
                    className={`p-4 rounded-xl flex flex-col items-start gap-2 border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      selectedRole === "professional" 
                        ? "border-[#7B61FF] bg-[#7B61FF]/10 dark:text-white text-slate-900 shadow-[0_0_15px_rgba(123,97,255,0.08)]" 
                        : "dark:border-white/5 border-black/5 dark:bg-[#030712] bg-white text-slate-500 hover:text-slate-300 hover:dark:border-white/10 border-black/10"
                    }`}
                  >
                    <Briefcase className={`h-5 w-5 transition-transform group-hover:scale-110 ${selectedRole === "professional" ? "text-[#7B61FF]" : "text-slate-500"}`} />
                    <div>
                      <span className="text-xs font-bold block">Professional</span>
                      <span className="text-[9px] text-slate-600 block">Salaries, compound vault</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Input Fields */}
              {isSignUp && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Operator Name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border dark:border-white/5 border-black/5 dark:bg-[#030712] bg-white dark:text-white text-slate-900 placeholder-slate-600 focus:outline-none focus:border-[#00F5D4]/40 focus:ring-1 focus:ring-[#00F5D4]/10 text-sm transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="System Email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border dark:border-white/5 border-black/5 dark:bg-[#030712] bg-white dark:text-white text-slate-900 placeholder-slate-600 focus:outline-none focus:border-[#00F5D4]/40 focus:ring-1 focus:ring-[#00F5D4]/10 text-sm transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Security Key (min 6 char)" : "Security Key"}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border dark:border-white/5 border-black/5 dark:bg-[#030712] bg-white dark:text-white text-slate-900 placeholder-slate-600 focus:outline-none focus:border-[#00F5D4]/40 focus:ring-1 focus:ring-[#00F5D4]/10 text-sm transition-all"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl text-left"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-linear-to-r from-[#00F5D4] via-[#00D4FF] to-[#7B61FF] text-slate-950 font-sans font-black text-sm uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,245,212,0.3)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <>
                    {isSignUp ? "Initialize Protocol" : "Verify Handshake"}
                    <Cpu className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                  </>
                )}
              </button>

            </form>

            <p className="mt-5 text-xs text-slate-500 font-sans">
              {isSignUp ? "Workspace already verified? " : "Require new console? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-[#00F5D4] font-bold hover:underline"
              >
                {isSignUp ? "Sign In" : "Register"}
              </button>
            </p>

          </div>
        </motion.div>

        {/* Bento Grid Redesign */}
        <section className="mt-28 w-full max-w-5xl">
          <h2 className="text-center font-sans font-black text-xs tracking-[0.25em] text-[#00F5D4] uppercase mb-12">
            System Modules & Core Capabilities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1 */}
            <div className="p-8 rounded-2xl border dark:border-white/5 border-black/5 bg-[#0b0f19]/40 backdrop-blur-md relative overflow-hidden group hover:border-[#00F5D4]/20 transition-all duration-500">
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[#00F5D4]/5 rounded-full blur-2xl group-hover:bg-[#00F5D4]/10 transition-colors" />
              <div className="h-11 w-11 rounded-xl bg-[#00F5D4]/5 border border-[#00F5D4]/10 flex items-center justify-center mb-6 text-[#00F5D4]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h4 className="font-sans font-bold text-lg dark:text-white text-slate-900 group-hover:text-[#00F5D4] transition-colors">Forensic Fraud Auditor</h4>
              <p className="mt-3 text-xs dark:text-slate-400 text-slate-500 leading-relaxed">
                Rule-based diagnostic checks for UPI phishing, location velocity discrepancies, double-swipes, and domain trust telemetry.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="p-8 rounded-2xl border dark:border-white/5 border-black/5 bg-[#0b0f19]/40 backdrop-blur-md relative overflow-hidden group hover:border-[#00D4FF]/20 transition-all duration-500">
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[#00D4FF]/5 rounded-full blur-2xl group-hover:bg-[#00D4FF]/10 transition-colors" />
              <div className="h-11 w-11 rounded-xl bg-[#00D4FF]/5 border border-[#00D4FF]/10 flex items-center justify-center mb-6 text-[#00D4FF]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="font-sans font-bold text-lg dark:text-white text-slate-900 group-hover:text-[#00D4FF] transition-colors">Savings Projection Engine</h4>
              <p className="mt-3 text-xs dark:text-slate-400 text-slate-500 leading-relaxed">
                Predictive wallet modeling and overspending indicators mapping allowances or professional salary sweeps automatically.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="p-8 rounded-2xl border dark:border-white/5 border-black/5 bg-[#0b0f19]/40 backdrop-blur-md relative overflow-hidden group hover:border-[#7B61FF]/20 transition-all duration-500">
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[#7B61FF]/5 rounded-full blur-2xl group-hover:bg-[#7B61FF]/10 transition-colors" />
              <div className="h-11 w-11 rounded-xl bg-[#7B61FF]/5 border border-[#7B61FF]/10 flex items-center justify-center mb-6 text-[#7B61FF]">
                <Target className="h-5 w-5" />
              </div>
              <h4 className="font-sans font-bold text-lg dark:text-white text-slate-900 group-hover:text-[#7B61FF] transition-colors">Dynamic Vault Milestones</h4>
              <p className="mt-3 text-xs dark:text-slate-400 text-slate-500 leading-relaxed">
                Category compromise analytics, real-time success probability indicators, and dynamic savings sweep recommendations.
              </p>
            </div>

          </div>
        </section>

        {/* Global Statistics Ticker */}
        <section className="mt-20 py-8 px-12 rounded-2xl border dark:border-white/5 border-black/5 bg-[#0f172a]/30 backdrop-blur-sm w-full max-w-4xl grid grid-cols-3 gap-6 text-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00F5D4]/1 pointer-events-none" />
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#00F5D4] font-mono">$42.8M</div>
            <div className="text-[10px] text-slate-500 mt-1.5 uppercase font-mono tracking-wider">Secured Vault Assets</div>
          </div>
          <div className="border-x dark:border-white/5 border-black/5">
            <div className="text-2xl md:text-3xl font-extrabold text-[#00D4FF] font-mono">92,410</div>
            <div className="text-[10px] text-slate-500 mt-1.5 uppercase font-mono tracking-wider">Scams Blocked</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#7B61FF] font-mono">98.4%</div>
            <div className="text-[10px] text-slate-500 mt-1.5 uppercase font-mono tracking-wider">Algorithmic Success</div>
          </div>
        </section>

        {/* Brand footer bar */}
        <div className="mt-24 text-center border-t dark:border-white/5 border-black/5 pt-12 w-full max-w-4xl font-sans">
          <p className="text-[10px] font-bold text-slate-600 tracking-[0.2em]">SECURED DATA LINK LINK ENCRYPTION POWERED BY NEXUS SECURITY GATEWAY</p>
        </div>

      </main>
    </div>
  );
}
