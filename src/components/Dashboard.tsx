import React, { useState, useEffect } from "react";
import { User, Transaction, FraudAlert, FinancialGoal } from "../types";
import { 
  ShieldAlert, TrendingUp, Cpu, Sparkles, CheckCircle2, 
  HelpCircle, ChevronRight, PlusCircle, LayoutGrid, Eye, EyeOff, Loader,
  Download, FileText, AlertTriangle, Coins, Bell, RefreshCw,
  PiggyBank, Target, Upload, X, FileSpreadsheet, ArrowUpRight, ArrowDownLeft, Calendar
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

const renderFormattedText = (text: string) => {
  if (!text) return "";
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-[#00C6FF]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

interface DashboardProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
}

export default function Dashboard({ user, onUpdateBalance }: DashboardProps) {
  const [isLight, setIsLight] = useState(() => localStorage.getItem("nexus_theme") === "light");
  
  useEffect(() => {
    const handler = () => {
      setIsLight(localStorage.getItem("nexus_theme") === "light");
    };
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 800);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // User-set monthly budget limit
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem("nexus_monthly_budget");
    return saved ? parseInt(saved) : (user.role === "student" ? 15000 : 50000);
  });
  const [budgetSliderVal, setBudgetSliderVal] = useState<number>(() => {
    const saved = localStorage.getItem("nexus_monthly_budget");
    return saved ? parseInt(saved) : (user.role === "student" ? 15000 : 50000);
  });

  // Keep synced with localStorage
  useEffect(() => {
    localStorage.setItem("nexus_monthly_budget", monthlyBudget.toString());
  }, [monthlyBudget]);

  useEffect(() => {
    // Keep slider matching outer changes
    setBudgetSliderVal(monthlyBudget);
  }, [monthlyBudget]);

  // Keep synced with role default changes on load if not customized
  useEffect(() => {
    const saved = localStorage.getItem("nexus_monthly_budget");
    if (!saved) {
      const defBudget = user.role === "student" ? 15000 : 50000;
      setMonthlyBudget(defBudget);
      setBudgetSliderVal(defBudget);
    }
  }, [user.role]);
  
  // Custom Transaction State
  const [newAmount, setNewAmount] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [newCategory, setNewCategory] = useState<"Food" | "Shopping" | "Travel" | "Bills" | "Education" | "Healthcare" | "Entertainment">("Food");
  const [newLocation, setNewLocation] = useState("Mumbai, IN");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvShowPanel, setCsvShowPanel] = useState(false);
  const [csvToast, setCsvToast] = useState<{ show: boolean; msg: string; type: "success" | "error" }>({ show: false, msg: "", type: "success" });

  // Widget Customizer / Reordering State
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    savingsGoal: true,
    scoreDial: true,
    riskMeter: true,
    budgetMonitor: true,
    quickAdd: true,
    expensePie: true,
    savingsLine: true,
    alertsFeed: true,
    insightsPanel: true,
    serpApiStats: true,
  });

  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    "savingsGoal", "scoreDial", "riskMeter", "budgetMonitor", "quickAdd", "expensePie", "savingsLine", "alertsFeed", "insightsPanel", "serpApiStats"
  ]);

  const [serpApiData, setSerpApiData] = useState<any[]>([]);
  const [serpApiView, setSerpApiView] = useState<"volume" | "tokens">("volume");

  // Fetch critical transaction data from fullstack endpoints
  useEffect(() => {
    fetchData();
  }, [user.role]);

  const fetchData = async () => {
    try {
      const txRes = await fetch("/api/transactions");
      const txData = await txRes.json();
      setTransactions(txData);

      const alertRes = await fetch("/api/fraud/alerts");
      const alertData = await alertRes.json();
      setAlerts(alertData);

      const insRes = await fetch("/api/dashboard/insights");
      const insData = await insRes.json();
      setInsights(insData.insights || []);

      // Fetch dynamic active goal records for consolidated PDF audit outputs
      const goalRes = await fetch("/api/goals");
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData || []);
      }

      // Fetch SerpApi usage telemetry
      const statsRes = await fetch("/api/serpapi/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSerpApiData(statsData);
      }
    } catch (err) {
      console.error("Failed to query full-stack portal assets:", err);
    }
  };

  const downloadFinancialReport = async () => {
    setIsGeneratingPdf(true);
    // Smooth delay simulating high precision cryptographic scanning process
    await new Promise(r => setTimeout(r, 600));
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // --- Color Palette ---
      const brandDark = [7, 11, 22];     // Deep Background
      const brandPanel = [11, 16, 32];   // Deep Slate Panel
      const accentCyan = [0, 198, 255];   // Bright Highlighting
      const accentPurple = [123, 97, 255]; // Accent Purple
      const accentGreen = [0, 227, 140];  // Stable Emerald

      // --- PAGE 1: TITLE & CORE INTELLIGENCE METRICS ---
      doc.setFillColor(7, 11, 22);
      doc.rect(0, 0, 210, 297, "F");

      // Draw top header band
      doc.setFillColor(11, 16, 32);
      doc.rect(0, 0, 210, 48, "F");

      // Decorative accent line under header
      doc.setFillColor(0, 198, 255);
      doc.rect(0, 47, 210, 1, "F");

      // Header Brand text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Financial Behavior Risk Report", 15, 20);

      doc.setFontSize(14);
      doc.setTextColor(0, 198, 255);
      doc.text("Safety & Budgeting Review", 15, 27);

      // Metatags on top right
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`REPORT_DATE: ${new Date().toLocaleDateString()}`, 130, 18);
      doc.text(`USER_NAME: ${user.name.toUpperCase()}`, 130, 23);
      doc.text(`ACCOUNT_STATUS: SAFE ACTIVE`, 130, 28);
      doc.text(`RISK_LEVEL: OPTIMAL`, 130, 33);

      // --- SECTION 1: USER CONTEXT & KPI CARDS ---
      let y = 60;

      // Card 1: Balance (Cyan themed)
      doc.setFillColor(11, 16, 32);
      doc.roundedRect(15, y, 55, 30, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(15, y, 55, 30, 4, 4, "S");
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("CURRENT NET BALANCE", 18, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(`INR ${user.balance.toLocaleString()}`, 18, y + 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 227, 140);
      doc.text("+5.2% Saved This Month", 18, y + 25);

      // Card 2: Financial Health Score (Purple themed)
      doc.setFillColor(11, 16, 32);
      doc.roundedRect(77, y, 55, 30, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(77, y, 55, 30, 4, 4, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("FINANCIAL HEALTH SCORE", 80, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(123, 97, 255);
      doc.text(`${user.financeScore}`, 80, y + 17);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("/100", 102, y + 17);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(123, 97, 255);
      doc.text("Grade: EXCELLENT STATUS", 80, y + 25);

      // Card 3: User Role / Income (Green themed)
      doc.setFillColor(11, 16, 32);
      doc.roundedRect(140, y, 55, 30, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(140, y, 55, 30, 4, 4, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("YOUR BUDGET PROFILE", 143, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 227, 140);
      doc.text(user.role.toUpperCase(), 143, y + 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Est Income: ₹${user.income.toLocaleString()}`, 143, y + 21);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 198, 255);
      doc.text("Account Status: Safe", 143, y + 26);

      // --- SECTION 2: EXPENDITURE ANALYTICS ENGINE ---
      y += 40;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("1. YOUR SPENDING BREAKDOWN", 15, y);
      
      // Draw a line
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.3);
      doc.line(15, y + 2, 195, y + 2);

      y += 8;
      const expenses = getExpensesByCategory();
      const totalSpend = expenses.reduce((sum, item) => sum + item.value, 0);

      // Create a neat modern styled data list
      doc.setFillColor(11, 16, 32);
      const categoryRows = Math.max(expenses.length, 3);
      doc.roundedRect(15, y, 180, categoryRows * 7 + 14, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(15, y, 180, categoryRows * 7 + 14, 4, 4, "S");

      let ey = y + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("CATEGORY GROUP", 20, ey);
      doc.text("AMOUNT SPENT", 85, ey);
      doc.text("RATIO CONTRIBUTION", 140, ey);

      ey += 2;
      doc.setDrawColor(50, 60, 80);
      doc.line(18, ey, 192, ey);

      if (expenses.length === 0) {
        ey += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No active transactional ledger entries found in memory.", 20, ey);
        ey += 4;
      } else {
        expenses.forEach((item) => {
          ey += 7;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          doc.text(item.name, 20, ey);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 198, 255);
          doc.text(`₹${item.value.toLocaleString()}`, 85, ey);

          const percent = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(1) : "0.0";
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(`${percent}%`, 140, ey);

          // Render miniature horizontal bar
          doc.setFillColor(30, 41, 59);
          doc.rect(158, ey - 2.5, 30, 2.5, "F");
          doc.setFillColor(123, 97, 255);
          const ratioWidth = totalSpend > 0 ? Math.ceil((item.value / totalSpend) * 30) : 0;
          doc.rect(158, ey - 2.5, ratioWidth, 2.5, "F");
        });
        ey += 4;
      }

      // --- SECTION 3: FRAUD INTEGRATED ASSESSMENT SYSTEM ---
      y = ey + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("2. SECURITY STATUS: SPENDING ALERTS", 15, y);

      doc.setDrawColor(30, 41, 59);
      doc.line(15, y + 2, 195, y + 2);

      y += 8;
      const alertsCount = Math.max(alerts.length, 1);
      doc.setFillColor(11, 16, 32);
      doc.roundedRect(15, y, 180, alertsCount * 14 + 14, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(15, y, 180, alertsCount * 14 + 14, 4, 4, "S");

      let ay = y + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("TRANSACTION ATTEMPT", 18, ay);
      doc.text("ALERT SEVERITY", 115, ay);
      doc.text("AI ADVISOR EXPLANATION", 145, ay);

      ay += 2;
      doc.setDrawColor(50, 60, 80);
      doc.line(18, ay, 192, ay);

      if (alerts.length === 0) {
        ay += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 227, 140);
        doc.text("ALL SECURE: NO UNUSUAL ALERTS RECORDED.", 18, ay);
        ay += 6;
      } else {
        alerts.forEach((item) => {
          ay += 8;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          doc.text(item.merchant || "Critical Event", 18, ay);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text((item.title || "Behavior Anomaly").substring(0, 45), 18, ay + 4);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          if (item.riskScore > 70) {
            doc.setTextColor(255, 77, 77);
            doc.text(`${item.riskScore}% CRITICAL`, 115, ay + 2);
          } else {
            doc.setTextColor(255, 159, 67);
            doc.text(`${item.riskScore}% MODERATE`, 115, ay + 2);
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(180, 180, 180);
          const splitReason = doc.splitTextToSize(item.reason, 44);
          doc.text(splitReason, 145, ay);

          ay += 7;
        });
      }

      // Footer
      doc.setFillColor(11, 16, 32);
      doc.rect(0, 282, 210, 15, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Financial Behavior Risk Report • Student Project Demo", 15, 290);
      doc.text("PAGE 1 of 2", 185, 290);

      // --- PAGE 2: SAVINGS GOAL VAULTS & EXTENDED TELEMETRY ---
      doc.addPage();
      doc.setFillColor(7, 11, 22);
      doc.rect(0, 0, 210, 297, "F");

      // Draw banner on Page 2
      doc.setFillColor(11, 16, 32);
      doc.rect(0, 0, 210, 25, "F");
      doc.setFillColor(123, 97, 255);
      doc.rect(0, 24, 210, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("SAVINGS GOALS PROFILE", 15, 16);

      y = 40;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("3. SAVINGS GOALS PROGRESS", 15, y);

      doc.setDrawColor(30, 41, 59);
      doc.line(15, y + 2, 195, y + 2);

      y += 8;
      
      const goalsCount = Math.max(goals.length, 1);
      doc.setFillColor(11, 16, 32);
      doc.roundedRect(15, y, 180, goalsCount * 14 + 14, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(15, y, 180, goalsCount * 14 + 14, 4, 4, "S");

      let gy = y + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("GOAL NAME", 20, gy);
      doc.text("TARGET AMOUNT", 85, gy);
      doc.text("ACCUMULATED SAVINGS", 120, gy);
      doc.text("PROGRESS PERCENTAGE", 155, gy);

      gy += 2;
      doc.setDrawColor(50, 60, 80);
      doc.line(18, gy, 192, gy);

      if (goals.length === 0) {
        gy += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No active savings goals found.", 20, gy);
        gy += 4;
      } else {
        goals.forEach((item) => {
          gy += 8;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(255, 255, 255);
          doc.text(item.name, 20, gy);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Duration: ${item.deadlineMonths} Mths • Class: ${item.category}`, 20, gy + 4);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(0, 198, 255);
          doc.text(`₹${item.targetAmount.toLocaleString()}`, 85, gy + 1);

          doc.setTextColor(0, 227, 140);
          doc.text(`₹${(item.savedAmount || 0).toLocaleString()}`, 120, gy + 1);

          const progressPercent = Math.min(100, Math.round(((item.savedAmount || 0) / item.targetAmount) * 100));
          doc.setTextColor(255, 255, 255);
          doc.text(`${progressPercent}%`, 155, gy + 1);

          doc.setFillColor(30, 41, 59);
          doc.rect(155, gy + 3, 30, 2, "F");
          doc.setFillColor(0, 227, 140);
          doc.rect(155, gy + 3, Math.ceil((progressPercent / 100) * 30), 2, "F");

          gy += 6;
        });
      }

      // --- SECTION 4: UNIFIED AUDIT TELEMETRY LOGS ---
      y = gy + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("4. LATEST LEDGER TRANSACTIONS AUDIT TELEMETRY", 15, y);

      doc.setDrawColor(30, 41, 59);
      doc.line(15, y + 2, 195, y + 2);

      y += 8;

      const recentTx = transactions.slice(0, 10);
      const rowCount = Math.max(recentTx.length, 1);
      doc.setFillColor(11, 16, 32);
      doc.roundedRect(15, y, 180, rowCount * 7 + 12, 4, 4, "F");
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(15, y, 180, rowCount * 7 + 12, 4, 4, "S");

      let ty = y + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("MERCHANT", 20, ty);
      doc.text("CATEGORY", 70, ty);
      doc.text("AMOUNT", 110, ty);
      doc.text("LOCATION", 140, ty);
      doc.text("VERDICT STATUS", 172, ty);

      ty += 2;
      doc.setDrawColor(50, 60, 80);
      doc.line(18, ty, 192, ty);

      if (recentTx.length === 0) {
        ty += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text("No registered transaction records inside active viewport.", 20, ty);
      } else {
        recentTx.forEach((tx) => {
          ty += 7;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text(tx.merchant.substring(0, 22), 20, ty);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(180, 180, 180);
          doc.text(tx.category, 70, ty);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 198, 255);
          doc.text(`₹${tx.amount.toLocaleString()}`, 110, ty);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(160, 160, 160);
          doc.text(tx.location, 140, ty);

          doc.setFont("helvetica", "bold");
          if (tx.riskStatus === "high") {
            doc.setTextColor(255, 77, 77);
          } else if (tx.riskStatus === "medium") {
            doc.setTextColor(255, 159, 67);
          } else {
            doc.setTextColor(0, 227, 140);
          }
          doc.text(tx.riskStatus.toUpperCase(), 172, ty);
        });
      }

      // Page footer 2
      doc.setFillColor(11, 16, 32);
      doc.rect(0, 282, 210, 15, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("CONFIDENTIAL SECURITY INTELLIGENCE MATRIX • POWERED BY NEXUS AI CORE ENGINE", 15, 290);
      doc.text("PAGE 2 of 2", 185, 290);

      // Trigger download
      doc.save(`NEXUS_Financial_Report_${user.name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generator process failure:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newMerchant) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(newAmount),
          merchant: newMerchant,
          category: newCategory,
          location: newLocation,
          date: new Date().toISOString().split("T")[0]
        })
      });
      const data = await res.json();
      
      // Real-time local state sweep
      setTransactions(prev => [data, ...prev]);
      onUpdateBalance(user.balance - parseFloat(newAmount));
      
      // Re-trigger visual alert assessments
      if (data.riskStatus === "high") {
        setAlerts(prev => [
          {
            id: `fr_${Date.now()}`,
            title: "Real-time High Risk Flags Spatially",
            type: "behavioral",
            riskScore: data.riskScore,
            merchant: data.merchant,
            amount: data.amount,
            reason: data.riskReason || "Unusual behavioral deviation scale.",
            details: "Security threshold triggered immediately via smart analytics.",
            date: data.date
          },
          ...prev
        ]);
      }

      // Trigger standard notifications updated event to refresh bells instantly
      window.dispatchEvent(new Event("notifications-updated"));

      setNewAmount("");
      setNewMerchant("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reorder Widget Helper
  const shiftWidgetOrder = (index: number) => {
    const nextOrder = [...widgetOrder];
    if (index < nextOrder.length - 1) {
      const temp = nextOrder[index];
      nextOrder[index] = nextOrder[index + 1];
      nextOrder[index + 1] = temp;
      setWidgetOrder(nextOrder);
    } else {
      // Loop back to start to reorder dynamically
      const temp = nextOrder[index];
      nextOrder.splice(index, 1);
      nextOrder.unshift(temp);
      setWidgetOrder(nextOrder);
    }
  };

  // Calculate high quality analytical categories from state
  const getExpensesByCategory = () => {
    const categories: Record<string, number> = {
      Food: 0, Shopping: 0, Travel: 0, Bills: 0, Education: 0, Healthcare: 0, Entertainment: 0
    };
    transactions.forEach(tx => {
      if (categories[tx.category] !== undefined) {
        categories[tx.category] += tx.amount;
      }
    });
    return Object.keys(categories).map(cat => ({
      name: cat, value: categories[cat]
    })).filter(item => item.value > 0);
  };

  const calculateDailySavingsProgress = () => {
    const dailyGoal = user.role === "student" ? 250 : 1200;
    const scoreFactor = (user.financeScore / 100) * 60;
    const balanceFactor = Math.min(40, ((user.balance % 10000) / 10000) * 40);
    const percentage = Math.min(100, Math.max(15, Math.round(scoreFactor + balanceFactor)));
    return {
      percentage,
      targetAmount: dailyGoal,
      currentSaved: Math.round(dailyGoal * (percentage / 100)),
    };
  };

  const getMonthlySavingsTrend = () => {
    return user.role === "student" ? [
      { name: "Feb", value: 1200 },
      { name: "March", value: 1900 },
      { name: "April", value: 1500 },
      { name: "May", value: 2400 },
      { name: "June", value: 2100 }
    ] : [
      { name: "Feb", value: 34000 },
      { name: "March", value: 43000 },
      { name: "April", value: 54000 },
      { name: "May", value: 68000 },
      { name: "June", value: 65000 }
    ];
  };

  const getLast7DaysData = () => {
    const data = [];
    const today = new Date("2026-06-21T12:00:00Z");
    const dailyIncomeBase = Math.round(user.income / 30);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const label = `${dayName} ${dayNum}`;

      const dayTxs = transactions.filter(tx => tx.date === dateStr);
      const totalSpent = dayTxs.reduce((sum, tx) => sum + tx.amount, 0);

      let dailyInflow = dailyIncomeBase;
      const seedVal = d.getDate();
      if (seedVal % 3 === 0) {
        dailyInflow += user.role === "student" ? 300 : 2500;
      } else if (seedVal % 5 === 0) {
        dailyInflow += user.role === "student" ? 150 : 1200;
      }

      data.push({
        dateStr,
        name: label,
        spending: totalSpent,
        income: dailyInflow
      });
    }
    return data;
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("Empty spreadsheet file uploaded.");

        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (lines.length === 0) throw new Error("The selected file is empty.");

        const firstLine = lines[0];
        const separator = (firstLine.split(";").length > firstLine.split(",").length) ? ";" : ",";

        const parseCSVLine = (line: string): string[] => {
          const parts: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              parts.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          parts.push(current.trim());
          return parts.map(p => p.replace(/^['"]|['"]$/g, "").trim());
        };

        const firstParts = parseCSVLine(firstLine);
        const hasHeaders = firstParts.some(part => {
          const lower = part.toLowerCase();
          return lower.includes("date") || lower.includes("time") || lower.includes("merchant") || lower.includes("source") || lower.includes("category") || lower.includes("amount") || lower.includes("cost") || lower.includes("price") || lower.includes("location");
        });

        let dateIdx = 0;
        let merchantIdx = 1;
        let categoryIdx = 2;
        let amountIdx = 3;
        let locationIdx = 4;

        if (hasHeaders) {
          const normalizedHeaders = firstParts.map(h => h.toLowerCase());
          const dIdx = normalizedHeaders.findIndex(h => h.includes("date") || h.includes("time") || h.includes("when"));
          if (dIdx !== -1) dateIdx = dIdx;

          const mIdx = normalizedHeaders.findIndex(h => h.includes("merchant") || h.includes("pay") || h.includes("source") || h.includes("vendor") || h.includes("desc") || h.includes("name"));
          if (mIdx !== -1) merchantIdx = mIdx;

          const cIdx = normalizedHeaders.findIndex(h => h.includes("category") || h.includes("type") || h.includes("tag") || h.includes("genre"));
          if (cIdx !== -1) categoryIdx = cIdx;

          const aIdx = normalizedHeaders.findIndex(h => h.includes("amount") || h.includes("cost") || h.includes("inr") || h.includes("price") || h.includes("value") || h.includes("val"));
          if (aIdx !== -1) amountIdx = aIdx;

          const lIdx = normalizedHeaders.findIndex(h => h.includes("location") || h.includes("geo") || h.includes("city") || h.includes("place") || h.includes("where"));
          if (lIdx !== -1) locationIdx = lIdx;
        }

        const transactionsToImport = [];
        const startIndex = hasHeaders ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const parts = parseCSVLine(line);
          if (parts.length === 0 || parts.every(p => !p)) continue;

          let date = parts[dateIdx];
          if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
            const foundDate = parts.find(p => /^\d{4}-\d{2}-\d{2}/.test(p) || /^\d{2}\/\d{2}\/\d{4}/.test(p));
            date = foundDate || new Date().toISOString().split("T")[0];
          }

          const merchant = parts[merchantIdx] || "Offline Merchant Vendor";
          const category = parts[categoryIdx] || "Bills";
          let rawAmt = parts[amountIdx] || "";
          let amount = parseFloat(rawAmt.replace(/[^\d.-]/g, ""));
          
          if (isNaN(amount) || amount <= 0) {
            for (const p of parts) {
              const parsedOpt = parseFloat(p.replace(/[^\d.-]/g, ""));
              if (!isNaN(parsedOpt) && parsedOpt > 0) {
                amount = parsedOpt;
                break;
              }
            }
          }

          if (isNaN(amount) || amount <= 0) {
            amount = 120;
          }

          const location = parts[locationIdx] || "Offline Mall Retailer";

          transactionsToImport.push({
            date,
            merchant,
            category: category as any,
            amount,
            location
          });
        }

        if (transactionsToImport.length === 0) {
          throw new Error("No valid transactions could be parsed. Keep standard columns: Date, Merchant, Category, Amount, Location");
        }

        const res = await fetch("/api/transactions/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: transactionsToImport })
        });

        if (res.ok) {
          const result = await res.json();
          setCsvToast({
            show: true,
            msg: `Successfully imported ${result.count} monthly transaction entries. Updated general ledger & current wallet balance!`,
            type: "success"
          });
          onUpdateBalance(result.newBalance);
          fetchData();
          window.dispatchEvent(new Event("notifications-updated"));
        } else {
          throw new Error("Failed server verification. Ingestion node returned status " + res.status);
        }
      } catch (err: any) {
        setCsvToast({
          show: true,
          msg: err.message || "Spreadsheet parse exception. Ensure proper formatting structure.",
          type: "error"
        });
      } finally {
        setCsvUploading(false);
        if (e.target) {
          e.target.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const pieColors = ["#00C6FF", "#7B61FF", "#00E38C", "#FF9F43", "#FF4D4D", "#FF007F", "#FDFD96"];

  const renderWidget = (widgetId: string, index: number) => {
    if (!visibleWidgets[widgetId]) return null;

    switch (widgetId) {
      case "savingsGoal":
        const savingsData = calculateDailySavingsProgress();
        const progress = savingsData.percentage;
        const isGoalOnTrack = progress >= 75;
        const isGoalPending = progress < 50;
        
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(0, 227, 140, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group flex flex-col justify-between transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#00E38C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className={`absolute -bottom-14 -left-14 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
              isGoalOnTrack ? "bg-[#00E38C]/10" : "bg-[#00C6FF]/10"
            }`} />
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#00E38C]" /> Daily Savings Goal
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wide border ${
                  isGoalOnTrack 
                    ? "bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/20" 
                    : isGoalPending 
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-[#00C6FF]/10 text-[#00C6FF] border-[#00C6FF]/20"
                }`}>
                  {isGoalOnTrack ? "highly optimal" : isGoalPending ? "boost needed" : "stable pace"}
                </span>
              </div>

              <div className="mt-4 mb-5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <div className="text-left">
                    <span className="text-[10px] dark:text-gray-500 text-slate-400 uppercase font-sans font-bold tracking-wider block">Estimated Saved Today</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-extrabold text-[#00E38C]">₹{savingsData.currentSaved.toLocaleString()}</span>
                      <span className="text-xs dark:text-gray-400 text-slate-500 font-mono">/ ₹{savingsData.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#00E38C] uppercase font-sans font-bold tracking-wider block">Goal Status</span>
                    <span className="text-lg font-mono font-extrabold dark:text-white text-slate-900">{progress}%</span>
                  </div>
                </div>

                <p className="text-[10px] dark:text-gray-400 text-slate-500 leading-relaxed font-sans text-left mt-1">
                  Dynamically calculated using active Finance Score (<strong className="dark:text-white text-slate-900 font-bold">{user.financeScore}</strong>) and net wallet balance limits.
                </p>
              </div>

              <div className="space-y-1.5 mt-4">
                <div className="w-full h-3 dark:bg-white/5 bg-black/5 rounded-full overflow-hidden border dark:border-white/5 border-black/5 relative p-[1px]">
                  <div 
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00C6FF] to-[#00E38C] shadow-[0_0_8px_rgba(0,227,140,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[8px] font-mono text-gray-600 px-1 pt-0.5">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/[0.02] border dark:border-white/5 border-black/5 rounded-xl mt-4 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-bold dark:text-gray-300 text-slate-600">
                <PiggyBank className="h-3.5 w-3.5 text-[#00E38C]" />
                <span>Behavioral Insights Channel</span>
              </div>
              <p className="text-[9px] dark:text-gray-400 text-slate-500 leading-relaxed font-sans mt-1">
                {progress >= 85 
                  ? "Outstanding consistency! Your top-tier visual financial behaviors keep daily goals highly protected today."
                  : progress >= 60
                  ? "Good progression rate. Maintain current categories bounds to trigger high savings achievements."
                  : "Needs enhancement. Your finance score suggests some limits can be streamlined via Nexus AI smart rules."}
              </p>
            </div>
          </motion.div>
        );

      case "budgetMonitor":
        const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const spendPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
        const reachedThreshold = spendPercentage >= 90;
        
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: reachedThreshold ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(0, 198, 255, 0.3)" }}
            className={`relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border backdrop-blur-xl p-6 group transition-all duration-300 ${reachedThreshold ? "border-red-500/40 bg-red-500/[0.03]" : "dark:border-white/5 border-black/5"}`}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {reachedThreshold && (
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none animate-pulse" />
            )}

            <h4 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase mb-4 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-[#00C6FF]" /> Smart Budget Tracker
            </h4>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] dark:text-gray-500 text-slate-400 font-sans block uppercase tracking-wider font-bold">TOTAL MONEY SPENT</span>
                  <span className="text-2xl font-mono font-extrabold dark:text-white text-slate-900">₹{totalSpent.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] dark:text-gray-500 text-slate-400 font-sans block uppercase tracking-wider font-bold">SET MONTHLY BUDGET</span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-sm font-mono font-bold text-[#00C6FF]">₹</span>
                    <input
                      type="number"
                      value={budgetSliderVal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBudgetSliderVal(val);
                      }}
                      onBlur={() => {
                        setMonthlyBudget(budgetSliderVal);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setMonthlyBudget(budgetSliderVal);
                        }
                      }}
                      className="w-20 bg-transparent text-right font-mono font-bold text-[#00C6FF] border-b dark:border-white/10 border-black/10 focus:outline-none focus:border-[#00C6FF] py-0 px-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="dark:text-gray-400 text-slate-500">Budget Spent: {spendPercentage.toFixed(1)}%</span>
                  {reachedThreshold ? (
                    <span className="text-[#FF4D4D] font-bold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> BUDGET ALERT (90%+)
                    </span>
                  ) : (
                    <span className="text-teal-400 font-bold">Safe Zone</span>
                  )}
                </div>
                <div className="w-full h-2.5 dark:bg-white/5 bg-black/5 rounded-full overflow-hidden border dark:border-white/5 border-black/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      reachedThreshold 
                        ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                        : spendPercentage >= 75
                        ? "bg-gradient-to-r from-red-600 to-red-400"
                        : "bg-gradient-to-r from-[#00C6FF] to-[#7B61FF]"
                    }`}
                    style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {reachedThreshold && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1 animate-fadeIn text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 animate-bounce" />
                    <span>BUDGET ALERT: SPENDING VERY HIGH</span>
                  </div>
                  <p className="text-[10px] dark:text-gray-300 text-slate-600 leading-relaxed font-sans">
                    You have spent <span className="font-bold dark:text-white text-slate-900">₹{totalSpent.toLocaleString()}</span> of your ₹{monthlyBudget.toLocaleString()} limit. Consider wrapping up secondary shopping or restaurant trips to keep your savings box protected.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t dark:border-white/5 border-black/5 text-left">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] uppercase font-mono dark:text-gray-400 text-slate-500">Quick Adjust Budget Limit (Slider)</label>
                  <span className="text-[10px] font-mono text-[#7B61FF]">₹{budgetSliderVal.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={budgetSliderVal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBudgetSliderVal(val);
                    setMonthlyBudget(val);
                  }}
                  className="w-full accent-[#7B61FF] dark:bg-white/10 bg-black/10 h-1 rounded-lg cursor-pointer"
                />
              </div>

            </div>
          </motion.div>
        );

      case "scoreDial":
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(123, 97, 255, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase mb-4">My Money Habits Score</h4>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="url(#healthGrad)" strokeWidth="8" fill="transparent"
                    strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * (typeof user?.financeScore === 'number' && !isNaN(user.financeScore) ? user.financeScore : 0)) / 100}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0px 0px 6px rgba(123,97,255,0.4))" }} />
                  <defs>
                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#7B61FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center z-10">
                  <span className="text-4xl font-mono font-extrabold dark:text-white text-slate-900">{user?.financeScore ?? 0}</span>
                  <span className="text-xs dark:text-gray-500 text-slate-400 block mt-0.5">HEALTHY</span>
                </div>
              </div>
              <p className="text-xs text-center dark:text-gray-400 text-slate-500 mt-4 leading-relaxed px-4">
                Score based on category allocation and goal progression progress. Keep it high!
              </p>
            </div>
          </motion.div>
        );

      case "riskMeter":
        const maxAlertRaw = alerts.length > 0 ? Math.max(...alerts.map(a => typeof a.riskScore === 'number' && !isNaN(a.riskScore) ? a.riskScore : 0)) : 10;
        const maxAlert = typeof maxAlertRaw === 'number' && !isNaN(maxAlertRaw) ? maxAlertRaw : 10;
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(255, 77, 77, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7B61FF] to-[#FF4D4D] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase mb-4">Unusual Security Alerts</h4>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="url(#riskGrad)" strokeWidth="8" fill="transparent"
                    strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * maxAlert) / 100}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0px 0px 6px rgba(255,77,77,0.4))" }} />
                  <defs>
                    <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7B61FF" />
                      <stop offset="100%" stopColor="#FF4D4D" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center z-10">
                  <span className="text-4xl font-mono font-extrabold text-[#FF4D4D]">{maxAlert}%</span>
                  <span className="text-xs dark:text-gray-500 text-slate-400 block mt-0.5">RISK LEVEL</span>
                </div>
              </div>
              <p className="text-xs text-center dark:text-gray-400 text-slate-500 mt-4 leading-relaxed px-4">
                Unusual transaction location flags. A domestic transaction in India took place right next to a foreign attempt.
              </p>
            </div>
          </motion.div>
        );

      case "quickAdd":
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(0, 198, 255, 0.3)" }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase mb-4 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-[#00C6FF]" /> Quickly Add a Transaction
            </h4>
            <form onSubmit={handleAddTransaction} className="space-y-3.5 text-left">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Merchant Name</label>
                <input
                  type="text" required value={newMerchant} onChange={e => setNewMerchant(e.target.value)}
                  placeholder="e.g. KFC Outlet, Amazon Grocery"
                  className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Amount (₹)</label>
                  <input
                    type="number" required value={newAmount} onChange={e => setNewAmount(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Category</label>
                  <select
                    value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-3 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF]"
                  >
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel</option>
                    <option value="Bills">Bills</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider dark:text-gray-400 text-slate-500 block mb-1">Transaction Location</label>
                <input
                  type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Delhi, IN (or Paris, FR)"
                  className="w-full dark:bg-[#070B16] bg-slate-50 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2.5 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-[#00C6FF] transition-all"
                />
              </div>
              <button
                type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] dark:text-white text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-[#7B61FF]/25"
              >
                {isSubmitting ? (
                  <Loader className="h-3 ml-1 animate-spin" />
                ) : "Add and Check Transaction"}
              </button>
            </form>
          </motion.div>
        );

      case "expensePie":
        const pieData = getExpensesByCategory();
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(0, 198, 255, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 md:col-span-2 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase mb-4">Where My Money Goes</h4>
            <div className="h-64 grid grid-cols-1 lg:grid-cols-2 items-center">
              {pieData.length === 0 ? (
                <div className="text-center text-xs dark:text-gray-500 text-slate-400 col-span-2 py-10">No transactions yet. Add some above to see your chart.</div>
              ) : (
                <>
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value"
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={isLight ? { backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" } : { backgroundColor: "#0c1328", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-2 text-left">
                    {pieData.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs border-b border-white/[0.03] pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                           <span className="dark:text-gray-300 text-slate-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-mono dark:text-white text-slate-900 text-right">₹{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );

      case "savingsLine":
        const lineData = getMonthlySavingsTrend();
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(0, 198, 255, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 md:col-span-2 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase mb-4">My Monthly Savings Trend</h4>
            <div className="h-60 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.03)"} />
                  <XAxis dataKey="name" stroke={isLight ? "#334155" : "rgba(255,255,255,0.3)"} fontSize={11} tickLine={false} />
                  <YAxis stroke={isLight ? "#334155" : "rgba(255,255,255,0.3)"} fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={isLight ? { backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px", fontSize: "12px" } : { backgroundColor: "#0c1328", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={3} dot={{ fill: "#00C6FF", r: 4 }} activeDot={{ r: 6 }} />
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#7B61FF" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );

      case "alertsFeed":
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(255, 77, 77, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF4D4D] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase mb-4 flex items-center gap-2 text-[#FF4D4D]">
              <ShieldAlert className="h-4 w-4 animate-bounce" /> Unusual Activity Alerts
            </h4>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-xs dark:text-gray-500 text-slate-400">Looks good! No unusual activity flags today.</div>
              ) : (
                alerts.map(al => (
                  <div key={al.id} className="p-4 rounded-xl dark:bg-[#0d1326] bg-slate-50 border-l-4 border-[#FF4D4D] space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-xs dark:text-white text-slate-900">{al.title}</span>
                      <span className="text-[10px] font-mono text-[#FF4D4D] font-extrabold bg-[#FF4D4D]/10 px-1.5 py-0.5 rounded">
                        {al.riskScore}% RISK
                      </span>
                    </div>
                    <p className="text-[11px] dark:text-gray-400 text-slate-500 font-sans leading-relaxed">{al.reason}</p>
                    <div className="text-[9px] text-[#7B61FF] font-mono">{al.merchant} • {al.date}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );

      case "insightsPanel":
        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(0, 227, 140, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#00E38C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#00C6FF]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00E38C] animate-pulse" /> NEXUS AI Core Insights
              </h4>
              <button 
                onClick={async () => {
                  setInsightsLoading(true);
                  try {
                    const insRes = await fetch("/api/dashboard/insights");
                    const insData = await insRes.json();
                    setInsights(insData.insights || []);
                  } catch (e) {
                    console.error("Failed to query customized insights:", e);
                  } finally {
                    setInsightsLoading(false);
                  }
                }}
                disabled={insightsLoading}
                className="text-[9px] font-mono font-bold uppercase text-[#00C6FF] hover:text-[#7B61FF] dark:bg-white/5 bg-black/5 hover:bg-[#00C6FF]/10 px-2.5 py-1 rounded-lg border dark:border-white/5 border-black/5 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {insightsLoading ? (
                  <Loader className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-2.5 w-2.5" />
                )}
                <span>Refresh AI</span>
              </button>
            </div>

            {insightsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs dark:text-gray-400 text-slate-500 gap-2">
                <Loader className="h-5 w-5 animate-spin text-[#00C6FF]" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#00C6FF]/60 animate-pulse">Running GenAI Engine...</span>
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-8 text-xs dark:text-gray-500 text-slate-400">No active financial advice generated yet.</div>
            ) : (
              <div className="space-y-4 text-left">
                {insights.map((ins, idx) => (
                  <div key={idx} className="flex gap-3 text-xs leading-relaxed dark:text-gray-300 text-slate-600 p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] rounded-xl transition-all">
                    <CheckCircle2 className="h-4 w-4 text-[#00E38C] shrink-0 mt-0.5" />
                    <span className="font-sans font-medium text-gray-200">{renderFormattedText(ins)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case "serpApiStats":
        const grouped: Record<string, any> = {};
        const serpArr = Array.isArray(serpApiData) ? serpApiData : (serpApiData ? Object.values(serpApiData) : []);
        serpArr.forEach((item: any) => {
          if (!item) return;
          const dt = item.date;
          if (!grouped[dt]) {
            grouped[dt] = {
              date: dt,
              volume: 0,
              tokens: 0,
              google: 0,
              google_maps: 0,
              google_trends: 0,
              google_shopping: 0
            };
          }
          grouped[dt].volume += item.calls || 0;
          grouped[dt].tokens += item.tokens || 0;
          if (item.engine === "google") grouped[dt].google += item.calls || 0;
          else if (item.engine === "google_maps") grouped[dt].google_maps += item.calls || 0;
          else if (item.engine === "google_trends") grouped[dt].google_trends += item.calls || 0;
          else if (item.engine === "google_shopping") grouped[dt].google_shopping += item.calls || 0;
        });

        const barChartData = Object.values(grouped)
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
          .map(item => {
            const dateStr = item.date || "";
            const parts = dateStr.split("-");
            return {
              ...item,
              name: parts.length === 3 ? `${parts[1]}/${parts[2]}` : dateStr
            };
          });

        const activeViewDataSum = barChartData.reduce((acc, curr) => acc + (serpApiView === "volume" ? curr.volume : curr.tokens), 0);

        return (
          <motion.div 
            key={widgetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4, border: "1px solid rgba(0, 198, 255, 0.3)" }}
            className="relative overflow-hidden rounded-2xl dark:bg-[#090d1c] bg-white/80 border dark:border-white/5 border-black/5 backdrop-blur-xl p-6 group flex flex-col justify-between transition-all duration-300 min-h-80"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shiftWidgetOrder(index)} className="p-1 hover:dark:bg-white/10 bg-black/10 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900" title="Reorder Widget">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#00C6FF]/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3 border-b dark:border-white/5 border-black/5 pb-2">
                <h4 className="text-xs font-mono tracking-wider dark:text-gray-400 text-slate-500 uppercase flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-[#00C6FF]" /> SerpApi Telemetry Node
                </h4>
                <div className="flex dark:bg-white/5 bg-black/5 rounded-lg p-0.5 border border-white/[0.03]">
                  <button
                    onClick={() => setSerpApiView("volume")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      serpApiView === "volume"
                        ? "bg-[#00C6FF]/20 text-[#00C6FF] border border-[#00C6FF]/30"
                        : "dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900"
                    }`}
                  >
                    Volume
                  </button>
                  <button
                    onClick={() => setSerpApiView("tokens")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      serpApiView === "tokens"
                        ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30"
                        : "dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900"
                    }`}
                  >
                    Tokens
                  </button>
                </div>
              </div>

              <div className="mb-3 text-left">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-sans font-extrabold tracking-tight dark:text-white text-slate-900">
                    {serpApiView === "volume" ? activeViewDataSum : activeViewDataSum.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-mono uppercase dark:text-gray-400 text-slate-500 dark:bg-white/5 bg-black/5 px-1.5 py-0.5 rounded">
                    {serpApiView === "volume" ? "total requests" : "units parsed"}
                  </span>
                </div>
                <p className="text-[10px] dark:text-gray-400 text-slate-500 font-sans mt-0.5 leading-relaxed">
                  Daily requested traffic volume across connected Search, Maps, Trends, and Shopping layers.
                </p>
              </div>

              <div className="h-40 w-full mt-2 font-mono text-[9px]">
                {barChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center dark:text-gray-500 text-slate-400">
                    No active SerpApi logs found on backend.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 0, left: -28, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#080d1a",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "10px",
                          fontFamily: "monospace"
                        }}
                      />
                      {serpApiView === "volume" ? (
                        <>
                          <Bar dataKey="google" name="Search" stackId="a" fill="#00C6FF" />
                          <Bar dataKey="google_maps" name="Maps" stackId="a" fill="#7B61FF" />
                          <Bar dataKey="google_trends" name="Trends" stackId="a" fill="#00E38C" />
                          <Bar dataKey="google_shopping" name="Shopping" stackId="a" fill="#FF9F43" radius={[3, 3, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="tokens" name="Tokens" fill="#7B61FF" radius={[3, 3, 0, 0]} />
                      )}
                      <Legend iconSize={5} wrapperStyle={{ fontSize: "7px", paddingTop: "6px" }} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b dark:border-white/5 border-black/5 pb-6 text-left">
        <div>
          <h2 className="text-2xl font-sans font-extrabold tracking-tight dark:text-white text-slate-900 flex items-center gap-2">
            My Wallet Dashboard
          </h2>
          <p className="text-xs dark:text-gray-400 text-slate-500 font-sans mt-1">Hello {user.name}! Here is a detailed real-time overview of your behaviors, budgets, and security audits.</p>
        </div>

        {/* Dashboard Actions and Customizer */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCsvShowPanel(prev => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              csvShowPanel 
                ? "bg-[#00E38C]/15 text-[#00E38C] border-[#00E38C]/30 shadow-[0_0_10px_rgba(0,227,140,0.15)]" 
                : "bg-[#0a0f1e]/60 hover:dark:bg-white/5 bg-black/5 dark:border-white/5 border-black/5 dark:text-gray-300 text-slate-600"
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-[#00E38C]" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={downloadFinancialReport}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#00C6FF] to-[#7B61FF] hover:from-[#00b2e6] hover:to-[#6a50e6] disabled:opacity-50 dark:text-white text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,198,255,0.2)] hover:shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download Report</span>
              </>
            )}
          </button>

          <div className="px-3 py-1.5 bg-[#0a0f1e]/60 rounded-xl border dark:border-white/5 border-black/5 flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5 text-[#00C6FF]" />
            <span className="text-[10px] font-mono dark:text-gray-400 text-slate-500 uppercase">Widgets:</span>
            <div className="flex gap-1.5">
              {Object.keys(visibleWidgets).filter(wid => !(user.role === "student" && wid === "quickAdd")).map((wid) => (
                <button
                  key={wid}
                  onClick={() => setVisibleWidgets(prev => ({ ...prev, [wid]: !prev[wid] }))}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                    visibleWidgets[wid] 
                      ? "bg-[#00C6FF]/10 text-[#00C6FF] border border-[#00C6FF]/20" 
                      : "dark:bg-white/5 bg-black/5 dark:text-gray-500 text-slate-400 border border-transparent"
                  }`}
                >
                  {{
                    savingsGoal: "Goal",
                    scoreDial: "Score",
                    riskMeter: "Risk",
                    budgetMonitor: "Budget",
                    quickAdd: "Add",
                    expensePie: "Pie",
                    savingsLine: "Trend",
                    alertsFeed: "Alerts",
                    insightsPanel: "Insights",
                    serpApiStats: "API"
                  }[wid] || wid}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-down statement/CSV uploader panel */}
      <AnimatePresence>
        {csvShowPanel && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-b from-[#0a0f1e]/80 to-[#070b16]/80 border dark:border-white/5 border-black/5 backdrop-blur-xl overflow-hidden space-y-4"
          >
            <div className="flex items-center justify-between border-b dark:border-white/5 border-black/5 pb-3 text-left">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#00E38C]" />
                <div>
                  <h3 className="font-sans font-extrabold dark:text-white text-slate-900 text-sm tracking-tight">Monthly Statement CSV Ingestion Node</h3>
                  <p className="text-[10px] dark:text-gray-400 text-slate-500 font-sans">Batch-upload offline bank lists directly into your Nexus analytics engine.</p>
                </div>
              </div>
              <button 
                onClick={() => setCsvShowPanel(false)}
                className="p-1 hover:dark:bg-white/5 bg-black/5 rounded dark:text-gray-400 text-slate-500 hover:dark:text-white text-slate-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <label 
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#00E38C]"); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-[#00E38C]"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-[#00E38C]");
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const inputElement = document.getElementById("csv_file_input") as HTMLInputElement;
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(file);
                      if (inputElement) {
                        inputElement.files = dataTransfer.files;
                        const changeEvent = new Event("change", { bubbles: true });
                        inputElement.dispatchEvent(changeEvent);
                      }
                    }
                  }}
                  className="flex flex-col items-center justify-center border border-dashed dark:border-white/10 border-black/10 hover:border-[#00E38C] bg-white/[0.01] hover:bg-[#00E38C]/[0.01] rounded-xl py-8 px-4 text-center cursor-pointer transition-all group relative"
                >
                  <input 
                    id="csv_file_input"
                    type="file" 
                    accept=".csv" 
                    onChange={handleCSVImport} 
                    className="hidden" 
                  />
                  
                  {csvUploading ? (
                    <div className="space-y-3">
                      <Loader className="h-8 w-8 text-[#00E38C] animate-spin mx-auto animate-bounce" />
                      <span className="text-xs font-mono font-bold text-[#00E38C]/80 uppercase tracking-wider block">Running Ingestion Matrix...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-8 w-8 dark:text-gray-500 text-slate-400 group-hover:text-[#00E38C] mx-auto transition-transform group-hover:-translate-y-1" />
                      <div>
                        <span className="text-xs font-sans dark:text-gray-300 text-slate-600 font-bold block">Drag & drop your bank statement here, or <span className="text-[#00E38C] group-hover:underline">browse files</span></span>
                        <span className="text-[9px] dark:text-gray-500 text-slate-400 font-mono mt-1 block uppercase">Supports Standard Comma-Separated Values (.csv)</span>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="lg:col-span-5 p-4 bg-black/40 rounded-xl border dark:border-white/5 border-black/5 space-y-2 text-left">
                <span className="text-[10px] font-mono uppercase text-[#00C6FF] font-bold block tracking-wider">Expected Column Header Format:</span>
                <div className="bg-[#070b16] p-2.5 rounded border dark:border-white/5 border-black/5 text-[9px] font-mono dark:text-gray-400 text-slate-500 overflow-x-auto whitespace-pre">
                  Date,Merchant,Category,Amount,Location<br/>
                  2026-06-20,Burger Joint Grill,Food,340,Delhi IN<br/>
                  2026-06-19,Amazon AWS Billing,Bills,4500,Online Gateway<br/>
                  2026-06-18,Uber Ride Premium,Travel,650,Mumbai IN
                </div>
                <p className="text-[9px] dark:text-gray-500 text-slate-400 font-sans leading-relaxed">
                  * Note: Uploading triggers automated behavioral risk metrics check. Inflow amounts automatically adjust overall balance accounts dynamically.
                </p>
              </div>
            </div>

            {csvToast.show && (
              <div className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                csvToast.type === "success" 
                  ? "bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/20" 
                  : "bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/20"
              }`}>
                <span className="font-sans font-medium">{csvToast.msg}</span>
                <button 
                  onClick={() => setCsvToast(prev => ({ ...prev, show: false }))}
                  className="text-[10px] font-mono hover:underline p-1 dark:text-gray-400 text-slate-500 capitalize cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Threshold Alert Notice Banner */}
      {(() => {
        const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const spendPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
        const reachedThreshold = spendPercentage >= 90;
        if (!reachedThreshold) return null;
        return (
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/10 border border-red-500/30 flex items-start gap-4 shadow-lg shadow-red-500/5 animate-fadeIn text-left">
            <div className="p-3 bg-red-500/20 text-red-500 rounded-xl shrink-0 animate-pulse">
              <ShieldAlert className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-sans font-extrabold dark:text-white text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span>BUDGET WARNING: 90%+ BUDGET USED</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold bg-red-500/30 text-red-200 animate-pulse uppercase">
                  {spendPercentage.toFixed(0)}% Used
                </span>
              </h3>
              <p className="text-xs dark:text-gray-300 text-slate-600 leading-relaxed font-sans">
                Attention {user.name}! You spent ₹{totalSpent.toLocaleString()} of your ₹{monthlyBudget.toLocaleString()} limit. Consider saving carefully over the next few days to keep your score high.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Three Sleek Recharts Micro-trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
        {(() => {
          const trendData = getLast7DaysData();
          const totalInflows = trendData.reduce((acc, curr) => acc + curr.income, 0);
          const totalOutflows = trendData.reduce((acc, curr) => acc + curr.spending, 0);
          const cushionBalance = totalInflows - totalOutflows;
          const savingsRate = totalInflows > 0 ? ((cushionBalance / totalInflows) * 100) : 0;

          return (
            <>
              {/* Card 1: 7-Day Inflows */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="rounded-2xl border dark:border-white/5 border-black/5 dark:bg-[#090d1c] bg-white/80 backdrop-blur-xl p-5 relative overflow-hidden flex flex-col justify-between h-40 group transition-all duration-300"
              >
                <div className="absolute top-0 right-0 p-3 text-emerald-400 opacity-[0.08] pointer-events-none group-hover:opacity-20 transition-opacity">
                  <ArrowUpRight className="h-10 w-10" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs dark:text-gray-400 text-slate-500 uppercase font-mono tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span>7-Day Cash Inflows</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-extrabold text-[#00E38C]">₹{totalInflows.toLocaleString()}</span>
                    <span className="text-[10px] dark:text-gray-500 text-slate-400 font-mono">Total</span>
                  </div>
                  <p className="text-[9px] dark:text-gray-400 text-slate-500 mt-1 leading-relaxed">
                    Consistent pocket allowances plus weekend side inflows.
                  </p>
                </div>
                
                <div className="h-14 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Tooltip
                        cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#070b16] border dark:border-white/10 border-black/10 px-2 py-1 rounded text-[9px] font-mono text-emerald-400">
                                Inflow: ₹{payload[0].value}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#00E38C" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: "#00E38C" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Card 2: 7-Day Outflows */}
              <motion.div 
                whileHover={{ y: -4 }}
                className={`rounded-2xl border dark:bg-[#090d1c] bg-white/80 backdrop-blur-xl p-5 relative overflow-hidden flex flex-col justify-between h-40 group transition-all duration-300 ${
                  totalOutflows > (monthlyBudget / 4) ? "border-red-500/10" : "dark:border-white/5 border-black/5"
                }`}
              >
                <div className="absolute top-0 right-0 p-3 text-rose-400 opacity-[0.08] pointer-events-none group-hover:opacity-20 transition-opacity">
                  <ArrowDownLeft className="h-10 w-10" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs dark:text-gray-400 text-slate-500 uppercase font-mono tracking-wider">
                    <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                    <span>7-Day Outflows</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-extrabold text-rose-400">₹{totalOutflows.toLocaleString()}</span>
                    <span className="text-[10px] dark:text-gray-500 text-slate-400 font-mono">Spent</span>
                  </div>
                  <p className="text-[9px] dark:text-gray-400 text-slate-500 mt-1 leading-relaxed">
                    Total spent across all registered shopping and food ventures.
                  </p>
                </div>

                <div className="h-14 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#070b16] border dark:border-white/10 border-black/10 px-2 py-1 rounded text-[9px] font-mono text-rose-400">
                                Outflow: ₹{payload[0].value}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="spending" 
                        fill="#FF4D4D" 
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Card 3: Financial Health Overlay Trend */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="rounded-2xl border dark:border-white/5 border-black/5 dark:bg-[#090d1c] bg-white/80 backdrop-blur-xl p-5 relative overflow-hidden flex flex-col justify-between h-40 group transition-all duration-300"
              >
                <div>
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs dark:text-gray-400 text-slate-500 uppercase font-mono tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-[#00C6FF]" />
                      <span>Financial Health Cushion</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-extrabold uppercase border ${
                      savingsRate > 50 
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/10" 
                        : savingsRate > 20 
                        ? "bg-[#00C6FF]/10 text-[#00C6FF] border-[#00C6FF]/10" 
                        : "bg-red-400/10 text-red-400 border-red-500/10"
                    }`}>
                      {savingsRate > 50 ? "Excellent" : savingsRate > 20 ? "Optimized" : "Critical Margin"}
                    </span>
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-mono font-extrabold ${cushionBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {cushionBalance >= 0 ? "+" : ""}₹{cushionBalance.toLocaleString()}
                    </span>
                    <span className="text-[10px] dark:text-gray-500 text-slate-400 font-mono">Net Surplus</span>
                  </div>
                  <p className="text-[9px] dark:text-gray-400 text-slate-500 mt-1 leading-relaxed">
                    Savings rate is <strong className="dark:text-white text-slate-900 font-bold">{savingsRate.toFixed(1)}%</strong> of standard budget cashflows.
                  </p>
                </div>

                <div className="h-14 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Tooltip
                        cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length >= 2) {
                            return (
                              <div className="bg-[#070b16] border dark:border-white/10 border-black/10 px-2 py-1.5 rounded text-[8px] font-mono space-y-0.5">
                                <div className="text-emerald-400">Inflow: ₹{payload[0].value}</div>
                                <div className="text-rose-400">Outflow: ₹{payload[1].value}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#00E38C" 
                        strokeWidth={1.5} 
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#FF4D4D" 
                        strokeWidth={1.5} 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </>
          );
        })()}
      </div>

      {/* Primary Dynamic Widgets Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgetOrder.filter(wid => !(user.role === "student" && wid === "quickAdd")).map((wid, idx) => renderWidget(wid, idx))}
      </div>

      {/* Comprehensive Raw Transaction Ledger List */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-10 rounded-2xl border dark:border-white/5 border-black/5 dark:bg-[#090d1c] bg-white/80 backdrop-blur-xl p-6 text-left"
      >
        <h4 className="text-xs font-mono tracking-wider dark:text-gray-500 text-slate-400 uppercase mb-4">My Transaction History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-white/5 border-black/5 dark:text-gray-500 text-slate-400 text-[10px] font-mono uppercase">
                <th className="py-3 px-4">Merchant Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Safety Score</th>
                <th className="py-3 px-4">Safety Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {transactions.map(tx => (
                <tr key={tx.id} className="text-xs dark:text-gray-300 text-slate-600 hover:bg-white/[0.01] transition-colors">
                  <td className="py-3 px-4 font-semibold dark:text-white text-slate-900">{tx.merchant}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium dark:bg-white/5 bg-black/5 dark:text-gray-400 text-slate-500 border dark:border-white/5 border-black/5">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold dark:text-white text-slate-900">₹{tx.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono dark:text-gray-400 text-slate-500">{tx.location}</td>
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-2">
                       <div className="w-12 h-1.5 dark:bg-white/5 bg-black/5 rounded-full overflow-hidden">
                        <div className={`h-full ${
                          tx.riskScore > 70 ? "bg-[#FF4D4D]" : tx.riskScore > 35 ? "bg-[#FF9F43]" : "bg-[#00E38C]"
                        }`} style={{ width: `${tx.riskScore}%` }} />
                      </div>
                      <span className={tx.riskScore > 70 ? "text-[#FF4D4D]" : tx.riskScore > 35 ? "text-[#FF9F43]" : "text-[#00E38C]"}>
                        {tx.riskScore}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold border ${
                      tx.riskStatus === "high" ? "bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/20" : tx.riskStatus === "medium" ? "bg-[#FF9F43]/10 text-[#FF9F43] border-[#FF9F43]/20" : "bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/20"
                    }`}>
                      {tx.riskStatus === "high" ? "high risk" : tx.riskStatus === "medium" ? "medium risk" : "low risk"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
