export type UserRole = "student" | "professional";

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
  amount: number;
  merchant: string;
  category: "Food" | "Shopping" | "Travel" | "Bills" | "Education" | "Healthcare" | "Entertainment";
  date: string;
  location: string;
  riskScore: number;
  riskStatus: "low" | "medium" | "high";
  riskReason?: string;
  isRecurring?: boolean;
}

export interface FraudAlert {
  id: string;
  title: string;
  type: "behavioral" | "location_anomaly" | "scam_trend";
  riskScore: number;
  merchant: string;
  amount: number;
  reason: string;
  details: string;
  date: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadlineMonths: number;
  monthlySavingsNeeded: number;
  category: "Laptop Font" | "Higher Studies" | "Travel Fund" | "Emergency Fund" | "Certification Fund" | string;
  probability: number;
  savingsPlan?: string;
}

export interface Subscription {
  id: string;
  user_id?: string;
  name: string;
  cost: number;
  interval?: "monthly" | "yearly";
  billing_interval?: "monthly" | "yearly";
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
  sender: "user" | "bot";
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
