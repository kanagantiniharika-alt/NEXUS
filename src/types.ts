/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'professional';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  financeScore: number;
  balance: number;
  income: number;
  password?: string;
  spendAlertsEnabled?: boolean;
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  riskScore: number; // 0 to 100
  riskStatus: 'low' | 'medium' | 'high';
  notes?: string;
  userRole: UserRole;
  userEmail?: string;
  ruleViolations?: string[];
  location?: string;
  riskReason?: string;
  isRecurring?: boolean;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  status: 'active' | 'completed';
  userRole: UserRole;
  userEmail?: string;
  savedAmount?: number;
  deadlineMonths?: number;
  monthlySavingsNeeded?: number;
  probability?: number;
  savingsPlan?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'amount_threshold' | 'category_limit' | 'off_hours' | 'frequency';
  value: number; // For amount limit or frequency count, etc.
  enabled: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isThinking?: boolean;
}

export interface FraudAlert {
  id: string;
  title: string;
  type: 'behavioral' | 'location_anomaly' | 'scam_trend';
  riskScore: number;
  merchant: string;
  amount: number;
  reason: string;
  details: string;
  date: string;
}

export interface Subscription {
  id: string;
  user_id?: string;
  name: string;
  cost: number;
  interval?: 'monthly' | 'yearly';
  billing_interval?: 'monthly' | 'yearly';
  category: string;
  savingsPotential?: number;
  savings_potential?: number;
  recommendation?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface StudentProfile {
  pocketMoney: number;
  allowance: number;
  semesterBudget: {
    hostel: number;
    food: number;
    books: number;
    courses: number;
    travel: number;
  };
  financeScore: number;
  careerGoals: string[];
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface MerchantQuery {
  name: string;
  location?: string;
}

export interface MerchantTrustReport {
  score: number;
  reviews: { author: string; rating: number; text: string }[];
  address: string;
  phone: string;
  website: string;
  legitimacyScore: number;
  aiExplanation: string;
  explanation?: string;
}

export interface PurchaseQuery {
  productName: string;
  price: number;
  purpose: string;
}

export interface PurchaseReport {
  score: number;
  affordability: string;
  savingsImpact: string;
  goalImpact: string;
  alternatives: { name: string; price: number; link?: string }[];
  aiRecommendation: string;
}

