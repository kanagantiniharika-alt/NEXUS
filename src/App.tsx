/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from './types';
import AuthInterface from './components/AuthInterface';
import ParticleNetwork from './components/ParticleNetwork';
import SoftAurora from './components/SoftAurora';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import FraudCenter from './components/FraudCenter';
import ForecastEngine from './components/ForecastEngine';
import Copilot from './components/Copilot';
import SpendingIntelligence from './components/SpendingIntelligence';
import SubscriptionIntelligence from './components/SubscriptionIntelligence';
import GoalVault from './components/GoalVault';
import PurchaseAdvisor from './components/PurchaseAdvisor';
import StudentMode from './components/StudentMode';
import FriendSplitter from './components/FriendSplitter';
import NexusChat from './components/NexusChat';
import PaymentManagement from './components/PaymentManagement';
import { 
  X, Settings, Moon, Sun, UserRound, ShieldCheck, Sparkles, 
  Menu, Cpu, Bell, Activity, Wifi, Shield 
} from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('introPlayed');
    } catch {
      return true;
    }
  });

  const [isInitializing, setIsInitializing] = useState(showSplash);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootText, setBootText] = useState('Booting Nexus Core...');

  const splashTimeout = useRef<number | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('nexus_is_logged_in') === 'true';
  });

  const [user, setUser] = useState<User>(() => {
    const cachedRole = (localStorage.getItem('nexus_user_role') as UserRole) || 'student';
    const cachedEmail = localStorage.getItem('nexus_user_email') || '';
    const cachedName = localStorage.getItem('nexus_user_name') || 'Robin Liu';
    return {
      id: 'usr_seeded_default',
      name: cachedName,
      email: cachedEmail,
      role: cachedRole,
      financeScore: cachedRole === 'student' ? 78 : 84,
      balance: cachedRole === 'student' ? 8500 : 124000,
      income: cachedRole === 'student' ? 10000 : 150000,
    };
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("nexus_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial Boot Sequence Animation
  useEffect(() => {
    if (!isInitializing) return;

    const interval = window.setInterval(() => {
      setBootProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 12) + 4;
        if (next >= 100) {
          clearInterval(interval);
          setBootText('Ready!');
          splashTimeout.current = window.setTimeout(() => {
            try {
              sessionStorage.setItem('introPlayed', 'true');
            } catch {
              // ignore sessionStorage failures
            }
            setShowSplash(false);
            setIsInitializing(false);
          }, 600);
          return 100;
        }

        if (next < 25) {
          setBootText('Initializing Nexus Core...');
        } else if (next < 55) {
          setBootText('Activating quantum ledger mesh...');
        } else if (next < 85) {
          setBootText('Engaging forensic security matrix...');
        } else {
          setBootText('Secure launch imminent...');
        }

        return next;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      if (splashTimeout.current) {
        window.clearTimeout(splashTimeout.current);
      }
    };
  }, [isInitializing]);

  // Sync notification counts
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
    if (isLoggedIn) {
      syncNotificationCount();
      const interval = setInterval(syncNotificationCount, 15000);
      window.addEventListener("notifications-updated", syncNotificationCount);
      return () => {
        clearInterval(interval);
        window.removeEventListener("notifications-updated", syncNotificationCount);
      };
    }
  }, [isLoggedIn, user.id]);

  const handleLoginSuccess = (role: UserRole, email: string, name?: string) => {
    const defaultName = email.split('@')[0];
    const finalName = name || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    const initialUser: User = {
      id: `usr_${Date.now()}`,
      name: finalName,
      email: email,
      role: role,
      financeScore: role === 'student' ? 78 : 84,
      balance: role === 'student' ? 8500 : 124000,
      income: role === 'student' ? 10000 : 150000,
    };
    setUser(initialUser);
    setIsLoggedIn(true);
    localStorage.setItem('nexus_is_logged_in', 'true');
    localStorage.setItem('nexus_user_role', role);
    localStorage.setItem('nexus_user_email', email);
    localStorage.setItem('nexus_user_name', initialUser.name);
    localStorage.setItem('nexus_user', JSON.stringify(initialUser));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('nexus_is_logged_in');
    localStorage.removeItem('nexus_user_role');
    localStorage.removeItem('nexus_user_email');
    localStorage.removeItem('nexus_user_name');
    localStorage.removeItem('nexus_user');
  };

  const handleSaveSettings = (updatedFields: Partial<User>) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('nexus_user_name', updatedUser.name);
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
    setIsSettingsOpen(false);
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return user.role === "student" ? (
          <StudentMode setActiveTab={setActiveTab} user={user} />
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
        return user.role === "student" ? (
          <StudentMode user={user} />
        ) : (
          <Dashboard user={user} onUpdateBalance={(newBal) => setUser((u: User) => ({ ...u, balance: newBal }))} />
        );
    }
  };

  return (
    <div className="min-h-screen flex select-none relative overflow-hidden font-sans dark:bg-[#0A0A0B] bg-slate-50 dark:text-[#CBD5E1] text-slate-800">
      
      {/* App-wide SoftAurora Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={0.8}
          color1="#f7f7f7"
          color2="#e100ff"
          noiseFrequency={2.5}
          noiseAmplitude={1.0}
          bandHeight={0.5}
          bandSpread={1.0}
          octaveDecay={0.1}
          layerOffset={0}
          colorSpeed={1.0}
          enableMouseInteraction={true}
          mouseInfluence={0.25}
        />
      </div>

      {/* Premium ambient glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-10 top-24 w-80 h-80 rounded-full bg-[#EF4444]/10 blur-3xl animate-pulse opacity-70" />
        <div className="absolute -right-30 top-1/4 w-72 h-72 rounded-full bg-[#EF4444]/6 blur-3xl animate-pulse opacity-70" />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="bootloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 bg-[#070709] flex flex-col items-center justify-center p-6"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#EF4444] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-[#EF4444] opacity-[0.02] rounded-full blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8 relative">
              
              {/* Decorative crosshairs for cyber military command vibe */}
              <div className="absolute -top-12 -left-12 w-6 h-6 border-t-2 border-l-2 dark:border-white/10 border-black/10 pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-6 h-6 border-t-2 border-r-2 dark:border-white/10 border-black/10 pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-6 h-6 border-b-2 border-l-2 dark:border-white/10 border-black/10 pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-6 h-6 border-b-2 border-r-2 dark:border-white/10 border-black/10 pointer-events-none" />

              {/* Logo Icon with double rotating rings and soft red breathing glow */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  className="absolute -inset-3 rounded-3xl border border-dashed border-[#EF4444]/30 pointer-events-none"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                  className="absolute -inset-6 rounded-full border border-dotted border-[#EF4444]/20 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [0.96, 1.04, 0.96] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl border-2 border-[#EF4444]/40 bg-[#EF4444]/5 flex items-center justify-center shadow-[0_0_60px_-5px_rgba(239,68,68,0.4)]"
                >
                  <Shield className="text-[#EF4444]" size={28} />
                </motion.div>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tighter dark:text-white text-slate-900">
                  NEXUS <span className="text-[#EF4444]">CORE</span>
                </h1>
                <p className="text-[9px] text-[#EF4444] uppercase tracking-[0.3em] mt-2 font-mono font-black">
                  🛡️ Forensic Financial Guard v4.14
                </p>
              </div>

              {/* Progress and status text */}
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span className="animate-pulse tracking-wider">{bootText}</span>
                  <span className="text-[#EF4444] font-bold">{bootProgress}%</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full dark:bg-white/5 bg-black/5 rounded-full overflow-hidden border dark:border-white/5 border-black/5 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#990000] to-[#EF4444] rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${bootProgress}%` }}
                  />
                </div>
              </div>

              <div className="text-[9px] text-neutral-600 font-mono tracking-widest pt-2">
                SYSTEM CORE ONLINE // CRYPTO LEDGER AUDITOR ACTIVE
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem('introPlayed', 'true');
                  } catch {
                    // ignore sessionStorage failure
                  }
                  if (splashTimeout.current) {
                    window.clearTimeout(splashTimeout.current);
                  }
                  setShowSplash(false);
                  setIsInitializing(false);
                }}
                className="mt-5 px-5 py-2 rounded-full border border-[#EF4444]/30 text-[#EF4444] text-xs uppercase tracking-[0.3em] font-semibold hover:bg-[#EF4444]/10 transition-colors"
              >
                Skip Intro
              </button>
            </div>
          </motion.div>
        ) : !isLoggedIn ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full min-h-screen flex flex-col relative z-10"
          >
            <AuthInterface onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full min-h-screen flex relative z-10 overflow-hidden"
          >
            <Navbar 
              user={user} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onLogout={handleLogout} 
              onOpenSettings={() => setIsSettingsOpen(true)}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 min-h-screen lg:pl-64 flex flex-col overflow-hidden min-w-0 relative z-10">
              <header className="h-24 border-b dark:border-white/5 border-black/5 dark:bg-[#030712] dark:bg-white/5 bg-black/50 backdrop-blur-2xl sticky top-0 z-40 px-6 lg:px-10 flex flex-col justify-center shadow-[0_20px_80px_-48px_rgba(0,0,0,0.8)]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-2.5 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 hover:border-[#EF4444]/20 dark:text-slate-400 text-slate-500 hover:dark:text-white text-slate-900 transition-all lg:hidden"
                      title="Open Navigation"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.32em] text-[#EF4444]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                        <span>NEXUS CORE COMMAND SUITE</span>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <h1 className="text-xl md:text-2xl font-black dark:text-white text-slate-900 tracking-tight capitalize leading-none">
                          {activeTab.replace('-', ' ')}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full border dark:border-white/5 border-black/5 dark:bg-white/5 bg-black/5 text-[9px] uppercase tracking-[0.25em] dark:text-slate-400 text-slate-500">
                          PREMIUM NODE // OK
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3">
                      <div className="rounded-2xl dark:bg-[#030712] bg-white/80 border dark:border-white/5 border-black/5 px-4 py-2 flex flex-col justify-center">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono leading-none">SECURITY LEVEL</div>
                        <div className="mt-1 text-xs font-bold text-emerald-400">NOMINAL</div>
                      </div>
                      <div className="rounded-2xl dark:bg-[#030712] bg-white/80 border dark:border-white/5 border-black/5 px-4 py-2 flex flex-col justify-center">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono leading-none">FINANCE SCORE</div>
                        <div className="mt-1 text-xs font-bold text-cyan-400">{user.financeScore}%</div>
                      </div>
                      <div className="rounded-2xl dark:bg-[#030712] bg-white/80 border dark:border-white/5 border-black/5 px-4 py-2 flex flex-col justify-center">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono leading-none">BALANCE</div>
                        <div className="mt-1 text-xs font-bold text-[#00E38C]">₹{user.balance.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2.5 rounded-2xl dark:bg-[#030712] bg-white/85 hover:dark:bg-[#030712] bg-white/60 border dark:border-white/5 border-black/5 dark:text-slate-400 text-slate-500 hover:dark:text-white text-slate-900 transition-all cursor-pointer shadow-lg"
                        title="Configure Settings"
                      >
                        <Settings className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    {renderActiveContent()}
                  </motion.div>
                </AnimatePresence>
              </main>

              <footer className="h-10 flex-none dark:bg-[#030712] bg-white/85 backdrop-blur-2xl border-t dark:border-white/5 border-black/5 flex items-center px-6 sticky bottom-0 z-30 w-full justify-between overflow-hidden">
                <div className="flex items-center gap-3 text-[8px] font-mono uppercase tracking-[0.35em] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                  TELEMETRY SHIELD VERIFIED
                </div>
                <div className="flex-1 overflow-hidden ml-6 hidden sm:block">
                  <motion.div 
                    animate={{ x: [0, -600] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="flex gap-12 text-[8px] font-mono text-slate-500 whitespace-nowrap"
                  >
                    <p><span className="text-[#EF4444] font-bold">[ADVISORY]</span> UPI Phishing QR voucher scams active. Maintain vigilant OTP clearance.</p>
                    <p><span className="text-[#EF4444] font-bold">[CORE STATUS]</span> Neural budget forecast model is currently optimized at 98.2% legitimacy precision.</p>
                    <p><span className="dark:text-white text-slate-900 font-bold">[GATEWAY]</span> ALL ENCRYPTED DATA CHANNELS SYNCHRONIZED SECURELY.</p>
                  </motion.div>
                </div>
              </footer>
            </div>

            <AnimatePresence>
              {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSettingsOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#0b0f19] border dark:border-white/10 border-black/10 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold dark:text-white text-slate-900 uppercase tracking-wider font-mono">Profile Configuration</h3>
                        <p className="text-xs text-slate-500">Edit local system variables</p>
                      </div>
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="p-2 rounded-xl dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 dark:text-slate-400 text-slate-500 hover:dark:text-white text-slate-900 transition-all cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500">Display Name</label>
                        <input 
                          type="text" 
                          value={user.name}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          className="w-full dark:bg-[#030712] bg-white border dark:border-white/10 border-black/10 rounded-2xl px-4 py-3 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-[#EF4444] transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500">Primary Email</label>
                        <input 
                          type="text" 
                          disabled
                          value={user.email}
                          className="w-full dark:bg-[#030712] dark:bg-white/5 bg-black/50 border dark:border-white/5 border-black/5 rounded-2xl px-4 py-3 text-sm text-slate-500 font-mono cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500">Estimated Income</label>
                          <input 
                            type="number" 
                            value={user.income}
                            onChange={(e) => setUser({ ...user, income: Number(e.target.value) })}
                            className="w-full dark:bg-[#030712] bg-white border dark:border-white/10 border-black/10 rounded-2xl px-4 py-3 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-[#EF4444] transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500">Current Balance</label>
                          <input 
                            type="number" 
                            value={user.balance}
                            onChange={(e) => setUser({ ...user, balance: Number(e.target.value) })}
                            className="w-full dark:bg-[#030712] bg-white border dark:border-white/10 border-black/10 rounded-2xl px-4 py-3 text-sm text-[#00E38C] focus:outline-none focus:border-[#EF4444] transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
                        <div className="space-y-1">
                          <div className="text-xs font-bold dark:text-white text-slate-900 font-mono uppercase tracking-wider">Spend Notifications</div>
                          <p className="text-[10px] text-slate-500">Deploy alerts on threshold breaches</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={user.spendAlertsEnabled ?? true}
                          onChange={(e) => setUser({ ...user, spendAlertsEnabled: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444] accent-[#EF4444]"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSaveSettings(user)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#991B1B] dark:text-white text-slate-900 font-bold uppercase tracking-wider font-mono text-xs cursor-pointer shadow-lg hover:brightness-110 transition-all"
                    >
                      Commit Profile Changes
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
