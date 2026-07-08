import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import FraudCenter from "./components/FraudCenter";
import ForecastEngine from "./components/ForecastEngine";
import Copilot from "./components/Copilot";
import SpendingIntelligence from "./components/SpendingIntelligence";
import SubscriptionIntelligence from "./components/SubscriptionIntelligence";
import GoalVault from "./components/GoalVault";
import PurchaseAdvisor from "./components/PurchaseAdvisor";
import StudentMode from "./components/StudentMode";
import FriendSplitter from "./components/FriendSplitter";
import NexusChat from "./components/NexusChat";
import PaymentManagement from "./components/PaymentManagement";
import { User, UserRole } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Moon, Sun, UserRound, ShieldCheck, Sparkles, Menu, Cpu, Bell, Activity, Wifi } from "lucide-react";

export default function App() {
  const [launched, setLaunched] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [notificationsCount, setNotificationsCount] = useState(0);
  
  // Theme state (loaded from localstorage or default to dark)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("nexus_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Set default initial user profile
  const [user, setUser] = useState<User>({
    id: "user_1",
    name: "Alex Mercer",
    email: "chrissx1012@gmail.com",
    role: "student",
    financeScore: 78,
    balance: 8500,
    income: 10000,
  });

  // Track mouse coordinates for interactive glowing particles/orb
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Update notification count from database dynamically
  const syncNotificationCount = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotificationsCount(data.filter((n: any) => !n.read).length);
        }
      }
    } catch (e) {
      console.warn("Silent notification count sync failed.");
    }
  };

  useEffect(() => {
    if (launched) {
      syncNotificationCount();
      const interval = setInterval(syncNotificationCount, 15000);
      window.addEventListener("notifications-updated", syncNotificationCount);
      return () => {
        clearInterval(interval);
        window.removeEventListener("notifications-updated", syncNotificationCount);
      };
    }
  }, [launched, user.id]);

  // Query and restore active session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const cached = localStorage.getItem("nexus_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: parsed.email, password: parsed.password || "nexus123" })
          });
          
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            setUser(data.user);
            setLaunched(true);
            setSessionLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Silent session restoration handed off.", e);
      }

      try {
        const res = await fetch("/api/auth/me");
        const contentType = res.headers.get("content-type") || "";
        let data: any = null;

        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.warn("Auth /api/auth/me returned non-JSON response", res.status, text);
        }

        if (res.ok && data?.success && data.user) {
          setUser(data.user);
          setLaunched(true);
        } else {
          console.warn("Auth /api/auth/me failed", res.status, data);
        }
      } catch (e) {
        console.error("Fetch me failed", e);
      } finally {
        if (!launched) {
          console.warn("No auth session restored; launching with default local user.");
          setLaunched(true);
        }
        setSessionLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLaunch = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("nexus_user", JSON.stringify(loggedInUser));
    setLaunched(true);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed", e);
    }
    localStorage.removeItem("nexus_user");
    setLaunched(false);
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return user.role === "student" ? (
          <StudentMode />
        ) : (
          <Dashboard user={user} onUpdateBalance={(newBal) => setUser((u: User) => ({ ...u, balance: newBal }))} />
        );
      case "payments":
        return <PaymentManagement user={user} onUpdateBalance={(newBal) => setUser((u: User) => ({ ...u, balance: newBal }))} />;
      case "fraud":
        return <FraudCenter />;
      case "forecast":
        return <ForecastEngine user={user} />;
      case "copilot":
        return <Copilot user={user} />;
      case "spending":
        return <SpendingIntelligence user={user} onUpdateUser={(fields) => setUser((u: User) => ({ ...u, ...fields }))} />;
      case "subscriptions":
        return <SubscriptionIntelligence />;
      case "goals":
        return <GoalVault user={user} onUpdateBalance={(newBal) => setUser((u: User) => ({ ...u, balance: newBal }))} />;
      case "purchase":
        return <PurchaseAdvisor />;
      case "friendsplit":
        return <FriendSplitter />;
      case "chat":
        return <NexusChat theme={theme} user={user} onUpdateBalance={(newBal) => setUser((u: User) => ({ ...u, balance: newBal }))} />;
      default:
        return <Dashboard user={user} onUpdateBalance={(newBal) => setUser((u: User) => ({ ...u, balance: newBal }))} />;
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center font-sans relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-10 w-10 rounded-xl bg-linear-to-tr from-[#00F5D4] to-[#7B61FF] p-[1.5px] mb-6 shadow-lg shadow-[#00F5D4]/10"
        >
          <div className="h-full w-full bg-[#020617] rounded-[9px] flex items-center justify-center">
            <Cpu className="h-5 w-5 text-[#00F5D4]" />
          </div>
        </motion.div>
        <span className="text-[10px] font-mono text-slate-400 tracking-[0.25em] uppercase animate-pulse">Establishing Secure Nexus Handshake...</span>
      </div>
    );
  }

  if (!launched) {
    return <LandingPage onLaunch={handleLaunch} />;
  }

  return (
    <div className={`nexus-shell min-h-screen text-[#CBD5E1] flex select-none relative overflow-hidden font-sans ${theme === "light" ? "light-theme" : "dark-theme"} ${user.role === "student" ? "student-mode" : "professional-mode"}`}>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-10 top-24 w-80 h-80 rounded-full bg-[#00F5D4]/12 blur-3xl animate-floatUp opacity-70" />
        <div className="absolute -right-30 top-1/4 w-72 h-72 rounded-full bg-[#7B61FF]/12 blur-3xl animate-floatUp opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,212,0.18),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.12),transparent_22%)]" />
      </div>

      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 min-h-screen lg:pl-64 flex flex-col overflow-hidden min-w-0 relative">
        <header className="h-24 border-b border-white/10 bg-[#020617]/55 backdrop-blur-2xl sticky top-0 z-40 px-6 lg:px-10 flex flex-col justify-center shadow-[0_20px_80px_-48px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F5D4]/20 text-slate-400 hover:text-white transition-all lg:hidden"
                title="Open Navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.32em] text-[#00F5D4]">
                  <span className="h-2 w-2 rounded-full bg-[#00F5D4] animate-pulse" />
                  <span>NEXUS COMMAND CENTER</span>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight capitalize leading-none">{activeTab.replace('-', ' ')}</h1>
                  <span className="px-3 py-1 rounded-2xl border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">Premium Command UI</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-3xl bg-[#020917]/85 border border-white/5 px-4 py-3 shadow-[0_18px_50px_-30px_rgba(0,245,212,0.4)]">
                  <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500 font-mono">AI Status</div>
                  <div className="mt-2 text-sm font-bold text-white">Active</div>
                </div>
                <div className="rounded-3xl bg-[#020917]/85 border border-white/5 px-4 py-3 shadow-[0_18px_50px_-30px_rgba(0,212,255,0.22)]">
                  <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500 font-mono">Health</div>
                  <div className="mt-2 text-sm font-bold text-[#06B6D4]">{user.financeScore}%</div>
                </div>
                <div className="rounded-3xl bg-[#020917]/85 border border-white/5 px-4 py-3 shadow-[0_18px_50px_-30px_rgba(123,97,255,0.22)]">
                  <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500 font-mono">Balance</div>
                  <div className="mt-2 text-sm font-bold text-[#00E38C]">₹{user.balance.toLocaleString()}</div>
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button 
                onClick={() => {
                  const nextTheme = theme === "dark" ? "light" : "dark";
                  setTheme(nextTheme);
                  localStorage.setItem("nexus_theme", nextTheme);
                  window.dispatchEvent(new Event("storage"));
                }}
                className="p-3 rounded-2xl bg-[#020917]/85 hover:bg-[#020917]/60 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-lg"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-[#00F5D4]" /> : <Moon className="h-5 w-5 text-[#7B61FF]" />}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8 overflow-y-auto">
          {renderActiveContent()}
        </div>

        <footer className="h-12 flex-none bg-[#020617]/80 backdrop-blur-2xl border-t border-white/5 flex items-center px-8 sticky bottom-0 z-30 w-full justify-between overflow-hidden">
          <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.35em] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#00F5D4] animate-pulse" />
            NEXUS TELEMETRY FEED
          </div>
          <div className="flex-1 overflow-hidden ml-6">
            <motion.div 
              animate={{ x: [0, -700] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className="flex gap-12 text-[9px] font-mono text-slate-500 whitespace-nowrap"
            >
              <p><span className="text-[#EF4444] font-bold">[ALERT]</span> UPI Phishing QR voucher scams targeting college students. Do not enter PIN code.</p>
              <p><span className="text-[#00F5D4] font-bold">[ADVISORY]</span> Savings rate increased by 2.4% following subscription pruning.</p>
              <p><span className="text-white font-bold">[NOMINAL]</span> SECURE LAYER BINDINGS VERIFIED. DATABASE ONLINE.</p>
            </motion.div>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Settings Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="w-full max-w-md bg-[#070b16]/95 border border-white/10 rounded-3xl p-6 relative z-10 shadow-2xl text-left overflow-hidden max-h-[90vh] overflow-y-auto backdrop-blur-2xl"
            >
              {/* Blur orbs inside modal */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00F5D4]/5 rounded-full blur-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#7B61FF]/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5 relative z-10">
                <div className="flex items-center gap-2.5 font-sans">
                  <div className="p-2 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/20 text-[#00F5D4]">
                    <Settings className="h-5 w-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-extrabold tracking-tight text-white uppercase">Console Settings</h3>
                    <p className="text-[9px] text-slate-500 font-mono tracking-wider">Configure System Parameters</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6 text-white relative z-10">
                {/* User Identity settings */}
                <div className="space-y-4">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-[#00F5D4] font-black flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" /> CARDHOLDER CERTIFICATE
                  </label>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] uppercase font-mono font-bold text-slate-500 block mb-1">Display Name</label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
                        className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00F5D4]/40 focus:ring-1 focus:ring-[#00F5D4]/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] uppercase font-mono font-bold text-slate-500 block mb-1">Access Role Privilege</label>
                      <select
                        value={user.role}
                        onChange={async (e) => {
                          const nextRole = e.target.value as UserRole;
                          setUser((u: User) => ({ ...u, role: nextRole }));
                          // Trigger role update to database
                          try {
                            await fetch("/api/auth/role", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role: nextRole })
                            });
                          } catch (err) {
                            console.error("Failed to sync role change to backend:", err);
                          }
                        }}
                        className="w-full bg-[#030712] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7b61ff]/40 focus:ring-1 focus:ring-[#7b61ff]/10"
                      >
                        <option value="student">Academic Mode</option>
                        <option value="professional">Enterprise Professional</option>
                      </select>
                      <span className="text-[9px] text-slate-600 mt-1.5 block leading-normal">
                        Role transitions dynamically adjust budgets, security telemetry, and card balances inside MySQL.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure database handshake message */}
                <div className="p-3 bg-[#22C55E]/5 border border-[#22C55E]/15 rounded-xl flex items-start gap-2.5 text-[9px] text-slate-400 leading-normal font-mono">
                  <ShieldCheck className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span>
                    Database transaction logs synchronized. Security credentials persisted via secure local caches.
                  </span>
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#00F5D4] to-[#7B61FF] text-slate-950 font-sans font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,245,212,0.25)] text-center cursor-pointer"
                >
                  Save Configuration
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
