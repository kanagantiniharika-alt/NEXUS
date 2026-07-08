import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, TrendingUp, Cpu, BarChart3, Receipt, Target, 
  GraduationCap, MessageSquare, Briefcase, Sparkles, LogOut, 
  ShoppingCart, CreditCard, Settings, Bell, CheckCheck, Trash2, 
  X, CheckCircle2, AlertTriangle, AlertCircle, Info, Loader, Users 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "../types";

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Navbar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onOpenSettings,
  isOpen = false,
  onClose
}: NavbarProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notiOpen, setNotiOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch tactical notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s poll for snappy dynamic feel
    
    const handleRefresh = () => fetchNotifications();
    window.addEventListener("notifications-updated", handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", handleRefresh);
    };
  }, [user.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all`, { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch (e) {
      console.error("Failed to mark all read:", e);
    }
  };

  const handleDeleteNoti = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const sections = [
    {
      title: "Core Command",
      items: [
        { id: "dashboard", label: user.role === "student" ? "Campus OS" : "Control Center", icon: user.role === "student" ? GraduationCap : BarChart3 },
        { id: "chat", label: "Nexus Core Chat", icon: MessageSquare }
      ]
    },
    {
      title: "Security & Vaults",
      items: [
        { id: "fraud", label: "Security Console", icon: ShieldAlert },
        { id: "payments", label: "Device Vaults", icon: CreditCard },
        { id: "purchase", label: "Buy-Decision Audit", icon: ShoppingCart }
      ]
    },
    {
      title: "Wealth Intelligence",
      items: [
        { id: "spending", label: "Spend Telemetry", icon: Receipt },
        { id: "forecast", label: "Budget Modeling", icon: TrendingUp },
        { id: "subscriptions", label: "Recurring Sweeps", icon: Sparkles },
        { id: "copilot", label: "AI Chatbot", icon: Cpu }
      ]
    },
    {
      title: "Savings & Sharing",
      items: [
        { id: "goals", label: "Savings Lockbox", icon: Target },
        ...(user.role === "student" ? [{ id: "friendsplit", label: "Friend Expense Splitter", icon: Users }] : [])
      ]
    }
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <nav className={`fixed left-0 top-0 h-screen w-64 border-r dark:border-white/5 border-black/5 bg-[#020617]/85 backdrop-blur-2xl dark:text-white text-slate-900 flex flex-col z-50 transition-all duration-500 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        
        {/* Brand Logo Header */}
        <div className="h-20 border-b dark:border-white/5 border-black/5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#EF4444] via-[#F59E0B] to-[#FACC15] p-[1.5px] shadow-lg shadow-[#EF4444]/10">
              <div className="h-full w-full bg-[#020617] rounded-[10px] flex items-center justify-center">
                <Cpu className="h-4 w-4 text-[#EF4444]" />
              </div>
            </div>
            <span className="font-sans font-extrabold text-base tracking-widest bg-gradient-to-r from-white via-[#F59E0B] to-[#FACC15] bg-clip-text text-transparent uppercase">
              NEXUS OS
            </span>
          </div>
          {/* Mobile Close Button */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:dark:bg-white/5 bg-black/5 dark:text-slate-400 text-slate-500 hover:dark:text-white text-slate-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-b dark:border-white/5 border-black/5 bg-white/[0.01] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#EF4444] to-[#FACC15] p-[1.5px] shrink-0">
                <div className="h-full w-full bg-[#020617] rounded-full flex items-center justify-center text-xs font-mono font-black dark:text-white text-slate-900">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </div>
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-xs font-extrabold truncate dark:text-white text-slate-900">{user.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {user.role === "student" ? (
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] flex items-center gap-1 uppercase tracking-wide">
                      <GraduationCap className="h-2 w-2" /> Academic
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black bg-[#FACC15]/10 border border-[#FACC15]/20 text-[#FACC15] flex items-center gap-1 uppercase tracking-wide">
                      <Briefcase className="h-2 w-2" /> Executive
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Notifications Popover Trigger */}
              <div className="relative">
                <button
                  onClick={() => setNotiOpen(!notiOpen)}
                  className={`p-1.5 rounded-lg transition-all duration-300 relative cursor-pointer ${
                    notiOpen 
                      ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20" 
                      : "dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 hover:text-[#EF4444] dark:text-slate-400 text-slate-500 border border-transparent"
                  }`}
                  title="Tactical Security Alerts"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                <AnimatePresence>
                  {notiOpen && (
                    <>
                      <div className="fixed inset-0 z-30 cursor-default" onClick={() => setNotiOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute left-full ml-4 top-[-20px] w-80 bg-[#070b16]/95 border dark:border-white/10 border-black/10 rounded-2xl p-4 shadow-2xl z-40 text-left backdrop-blur-2xl"
                      >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#EF4444]/5 rounded-full blur-xl pointer-events-none" />

                        <div className="flex items-center justify-between border-b dark:border-white/5 border-black/5 pb-2.5 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Bell className="h-4 w-4 text-[#EF4444]" />
                            <span className="text-[10px] font-mono tracking-widest uppercase font-extrabold dark:text-white text-slate-900">TACTICAL ALERTS ({unreadCount})</span>
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAllRead();
                              }}
                              className="text-[9px] text-[#EF4444] hover:underline font-mono font-bold cursor-pointer"
                            >
                              Flush Alerts
                            </button>
                          )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
                          {notifications.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                              <CheckCircle2 className="h-8 w-8 text-[#EF4444]/30" />
                              <p className="text-[9px] font-mono text-slate-500 tracking-wider">ALL TRACKERS NOMINAL</p>
                            </div>
                          ) : (
                            notifications.map((noti) => (
                              <div 
                                key={noti.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!noti.read) handleMarkAsRead(noti.id);
                                }}
                                className={`p-2.5 rounded-xl border relative transition-all duration-300 flex flex-col cursor-pointer ${
                                  noti.read
                                    ? "bg-white/[0.01]/60 dark:border-white/5 border-black/5 text-slate-500"
                                    : "bg-white/[0.03] dark:border-white/10 border-black/10 dark:text-white text-slate-900 hover:bg-white/[0.05]"
                                }`}
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${
                                  noti.severity === "danger" 
                                    ? "bg-[#EF4444]" 
                                    : noti.severity === "warning" 
                                    ? "bg-[#F59E0B]" 
                                    : noti.severity === "success" 
                                    ? "bg-[#22C55E]" 
                                    : "bg-[#06B6D4]"
                                }`} />

                                <div className="pl-2 space-y-1">
                                  <div className="flex items-start justify-between gap-1">
                                    <span className={`text-[10px] font-bold tracking-tight leading-snug flex items-center gap-1.5 ${noti.read ? "text-slate-500" : "dark:text-white text-slate-900"}`}>
                                      {noti.title}
                                    </span>
                                    <button
                                      onClick={(e) => handleDeleteNoti(noti.id, e)}
                                      className="p-1 rounded text-slate-600 hover:text-red-400 hover:dark:bg-white/5 bg-black/5 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <p className="text-[9px] leading-snug dark:text-slate-400 text-slate-500">
                                    {noti.description}
                                  </p>
                                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-0.5">
                                    <span>{noti.type.toUpperCase().replace('_', ' ')}</span>
                                    <span>{new Date(noti.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings Trigger */}
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 hover:text-[#EF4444] dark:text-slate-400 text-slate-500 border border-transparent transition-colors cursor-pointer"
                title="Workspace settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick wallet stats */}
          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="dark:bg-[#030712] dark:bg-white/5 bg-black/50 p-2 rounded-xl border dark:border-white/5 border-black/5">
              <div className="text-[8px] text-slate-500 font-mono tracking-wider">BALANCE</div>
              <div className="text-[11px] font-mono font-bold text-[#22C55E] mt-0.5">
                ₹{user.balance.toLocaleString()}
              </div>
            </div>
            <div className="dark:bg-[#030712] dark:bg-white/5 bg-black/50 p-2 rounded-xl border dark:border-white/5 border-black/5">
              <div className="text-[8px] text-slate-500 font-mono tracking-wider">HEALTH</div>
              <div className="text-[11px] font-mono font-bold text-[#FACC15] mt-0.5">
                {user.financeScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection List with beautiful sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin">
          {sections.map((section, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-4 py-1 text-[8px] font-mono tracking-[0.25em] text-slate-500 uppercase font-bold">
                {section.title}
              </div>
              
              {section.items.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all duration-300 relative group cursor-pointer ${
                      isActive
                        ? "text-[#EF4444]"
                        : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.01]"
                    }`}
                  >
                    {/* Active selection background capsule pill */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-[#EF4444]/10 border-l-[3px] border-[#EF4444] rounded-xl pointer-events-none"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    
                    <Icon className={`h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#EF4444]" : "text-slate-500"}`} />
                    <span className="relative z-10 text-[11px] truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Rebuilt Logout Button */}
        <div className="p-4 border-t dark:border-white/5 border-black/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border dark:border-white/5 border-black/5 hover:border-red-500/25 dark:bg-[#030712] bg-white/20 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all duration-300 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            De-Authorize
          </button>
        </div>
      </nav>
    </>
  );
}
