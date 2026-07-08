/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { Transaction, FinancialGoal, SecurityRule, ChatMessage, UserRole } from './src/types.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || process.env.VITE_PORT || 3001);

app.use(express.json());

// ======================================================================
//   HIGH-FIDELITY IN-MEMORY DATABASE STATE
// ======================================================================

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  financeScore: number;
  balance: number;
  income: number;
  spendAlertsEnabled: boolean;
}

let currentUser: UserProfile = {
  id: 'usr_seeded_default',
  name: 'Robin Liu',
  email: 'sprutixtina1012@gmail.com',
  role: 'student',
  financeScore: 78,
  balance: 8500.00,
  income: 10000.00,
  spendAlertsEnabled: false
};

let users: { email: string; passwordHash: string; role: UserRole; name: string }[] = [
  { email: 'student@example.com', passwordHash: 'student123', role: 'student', name: 'Student Tester' },
  { email: 'pro@example.com', passwordHash: 'pro123', role: 'professional', name: 'Professional Tester' },
  { email: 'sprutixtina1012@gmail.com', passwordHash: 'default123', role: 'student', name: 'Robin Liu' }
];

let transactions: Transaction[] = [
  {
    id: 'tx-s-1',
    merchant: 'AWS Education Cloud Credits',
    amount: 1500.00,
    category: 'Education',
    date: '2026-06-23T10:30:00.000Z',
    riskScore: 12,
    riskStatus: 'low',
    notes: 'Pre-approved student research grant allocation.',
    userRole: 'student',
    userEmail: 'sprutixtina1012@gmail.com',
    ruleViolations: []
  },
  {
    id: 'tx-s-2',
    merchant: 'Campus Cafeteria',
    amount: 350.00,
    category: 'Food & Dining',
    date: '2026-06-24T08:15:00.000Z',
    riskScore: 5,
    riskStatus: 'low',
    notes: 'Standard micro-transaction.',
    userRole: 'student',
    userEmail: 'sprutixtina1012@gmail.com',
    ruleViolations: []
  },
  {
    id: 'tx-s-3',
    merchant: 'Global Tech Store Bulk purchase',
    amount: 12500.00,
    category: 'Equipment',
    date: '2026-06-24T02:45:00.000Z',
    riskScore: 82,
    riskStatus: 'high',
    notes: 'ALERT: Suspicious transaction. Off-hours purchase combined with high value exceedance.',
    userRole: 'student',
    userEmail: 'sprutixtina1012@gmail.com',
    ruleViolations: ['Off-Hours Transaction Flagged', 'High-Value Student Purchase Threshold Exceeded']
  }
];

let goals: (FinancialGoal & { recommendations?: any[]; probability?: number; savingsPlan?: string })[] = [
  {
    id: 'g-s-1',
    name: 'GATE Exam Prep Materials',
    targetAmount: 15000,
    currentAmount: 12000,
    deadline: '2026-09-15',
    category: 'Education',
    status: 'active',
    userRole: 'student',
    userEmail: 'sprutixtina1012@gmail.com',
    probability: 88,
    savingsPlan: 'Aim to save ₹1,000 per month for the next 3 months.',
    recommendations: [
      { id: 'rec-1', type: 'cashflow', text: 'Your current monthly cashflow supports standard goal savings.' }
    ]
  },
  {
    id: 'g-s-2',
    name: 'New Development Laptop',
    targetAmount: 80000,
    currentAmount: 25000,
    deadline: '2026-12-01',
    category: 'Equipment',
    status: 'active',
    userRole: 'student',
    userEmail: 'sprutixtina1012@gmail.com',
    probability: 45,
    savingsPlan: 'Aim to save ₹9,000 per month to converge on time.',
    recommendations: [
      { id: 'rec-2', type: 'cashflow_deficit', text: 'Shortfall detected. Consider shifting 15% of food budget to accelerate laptop procurement.' }
    ]
  }
];

let securityRules: SecurityRule[] = [
  {
    id: 'rule-1',
    name: 'High-Value Student Limit',
    description: 'Flag transactions above ₹5,000 for Student accounts.',
    type: 'amount_threshold',
    value: 5000,
    enabled: true
  },
  {
    id: 'rule-2',
    name: 'High-Value Professional Limit',
    description: 'Flag transactions above ₹100,000 for Professional accounts.',
    type: 'amount_threshold',
    value: 100000,
    enabled: true
  },
  {
    id: 'rule-3',
    name: 'Off-Hours Restricted Interval',
    description: 'Flag transactions occurring during late hours (11:00 PM to 5:00 AM).',
    type: 'off_hours',
    value: 0,
    enabled: true
  },
  {
    id: 'rule-4',
    name: 'Anomalous Food & Dining Outlier',
    description: 'Flag single food purchases exceeding ₹2,000.',
    type: 'category_limit',
    value: 2000,
    enabled: true
  }
];

// Subscriptions Mappings
interface UserSubscription {
  id: string;
  name: string;
  cost: number;
  billingInterval: 'monthly' | 'yearly';
  category: string;
  savingsPotential: number;
  recommendation: string;
  isActive: boolean;
}

let subscriptions: UserSubscription[] = [
  {
    id: 'sub-1',
    name: 'Netflix Premium UHD',
    cost: 649.00,
    billingInterval: 'monthly',
    category: 'Entertainment',
    savingsPotential: 150.00,
    recommendation: 'Downgrade to Standard 1080p plan. Saves ₹150 monthly with identical screen casting limits.',
    isActive: true
  },
  {
    id: 'sub-2',
    name: 'Spotify Family Pack',
    cost: 179.00,
    billingInterval: 'monthly',
    category: 'Entertainment',
    savingsPotential: 119.00,
    recommendation: 'Switch to single-student profile. Saves ₹119 monthly with zero playlist metadata degradation.',
    isActive: true
  },
  {
    id: 'sub-3',
    name: 'GitHub Copilot AI',
    cost: 820.00,
    billingInterval: 'monthly',
    category: 'Education',
    savingsPotential: 0.00,
    recommendation: 'Keep Active: Critical developer utility. High direct correlation with career goal timelines.',
    isActive: true
  }
];

// Payment profiles
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  issuer: string;
  lastFour: string;
  expiry: string;
  holder: string;
  isFrozen: boolean;
}

let paymentMethods: PaymentMethod[] = [
  {
    id: 'pay_card_default',
    type: 'card',
    name: 'Visa Premium Signature',
    issuer: 'Visa',
    lastFour: '1049',
    expiry: '12/28',
    holder: 'Robin Liu',
    isFrozen: false
  },
  {
    id: 'pay_bank_default',
    type: 'bank',
    name: 'HDFC Private Wealth',
    issuer: 'HDFC',
    lastFour: '9192',
    expiry: 'N/A',
    holder: 'Robin Liu',
    isFrozen: false
  }
];

// Student Metas
interface StudentProfileState {
  pocketMoney: number;
  allowance: number;
  semesterBudget: {
    hostel: number;
    food: number;
    books: number;
    courses: number;
    travel: number;
  };
  careerGoals: string[];
}

let studentProfile: StudentProfileState = {
  pocketMoney: 5000.00,
  allowance: 10000.00,
  semesterBudget: {
    hostel: 3000.00,
    food: 2500.00,
    books: 1000.00,
    courses: 1500.00,
    travel: 1000.00
  },
  careerGoals: ['Complete AI Engineering Degree', 'Automate Expense Sweeping', 'Preserve Consistent GATE prep timeline']
};

// Fraud Alert notifications
interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: 'security_threat' | 'goal_milestone' | 'info';
  timestamp: string;
  read: boolean;
  severity: 'danger' | 'warning' | 'success' | 'info';
}

let systemNotifications: SystemNotification[] = [
  {
    id: 'noti_f_seeded_1',
    title: 'High Risk Offline Purchase',
    description: 'Suspicious transaction flag triggered on AWS Bulk Purchase. Value exceeded ₹5,000 threshold during restricted night hours.',
    type: 'security_threat',
    timestamp: new Date().toISOString(),
    read: false,
    severity: 'danger'
  }
];

// Friend splits
interface FriendExpense {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string;
  splitMode: 'equal' | 'custom';
  notes?: string;
  createdAt: string;
  members: { name: string; owesAmount: number; isSettled: boolean }[];
  settlements: { id: string; from: string; to: string; amount: number; isSettled: boolean }[];
}

let friendExpenses: FriendExpense[] = [
  {
    id: 'split_1',
    title: 'Research Project Textbooks',
    totalAmount: 1500.00,
    paidBy: 'Robin Liu',
    splitMode: 'equal',
    notes: 'Deep learning reference guides split with study group.',
    createdAt: new Date().toISOString(),
    members: [
      { name: 'Robin Liu', owesAmount: 500.00, isSettled: true },
      { name: 'Aditya', owesAmount: 500.00, isSettled: false },
      { name: 'Ananya', owesAmount: 500.00, isSettled: false }
    ],
    settlements: [
      { id: 'set_1_1', from: 'Aditya', to: 'Robin Liu', amount: 500.00, isSettled: false },
      { id: 'set_1_2', from: 'Ananya', to: 'Robin Liu', amount: 500.00, isSettled: false }
    ]
  }
];

// ======================================================================
//   EVALUATE FRAUD RISK
// ======================================================================

function evaluateTransactionRisk(tx: Partial<Transaction>, userRole: UserRole): {
  riskScore: number;
  riskStatus: 'low' | 'medium' | 'high';
  violations: string[];
} {
  const violations: string[] = [];
  let score = 5; // Base risk score

  const hour = new Date().getHours();
  const isOffHours = hour >= 23 || hour < 5;

  const amount = tx.amount || 0;
  const category = tx.category || '';

  // Rule 1 & 2: High Value Thresholds
  const highValStudentRule = securityRules.find(r => r.id === 'rule-1');
  const highValProfRule = securityRules.find(r => r.id === 'rule-2');

  if (userRole === 'student') {
    if (highValStudentRule && highValStudentRule.enabled && amount > highValStudentRule.value) {
      violations.push(`Student High-Value Threshold Breached (> ₹${highValStudentRule.value})`);
      score += 45;
    }
  } else {
    if (highValProfRule && highValProfRule.enabled && amount > highValProfRule.value) {
      violations.push(`Professional Capital Limit Breached (> ₹${highValProfRule.value})`);
      score += 50;
    }
  }

  // Rule 3: Off hours
  const offHoursRule = securityRules.find(r => r.id === 'rule-3');
  if (offHoursRule && offHoursRule.enabled && isOffHours) {
    violations.push('Restricted Night Hours Activity (11 PM - 5 AM)');
    score += 30;
  }

  // Rule 4: Category outlier
  const categoryRule = securityRules.find(r => r.id === 'rule-4');
  if (categoryRule && categoryRule.enabled && category.toLowerCase().includes('food')) {
    if (amount > categoryRule.value) {
      violations.push(`Out-of-Pattern Food Expense Limit Exceeded (> ₹${categoryRule.value})`);
      score += 25;
    }
  }

  const finalScore = Math.min(score, 100);
  let status: 'low' | 'medium' | 'high' = 'low';
  if (finalScore >= 70) {
    status = 'high';
  } else if (finalScore >= 35) {
    status = 'medium';
  }

  return {
    riskScore: finalScore,
    riskStatus: status,
    violations
  };
}

// ======================================================================
//   LAZY GEMINI AI CLIENT
// ======================================================================

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ======================================================================
//   REST API ROUTING (CONNECTED & COMPATIBLE)
// ======================================================================

// AUTH LAYER
app.post('/api/auth/register', (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ error: 'Missing email, password, or role' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = users.find(u => u.email === normalizedEmail);
  if (exists) {
    res.status(400).json({ error: 'Account already exists' });
    return;
  }

  const newUser = {
    email: normalizedEmail,
    passwordHash: password,
    role: role as UserRole,
    name: name || email.split('@')[0]
  };

  users.push(newUser);
  currentUser = {
    id: `usr_${Date.now()}`,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    financeScore: role === 'student' ? 78 : 84,
    balance: role === 'student' ? 8500.00 : 124000.00,
    income: role === 'student' ? 10000.00 : 150000.00,
    spendAlertsEnabled: false
  };

  res.json({ success: true, email: currentUser.email, role: currentUser.role, user: currentUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Missing email or password' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find(u => u.email === normalizedEmail && u.passwordHash === password);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  currentUser = {
    id: `usr_${Date.now()}`,
    name: user.name,
    email: user.email,
    role: user.role,
    financeScore: user.role === 'student' ? 78 : 84,
    balance: user.role === 'student' ? 8500.00 : 124000.00,
    income: user.role === 'student' ? 10000.00 : 150000.00,
    spendAlertsEnabled: false
  };

  res.json({ success: true, email: currentUser.email, role: currentUser.role, user: currentUser });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, user: currentUser });
});

app.post('/api/auth/role', (req, res) => {
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ error: 'Role is required' });
    return;
  }
  currentUser.role = role as UserRole;
  if (role === 'student') {
    currentUser.financeScore = 78;
    currentUser.balance = 8500.00;
    currentUser.income = 10000.00;
  } else {
    currentUser.financeScore = 84;
    currentUser.balance = 124000.00;
    currentUser.income = 150000.00;
  }
  res.json(currentUser);
});

// TRANSACTIONS LAYER
app.get('/api/transactions', (req, res) => {
  const role = (req.query.role as UserRole) || currentUser.role;
  const email = (req.query.email as string) || currentUser.email;

  const userTx = transactions.filter(t => t.userEmail === email);
  if (userTx.length > 0) {
    res.json(userTx);
  } else {
    const seededTx = transactions.filter(t => t.userRole === role && !t.userEmail).map(t => ({
      ...t,
      id: `tx-${role}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userEmail: email
    }));
    transactions = [...seededTx, ...transactions];
    res.json(seededTx.length ? seededTx : transactions.filter(t => t.userRole === role));
  }
});

app.post('/api/transactions', (req, res) => {
  const { merchant, amount, category, userRole, notes, userEmail } = req.body;

  if (!merchant || amount === undefined || !category || !userRole) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  const amt = parseFloat(amount);
  const riskResult = evaluateTransactionRisk({ merchant, amount: amt, category }, userRole);

  const newTx: Transaction = {
    id: `tx-sim-${Date.now()}`,
    merchant,
    amount: amt,
    category,
    date: new Date().toISOString(),
    riskScore: riskResult.riskScore,
    riskStatus: riskResult.riskStatus,
    notes,
    userRole,
    userEmail: userEmail || currentUser.email,
    ruleViolations: riskResult.violations
  };

  transactions.unshift(newTx);
  currentUser.balance = Math.max(0, currentUser.balance - amt);

  // Auto-generate notification if high risk
  if (riskResult.riskStatus === 'high') {
    systemNotifications.unshift({
      id: `noti_f_${Date.now()}`,
      title: 'Suspicious Ledger Transaction',
      description: `Risk score ${riskResult.riskScore}% flagged on purchase to ${merchant}. Triggered: ${riskResult.violations.join(', ')}`,
      type: 'security_threat',
      timestamp: new Date().toISOString(),
      read: false,
      severity: 'danger'
    });
  }

  res.json(newTx);
});

// CSV Import
app.post('/api/transactions/import', (req, res) => {
  const { transactions: importedList } = req.body;
  if (!Array.isArray(importedList)) {
    res.status(400).json({ error: 'Invalid transactions format' });
    return;
  }

  const processed = importedList.map(t => {
    const amt = parseFloat(t.amount || 0);
    const riskResult = evaluateTransactionRisk({ merchant: t.merchant, amount: amt, category: t.category }, currentUser.role);
    return {
      id: `tx-imp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      merchant: t.merchant || 'Standard Retailer',
      amount: amt,
      category: t.category || 'Other',
      date: t.date || new Date().toISOString(),
      riskScore: riskResult.riskScore,
      riskStatus: riskResult.riskStatus,
      notes: t.notes || 'CSV imported ledger record.',
      userRole: currentUser.role,
      userEmail: currentUser.email,
      ruleViolations: riskResult.violations
    };
  });

  transactions = [...processed, ...transactions];
  res.json({ success: true, count: processed.length });
});

// Bulk Payments Reconciliation
app.post('/api/transactions/bulk', (req, res) => {
  const { payments: list } = req.body;
  if (!Array.isArray(list)) {
    res.status(400).json({ error: 'Payments list is required' });
    return;
  }

  let totalDeduct = 0;
  const processed = list.map((p, index) => {
    const amt = parseFloat(p.amount || 100);
    totalDeduct += amt;
    const riskResult = evaluateTransactionRisk({ merchant: p.merchant || p.recipientName, amount: amt, category: p.category || 'Bills' }, currentUser.role);
    return {
      id: `tx-bulk-${Date.now()}-${index}`,
      merchant: p.merchant || p.recipientName || 'P2P Transfer',
      amount: amt,
      category: p.category || 'Bills',
      date: p.date || new Date().toISOString(),
      riskScore: riskResult.riskScore,
      riskStatus: riskResult.riskStatus,
      notes: 'Bulk payment transaction.',
      userRole: currentUser.role,
      userEmail: currentUser.email,
      ruleViolations: riskResult.violations
    };
  });

  transactions = [...processed, ...transactions];
  currentUser.balance = Math.max(0, currentUser.balance - totalDeduct);
  res.json({ success: true, count: processed.length, balance: currentUser.balance });
});

// SAVINGS GOALS MODULE
app.get('/api/goals', (req, res) => {
  const role = (req.query.role as UserRole) || currentUser.role;
  const email = (req.query.email as string) || currentUser.email;

  const userGoals = goals.filter(g => g.userEmail === email);
  if (userGoals.length > 0) {
    res.json(userGoals);
  } else {
    const seededGoals = goals.filter(g => g.userRole === role && !g.userEmail).map(g => ({
      ...g,
      id: `g-${role}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userEmail: email
    }));
    goals = [...seededGoals, ...goals];
    res.json(seededGoals.length ? seededGoals : goals.filter(g => g.userRole === role));
  }
});

app.post('/api/goals', (req, res) => {
  const { name, targetAmount, savedAmount, deadlineMonths, category } = req.body;
  if (!name || !targetAmount || !deadlineMonths) {
    res.status(400).json({ error: 'Missing name, targetAmount or deadlineMonths' });
    return;
  }

  const target = parseFloat(targetAmount);
  const saved = parseFloat(savedAmount || 0);
  const term = parseInt(deadlineMonths);
  const installment = Math.max(0, parseFloat(((target - saved) / term).toFixed(2)));

  const remaining = Math.max(0, target - saved);
  const probability = Math.min(99, Math.max(15, Math.round((currentUser.balance / (installment || 1)) * 10)));

  const newGoal = {
    id: `g-${Date.now()}`,
    name,
    targetAmount: target,
    currentAmount: saved,
    deadline: new Date(Date.now() + term * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: category || 'Other',
    status: (saved >= target ? 'completed' : 'active') as 'completed' | 'active',
    userRole: currentUser.role,
    userEmail: currentUser.email,
    probability,
    savingsPlan: `Aim to save ₹${installment.toLocaleString()} per month for the next ${term} months.`,
    recommendations: [
      { id: `rec-${Date.now()}`, type: 'cashflow', text: `Your budget can support ₹${installment} monthly installment.` }
    ]
  };

  goals.unshift(newGoal);
  res.json(newGoal);
});

// Contribute / Deposit to Goal
app.post('/api/goals/contribute', (req, res) => {
  const { goalId, amount, source } = req.body;
  if (!goalId || amount === undefined) {
    res.status(400).json({ error: 'Missing goalId or amount' });
    return;
  }

  const goal = goals.find(g => g.id === goalId);
  if (!goal) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }

  const depositAmt = parseFloat(amount);
  
  if (source === 'wallet' || !source) {
    currentUser.balance = Math.max(0, currentUser.balance - depositAmt);
  }

  goal.currentAmount = Math.min(goal.currentAmount + depositAmt, goal.targetAmount);
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
    systemNotifications.unshift({
      id: `noti_g_${Date.now()}`,
      title: 'Goal Completed! 🎉',
      description: `Objective accomplished! '${goal.name}' tracker has reached 100% convergence.`,
      type: 'goal_milestone',
      timestamp: new Date().toISOString(),
      read: false,
      severity: 'success'
    });
  }

  res.json(goal);
});

app.post('/api/goals/:goalId/deposit', (req, res) => {
  const { goalId } = req.params;
  const { amount, source } = req.body;
  if (amount === undefined) {
    res.status(400).json({ error: 'Amount is required' });
    return;
  }

  const goal = goals.find(g => g.id === goalId);
  if (!goal) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }

  const depositAmt = parseFloat(amount);
  if (source === 'wallet' || !source) {
    currentUser.balance = Math.max(0, currentUser.balance - depositAmt);
  }

  goal.currentAmount = Math.min(goal.currentAmount + depositAmt, goal.targetAmount);
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
  }

  res.json({ success: true, balance: currentUser.balance, goal });
});

app.delete('/api/goals/:goalId', (req, res) => {
  const { goalId } = req.params;
  goals = goals.filter(g => g.id !== goalId);
  res.json({ success: true });
});

app.get('/api/goals/insights', (req, res) => {
  const active = goals.filter(g => g.userEmail === currentUser.email);
  if (!active.length) {
    res.json({ insights: [{ type: 'empty', text: 'No active savings goals detected. Create a goal to get personalized recommendations.' }] });
    return;
  }

  const totalTarget = active.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = active.reduce((sum, g) => sum + g.currentAmount, 0);
  const pct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  res.json({
    insights: [
      { type: 'progress', text: `You have saved ₹${totalSaved.toLocaleString()} (${pct}% of combined targets).` },
      { type: 'trajectory', text: `Maintain current allocation of ₹3,000 monthly to stay on target track.` }
    ]
  });
});

// RULES LAYER
app.get('/api/rules', (req, res) => {
  res.json(securityRules);
});

app.post('/api/rules/toggle', (req, res) => {
  const { ruleId, enabled, value } = req.body;
  const rule = securityRules.find(r => r.id === ruleId);
  if (!rule) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }

  if (enabled !== undefined) rule.enabled = enabled;
  if (value !== undefined) rule.value = parseFloat(value);

  res.json(rule);
});

// NOTIFICATIONS ENGINE
app.get('/api/notifications', (req, res) => {
  res.json(systemNotifications);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const noti = systemNotifications.find(n => n.id === id);
  if (noti) noti.read = true;
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  systemNotifications.forEach(n => n.read = true);
  res.json({ success: true });
});

app.delete('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  systemNotifications = systemNotifications.filter(n => n.id !== id);
  res.json({ success: true });
});

// PAYMENTS AND WALLET MANAGER
app.get('/api/payments', (req, res) => {
  res.json({ methods: paymentMethods });
});

app.post('/api/payments', (req, res) => {
  const { type, holder, lastFour, expiry, issuer } = req.body;
  if (!type || !issuer) {
    res.status(400).json({ error: 'Missing type or issuer' });
    return;
  }

  const newMethod: PaymentMethod = {
    id: `pay_${Date.now()}`,
    type: type as 'card' | 'bank',
    name: type === 'card' ? `${issuer} card` : `${issuer} Bank Account`,
    issuer,
    lastFour: lastFour || '1234',
    expiry: expiry || 'N/A',
    holder: holder || currentUser.name,
    isFrozen: false
  };

  paymentMethods.push(newMethod);
  res.json({ success: true, ...newMethod });
});

app.delete('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  paymentMethods = paymentMethods.filter(p => p.id !== id);
  res.json({ success: true });
});

app.post('/api/payments/topup', (req, res) => {
  const { amount, account_id } = req.body;
  if (!amount) {
    res.status(400).json({ error: 'Amount is required' });
    return;
  }

  const amt = parseFloat(amount);
  currentUser.balance += amt;

  // Insert standard deposit transaction
  const topupTx: Transaction = {
    id: `tx-topup-${Date.now()}`,
    merchant: 'Nexus Private Wallet Topup',
    amount: amt,
    category: 'Income',
    date: new Date().toISOString(),
    riskScore: 0,
    riskStatus: 'low',
    notes: `Wallet funds manual sweep topup.`,
    userRole: currentUser.role,
    userEmail: currentUser.email,
    ruleViolations: []
  };

  transactions.unshift(topupTx);
  res.json({ success: true, balance: currentUser.balance, transaction: topupTx });
});

app.post('/api/payments/:id/toggle-freeze', (req, res) => {
  const { id } = req.params;
  const pm = paymentMethods.find(p => p.id === id);
  if (!pm) {
    res.status(404).json({ error: 'Payment method not found' });
    return;
  }
  pm.isFrozen = !pm.isFrozen;
  res.json({ success: true, isFrozen: pm.isFrozen });
});

app.post('/api/payments/freeze-all', (req, res) => {
  paymentMethods.forEach(p => p.isFrozen = true);
  res.json({ success: true, isFrozen: true });
});

// STUDENT PROFILE HUB
app.get('/api/student/profile', (req, res) => {
  res.json({
    profile: studentProfile,
    scores: {
      savings: 82,
      discipline: 74,
      overall: currentUser.financeScore
    }
  });
});

app.post('/api/student/profile', (req, res) => {
  const payload = req.body;
  if (payload.pocketMoney !== undefined) studentProfile.pocketMoney = parseFloat(payload.pocketMoney);
  if (payload.allowance !== undefined) studentProfile.allowance = parseFloat(payload.allowance);
  if (payload.semesterBudget) {
    studentProfile.semesterBudget = {
      ...studentProfile.semesterBudget,
      ...payload.semesterBudget
    };
  }
  if (payload.careerGoals) studentProfile.careerGoals = payload.careerGoals;

  res.json({ success: true });
});

// SUBSCRIPTIONS LAYER
app.get('/api/subscriptions', (req, res) => {
  res.json(subscriptions);
});

app.post('/api/subscriptions', (req, res) => {
  const { name, cost, billing_interval, category } = req.body;
  if (!name || !cost) {
    res.status(400).json({ error: 'Missing name or cost' });
    return;
  }

  const price = parseFloat(cost);
  const potential = price > 500 ? parseFloat((price * 0.2).toFixed(2)) : 0;

  const newSub: UserSubscription = {
    id: `sub_${Date.now()}`,
    name,
    cost: price,
    billingInterval: billing_interval || 'monthly',
    category: category || 'Utilities',
    savingsPotential: potential,
    recommendation: potential > 0 
      ? `Switch to standard student annual profile to save ₹${potential} monthly with exact account settings.`
      : 'Maintain active SaaS billing; no redundancies identified.',
    isActive: true
  };

  subscriptions.push(newSub);
  res.json(newSub);
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  subscriptions = subscriptions.filter(s => s.id !== id);
  res.json({ success: true });
});

// FRAUD AUDITING ENGINE
app.get('/api/fraud/alerts', (req, res) => {
  res.json(systemNotifications.filter(n => n.type === 'security_threat'));
});

app.get('/api/fraud/scam-trends', (req, res) => {
  res.json([
    {
      id: 'trend_qr',
      title: 'QR Code Scanning Redirection',
      category: 'QR Code',
      trendScore: 88,
      description: 'Scammers placing overlay QR stickers on restaurant menus to redirect payment gateways.',
      safeguards: ['Always double check URL domain matches the restaurant SSL profile before submitting funds.']
    },
    {
      id: 'trend_subscription',
      title: 'Dark Pattern Subscriptions',
      category: 'SaaS Billing',
      trendScore: 72,
      description: 'Free trial platforms immediately auto-renewing into expensive annual bundles with hidden cancellation portals.',
      safeguards: ['Leverage Nexus Subscriptions audit to cancel immediately after initializing trial.']
    }
  ]);
});

app.post('/api/fraud/merchant-trust', (req, res) => {
  const { merchantName } = req.body;
  if (!merchantName) {
    res.status(400).json({ error: 'Merchant name is required' });
    return;
  }

  const name = merchantName.toLowerCase();
  if (name.includes('gucci') || name.includes('amazon') || name.includes('delta')) {
    res.json({
      score: 95,
      address: 'Corporate Headquarters, US',
      phone: '+1 (800) 555-0100',
      website: `https://www.${name.replace(' ', '')}.com`,
      legitimacyScore: 98,
      reviews: [{ author: 'Forensic System', rating: 5, text: 'Verified corporate domain SSL handshakes and clean retail indicators.' }],
      aiExplanation: 'Global Verified Merchant. Fully trusted checkout coordinates.'
    });
  } else {
    res.json({
      score: 42,
      address: 'Unknown / Virtual gateway address',
      phone: 'Not available',
      website: 'N/A',
      legitimacyScore: 35,
      reviews: [{ author: 'User Flag', rating: 1, text: 'Reported double-debit checkout attempt!' }],
      aiExplanation: 'Caution: Merchant has short domain registration life and zero physical contact references. High probability of phishing redirection.'
    });
  }
});

app.post('/api/fraud/investigate', (req, res) => {
  const { transactionId } = req.body;
  const tx = transactions.find(t => t.id === transactionId);
  if (!tx) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const reports = [
    `<h4>Auditing Investigation Report: ${tx.riskStatus.toUpperCase()} RISK (${tx.riskScore}%)</h4>`,
    `<p><strong>Merchant Flag:</strong> ${tx.merchant}</p>`,
    `<p><strong>Vulnerability Breakdown:</strong> The purchase of ₹${tx.amount} has been audited against active safety criteria.</p>`,
    `<ul>`,
    `<li>Safety Check Baseline: ${tx.riskScore > 30 ? 'Rule violation warning triggered.' : 'Aligned perfectly with user historical patterns.'}</li>`,
    `<li>Category Analysis: Mapped Category matches normal ${tx.category} pattern index.</li>`,
    `</ul>`,
    `<p><strong>Recommended Action:</strong> Maintain current safeguards and monitor ledger closely.</p>`
  ].join('\n');

  res.json({
    riskEvaluation: `${tx.riskStatus.toUpperCase()} RISK (${tx.riskScore}%)`,
    vulnerabilityBreakdown: tx.notes || 'Aligned with baseline transactions spending profiles.',
    safeguards: ['Rotate dynamic session passcodes weekly.', 'Validate secure HTTPS domains during QR scans.'],
    report: reports
  });
});

// SHOPPING AFFORDABILITY SCORES AND SHOPPING OFFERS
app.post('/api/purchase-advisor', async (req, res) => {
  const { productName, price, purpose } = req.body;
  if (!productName || !price) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const cost = parseFloat(price);
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `Analyze purchase affordability:
Product: ${productName}
Price: ₹${cost}
User Purpose: ${purpose}
User Role: ${currentUser.role}
User Balance: ₹${currentUser.balance}
User Monthly Income: ₹${currentUser.income}

You are Gemini, a funny, witty, friendly personal financial advisor. Analyze if the user can afford this item. 
Respond in a funny and friendly tone, but give solid, real-world advice. Keep it humorous and engaging (e.g. use funny metaphors about eating instant noodles or selling kidneys, or having to walk instead of taking an auto-rickshaw). Do NOT use any asterisks (*) for formatting.

Please return a valid JSON object matching this schema:
{
  "score": number (0-100 score on affordability, 100 being perfectly affordable, 0 being absolute ruin),
  "affordability": string (funny, friendly explanation of affordability),
  "savingsImpact": string (funny analysis of impact on savings, e.g. how many months of chai/canteen food they have to sacrifice),
  "goalImpact": string (funny analysis of impact on their goals, like their active college goal/prep materials),
  "alternatives": array of objects, each with {"name": string, "price": number} (provide 2 realistic or funny cheaper alternatives, like refurbished models or second-hand or a potato equivalent),
  "aiRecommendation": string (funny, witty, solid advice on whether they should buy it or hold off)
}

Do NOT include any markdown formatting wrappers (like \`\`\`json) besides raw JSON.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });

      const responseText = (response.text || "").trim();
      let cleanedText = responseText;
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "");
        cleanedText = cleanedText.replace(/\n?```$/, "");
      }
      cleanedText = cleanedText.trim();
      
      const parsed = JSON.parse(cleanedText);
      const validatedReport = {
        score: typeof parsed.score === 'number' ? parsed.score : 50,
        affordability: parsed.affordability || "No explanation provided.",
        savingsImpact: parsed.savingsImpact || "No savings impact calculated.",
        goalImpact: parsed.goalImpact || "No goal impact calculated.",
        alternatives: Array.isArray(parsed.alternatives) 
          ? parsed.alternatives.map((alt: any) => ({
              name: alt?.name || "Alternative option",
              price: typeof alt?.price === 'number' 
                ? alt.price 
                : parseFloat(String(alt?.price || '0').replace(/[^\d.]/g, '')) || 0
            }))
          : [],
        aiRecommendation: parsed.aiRecommendation || "No recommendation provided."
      };

      res.json(validatedReport);
      return;
    } catch (err) {
      console.error("Gemini purchase-advisor error, falling back to dynamic mock:", err);
    }
  }

  // Fallback to dynamic, funny mock engine
  const score = cost > currentUser.balance 
    ? Math.max(10, Math.round(100 - (cost / currentUser.balance) * 40)) 
    : Math.round(100 - (cost / currentUser.balance) * 50);

  const cappedScore = Math.min(99, Math.max(5, score));

  let affordability = "";
  let savingsImpact = "";
  let goalImpact = "";
  let aiRecommendation = "";
  let alternatives: { name: string; price: number }[] = [];

  if (cost > currentUser.balance) {
    affordability = `Whoa there! Your wallet is currently crying at ₹${currentUser.balance.toLocaleString()} and you're eyeing a ₹${cost.toLocaleString()} ${productName}? That's not just a budget stretch, that's trying to do splits across the Grand Canyon!`;
    savingsImpact = `You would need to starve for approximately ${Math.ceil(cost / 1500)} weeks, surviving purely on canteen air, hope, and library book dust.`;
    goalImpact = `Active goals like your exam prep materials will be pushed back to the next century.`;
    aiRecommendation = `Hold your horses! Cancel the checkout, step away from the device, and go eat a samosa instead. If you absolutely need it, check the cheaper options below or wait for your next allowance!`;
    alternatives = [
      { name: `Refurbished ${productName} (Grade B)`, price: parseFloat((cost * 0.6).toFixed(0)) },
      { name: `Second-hand alternative via helpful seniors`, price: parseFloat((cost * 0.35).toFixed(0)) }
    ];
  } else if (cost > currentUser.balance * 0.5) {
    affordability = `Middling ground! A ₹${cost.toLocaleString()} bill will gobble up more than half your liquid reserves (₹${currentUser.balance.toLocaleString()}). You can afford it physically, but your wallet will look flatter than a laptop under a stack of textbooks.`;
    savingsImpact = `Expect to skip all fancy coffee, premium snacks, and streaming subscriptions for at least ${Math.ceil(cost / 2000)} weeks.`;
    goalImpact = `This will put a temporary speed bump on your active saving goals. Progress will slow down to a snail's pace!`;
    aiRecommendation = `Advising a cautious HOLD. Think about it for 48 hours. If you're still dreaming about it and can promise to eat home-cooked food for a month, then okay. Otherwise, go for the budget option below.`;
    alternatives = [
      { name: `Refurbished ${productName}`, price: parseFloat((cost * 0.7).toFixed(0)) },
      { name: `Lite / Student alternative tier`, price: parseFloat((cost * 0.5).toFixed(0)) }
    ];
  } else {
    affordability = `Totally feasible! At ₹${cost.toLocaleString()}, this fits nicely into your wallet of ₹${currentUser.balance.toLocaleString()}. No kidneys need to be sold on the black market today!`;
    savingsImpact = `Minimal scratch. It is equivalent to just about ${Math.ceil(cost / 150)} cups of campus cutting-chai. Totally manageable.`;
    goalImpact = `Your savings goals are safe and sound. They won't even notice this little pocket squeeze.`;
    aiRecommendation = `Green light! Since your purpose is "${purpose}", it seems like a solid investment in your day-to-day productivity. Go ahead, treat yourself, but don't make impulse shopping a habit!`;
    alternatives = [
      { name: `Slightly older edition (save even more!)`, price: parseFloat((cost * 0.8).toFixed(0)) },
      { name: `Refurbished model of ${productName}`, price: parseFloat((cost * 0.72).toFixed(0)) }
    ];
  }

  res.json({
    score: cappedScore,
    affordability,
    savingsImpact,
    goalImpact,
    alternatives,
    aiRecommendation
  });
});

// BUDGET FORECASTS
app.post('/api/forecast/analyze', (req, res) => {
  const role = req.body.userRole || currentUser.role;
  const balance = req.body.currentBalance || currentUser.balance;

  const defaultExpenses = role === 'student' ? 5400 : 85000;
  const defaultSavings = role === 'student' ? 2100 : 65000;

  res.json({
    forecastData: [
      { month: 'June', expenses: defaultExpenses, savings: defaultSavings, overspentProb: 15 },
      { month: 'July', expenses: Math.round(defaultExpenses * 1.1), savings: Math.round(defaultSavings * 0.9), overspentProb: 28 },
      { month: 'August', expenses: Math.round(defaultExpenses * 0.95), savings: Math.round(defaultSavings * 1.2), overspentProb: 12 }
    ],
    healthText: role === 'student' 
      ? 'Semester registration expenditures will decrease cash reserve sizes next month. Prune Netflix subscriptions early.'
      : 'Excellent performance. Budget tracking is stable and supports standard index allocations.',
    studentBudgetWarning: role === 'student'
      ? 'Allowance Alert: High-risk out-of-pattern spending will fully deplete balance 8 days before monthly allowance renewal.'
      : null
  });
});

// SERPAPI ENPOINTS
app.get('/api/serpapi/stats', (req, res) => {
  res.json({
    queriesRemaining: 84,
    queriesLimit: 100,
    activeScansSpeed: "Fast (1.2s)"
  });
});

// FRIEND SPLITS CONTROLLER
app.get('/api/friendsplit/history', (req, res) => {
  res.json({ success: true, history: friendExpenses });
});

app.post('/api/friendsplit/create', (req, res) => {
  const { title, total_amount, paid_by, members, split_mode, notes } = req.body;
  if (!title || !total_amount || !paid_by) {
    res.status(400).json({ error: 'Missing title, total_amount, or paid_by parameters' });
    return;
  }

  const total = parseFloat(total_amount);
  const count = (members?.length || 0) + 1;
  const share = parseFloat((total / count).toFixed(2));

  const listMembers = [
    { name: paid_by, owesAmount: share, isSettled: true },
    ...(members || []).map((m: any) => ({
      name: m.name,
      owesAmount: share,
      isSettled: false
    }))
  ];

  const settlements = (members || []).map((m: any, index: number) => ({
    id: `set_${Date.now()}-${index}`,
    from: m.name,
    to: paid_by,
    amount: share,
    isSettled: false
  }));

  const newSplit: FriendExpense = {
    id: `split_${Date.now()}`,
    title,
    totalAmount: total,
    paidBy: paid_by,
    splitMode: split_mode || 'equal',
    notes,
    createdAt: new Date().toISOString(),
    members: listMembers,
    settlements
  };

  friendExpenses.unshift(newSplit);
  res.json({ success: true, expense: newSplit });
});

app.get('/api/friendsplit/analytics', (req, res) => {
  let lent = 0;
  let borrowed = 0;
  let pending = 0;

  friendExpenses.forEach(fe => {
    fe.settlements.forEach(s => {
      if (s.to === currentUser.name && !s.isSettled) {
        lent += s.amount;
        pending += s.amount;
      }
      if (s.from === currentUser.name && !s.isSettled) {
        borrowed += s.amount;
        pending += s.amount;
      }
    });
  });

  res.json({
    success: true,
    total_lent: lent,
    total_borrowed: borrowed,
    pending,
    most_frequent_partner: 'Aditya'
  });
});

app.put('/api/friendsplit/settle/:settlement_id', (req, res) => {
  const { settlement_id } = req.params;
  let found = false;

  friendExpenses.forEach(fe => {
    const s = fe.settlements.find(set => set.id === settlement_id);
    if (s) {
      s.isSettled = true;
      found = true;
      // also toggle member as settled if all settlements are completed
      const member = fe.members.find(m => m.name === s.from);
      if (member) member.isSettled = true;
    }
  });

  if (!found) {
    res.status(404).json({ error: 'Settlement ID not located' });
    return;
  }

  res.json({ success: true });
});

// MISSING PORTAL ENGINES & ANALYTICAL ROUTES

app.get('/api/dashboard/insights', (req, res) => {
  const isStudent = currentUser.role === 'student';
  if (isStudent) {
    res.json({
      insights: [
        "Your weekly Food & Dining budget has a ₹450 surplus. Recommend redirecting to GATE prep target.",
        "Out-of-pattern off-hours bulk tech store purchase of ₹12,500 flagged in Fraud Center.",
        "Potential savings of ₹150/month detected: Netflix premium plan is under-utilized. Consider downgrade."
      ]
    });
  } else {
    res.json({
      insights: [
        "Monthly SaaS expenditure is running 8% below forecast bounds. Excellent discipline.",
        "Recommended safeguard: Enable two-factor OTP approval rules for transactions exceeding ₹50,000.",
        "Your HDFC Wealth sweep account shows uninvested cash surplus. Sweep to Goals to yield 7.2% APY."
      ]
    });
  }
});

app.post('/api/user/spend-alerts', (req, res) => {
  const { enabled } = req.body;
  currentUser.spendAlertsEnabled = !!enabled;
  res.json({ success: true, spendAlertsEnabled: currentUser.spendAlertsEnabled });
});

app.get('/api/spending/trend-analysis', (req, res) => {
  const isStudent = currentUser.role === 'student';
  const currentMonthSpend = isStudent ? 13850 : 92400;
  const threeMonthRollingAverage = isStudent ? 12100 : 85000;
  const variancePct = ((currentMonthSpend - threeMonthRollingAverage) / threeMonthRollingAverage) * 100;
  const varianceLabel = `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}% VARIANCE DEVIATION`;

  res.json({
    currentMonthSpend,
    threeMonthRollingAverage,
    statusColor: variancePct > 10 ? "yellow" : "green",
    summary: isStudent 
      ? `Spending is running 14.4% higher than your rolling average due to recent technology equipment purchase.`
      : `Corporate expenditures are stable, with mild seasonal software licensing variances.`,
    varianceLabel,
    comparisonHistory: {
      "March": isStudent ? 9800 : 78000,
      "April": isStudent ? 11200 : 81000,
      "May": isStudent ? 12500 : 84000,
      "June": currentMonthSpend
    },
    categoryComparison: [
      { category: isStudent ? "Food & Dining" : "Software", current: isStudent ? 3200 : 45000, previous: isStudent ? 2800 : 42000 },
      { category: isStudent ? "Education" : "Hosting", current: isStudent ? 1500 : 25000, previous: isStudent ? 1200 : 23000 },
      { category: isStudent ? "Equipment" : "Marketing", current: isStudent ? 8000 : 15000, previous: isStudent ? 0 : 16000 },
      { category: "Other", current: isStudent ? 1150 : 7400, previous: isStudent ? 1500 : 4000 }
    ],
    insights: isStudent ? [
      "Bulk technology equipment purchase is the primary driver of this month's budget variance.",
      "Canteen food spend is stable, but coffee and cutting tea visits have ticked upward slightly.",
      "Recommended: Pause or defer non-academic shopping categories for 7 days to let balance recover."
    ] : [
      "Software licensing renewals are complete. Expected runtime spend will plateau next month.",
      "Vigilant budget tracking in Hosting has prevented standard database scale-out over-allocation.",
      "Recommended: Setup automatic alerts for any transaction exceeding ₹50,000."
    ]
  });
});

app.get('/api/spending/insights', (req, res) => {
  res.json({
    tips: [
      "Establish a 'Pocket Money Buffer' of **₹1,000** in your wallet structure that you never touch except for extreme emergencies.",
      "Leaving cart items for 72 hours before checking out cuts down impulse shopping in **Shopping** category by up to 60%!",
      "Your continuous subscription cost is active. Pruning just one minor entertainment channel raises your compound savings velocity."
    ]
  });
});

function hasWord(msgLower: string, ...words: string[]): boolean {
  const tokens = msgLower.split(/[^a-zA-Z0-9]/).filter(Boolean);
  return words.some(word => {
    const cleanWord = word.toLowerCase();
    if (cleanWord.length <= 3) {
      return tokens.includes(cleanWord);
    }
    if (msgLower.includes(cleanWord)) {
      return tokens.some(token => token.includes(cleanWord));
    }
    return false;
  });
}

function generateFunnyDynamicChatResponse(message: string, role: string, user: any): string {
  const msgLower = message.toLowerCase();
  const balance = user.balance !== undefined ? user.balance : 8500;
  const income = user.income !== undefined ? user.income : 10000;
  const name = user.name || "User";
  const balanceStr = `₹${balance.toLocaleString()}`;
  const incomeStr = `₹${income.toLocaleString()}`;
  const isStudent = role === 'student';

  let intent = "General Financial Question";
  let analysis = "";
  let risk = "Medium";
  let recommendation = "";
  let actions: string[] = [];

  // 1. Detect Intent
  // Regex check to extract any amount/price mentioned in the message
  const amountMatch = message.match(/(?:rs\.?|inr|₹|rs\s+)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  let costValue: number | null = null;
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    costValue = parseFloat(rawNum);
  }

  if (hasWord(msgLower, "iphone", "laptop", "macbook", "phone", "gadget", "ipad", "electronics", "buy", "purchase", "afford", "cost")) {
    intent = costValue !== null ? "Buy Decision Analysis" : "Affordability Analysis";
    
    let cost = costValue || 80000; 
    if (msgLower.includes("phone") || msgLower.includes("iphone")) cost = costValue || 120000;
    if (msgLower.includes("netflix") || msgLower.includes("spotify") || msgLower.includes("subscription")) cost = costValue || 649;
    if (hasWord(msgLower, "chai", "samosa", "tea", "canteen")) cost = costValue || 15;

    const percentageOfBalance = Math.round((cost / balance) * 100);
    const percentageOfIncome = Math.round((cost / income) * 100);

    analysis = `You are eyeing a purchase costing approximately ₹${cost.toLocaleString()} as a ${isStudent ? 'Student' : 'Professional'}. Your current wallet balance is ${balanceStr} (this purchase represents ${percentageOfBalance}% of your total liquid funds) and your monthly income/stipend is ${incomeStr} (represents ${percentageOfIncome}% of your monthly intake).`;

    if (cost > balance) {
      risk = "High";
      recommendation = `Whoa, ${name}! Your wallet is currently crying at ${balanceStr}, and you are looking at a ₹${cost.toLocaleString()} spend. That's a budget-breaker! We highly recommend holding off or setting up a target savings lockbox first.`;
      actions = [
        `Do not purchase this immediately. Wait at least 48 hours to bypass the impulse phase.`,
        `Head to your active Savings Lockbox and create a specific target goal.`,
        `Explore cheap pre-owned alternatives or student/educational discount cards.`
      ];
    } else if (cost > balance * 0.3) {
      risk = "Medium";
      recommendation = `It's technically feasible, ${name}, but a ₹${cost.toLocaleString()} purchase will consume ${percentageOfBalance}% of your cash buffer. We recommend caution so you don't end up cash-strapped.`;
      actions = [
        `If you proceed, check if you can split the cost using our Splitter.`,
        `Review your recurring sweeps to find ₹${Math.round(cost * 0.1).toLocaleString()} in subscription savings to offset this.`,
        `Audit your spending telemetry to ensure no critical upcoming bills are due.`
      ];
    } else {
      risk = "Low";
      recommendation = `Looking good, ${name}! A spending of ₹${cost.toLocaleString()} fits very comfortably inside your current reserves of ${balanceStr}. No kidneys need to be auctioned off today!`;
      actions = [
        `Proceed with the purchase using your main card vault.`,
        `Keep cards frozen inside your security console except during this purchase window.`,
        `Log the final receipt to your ledger to keep your financial score high.`
      ];
    }
  } else if (hasWord(msgLower, "save", "saving", "budget", "plan", "accumulate")) {
    intent = "Savings Planning";
    const target = costValue || Math.round(income * 0.2);
    const dailyTarget = Math.round(target / 30);
    const percentOfIncome = Math.round((target / income) * 100);

    analysis = `You are trying to save ₹${target.toLocaleString()} from your monthly stipend/income of ${incomeStr}. With a current balance of ${balanceStr}, setting aside ₹${target.toLocaleString()} represents ${percentOfIncome}% of your monthly intake. This requires a daily saving velocity of ₹${dailyTarget.toLocaleString()}.`;

    if (percentOfIncome > 50) {
      risk = "High";
      recommendation = `Saving ${percentOfIncome}% of your income is a very aggressive target, ${name}! While admirable, ensure you leave enough for essential campus canteen meals, rents, and survival bills.`;
      actions = [
        `Lower your target to a sustainable 20-30% first to build early momentum.`,
        `Drape an active lockbox to sweep a fixed 15% of any stipend deposits automatically.`,
        `Strictly limit your canteen/caffè outings to once a week.`
      ];
    } else {
      risk = "Low";
      recommendation = `This is a highly realistic and healthy goal, ${name}! At ${percentOfIncome}% of your monthly income, you can easily automate this savings loop with simple discipline.`;
      actions = [
        `Initialize a dedicated Savings Lockbox today with a target of ₹${target.toLocaleString()}.`,
        `Configure an automatic sweeps trigger inside your settings.`,
        `Track your daily progress on our telemetry dashboard to maintain your score.`
      ];
    }
  } else if (hasWord(msgLower, "netflix", "spotify", "subscription", "prime", "saas", "ott", "billing", "recurring")) {
    intent = "Subscription Review";
    analysis = `Reviewing your recurring subscriptions against your income of ${incomeStr} and active balance of ${balanceStr}. Silent monthly sweeps are quiet wallet killers, especially for a ${isStudent ? 'student with pocket allowance' : 'professional with investments'}.`;
    risk = "Medium";
    recommendation = `We suggest auditing all active subscription cards. Binge, rotate, and cancel is the absolute best way to keep your subscription leakage at zero.`;
    actions = [
      `Go to the 'Recurring Sweeps' tab and identify unused digital channels.`,
      `Share subscription costs with friends or roommates using the split ledger.`,
      `Downgrade premium multi-screen tiers to single-device basic tiers to save instantly.`
    ];
  } else if (hasWord(msgLower, "scam", "fraud", "hack", "suspicious", "threat", "alert", "gucci")) {
    intent = "Scam Detection";
    analysis = `Analyzing security state for your account ${name}. Your active card limit rules and recent transactions indicate a security risk score of ${isStudent ? '78%' : '84%'} stability.`;
    risk = "High";
    recommendation = `Take immediate defensive steps! Protect your ${balanceStr} balance from rogue scans, unverified split requests, or unauthorized terminal sweeps.`;
    actions = [
      `Go to your Security Console right now and freeze all active card lines.`,
      `Set your maximum daily single transaction limit to ₹1,500.`,
      `Never scan external QR codes or share multi-factor verification codes.`
    ];
  } else if (hasWord(msgLower, "split", "friends", "each", "divide", "among", "roommates", "roommate", "bill")) {
    intent = "Expense Split Analysis";
    let people = 5;
    const peopleMatch = message.match(/(\d+)\s+(?:friends|people|roommates|shares)/i);
    if (peopleMatch) people = parseInt(peopleMatch[1]);
    
    let total = costValue || 2000;
    const perPerson = Math.round(total / people);

    analysis = `Splitting a bill of ₹${total.toLocaleString()} among ${people} individuals. This translates to exactly ₹${perPerson.toLocaleString()} per person.`;
    risk = "Low";
    recommendation = `Log this split immediately in the Roommate Split Ledger so nobody "forgets" their share. A clean split makes for solid friendships!`;
    actions = [
      `Add a new split item of ₹${perPerson.toLocaleString()} each to our campus/shared tracker.`,
      `Set up automated payment reminders inside the Device Vaults.`,
      `Accept nothing less than prompt settlement via direct transfers.`
    ];
  } else {
    intent = "General Financial Question";
    analysis = `Analyzing your general query: "${message}". As a ${isStudent ? 'Student' : 'Professional'}, you are currently working with an active cash balance of ${balanceStr} and a monthly income/stipend of ${incomeStr}.`;
    risk = "Medium";
    recommendation = `Hello, ${name}! Let's make sure we customize your strategy around your specific query. Your current balance of ${balanceStr} gives you great leverage to manage this smart!`;
    actions = [
      `Head over to Spend Telemetry to view a comprehensive breakdown of where your money goes.`,
      `Set up a specific savings goal if this involves a long-term plan.`,
      `Let me know if you want to calculate affordability or split this cost with others!`
    ];
  }

  return `## Query Understanding
${message}

## Financial Analysis
${analysis}

## Risk Score
${risk}

## Recommendation
${recommendation}

## Suggested Actions
${actions.map(act => `- ${act}`).join("\n")}`;
}

async function queryNexusAdvisor(
  client: any,
  message: string,
  history: any[],
  userRole: string,
  userDetails: { name: string; balance: number; income: number; financeScore: number },
  image_base64?: string,
  image_mime_type?: string
): Promise<string> {
  const { name, balance, income, financeScore } = userDetails;

  const systemInstruction = `You are Nexus OS Financial Advisor.

The user's latest message is the highest priority.

Never repeat previous answers.
Never use canned responses.
Always analyze the current query.
Use wallet balance, transactions, subscriptions, income and savings data to generate a personalized answer.

If data is unavailable, ask follow-up questions.

The current user is ${name}. Their role/work is ${userRole === 'student' ? 'a Student (focusing on campus life, pocket money, canteen meals, and study books)' : 'a Professional (focusing on work, salary, SaaS billing audits, and investments)'}.
Their current account balance is ₹${balance}. Their monthly income/stipend is ₹${income}. Their finance score is ${financeScore}%.

CRITICAL RULES:
1. NEVER return a predefined, static, template response.
2. NEVER answer about education funds, savings goals, investments, or any topic unless the user explicitly asks about it.
3. ALWAYS analyze the user's latest question first.
4. Generate a fresh response based on:
   - User's actual question
   - Wallet balance
   - Spending history
   - Monthly income
   - Savings
   - Subscriptions
   - Buy-decision audit data
   - Student or Professional mode

Return JSON:
{
  "intent": "Concise summary of what the user explicitly asked in their latest query",
  "analysis": "Witty, humorous, and highly personalized financial analysis using the user's actual name, balance, income, and role. Limit analogies to what is relevant to the query (no unprompted talk about savings goals, investments, or education funds unless asked).",
  "risk": "Low / Medium / High",
  "recommendation": "The personalized recommendation answering the exact query",
  "actions": ["Action 1", "Action 2", "Action 3"]
}`;

  try {
    const contents: any[] = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    if (image_base64 && image_mime_type) {
      contents.push({
        inlineData: {
          data: image_base64,
          mimeType: image_mime_type
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const text = (response.text || "").trim();
    let cleanedText = text;
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "");
      cleanedText = cleanedText.replace(/\n?```$/, "");
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);
    
    return `## Query Understanding
${parsed.intent || message}

## Financial Analysis
${parsed.analysis}

## Risk Score
${parsed.risk || "Medium"}

## Recommendation
${parsed.recommendation}

## Suggested Actions
${Array.isArray(parsed.actions) ? parsed.actions.map((act: string) => `- ${act}`).join("\n") : "- Review your spending telemetry\n- Save aggressively\n- Keep cards frozen when not in use"}`;
  } catch (err) {
    console.error("Error in queryNexusAdvisor, falling back:", err);
    return generateFunnyDynamicChatResponse(message, userRole, userDetails);
  }
}

app.post('/api/copilot/ask', async (req, res) => {
  const { message, userRole, currentBalance, userName, userIncome, userFinanceScore, image_base64, image_mime_type } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const activeName = userName || currentUser.name;
  const activeRole = userRole || currentUser.role;
  const activeBalance = currentBalance !== undefined ? currentBalance : currentUser.balance;
  const activeIncome = userIncome !== undefined ? userIncome : currentUser.income;
  const activeScore = userFinanceScore !== undefined ? userFinanceScore : currentUser.financeScore;

  const client = getGeminiClient();
  let responseText = "";

  if (client) {
    responseText = await queryNexusAdvisor(
      client,
      message,
      [],
      activeRole,
      {
        name: activeName,
        balance: typeof activeBalance === 'string' ? parseFloat(activeBalance) : activeBalance,
        income: typeof activeIncome === 'string' ? parseFloat(activeIncome) : activeIncome,
        financeScore: typeof activeScore === 'string' ? parseFloat(activeScore) : activeScore
      },
      image_base64,
      image_mime_type
    );
  } else {
    responseText = generateFunnyDynamicChatResponse(message, activeRole, {
      name: activeName,
      balance: typeof activeBalance === 'string' ? parseFloat(activeBalance) : activeBalance,
      financeScore: activeScore,
      income: activeIncome
    });
  }

  res.json({ response: responseText });
});

// INTERACTIVE FORENSIC CHATBOT ENHANCED
app.post('/api/chat', async (req, res) => {
  const { message, history, chatHistory, role, email, name, balance, income, financeScore } = req.body;
  const activeHistory = history || chatHistory || [];
  
  const userRole = role || currentUser.role;
  const userEmail = email || currentUser.email;
  const userName = name || currentUser.name;
  const userBalance = balance !== undefined ? balance : currentUser.balance;
  const userIncome = income !== undefined ? income : currentUser.income;
  const userFinanceScore = financeScore !== undefined ? financeScore : currentUser.financeScore;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const client = getGeminiClient();
  let responseText = "";

  if (client) {
    responseText = await queryNexusAdvisor(
      client,
      message,
      activeHistory,
      userRole,
      {
        name: userName,
        balance: typeof userBalance === 'string' ? parseFloat(userBalance) : userBalance,
        income: typeof userIncome === 'string' ? parseFloat(userIncome) : userIncome,
        financeScore: typeof userFinanceScore === 'string' ? parseFloat(userFinanceScore) : userFinanceScore
      }
    );
  } else {
    responseText = generateFunnyDynamicChatResponse(message, userRole, {
      name: userName,
      balance: typeof userBalance === 'string' ? parseFloat(userBalance) : userBalance,
      financeScore: userFinanceScore,
      income: userIncome
    });
  }

  res.json({ text: responseText });
});

// Setup development or production build flows
async function startServer() {
  if (process.env.DISABLE_HMR === 'true') {
    // Under disabled HMR conditions
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus Core Server successfully running on http://localhost:${PORT}`);
  });
}

startServer();
