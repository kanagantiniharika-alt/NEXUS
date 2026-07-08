/**
 * NEXUS FINANCE - OFFLINE/PREVIEW COMPATIBILITY MOCK API INTERCEPTOR
 * 
 * Intercepts all fetch requests to `/api/*` and redirects them to a highly detailed,
 * in-memory/localStorage mock repository that perfectly mirrors the Express and Python backends.
 * 
 * This enables the frontend to remain 100% functional, responsive, and stateful
 * inside sandboxed browsers and iframe environments, while ensuring developers can export
 * and deploy to raw Python/FastAPI/MySQL without modifications to the frontend files.
 */

// Initial states conforming exactly to MySQL types
const USERS_KEY = "nexus_db_users";
const ACTIVE_USER_ID_KEY = "nexus_db_active_user_id";
const TRANSACTIONS_KEY = "nexus_db_transactions";
const GOALS_KEY = "nexus_db_goals";
const SUBSCRIPTIONS_KEY = "nexus_db_subscriptions";
const PAYMENTS_KEY = "nexus_db_payments";
const FRAUD_ALERTS_KEY = "nexus_db_fraud_alerts";
const NOTIFICATIONS_KEY = "nexus_db_notifications";
const STUDENT_PROFILE_KEY = "nexus_db_student_profile";

// Helper utilities to retrieve / preserve state
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const initMockDatabase = () => {
  // Default user Alex Mercer
  getStorageItem(USERS_KEY, [
    {
      id: "user_1",
      name: "Alex Mercer",
      email: "mleelavaishnavi@gmail.com", // Set to active user's email
      role: "professional",
      password: "nexus123",
      financeScore: 84,
      balance: 124000,
      income: 150000,
      spendAlertsEnabled: false,
    }
  ]);

  getStorageItem(ACTIVE_USER_ID_KEY, "user_1");

  getStorageItem(TRANSACTIONS_KEY, [
    { id: "tx_1", amount: 4500, merchant: "AWS Cloud Services", category: "Bills", date: "2026-06-18", location: "Seattle, USA", riskScore: 12, riskStatus: "low", riskReason: "Standard recurring business invoice." },
    { id: "tx_2", amount: 15000, merchant: "Gucci Store Paris", category: "Shopping", date: "2026-06-17", location: "Paris, FR", riskScore: 78, riskStatus: "high", riskReason: "Impossible travel: User was in Mumbai 2 hours prior." },
    { id: "tx_3", amount: 350, merchant: "Starbucks Coffee", category: "Food", date: "2026-06-16", location: "Mumbai, IN", riskScore: 4, riskStatus: "low", riskReason: "Perfect behavioral alignment." },
    { id: "tx_4", amount: 12000, merchant: "Unacademy Subscription", category: "Education", date: "2026-06-15", location: "Online", riskScore: 8, riskStatus: "low", riskReason: "Regular educational portal spend." },
    { id: "tx_5", amount: 800, merchant: "Uber Rides", category: "Travel", date: "2026-06-14", location: "Mumbai, IN", riskScore: 10, riskStatus: "low", riskReason: "Standard commute pattern." },
    { id: "tx_6", amount: 1250, merchant: "MedPlus Pharmacy", category: "Healthcare", date: "2026-06-12", location: "Pune, IN", riskScore: 5, riskStatus: "low", riskReason: "Essential clinical catalog." },
    { id: "tx_7", amount: 4500, merchant: "Delta Air Lines", category: "Travel", date: "2026-06-10", location: "Atlanta, USA", riskScore: 84, riskStatus: "high", riskReason: "Location anomaly: Sudden transit outside local perimeter." }
  ]);

  getStorageItem(FRAUD_ALERTS_KEY, [
    {
      id: "fr_1",
      title: "Instant Location Discrepancy",
      type: "location_anomaly",
      riskScore: 84,
      merchant: "Delta Air Lines",
      amount: 4500,
      reason: "Impossible travel registered between Pune and Atlanta relative to transaction timestamps.",
      details: "Pune (11:04 AM) vs Delta Atlanta (11:34 AM). Requires supersonic speeds, confirming virtual replication.",
      date: "2026-06-10"
    },
    {
      id: "fr_2",
      title: "Suspicious P2P Cashback QR Scanner",
      type: "scam_trend",
      riskScore: 92,
      merchant: "Amazon Pay Merchant QR",
      amount: 5000,
      reason: "Aligned with current trending UPI cashback scans targeting Students.",
      details: "Social engineered prompt requested instant scanner clearance under pretense of custom stipend rewards.",
      date: "2026-06-18"
    }
  ]);

  getStorageItem(GOALS_KEY, [
    { id: "g_1", name: "High-Performance Laptop Fund", targetAmount: 45000, savedAmount: 15300, deadlineMonths: 6, monthlySavingsNeeded: 5000, category: "Laptop Fund", probability: 89, savingsPlan: "Reduce Dining out by ₹1500; Allocate 12% of student stipend to locked vault." },
    { id: "g_2", name: "GATE Preparation & Materials", targetAmount: 12000, savedAmount: 4200, deadlineMonths: 4, monthlySavingsNeeded: 2000, category: "Higher Studies", probability: 94, savingsPlan: "Save ₹500 weekly by opting for digital books; trim secondary subscriptions." }
  ]);

  getStorageItem(SUBSCRIPTIONS_KEY, [
    { id: "sub_1", name: "Netflix Premium", cost: 649, interval: "monthly", category: "Entertainment", savingsPotential: 450, recommendation: "Downgrade to Standard 1080p plan. Saves ₹450 monthly." },
    { id: "sub_2", name: "Spotify Premium Duos", cost: 179, interval: "monthly", category: "Entertainment", savingsPotential: 179, recommendation: "Switch to Spotify Family or Free Tier with brief ad intervals." },
    { id: "sub_3", name: "Amazon Prime Monthly", cost: 299, interval: "monthly", category: "Bills", savingsPotential: 100, recommendation: "Convert to Annual Plan at ₹1499 to save 58% on continuous billing." },
    { id: "sub_4", name: "ChatGPT Plus", cost: 1999, interval: "monthly", category: "Education", savingsPotential: 0, recommendation: "Maintain subscription. Critical high-utility asset for engineering courses." }
  ]);

  getStorageItem(PAYMENTS_KEY, [
    { id: "pay_1", type: "bank", name: "HDFC Max Yield Salary Premium", issuer: "HDFC", lastFour: "4912", holder: "Alex Mercer", addedAt: new Date().toISOString(), isFrozen: false },
    { id: "pay_2", type: "card", name: "Premium Metal ICICI Reserve Card", issuer: "ICICI", lastFour: "7392", expiry: "09/30", holder: "Alex Mercer", addedAt: new Date().toISOString(), isFrozen: false }
  ]);

  getStorageItem(STUDENT_PROFILE_KEY, {
    pocketMoney: 6000,
    allowance: 4000,
    semesterBudget: {
      hostel: 12000,
      food: 8000,
      books: 3000,
      courses: 5000,
      travel: 2000
    },
    financeScore: 78,
    careerGoals: ["Laptop purchase for coding", "GATE Exam Registration", "AWS Cloud Practitioner certification"]
  });

  getStorageItem(NOTIFICATIONS_KEY, [
    {
      id: "noti_g_g_1",
      title: "Goal Milestone Achieved! 🎉",
      description: "Objective milestone active! Laptop Fund tracker is currently at 34% success.",
      type: "goal_milestone",
      timestamp: new Date().toISOString(),
      read: false,
      severity: "success"
    },
    {
      id: "noti_f_fr_2",
      title: "High Risk UPI Alert ⚠️",
      description: "UPI Refund scan flagged at Amazon Pay Merchant QR. Risk Score 92% detected.",
      type: "security_threat",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      severity: "danger"
    }
  ]);
};

// Start Mock DB setup
initMockDatabase();

// Interceptor routing logic
export const registerMockFetch = () => {
  const originalFetch = window.fetch;

  const mockFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = input.toString();

    // Check if the endpoint points to our server API
    if (urlString.startsWith("/api") || urlString.includes("/api/")) {
      const parsedUrl = new URL(urlString, window.location.origin);
      const pathname = parsedUrl.pathname;
      const method = init?.method?.toUpperCase() || "GET";
      const body = init?.body ? JSON.parse(init.body as string) : null;

      // Extract details from storage
      const users = getStorageItem<any[]>(USERS_KEY, []);
      let activeUserId = getStorageItem<string>(ACTIVE_USER_ID_KEY, "user_1");
      let currentUser = users.find(u => u.id === activeUserId) || users[0];

      // Delay helper for realism
      await new Promise(resolve => setTimeout(resolve, 200));

      const respondJSON = (status: number, data: any) => {
        return new Response(JSON.stringify(data), {
          status,
          headers: { "Content-Type": "application/json" }
        });
      };

      // --- ROUTE MATCHING ---

      // 1. AUTHENTICATION ENDPOINTS
      if (pathname === "/api/auth/login" && method === "POST") {
        const { email, password } = body || {};
        const matched = users.find(u => u.email.toLowerCase() === email?.toLowerCase() && u.password === password);
        if (matched) {
          setStorageItem(ACTIVE_USER_ID_KEY, matched.id);
          return respondJSON(200, { success: true, user: matched });
        }
        return respondJSON(401, { error: "Invalid email or password credentials. Please try again." });
      }

      if (pathname === "/api/auth/register" && method === "POST") {
        const { name, email, password, role } = body || {};
        const exists = users.find(u => u.email.toLowerCase() === email?.toLowerCase());
        if (exists) {
          return respondJSON(400, { error: "An account with this email is already registered." });
        }
        const newUser = {
          id: `user_${Date.now()}`,
          name: name || "New User",
          email: email,
          password: password,
          role: role || "professional",
          financeScore: role === "student" ? 78 : 84,
          balance: role === "student" ? 8500 : 124000,
          income: role === "student" ? 10000 : 150000,
          spendAlertsEnabled: false
        };
        users.push(newUser);
        setStorageItem(USERS_KEY, users);
        setStorageItem(ACTIVE_USER_ID_KEY, newUser.id);
        return respondJSON(200, { success: true, user: newUser });
      }

      if (pathname === "/api/auth/logout" && method === "POST") {
        return respondJSON(200, { success: true });
      }

      if (pathname === "/api/auth/me" && method === "GET") {
        return respondJSON(200, { success: !!currentUser, user: currentUser });
      }

      if (pathname === "/api/user" && method === "GET") {
        if (!currentUser) return respondJSON(401, { error: "Unauthorized" });
        return respondJSON(200, currentUser);
      }

      if (pathname === "/api/user/role" && method === "POST") {
        const { role } = body || {};
        if (currentUser) {
          currentUser.role = role;
          if (role === "student") {
            currentUser.financeScore = 78;
            currentUser.balance = 8500;
            currentUser.income = 10000;
          } else {
            currentUser.financeScore = 84;
            currentUser.balance = 124000;
            currentUser.income = 150000;
          }
          const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
          setStorageItem(USERS_KEY, updatedUsers);
          return respondJSON(200, { success: true, user: currentUser });
        }
        return respondJSON(400, { error: "User context not identified." });
      }

      if (pathname === "/api/user/spend-alerts" && (method === "POST" || method === "PUT")) {
        const { enabled } = body || {};
        if (currentUser) {
          currentUser.spendAlertsEnabled = enabled;
          const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
          setStorageItem(USERS_KEY, updatedUsers);
          return respondJSON(200, { success: true, user: currentUser });
        }
        return respondJSON(400, { error: "User session not active." });
      }

      // 2. TRANSACTION ENDPOINTS
      if (pathname === "/api/transactions") {
        const transactions = getStorageItem<any[]>(TRANSACTIONS_KEY, []);
        if (method === "GET") {
          return respondJSON(200, transactions);
        }
        if (method === "POST") {
          const { amount, merchant, category, date, location } = body || {};
          const numAmount = parseFloat(amount) || 120;
          
          let riskScore = 4;
          let riskStatus = "low";
          let riskReason = "aligned with standard user profile patterns.";

          if (numAmount > 20000) {
            riskScore = 88;
            riskStatus = "high";
            riskReason = "Transaction exceeds standard behavioral margin filters.";
          } else if (location && (location.toLowerCase().includes("paris") || location.toLowerCase().includes("france") || location.toLowerCase().includes("usa"))) {
            riskScore = 75;
            riskStatus = "high";
            riskReason = "Impossible travel anomaly relative to recent geographic telemetry.";
          } else if (merchant && merchant.toLowerCase().includes("qr")) {
            riskScore = 48;
            riskStatus = "medium";
            riskReason = "Unregistered peer-to-peer scanning pattern detected.";
          }

          const newTx = {
            id: `tx_${Date.now()}`,
            amount: numAmount,
            merchant: merchant || "Card Checkout",
            category: category || "Bills",
            date: date || new Date().toISOString().split("T")[0],
            location: location || "Mumbai, IN",
            riskScore,
            riskStatus,
            riskReason
          };

          transactions.unshift(newTx);
          setStorageItem(TRANSACTIONS_KEY, transactions);

          if (currentUser) {
            currentUser.balance -= numAmount;
            const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
            setStorageItem(USERS_KEY, updatedUsers);
          }

          // Generate security threat automatically if high risk
          if (riskScore > 50) {
            const alerts = getStorageItem<any[]>(FRAUD_ALERTS_KEY, []);
            alerts.unshift({
              id: `fr_${Date.now()}`,
              title: "Autonomous Risk Trigger Alert",
              type: location?.toLowerCase().includes("paris") ? "location_anomaly" : "behavioral",
              riskScore,
              merchant: newTx.merchant,
              amount: newTx.amount,
              reason: riskReason,
              details: `Dynamic system threat signal flagged at ${newTx.location} for ₹${newTx.amount.toLocaleString()}. Check credentials immediately.`,
              date: newTx.date
            });
            setStorageItem(FRAUD_ALERTS_KEY, alerts);
          }

          return respondJSON(200, newTx);
        }
      }

      if (pathname === "/api/transactions/import" && method === "POST") {
        const { transactions: rows } = body || {};
        if (Array.isArray(rows)) {
          const transactions = getStorageItem<any[]>(TRANSACTIONS_KEY, []);
          let totalDeduct = 0;
          const imported = rows.map((r, index) => {
            const numAmount = parseFloat(r.amount) || 120;
            totalDeduct += numAmount;
            return {
              id: `tx_imported_${Date.now()}_${index}`,
              amount: numAmount,
              merchant: r.merchant || "Imported Ledger Payout",
              category: r.category || "Bills",
              date: r.date || new Date().toISOString().split("T")[0],
              location: r.location || "Online Statement",
              riskScore: numAmount > 15000 ? 76 : 8,
              riskStatus: numAmount > 15000 ? "high" : "low",
              riskReason: numAmount > 15000 ? "Large statement import transaction exceeds standard alert parameters." : "regular category listing"
            };
          });

          transactions.unshift(...imported);
          setStorageItem(TRANSACTIONS_KEY, transactions);

          if (currentUser) {
            currentUser.balance -= totalDeduct;
            const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
            setStorageItem(USERS_KEY, updatedUsers);
          }

          return respondJSON(200, {
            success: true,
            count: imported.length,
            transactions: imported,
            newBalance: currentUser ? currentUser.balance : 0
          });
        }
        return respondJSON(400, { error: "Transactions row list parameter not received." });
      }

      if (pathname === "/api/transactions/bulk" && method === "POST") {
        const { payments: rows } = body || {};
        if (Array.isArray(rows)) {
          const transactions = getStorageItem<any[]>(TRANSACTIONS_KEY, []);
          let totalDeduct = 0;
          const imported = rows.map((r, index) => {
            const numAmount = parseFloat(r.amount) || 100;
            totalDeduct += numAmount;
            return {
              id: `tx_bulk_${Date.now()}_${index}`,
              amount: numAmount,
              merchant: r.recipientName || r.merchant || "Standard Outward Wire",
              category: r.category || "Bills",
              date: new Date().toISOString().split("T")[0],
              location: "P2P NetBanking",
              riskScore: 12,
              riskStatus: "low",
              riskReason: "recurring direct clearance scheduled."
            };
          });

          transactions.unshift(...imported);
          setStorageItem(TRANSACTIONS_KEY, transactions);

          if (currentUser) {
            currentUser.balance -= totalDeduct;
            const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
            setStorageItem(USERS_KEY, updatedUsers);
          }

          return respondJSON(200, { success: true, count: imported.length });
        }
      }

      // 3. FRAUD & ALERT ENDPOINTS
      if (pathname === "/api/fraud/alerts" && method === "GET") {
        const alerts = getStorageItem<any[]>(FRAUD_ALERTS_KEY, []);
        return respondJSON(200, alerts);
      }

      if (pathname === "/api/fraud/scam-trends" && method === "GET") {
        return respondJSON(200, [
          {
            id: "sc_1",
            title: "UPI Dynamic QR Cashback Phishing",
            category: "UPI Scan Scams",
            trendScore: 94,
            description: "Fraudsters generate visual coupon templates that contain direct wallet-debit authorizations, masquerading as promotional student stipend returns.",
            safeguards: "Never type secure UPI PIN details to resolve outward cashback bonuses."
          },
          {
            id: "sc_2",
            title: "DHL/FedEx Customs Verification Relay",
            category: "Courier Frauds",
            trendScore: 89,
            description: "Robotic text coordinates claim custom packages are detained under your tax ID, forcing instant legal wire setups to avoid mock arrests.",
            safeguards: "Verified governmental departments do not process clearance fees via personal wire routes."
          },
          {
            id: "sc_3",
            title: "KYC Banking Bio-reverification Panic",
            category: "Phishing Scams",
            trendScore: 81,
            description: "Urgent notifications claiming active credit profiles or cellular eSIM packages will be permanently blocked unless custom links are processed.",
            safeguards: "Audit status messages directly with bank managers inside certified branches."
          }
        ]);
      }

      if (pathname === "/api/fraud/merchant-trust" && method === "POST") {
        const { merchantName } = body || {};
        return respondJSON(200, {
          score: merchantName?.toLowerCase().includes("gucci") ? 98 : merchantName?.toLowerCase().includes("qr") ? 34 : 72,
          address: merchantName?.toLowerCase().includes("gucci") ? "2 Avenue Montaigne, Paris, France" : "Virtual Decentralized Ledger Base",
          phone: "+33 1 53 57 11 50",
          website: `https://www.${merchantName || "merchant"}.com`,
          legitimacyScore: merchantName?.toLowerCase().includes("gucci") ? 96 : merchantName?.toLowerCase().includes("qr") ? 18 : 75,
          reviews: [
            { author: "Rita J.", rating: merchantName?.toLowerCase().includes("qr") ? 1 : 5, text: merchantName?.toLowerCase().includes("qr") ? "Scammed me claiming quick cashback." : "Perfect corporate verified vendor." }
          ],
          aiExplanation: `Strategic check for ${merchantName || "merchant"}. Maps data shows regular storefront footprints. Checked credentials against continuous financial registries.`
        });
      }

      if (pathname === "/api/fraud/investigate" && method === "POST") {
        const { transactionId } = body || {};
        const transactions = getStorageItem<any[]>(TRANSACTIONS_KEY, []);
        const tx = transactions.find(t => t.id === transactionId) || transactions[0];
        
        return respondJSON(200, {
          report: `
            <div class="space-y-4 text-xs font-mono">
              <h3 class="text-sm font-sans font-bold text-red-400">🚨 INTEGRATED ANOMALY FORENSIC DOSSIER</h3>
              <p>User Identity Mapping: <strong>${currentUser?.name}</strong> | Tx ID REF: <strong>${tx?.id || "N/A"}</strong></p>
              <div class="p-3 bg-red-950/20 border border-red-500/15 rounded-lg space-y-2">
                <p class="text-red-300 font-bold">VULNERABILITY ASSESSMENT SUMMARY</p>
                <p>The transaction of ₹${tx?.amount?.toLocaleString()} at <strong>${tx?.merchant}</strong> represents a threat score of <strong>${tx?.riskScore}%</strong>.</p>
                <p><strong>Diagnosis:</strong> ${tx?.riskReason || "Behavioral deviation from standard professional timeline metrics."}</p>
                <p><strong>Actionable Directives:</strong></p>
                <ul class="list-disc pl-4 space-y-1">
                  <li>Freeze structural token keys on associated payment gateway profiles.</li>
                  <li>Report telemetry parameters to cyber department logs.</li>
                  <li>Establish two-factor verification on credential assets.</li>
                </ul>
              </div>
            </div>
          `
        });
      }

      // 4. FINANCIAL GOALS ENDPOINTS
      if (pathname === "/api/goals" && method === "GET") {
        const goals = getStorageItem<any[]>(GOALS_KEY, []);
        return respondJSON(200, goals);
      }

      if (pathname === "/api/goals" && method === "POST") {
        const { name, targetAmount, deadlineMonths, category } = body || {};
        const target = parseFloat(targetAmount) || 10000;
        const deadline = parseInt(deadlineMonths) || 5;
        const needed = Math.round(target / deadline);
        const goals = getStorageItem<any[]>(GOALS_KEY, []);
        const newGoal = {
          id: `g_${Date.now()}`,
          name: name || "Reserve Fund Objective",
          targetAmount: target,
          savedAmount: 0,
          deadlineMonths: deadline,
          monthlySavingsNeeded: needed,
          category: category || "Asset Vault",
          probability: 98,
          savingsPlan: `Establishing standard lock-box sweep to capture secondary dining expenditures. Target monthly savings ₹${needed.toLocaleString()}`
        };

        goals.push(newGoal);
        setStorageItem(GOALS_KEY, goals);
        return respondJSON(200, newGoal);
      }

      if (pathname.match(/^\/api\/goals\/[^\/]+\/deposit$/) && method === "POST") {
        const matches = pathname.match(/^\/api\/goals\/([^\/]+)\/deposit$/);
        const goalId = matches ? matches[1] : "";
        const { amount } = body || {};
        const depositAmt = parseFloat(amount) || 1000;

        const goals = getStorageItem<any[]>(GOALS_KEY, []);
        const goalIndex = goals.findIndex(g => g.id === goalId);
        
        if (goalIndex !== -1) {
          goals[goalIndex].savedAmount += depositAmt;
          setStorageItem(GOALS_KEY, goals);

          if (currentUser) {
            currentUser.balance -= depositAmt;
            const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
            setStorageItem(USERS_KEY, updatedUsers);
          }

          return respondJSON(200, { success: true, goal: goals[goalIndex], newBalance: currentUser?.balance });
        }
        return respondJSON(404, { error: "Objective index target not found." });
      }

      if (pathname.match(/^\/api\/goals\/[^\/]+$/) && method === "DELETE") {
        const matches = pathname.match(/^\/api\/goals\/([^\/]+)$/);
        const goalId = matches ? matches[1] : "";

        const goals = getStorageItem<any[]>(GOALS_KEY, []);
        const filtered = goals.filter(g => g.id !== goalId);
        setStorageItem(GOALS_KEY, filtered);
        return respondJSON(200, { success: true });
      }

      if (pathname === "/api/goals/insights" && method === "GET") {
        return respondJSON(200, {
          insights: "Your dynamic lock-box metrics indicate an overall savings potential of ₹15,400 per quarter. Establish active sweeps toward Higher Studies objectives to capture 14% latency bonus before timeline ends."
        });
      }

      // 5. SUBSCRIPTION ENDPOINTS
      if (pathname === "/api/subscriptions" && method === "GET") {
        const subscriptions = getStorageItem<any[]>(SUBSCRIPTIONS_KEY, []);
        return respondJSON(200, subscriptions);
      }

      // 6. PAYMENTS & SOURCE WALLETS ENDPOINTS
      if (pathname === "/api/payments") {
        const payments = getStorageItem<any[]>(PAYMENTS_KEY, []);
        if (method === "GET") {
          return respondJSON(200, payments);
        }
        if (method === "POST") {
          const { type, name, issuer, lastFour, expiry, holder, balance } = body || {};
          const newPay = {
            id: `pay_${Date.now()}`,
            type: type || "card",
            name: name || "Debit Vault Account",
            issuer: issuer || "VISA",
            lastFour: lastFour || "0000",
            expiry: expiry || "",
            holder: holder || currentUser?.name || "Alex Mercer",
            addedAt: new Date().toISOString(),
            balance: parseFloat(balance) || 25000,
            isFrozen: false
          };
          payments.push(newPay);
          setStorageItem(PAYMENTS_KEY, payments);
          return respondJSON(200, newPay);
        }
      }

      if (pathname.match(/^\/api\/payments\/[^\/]+$/) && method === "DELETE") {
        const matches = pathname.match(/^\/api\/payments\/([^\/]+)$/);
        const payId = matches ? matches[1] : "";

        const payments = getStorageItem<any[]>(PAYMENTS_KEY, []);
        const filtered = payments.filter(p => p.id !== payId);
        setStorageItem(PAYMENTS_KEY, filtered);
        return respondJSON(200, { success: true });
      }

      if (pathname.match(/^\/api\/payments\/[^\/]+\/toggle-freeze$/) && method === "POST") {
        const matches = pathname.match(/^\/api\/payments\/([^\/]+)\/toggle-freeze$/);
        const payId = matches ? matches[1] : "";

        const payments = getStorageItem<any[]>(PAYMENTS_KEY, []);
        const matchedIdx = payments.findIndex(p => p.id === payId);
        if (matchedIdx !== -1) {
          payments[matchedIdx].isFrozen = !payments[matchedIdx].isFrozen;
          setStorageItem(PAYMENTS_KEY, payments);
          return respondJSON(200, { success: true, payment: payments[matchedIdx] });
        }
        return respondJSON(404, { error: "Payment method not secured." });
      }

      if (pathname === "/api/payments/freeze-all" && method === "POST") {
        const payments = getStorageItem<any[]>(PAYMENTS_KEY, []);
        const frozen = payments.map(p => ({ ...p, isFrozen: true }));
        setStorageItem(PAYMENTS_KEY, frozen);
        return respondJSON(200, { success: true });
      }

      if (pathname === "/api/payments/topup" && method === "POST") {
        const { amount } = body || {};
        if (currentUser) {
          currentUser.balance += parseFloat(amount) || 10000;
          const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
          setStorageItem(USERS_KEY, updatedUsers);
        }
        return respondJSON(200, { success: true, newBalance: currentUser?.balance });
      }

      // 7. COPILOT / CHATBOT ENGINE
      if ((pathname === "/api/copilot/ask" || pathname === "/api/chat" || pathname === "/api/copilot") && method === "POST") {
        const { prompt, message } = body || {};
        const query = prompt || message || "";
        let responseText = "";

        const queryLower = query.toLowerCase();
        if (queryLower.includes("scam") || queryLower.includes("fraud") || queryLower.includes("upi")) {
          responseText = `### 🛡️ NEXUS Security Shield Active: UPI Scam Detection Summary
Detected potential risk query related to scam security patterns and P2P transfers. 
Across your region, the highly trending scam is **UPI Dynamic QR Cashback Phishing**.
**Action Plan:**
1. **PIN Protocol:** Never input your secure 4 or 6-digit PIN to receive payments.
2. **Gateway Verification:** Double-check verified coordinates on commercial scanner footprints.
3. **Card Shields:** Use your payment terminal interface to instantly freeze metal card accounts if compromised.`;
        } else if (queryLower.includes("budget") || queryLower.includes("pocket") || queryLower.includes("student") || queryLower.includes("save")) {
          responseText = `### 📊 Dynamic Budget Advisory & Allocation Insights
For active users on the **${currentUser?.role || "student"} mode**, we have computed optimal saving loops:
- **Rent & Hostels:** Allocate raw funds early to prevent late utility sweeps.
- **Subscriptions:** Downgrading ChatGPT or Netflix options converts continuous monthly payments to a saved capital format. Total potential yearly surplus: ₹8,400.
- **Goal Sweep:** Program an automated 10% cash transfer to specialized laptop locked boxes.`;
        } else {
          responseText = `### 🚀 Welcome to the NEXUS Core Terminal Interface
I am your custom autonomous assistant. 

**Dynamic Dashboard Audit:**
- Active Balance Ledger: **₹${currentUser?.balance?.toLocaleString() || "124,000"}**
- Security Threat Signals: **0 Anomalies** over the past 48 hours.
- Active Goal Objective: **Laptop Purchase Vault** is currently at ${currentUser?.role === 'student' ? '34%' : '72%'} completion target.

Let me know if you would like me to compile analytical reports, trace transaction legitimacy, freeze bank relays, or evaluate subscriptions cost.`;
        }

        return respondJSON(200, { response: responseText, success: true, text: responseText });
      }

      // 8. NOTIFICATION ENDPOINTS
      if (pathname === "/api/notifications" && method === "GET") {
        const notifications = getStorageItem<any[]>(NOTIFICATIONS_KEY, []);
        return respondJSON(200, notifications);
      }

      if (pathname.match(/^\/api\/notifications\/[^\/]+\/read$/) && method === "POST") {
        const matches = pathname.match(/^\/api\/notifications\/([^\/]+)\/read$/);
        const notiId = matches ? matches[1] : "";

        const notifications = getStorageItem<any[]>(NOTIFICATIONS_KEY, []);
        const updated = notifications.map(n => n.id === notiId ? { ...n, read: true } : n);
        setStorageItem(NOTIFICATIONS_KEY, updated);
        return respondJSON(200, { success: true });
      }

      if (pathname === "/api/notifications/read-all" && method === "POST") {
        const notifications = getStorageItem<any[]>(NOTIFICATIONS_KEY, []);
        const updated = notifications.map(n => ({ ...n, read: true }));
        setStorageItem(NOTIFICATIONS_KEY, updated);
        return respondJSON(200, { success: true });
      }

      if (pathname.match(/^\/api\/notifications\/[^\/]+$/) && method === "DELETE") {
        const matches = pathname.match(/^\/api\/notifications\/([^\/]+)$/);
        const notiId = matches ? matches[1] : "";

        const notifications = getStorageItem<any[]>(NOTIFICATIONS_KEY, []);
        const filtered = notifications.filter(n => n.id !== notiId);
        setStorageItem(NOTIFICATIONS_KEY, filtered);
        return respondJSON(200, { success: true });
      }

      // 9. GENERAL INSIGHTS ENDPOINTS
      if (pathname === "/api/dashboard/insights" && method === "GET") {
        const transactions = getStorageItem<any[]>(TRANSACTIONS_KEY, []);
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        return respondJSON(200, [
          `Your active monthly spend index is ₹${totalSpent.toLocaleString()}. Diverting 10% to lockboxes satisfies deadlines 2.4 weeks earlier.`,
          "Safe Shield confirmed: Zero high-risk geographic location anomalies or UPI spoof entries reported in standard logs.",
          "Dynamic review shows downgrading active streaming subscriptions releases ₹5,400 in continuous yearly capital."
        ]);
      }

      if (pathname === "/api/spending/insights" && method === "GET") {
        return respondJSON(200, {
          insights: [
            "Weekend restaurant transactions indicate an upward trend of 18%. Optimize category spending to protect student limits.",
            "Handshake verified for active digital subscriptions; zero secondary waste charges found."
          ]
        });
      }

      if (pathname === "/api/serpapi/stats" && method === "GET") {
        return respondJSON(200, { queriesRemaining: 84, queriesLimit: 100, activeScansSpeed: "Fast (1.2s)" });
      }

      // Unknown API fallback
      return respondJSON(404, { error: `Endpoint ${pathname} not mapped.` });
    }

    return originalFetch.apply(this, [input, init]);
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: mockFetch,
      configurable: true,
      writable: true
    });
  } catch (e) {
    console.warn("Could not redefine window.fetch with Object.defineProperty, falling back to direct assignment:", e);
    try {
      window.fetch = mockFetch;
    } catch (err) {
      console.error("Critical: Failed to register fetch hack:", err);
    }
  }
};
