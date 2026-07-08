import { useState } from "react";
import { User } from "../types";
import { 
  Sparkles, Send, ShieldAlert, Cpu, HeartPulse, Target, 
  HelpCircle, MessageSquare, Loader, CornerDownLeft, Terminal
} from "lucide-react";

interface CopilotProps {
  user: User;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  imageUrl?: string;
}

export default function Copilot({ user }: CopilotProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAdvisorType, setActiveAdvisorType] = useState<"advisor" | "coach" | "security" | "planner">("advisor");

  const preSets = {
    advisor: [
      { text: "Can I afford high-end digital electronics this month?", label: "Purchase Coach" },
      { text: "How do I easily start saving money inside index funds?", label: "Investment Tip" }
    ],
    coach: [
      { text: "How can I cut my weekend restaurant dining bills?", label: "Spending Advice" },
      { text: "Draft an automated ₹5,000 monthly savings sweep plan.", label: "Savings Plan" }
    ],
    security: [
      { text: "Why was my Paris Gucci charge flagged as suspicious?", label: "Fraud Alert" },
      { text: "How can I check the safety of a seller's QR code?", label: "Safety Scan" }
    ],
    planner: [
      { text: "Draft a simple timeline to save ₹50,000 for a laptop.", label: "Savings Goal" },
      { text: "Is it worth upgrading to a monthly premium subscription?", label: "Sub Analysis" }
    ]
  };

  const adviceChannels = [
    { id: "advisor", label: "Smart Financial Advisor", theme: "#EF4444", icon: Cpu },
    { id: "coach", label: "Spending & Savings Coach", theme: "#FACC15", icon: HeartPulse },
    { id: "security", label: "Safety & Scam Guard", theme: "#EF4444", icon: ShieldAlert },
    { id: "planner", label: "Savings Goal Planner", theme: "#FACC15", icon: Target }
  ];

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1] ?? "";
          resolve(base64);
        } else {
          reject(new Error("Unable to read file."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const clearImageSelection = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAsk = async (textToSend: string) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText && !selectedImage) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: trimmedText || "Sent an image for analysis.",
      imageUrl: imagePreview ?? undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      let image_base64: string | undefined;
      let image_mime_type: string | undefined;

      if (selectedImage) {
        image_base64 = await fileToBase64(selectedImage);
        image_mime_type = selectedImage.type || "image/png";
      }

      const res = await fetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedText,
          userRole: user.role,
          currentBalance: user.balance,
          userName: user.name,
          userIncome: user.income,
          userFinanceScore: user.financeScore,
          image_base64,
          image_mime_type
        })
      });
      const data = await res.json();
      const botResponse = data.response || "Sorry, I couldn't generate a response right now. Please try again.";

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: botResponse
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: "bot",
        text: "Sorry! We are experiencing a small connection request overflow. Please wait a moment and try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      clearImageSelection();
    }
  };

  return (
    <div className="space-y-8 dark:text-white text-slate-900">
      
      {/* Title */}
      <div className="border-b dark:border-white/5 border-black/5 pb-6">
        <h2 className="text-2xl font-sans font-extrabold tracking-tight flex items-center gap-2.5">
          <Cpu className="h-6 w-6 text-[#EF4444]" /> Nexus Advisor
        </h2>
        <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">An easy way to ask budget questions, explore simple subscription tips, and plan custom savings goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sidebar panels selector */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border dark:border-white/5 border-black/5 backdrop-blur-md space-y-6">
          <h3 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase">CHOOSE HELPER TOPIC</h3>
          
          <div className="space-y-3">
            {adviceChannels.map(ch => {
              const Icon = ch.icon;
              const isActive = activeAdvisorType === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveAdvisorType(ch.id as any)}
                  className={`w-full flex items-center gap-3.5 p-4 rounded-xl text-left border transition-all text-xs font-semibold cursor-pointer ${
                    isActive 
                      ? "dark:bg-[#0c1328] bg-white dark:border-white/10 border-black/10 dark:text-white text-slate-900 shadow-lg shadow-[#EF4444]/5" 
                      : "dark:bg-[#070B16] bg-slate-50/50 border-transparent dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? ch.theme : "#9ca3af" }} />
                  <div>
                    <span className="block">{ch.label}</span>
                    <span className="text-[10px] font-mono dark:text-gray-500 text-slate-400 font-medium">Helper Topic Active</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-tr from-[#EF4444]/10 to-[#FACC15]/10 border border-[#EF4444]/20">
            <span className="text-[10px] font-mono text-[#EF4444] font-semibold block uppercase">My Wallet Balance</span>
            <p className="text-[11px] dark:text-gray-400 text-slate-500 mt-1.5 leading-relaxed font-sans">
              Unlike generic articles, your friendly AI money guide helps read your current wallet balance (₹{user.balance.toLocaleString()}) to provide easy advice.
            </p>
          </div>
        </div>

        {/* Console space with input and responses */}
        <div className="lg:col-span-2 p-6 rounded-2xl dark:bg-[#0c1328] bg-white border dark:border-white/5 border-black/5 flex flex-col justify-between min-h-[500px]">
          
          {/* Answer display context */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-2 scrollbar-thin">
            
            <div className="flex items-center gap-2 border-b dark:border-white/5 border-black/5 pb-3">
              <Sparkles className="h-4 w-4 text-[#FACC15] animate-pulse" />
              <span className="text-xs font-mono dark:text-gray-400 text-slate-500 uppercase">Friendly Advisor Tips</span>
            </div>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-xs dark:text-gray-500 text-slate-400 gap-2">
                  <MessageSquare className="h-6 w-6 text-gray-600" />
                  Select a question above or type your own message below to start the conversation.
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed font-sans tracking-wide whitespace-pre-line ${
                      msg.sender === "user"
                        ? "bg-[#07101D] border border-[#00C6FF]/20 text-right self-end"
                        : "bg-white/[0.01] border dark:border-white/5 border-black/5 text-left"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-widest dark:text-gray-400 text-slate-500 mb-2">
                      {msg.sender === "user" ? "You" : "Nexus OS"}
                    </div>
                    <div>{msg.text ? msg.text.replace(/\*/g, "") : ""}</div>
                    {msg.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border dark:border-white/10 border-black/10">
                        <img src={msg.imageUrl} alt="Uploaded" className="w-full object-cover" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="rounded-2xl p-4 border border-dashed border-[#EF4444]/40 bg-[#07101D] text-xs dark:text-gray-400 text-slate-500 flex items-center gap-2">
                  <Loader className="h-4 w-4 text-[#EF4444] animate-spin" />
                  Sending your question to the chatbot...
                </div>
              )}
            </div>
          </div>

          {/* Form and preset presets */}
          <div className="mt-6 pt-4 border-t dark:border-white/5 border-black/5 space-y-4">
            
            {/* Presets chips */}
            <div className="flex flex-wrap gap-2">
              {preSets[activeAdvisorType].map(pre => (
                <button
                  key={pre.text}
                  onClick={() => {
                    setQuery(pre.text);
                    handleAsk(pre.text);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border dark:border-white/5 border-black/5 text-[10px] dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 transition-colors duration-200 cursor-pointer text-left"
                >
                  <span className="text-[#EF4444] font-mono mr-1.5">[{pre.label}]</span> {pre.text}
                </button>
              ))}
            </div>

            {/* Image upload preview */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest dark:text-gray-400 text-slate-500">
                <span className="font-semibold dark:text-white text-slate-900">Upload image for analysis</span>
                <span className="text-[10px] dark:text-gray-500 text-slate-400">optional</span>
              </label>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file) {
                      setSelectedImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      clearImageSelection();
                    }
                  }}
                  className="w-full text-[10px] text-gray-200 file:rounded-full file:border-0 file:bg-[#111827] file:px-3 file:py-2 file:text-xs file:dark:text-white text-slate-900 file:cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden border dark:border-white/10 border-black/10 bg-[#07101D]">
                    <img src={imagePreview} alt="Selected" className="w-full object-cover max-h-56" />
                    <button
                      type="button"
                      onClick={clearImageSelection}
                      className="absolute top-2 right-2 rounded-full bg-black/70 px-3 py-1 text-[10px] dark:text-white text-slate-900"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Input send bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleAsk(query); }} className="relative flex items-center gap-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask your Coach (e.g. Can I afford higher studies fund this month?)"
                className="flex-1 dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl pl-4 pr-12 py-3.5 text-xs dark:text-white text-slate-900 placeholder-gray-500 focus:outline-none focus:border-[#EF4444] transition-all"
              />
              <button
                type="submit"
                disabled={loading || (!query && !selectedImage)}
                className="bg-gradient-to-tr from-[#EF4444] to-[#FACC15] hover:opacity-90 disabled:opacity-40 dark:text-white text-slate-900 px-4 py-2 rounded-lg cursor-pointer transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
