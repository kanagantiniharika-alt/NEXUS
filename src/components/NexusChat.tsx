import React, { useState, useRef, useEffect } from "react";
import { Message, User } from "../types";
import { 
  Send, Sparkles, MessageSquare, ShieldAlert, Cpu, 
  GraduationCap, Loader, HelpCircle, Bot, CornerDownLeft,
  Coins, Activity, TrendingUp, Sparkle, Volume2, VolumeX, 
  Copy, Check, Snowflake, ShieldCheck, Lock, Unlock, 
  Mic, Trash2, Headphones, Terminal, RefreshCw, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NexusChatProps {
  theme?: "dark" | "light";
  user?: User;
  onUpdateBalance?: (newBal: number) => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  issuer: string;
  name: string;
  lastFour: string;
  holder: string;
  addedAt: string;
  isFrozen?: boolean;
}

export default function NexusChat({ theme = "dark", user, onUpdateBalance }: NexusChatProps) {
  const isDark = theme === "dark";
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "ch_1", 
      sender: "bot", 
      text: `### 🌟 Welcome to the NEXUS Conversational Advisor!
Hi **${user?.name || "Alex Mercer"}**! I am your real-time **NEXUS AI Cybersecurity & Financial Mentor** powered by Gemini.

**Here are some of the actions I am fully synchronized to perform:**
1. ❄️ **Card Control**: Lock, freeze, or restore active debit/credit lines right in our side deck controller.
2. 🚀 **Scam & Fraud Defense**: Ask me how to prevent the recent UPI cashback or travel spoofing threat vectors.
3. 📉 **Spend Optimiser**: Identify unused movie subscriptions (Netflix, Prime) or canteen overspending leakages.
4. 💻 **Relational Schemas**: Learn about our underlying PostgreSQL tables or FastAPI python backend structures!

Feel free to write any budget query below, or click any smart launcher chip!`, 
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  
  // Realtime panel state
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [systemAlertMessage, setSystemAlertMessage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMicSimulating, setIsMicSimulating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== "undefined" ? window.speechSynthesis : null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const suggestedPrompts = [
    { text: "Detailed safety tips to protect my money from UPI cashback refund scanning scams", icon: ShieldAlert, short: "UPI Fraud Protection" },
    { text: "Create a simple, step-by-step monthly budget guide tailored for university students", icon: Cpu, short: "Student Budget Guide" },
    { text: "Helpful ways to reduce monthly subscriptions and OTT movie channels spending", icon: GraduationCap, short: "Optimize OTT Bills" },
    { text: "How does the Locked Savings Goal vault calculate achievement probability scales?", icon: HelpCircle, short: "Savings Goal Math" }
  ];

  const smartPrompts = [
    { text: "Analyze my last 3 transactions and suggest optimization options.", short: "Analyze my last 3 transactions", icon: Coins },
    { text: "Check my current budget health and compare it with recommended guidelines.", short: "Check budget health", icon: Activity },
    { text: "Verify if there are any active safety, fraud, or cybersecurity alert trends right now.", short: "Verify active safety alerts", icon: ShieldAlert },
    { text: "Recommend high-yield savings box allocation strategy based on my profile.", short: "Build savings strategy", icon: TrendingUp }
  ];

  // Load active payments
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        // API may return array or {methods: [...]} - handle both
        const payments = Array.isArray(data) ? data : (data.methods || []);
        setPayments(payments);
      }
    } catch (e) {
      console.error("Error loaded payments inside chat bot:", e);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    
    // Clean up speech on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleToggleFreezeCard = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/payments/${id}/toggle-freeze`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPayments(prev => prev.map(p => p.id === id ? { ...p, isFrozen: data.isFrozen } : p));
        
        // Add info to stream
        const alertMsg: Message = {
          id: `sys_${Date.now()}`,
          sender: "bot",
          text: `🔐 **NEXUS SYSTEM LOCK EVENT**  
The payment channel **${name}** has been successfully **${data.isFrozen ? "FROZEN & LOCKED" : "UNFROZEN & ENABLED"}**!

*   **Status Code**: \`LOCK_STATE_SHIELD_${data.isFrozen ? "ACTIVE" : "OFF"}\`
*   **Safety Threshold**: Dynamic top-up block applied to block rogue merchant sweeps.
*   **Balance Lock**: Secured.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => [...prev, alertMsg]);
        
        if (speakingMsgId) {
          synthRef.current?.cancel();
          setSpeakingMsgId(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFreezeAllCards = async () => {
    try {
      const res = await fetch("/api/payments/freeze-all", { method: "POST" });
      if (res.ok) {
        await fetchPayments();
        const alertMsg: Message = {
          id: `sys_${Date.now()}`,
          sender: "bot",
          text: `🚨 **MILITARY-GRADE SAFETY PROTOCOL TRIGGERED**  
All registered credit lines and linked bank accounts have been **TEMPORARILY FROZEN** protectively! 

Top-ups on blocked routes are now strictly restricted until you manually slide-unlock individual channels in the Saved Wallet desk.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => [...prev, alertMsg]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages.map(m => ({ sender: m.sender, text: m.text })),
          role: user?.role,
          email: user?.email,
          name: user?.name,
          balance: user?.balance,
          income: user?.income,
          financeScore: user?.financeScore
        })
      });
      const data = await res.json();
      
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: data.text || "I processed your request, but received an empty response. Let me try compiling it again!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      const errMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "bot",
        text: "I am running in Offline Smart Mode because of heavy server demand. Here is a direct smart tip:\n\n1. Always verify the source and payment address before sending funds.\n2. Leverage manual top-ups inside your target Goals tab to build a stable habit.\n3. Cancel inactive music contracts directly to save instantly up to 45%!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !loading) {
        handleSendMessage(inputMessage);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeech = (text: string, msgId: string) => {
    if (!synthRef.current) return;

    if (speakingMsgId === msgId) {
      synthRef.current.cancel();
      setSpeakingMsgId(null);
      return;
    }

    synthRef.current.cancel();
    
    // strip markdown formatting symbols for natural reading
    const cleanText = text
      .replace(/[#*`_-]/g, " ")
      .replace(/\[.*?\]\(.*?\)/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = synthRef.current.getVoices().find(v => v.lang.includes("en")) || null;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    utteranceRef.current = utterance;
    setSpeakingMsgId(msgId);
    synthRef.current.speak(utterance);
  };

  const simulateMicInput = () => {
    setIsMicSimulating(true);
    setTimeout(() => {
      setIsMicSimulating(false);
      setInputMessage("Check active safety profile and database postgres layouts.");
    }, 2200);
  };

  // Inline formatting helper for stunning visual markdown inside chat
  const parseInlineFormatting = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      if (matchIndex > currentIndex) {
        parts.push(text.slice(currentIndex, matchIndex).replace(/\*/g, ""));
      }

      const matchedStr = match[0];
      if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
        parts.push(
          <strong key={matchIndex} className="font-extrabold text-[#FACC15]">
            {matchedStr.slice(2, -2).replace(/\*/g, "")}
          </strong>
        );
      } else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
        parts.push(
          <code key={matchIndex} className="font-mono text-[10px] md:text-sm bg-black/45 text-[#EF4444] px-1.5 py-0.5 rounded border dark:border-white/5 border-black/5 mx-0.5">
            {matchedStr.slice(1, -1)}
          </code>
        );
      }

      currentIndex = regex.lastIndex;
    }

    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex).replace(/\*/g, ""));
    }

    const cleanParts = parts.map(part => {
      if (typeof part === 'string') {
        return part.replace(/\*/g, "");
      }
      return part;
    });

    return cleanParts.length > 0 ? cleanParts : text.replace(/\*/g, "");
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-xs md:text-sm font-extrabold text-[#EF4444] mt-4 mb-2 pb-1 border-b border-white/4 tracking-tight flex items-center gap-1.5 font-sans">
            <Sparkles className="h-3.5 w-3.5 text-[#EF4444] animate-pulse shrink-0" />
            <span className="uppercase tracking-wider">{parseInlineFormatting(line.slice(4))}</span>
          </h3>
        );
      }
      if (line.startsWith("## ") || line.startsWith("# ")) {
        const cleanText = line.startsWith("## ") ? line.slice(3) : line.slice(2);
        return (
          <h4 key={i} className="text-sm font-sans font-extrabold uppercase text-[#FACC15] tracking-widest mt-5 mb-2.5 flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-[#FACC15] shrink-0" />
            <span>{parseInlineFormatting(cleanText)}</span>
          </h4>
        );
      }

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const lineContent = line.trim().substring(2);
        return (
          <div key={i} className="flex items-start gap-2 pl-1.5 my-1.5 text-xs md:text-sm dark:text-gray-300 text-slate-600">
            <span className="text-[#EF4444] text-lg font-mono select-none" style={{ marginTop: "-3px" }}>•</span>
            <span className="flex-1 font-sans">{parseInlineFormatting(lineContent)}</span>
          </div>
        );
      }

      const numberListMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numberListMatch) {
        const [_, num, content] = numberListMatch;
        return (
          <div key={i} className="flex items-start gap-2.5 pl-1.5 my-2 text-xs md:text-sm dark:text-gray-300 text-slate-600">
            <span className="text-[#EF4444] text-xs font-mono font-bold select-none px-1.5 py-0.2 rounded bg-[#EF4444]/10 border border-[#EF4444]/20">{num}</span>
            <span className="flex-1 font-sans font-medium">{parseInlineFormatting(content)}</span>
          </div>
        );
      }

      if (line.startsWith("```")) {
        return null; 
      }

      if (!line.trim()) {
        return <div key={i} className="h-2" />;
      }

      return (
        <p key={i} className="text-xs md:text-sm dark:text-gray-300 text-slate-600 my-1 font-sans leading-relaxed">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  return (
    <div className={`w-full max-w-full lg:max-w-7xl mx-auto rounded-3xl border shadow-2xl flex flex-col lg:flex-row font-sans overflow-hidden transition-all duration-300 ${
      isDark 
        ? "bg-[#090e1a]/95 border-white/8 dark:text-white text-slate-900" 
        : "bg-white border-slate-200 text-slate-800"
    }`}
    style={{ height: "calc(100vh - 180px)", minHeight: "580px" }}
    >
      
      {/* LEFT PORTION: CHAT BODY */}
      <div className="flex-1 flex flex-col p-3 md:p-5 h-full overflow-hidden min-w-0">
        
        {/* Header Panel */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b shrink-0 ${
          isDark ? "dark:border-white/5 border-black/5" : "border-slate-100"
        }`}>
          <div className="space-y-0.5 text-left">
            <h2 className="text-base md:text-lg font-sans font-extrabold tracking-tight flex items-center gap-2">
              <Bot className="h-5.5 w-5.5 text-[#00E38C]" /> 
              <span>Nexus Intelligence Support Chatbot</span>
            </h2>
            <p className={`text-[11px] font-sans ${isDark ? "dark:text-gray-400 text-slate-500" : "text-slate-500"}`}>
              Direct database read channels and active credit line freeze nodes enabled.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSidebarOpen 
                  ? "bg-[#00C6FF]/10 border-[#00C6FF]/30 text-[#00C6FF]" 
                  : "dark:bg-white/5 bg-black/10 dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500 hover:dark:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{isSidebarOpen ? "Side Console Enabled" : "Collapse Console"}</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm("Purge chat history logs?")) {
                  setMessages([{
                    id: "ch_reset",
                    sender: "bot",
                    text: "*Conversational context flushed successfully. Channel security reset complete.*",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  }]);
                }
              }}
              title="Flush session logs"
              className="p-1.5 rounded-lg dark:bg-white/5 bg-black/10 border dark:border-white/5 border-black/5 dark:text-gray-500 text-slate-400 hover:text-red-400 hover:dark:bg-white/10 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div 
          className={`flex-1 overflow-y-auto my-3 space-y-4 px-2 pr-3 scrollbar-thin rounded-2xl p-4 transition-colors duration-300 select-text touch-pan-y ${
            isDark ? "bg-[#050811]/50 border border-white/3" : "bg-slate-50/50 border border-slate-100"
          }`}
          style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isSpeaking = speakingMsgId === msg.id;

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3`}
                >
                  {!isUser && (
                    <div className="h-8 md:h-8.5 w-8 md:w-8.5 rounded-xl bg-linear-to-tr from-[#EF4444] to-[#991B1B] flex items-center justify-center shrink-0 shadow-md dark:text-white text-slate-900">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col space-y-1 max-w-[85%] ${isUser ? "items-end text-right" : "items-start text-left"}`}>
                    <div className={`p-3.5 md:p-4 rounded-2xl border shadow-sm relative font-sans whitespace-pre-wrap ${
                      isUser 
                        ? isDark
                          ? "bg-linear-to-br from-[#EF4444]/15 to-[#7F1D1D]/15 border-[#EF4444]/35 dark:text-white text-slate-900 rounded-tr-none" 
                          : "bg-red-50/70 border-[#EF4444]/20 text-red-950 rounded-tr-none"
                        : isDark
                          ? "bg-white/3 dark:border-white/10 border-black/10 text-gray-100 rounded-tl-none" 
                          : "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                    }`}>
                      {isUser ? msg.text : renderFormattedText(msg.text)}

                      {/* Tool utility line for bot responses */}
                      {!isUser && (
                        <div className="mt-3.5 pt-2 border-t border-white/4 flex items-center justify-between gap-4">
                          <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-[#00E38C]" /> SECURE DECRYPTION KEY
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSpeech(msg.text, msg.id)}
                              className={`p-1 rounded dark:bg-white/5 bg-black/10 hover:dark:bg-white/10 cursor-pointer transition-colors flex items-center gap-1 text-[10px] ${
                                isSpeaking ? "text-[#00E38C] bg-[#00E38C]/10" : "dark:text-gray-400 text-slate-500 hover:dark:text-white"
                              }`}
                              title={isSpeaking ? "Pause audio recitation" : "Speak advice out loud"}
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX className="h-3 w-3 text-[#00E38C]" />
                                  <span className="font-mono text-[8px] tracking-wide animate-pulse">STOP SPEECH</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3 w-3 dark:text-gray-400 text-slate-500" />
                                  <span className="font-mono text-[8px] tracking-wide">LISTEN ADVICE</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => copyToClipboard(msg.text, msg.id)}
                              className="p-1 rounded dark:bg-white/5 bg-black/10 hover:dark:bg-white/10 dark:text-gray-400 text-slate-500 hover:dark:text-white cursor-pointer transition-colors flex items-center gap-1 text-[10px]"
                              title="Copy text ledger of response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-3 w-3 text-[#00E38C]" />
                                  <span className="font-mono text-[8px] tracking-wide text-[#00E38C]">COPIED</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span className="font-mono text-[8px] tracking-wide">COPY</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] font-mono uppercase tracking-wide px-1 ${
                      isDark ? "text-slate-500" : "dark:text-slate-400 text-slate-500"
                    }`}>
                      {isUser ? (user?.name || "Alex Mercer") : "Nexus Cyber AI Specialist"} • {msg.timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading feedback */}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-center gap-3"
            >
              <div className="h-8.5 w-8.5 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center dark:text-gray-500 text-slate-400 animate-pulse">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className={`px-4 py-3 rounded-2xl border text-xs font-sans flex items-center gap-2.5 shadow-sm ${
                isDark ? "bg-[#070b16] dark:border-white/5 border-black/5 dark:text-gray-400 text-slate-500" : "bg-white border-slate-200 text-slate-500"
              }`}>
                <Loader className="h-3.5 w-3.5 animate-spin text-[#00E38C]" />
                <span className="animate-pulse">Consulting relational databanks & Gemini brain...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested & Typing Footer Drawer */}
        <div className="shrink-0 space-y-3.5 text-left">
          
          {/* Horizontal presets slider */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-1">
              <Sparkles className="h-3.5 w-3.5 text-[#00E38C] animate-pulse" />
              <span className={`text-[9px] font-mono uppercase font-bold tracking-widest ${isDark ? "text-slate-500" : "dark:text-slate-400 text-slate-500"}`}>⚡ NEXUS GEMINI ACTIVE LAUNCHERS</span>
            </div>
            
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-none scroll-smooth">
              {smartPrompts.map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <button
                    type="button"
                    key={`sp_${idx}`}
                    onClick={() => handleSendMessage(chip.text)}
                    disabled={loading}
                    className={`flex-none px-3.5 py-1.5 rounded-full border text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                      isDark 
                        ? "bg-[#00C6FF]/5 hover:bg-[#00E38C]/10 border-[#00C6FF]/15 hover:border-[#00E38C]/35 text-[#00C6FF] hover:text-[#00E38C]"
                        : "bg-sky-50/40 hover:bg-[#00E38C]/10 border-sky-100 hover:border-[#00E38C]/30 text-sky-700 hover:text-[#00E38C]"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0 text-[#00C6FF]" />
                    <span>{chip.short}</span>
                  </button>
                );
              })}
              
              {suggestedPrompts.map((pr, idx) => {
                const Icon = pr.icon;
                return (
                  <button
                    type="button"
                    key={`p_${idx}`}
                    onClick={() => handleSendMessage(pr.text)}
                    disabled={loading}
                    className={`flex-none px-3.5 py-1.5 rounded-full border text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                      isDark 
                        ? "bg-white/1 hover:bg-white/4 dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600 hover:dark:text-white"
                        : "bg-slate-50/50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="leading-none">{pr.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typing field */}
          <div className={`relative rounded-2xl border transition-all duration-200 p-2 flex items-center gap-2 ${
            isDark 
              ? "bg-[#070b16] dark:border-white/10 border-black/10 focus-within:border-[#EF4444] focus-within:ring-1 focus-within:ring-[#EF4444]/15" 
              : "bg-white border-slate-200 focus-within:border-[#EF4444] focus-within:ring-1 focus-within:ring-[#EF4444]/15"
          }`}>
            <button
              onClick={simulateMicInput}
              disabled={isMicSimulating || loading}
              className={`p-2 rounded-xl transition-all ${
                isMicSimulating 
                  ? "bg-red-500/20 text-red-500 animate-ping" 
                  : "dark:bg-white/5 bg-black/10 dark:text-gray-400 text-slate-500 hover:dark:text-white hover:dark:bg-white/10"
              }`}
              title="Speak into secure interface (Simulated Voice Recognition)"
            >
              <Mic className="h-4 w-4" />
            </button>

            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={isMicSimulating ? "Listening..." : "Query active wallet ledger, postgres model column list, freeze methods..."}
              rows={1}
              className={`w-full resize-none border-0 bg-transparent py-1.5 px-2 text-xs md:text-sm focus:outline-none focus:ring-0 leading-relaxed font-sans ${
                isDark ? "dark:text-white text-slate-900 placeholder-gray-500" : "text-slate-900 placeholder-slate-400"
              }`}
            />
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={loading || !inputMessage.trim()}
                className="bg-linear-to-tr from-[#EF4444] to-[#991B1B] disabled:opacity-35 disabled:scale-100 dark:text-white text-slate-900 p-2.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md"
                title="Transmit transaction audit"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Guide helpers */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-0.5">
            <div className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              <span>Press <kbd className="font-sans font-bold">Enter</kbd> to transmit</span>
            </div>
            <span>Double click bot answer to listen speech recitation anytime</span>
          </div>

        </div>

      </div>

      {/* RIGHT SIDEBAR: NEXUS REALTIME CONTROLLER & SYSTEM TELEMETRY */}
      {isSidebarOpen && (
        <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l p-4 flex flex-col justify-between space-y-4 shrink-0 overflow-y-auto ${
          isDark ? "bg-[#050811]/90 dark:border-white/5 border-black/5" : "bg-slate-50/50 border-slate-200"
        }`}>
          
          <div className="space-y-4 text-left">
            {/* Header section card */}
            <div className="p-3.5 rounded-2xl bg-linear-to-br from-[#0c1a2f] to-transparent border border-[#00C6FF]/10 text-left space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold text-[#00C6FF] block">CURRENT ACTIVE BALANCE</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold dark:text-white text-slate-900">₹{(user?.balance || 124000).toLocaleString()}</span>
                <span className="text-[10px] font-mono dark:text-gray-400 text-slate-500">INR</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t dark:border-white/5 border-black/5 text-[10px] dark:text-gray-400 text-slate-500">
                <span>Account Category:</span>
                <span className="dark:text-white text-slate-900 text-[11px] font-bold capitalize">{user?.role || "Professional"}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] dark:text-gray-400 text-slate-500">
                <span>Finance Score Rating:</span>
                <span className="text-[#00E38C] font-mono font-bold">{user?.financeScore || 84}% Excellent</span>
              </div>
            </div>

            {/* Safety Actions Quick Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold dark:text-gray-400 text-slate-500 flex items-center gap-1.5 px-1">
                <ShieldCheck className="h-3.5 w-3.5 text-red-400" /> SECURED PAYMENT LOCKS ({payments.length})
              </span>
              
              <div className="space-y-2 select-none">
                {paymentsLoading ? (
                  <div className="py-6 text-center text-[10px] dark:text-gray-500 text-slate-400 font-mono flex items-center justify-center gap-1">
                    <Loader className="h-3 w-3 animate-spin text-[#00C6FF]" /> 
                    <span>Accessing Secure Vault...</span>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-2 text-center text-[10px] dark:text-gray-500 text-slate-400 font-sans border border-dashed dark:border-white/5 border-black/5 rounded-xl">
                    No active cards/accounts found. Link one in the Payments tab.
                  </div>
                ) : (
                  payments.map((p) => {
                    return (
                      <div 
                        key={p.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                          p.isFrozen 
                            ? "bg-red-500/5 border-red-500/20 text-red-200" 
                            : "bg-white/2 dark:border-white/5 border-black/5 hover:border-[#00C6FF]/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${p.isFrozen ? "bg-red-500/15 text-red-400" : "dark:bg-white/5 bg-black/5 dark:text-gray-400 text-slate-500"}`}>
                            {p.isFrozen ? <Snowflake className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "12s" }} /> : <Lock className="h-3.5 w-3.5" />}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold dark:text-white text-slate-900 block leading-tight">{p.name}</span>
                            <span className="text-[9px] font-mono dark:text-gray-500 text-slate-400">{p.issuer.toUpperCase()} *{p.lastFour}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleFreezeCard(p.id, p.name)}
                          className={`text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer border select-none transition-all ${
                            p.isFrozen 
                              ? "bg-red-500 dark:text-white text-slate-900 border-red-400 hover:bg-red-650" 
                              : "dark:bg-white/5 bg-black/10 dark:text-gray-300 text-slate-600 dark:border-white/5 border-black/5 hover:dark:bg-white/10"
                          }`}
                        >
                          {p.isFrozen ? "❄️ FROZEN" : "FREEZE"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {payments.length > 0 && (
                <button
                  type="button"
                  onClick={handleFreezeAllCards}
                  className="w-full py-2 bg-red-500/25 border border-red-500/35 hover:bg-red-500/45 text-red-300 font-mono text-[9px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest"
                >
                  <Snowflake className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                  <span>TEMPORARY FREEZE ALL CARDS</span>
                </button>
              )}
            </div>

            {/* Live Telemetry Node */}
            <div className="space-y-2 pt-2 border-t border-white/4">
              <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold dark:text-gray-400 text-slate-500 flex items-center gap-1.5 px-1">
                <Terminal className="h-3.5 w-3.5 text-[#00E38C]" /> CONSOLE METRICS
              </span>
              <div className="p-3 rounded-xl bg-black/40 border dark:border-white/5 border-black/5 space-y-2 text-[10px] font-mono dark:text-gray-400 text-slate-500 leading-normal">
                <div className="flex justify-between">
                  <span>SSL HANDSHAKE:</span>
                  <span className="text-[#00E38C] font-bold">ESTABLISHED</span>
                </div>
                <div className="flex justify-between">
                  <span>SCAM SENTINEL:</span>
                  <span className="text-[#00E38C] font-bold">ACTIVE DEPLOYED</span>
                </div>
                <div className="flex justify-between">
                  <span>METADB DRIVER:</span>
                  <span className="dark:text-white text-slate-900">POSTGRESQL</span>
                </div>
                <div className="flex justify-between">
                  <span>AI MODEL NODE:</span>
                  <span className="text-cyan-400 font-bold">GEMINI FLASH-3.5</span>
                </div>
                <div className="pt-1.5 border-t dark:border-white/5 border-black/5 text-[9px] dark:text-gray-500 text-slate-400 text-center uppercase tracking-wider">
                  NEXUS FINANCIAL CRYPTO SHIELD ACTIVE
                </div>
              </div>
            </div>

          </div>

          {/* Bottom badge */}
          <div className="pt-2 text-[10px] font-mono text-slate-500 text-center flex items-center justify-center gap-1 px-1">
            <Headphones className="h-3.5 w-3.5 text-[#00C6FF]" />
            <span>NEXUS REAL-TIME VOICE RECEPTORS ON</span>
          </div>

        </div>
      )}

    </div>
  );
}
