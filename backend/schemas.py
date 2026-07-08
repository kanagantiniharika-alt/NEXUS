from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date as dt_date, datetime
from decimal import Decimal
from backend.models import UserRole, RiskStatusLevel, TransactionCategory, AlertType, BillingInterval

# ======================================================================
#   USER SCHEMAS & SECURITY PROFILES
# ======================================================================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.professional

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    finance_score: int
    balance: Decimal
    income: Decimal
    created_at: datetime
    spendAlertsEnabled: Optional[bool] = False

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    success: bool
    user: UserResponse

    class Config:
        from_attributes = True

class UserUpdateRole(BaseModel):
    role: UserRole


# ======================================================================
#   TRANSACTION SCHEMAS
# ======================================================================

class TransactionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    merchant: str
    category: TransactionCategory
    location: Optional[str] = "Online Gateway"
    date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: Decimal
    merchant: str
    category: TransactionCategory
    transaction_date: dt_date
    location: str
    risk_score: int
    risk_status: RiskStatusLevel
    risk_reason: Optional[str] = None
    is_recurring: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ======================================================================
#   FRAUD ALERTS SCHEMAS
# ======================================================================

class FraudAlertCreate(BaseModel):
    title: str
    type: AlertType
    risk_score: int
    merchant: str
    amount: Decimal
    reason: str
    details: Optional[str] = None

class FraudAlertResponse(BaseModel):
    id: str
    user_id: str
    title: str
    type: AlertType
    risk_score: int
    merchant: str
    amount: Decimal
    reason: str
    details: Optional[str] = None
    alert_date: dt_date
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ======================================================================
#   FINANCIAL GOALS SCHEMAS
# ======================================================================

class FinancialGoalCreate(BaseModel):
    name: str
    target_amount: Decimal = Field(..., alias="targetAmount", gt=0)
    saved_amount: Decimal = Field(default=Decimal('0.00'), alias="savedAmount", ge=0)
    deadline_months: int = Field(..., alias="deadlineMonths", gt=0)
    category: str

    class Config:
        allow_population_by_field_name = True

class GoalDeposit(BaseModel):
    amount: Decimal = Field(..., gt=0)
    source: Optional[str] = Field(default="wallet")

    class Config:
        allow_population_by_field_name = True

class FinancialGoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: Decimal
    saved_amount: Decimal
    deadline_months: int
    monthly_savings_needed: Decimal
    category: str
    probability: Decimal
    savings_plan: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ======================================================================
#   SUBSCRIPTION SCHEMAS
# ======================================================================

class SubscriptionCreate(BaseModel):
    name: str
    cost: Decimal = Field(..., gt=0)
    billing_interval: BillingInterval = BillingInterval.monthly
    category: Optional[str] = "Utilities"

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    cost: Decimal
    billing_interval: BillingInterval
    category: str
    savings_potential: Decimal
    recommendation: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ======================================================================
#   STUDENT PROFILE SCHEMAS
# ======================================================================

class SemesterBudget(BaseModel):
    hostel: Decimal
    food: Decimal
    books: Decimal
    courses: Decimal
    travel: Decimal

class StudentProfileCreate(BaseModel):
    pocket_money: Decimal = Field(default=Decimal('0.00'), ge=0)
    allowance: Decimal = Field(default=Decimal('0.00'), ge=0)
    semester_budget: SemesterBudget
    career_goals: List[str] = []

class StudentProfileResponse(BaseModel):
    user_id: str
    pocket_money: Decimal
    allowance: Decimal
    hostel_budget: Decimal
    food_budget: Decimal
    books_budget: Decimal
    courses_budget: Decimal
    travel_budget: Decimal
    career_goals: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ======================================================================
#   PAYMENTS (CARDS & BANK ACCOUNTS)
# ======================================================================

class SavedCardCreate(BaseModel):
    card_holder: str
    card_number: str
    expiry: str
    card_type: Optional[str] = "Visa"

class SavedCardResponse(BaseModel):
    id: str
    user_id: str
    card_holder: str
    card_number: str
    expiry: str
    card_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class SavedBankAccountCreate(BaseModel):
    account_holder: str
    bank_name: str
    account_number: str
    ifsc: str
    balance: Decimal = Field(default=Decimal('0.00'))

class SavedBankAccountResponse(BaseModel):
    id: str
    user_id: str
    account_holder: str
    bank_name: str
    account_number: str
    ifsc: str
    balance: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class TopupRequest(BaseModel):
    account_id: str
    amount: Decimal = Field(..., gt=0)


# ======================================================================
#   AI RESPONSES & AI SECURITY REPORTS
# ======================================================================

class CopilotQuery(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = None

    class Config:
        allow_population_by_field_name = True

class CopilotResponse(BaseModel):
    response: str

class MerchantTrustRequest(BaseModel):
    merchantName: str

class ReviewItem(BaseModel):
    author: str
    rating: int
    text: str

class MerchantTrustResponse(BaseModel):
    score: int
    reviews: List[ReviewItem]
    address: str
    phone: str
    website: str
    legitimacyScore: int
    aiExplanation: str

class PurchaseAdviceRequest(BaseModel):
    productName: str
    price: Decimal = Field(..., gt=0)
    purpose: str

class AlternativeItem(BaseModel):
    name: str
    price: Decimal
    link: Optional[str] = None

class PurchaseAdviceResponse(BaseModel):
    score: int
    affordability: str
    savingsImpact: str
    goalImpact: str
    alternatives: List[AlternativeItem]
    aiRecommendation: str

class InvestigateRequest(BaseModel):
    transactionId: str

class InvestigateResponse(BaseModel):
    riskEvaluation: str
    vulnerabilityBreakdown: str
    safeguards: str
    report: Optional[str] = None
