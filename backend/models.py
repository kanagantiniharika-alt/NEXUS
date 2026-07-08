import uuid
#from sqlalchemy import Column, String, Integer, Numeric, Boolean, Date, DateTime, Text, ForeignKey, JSON, Enum as DbEnum
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    Date,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Enum as DbEnum,
    text,
)

from sqlalchemy.orm import relationship

from sqlalchemy.sql import func
from backend.database import Base
import enum

class UserRole(str, enum.Enum):
    student = "student"
    professional = "professional"

class RiskStatusLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TransactionCategory(str, enum.Enum):
    Food = "Food"
    Shopping = "Shopping"
    Travel = "Travel"
    Bills = "Bills"
    Education = "Education"
    Healthcare = "Healthcare"
    Entertainment = "Entertainment"

class AlertType(str, enum.Enum):
    behavioral = "behavioral"
    location_anomaly = "location_anomaly"
    scam_trend = "scam_trend"

class BillingInterval(str, enum.Enum):
    monthly = "monthly"
    yearly = "yearly"


class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(DbEnum(UserRole), default=UserRole.professional)
    finance_score = Column(Integer, default=80)
    balance = Column(Numeric(15, 2), default=0.00)
    income = Column(Numeric(15, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    fraud_alerts = relationship("FraudAlert", back_populates="user", cascade="all, delete-orphan")
    financial_goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_cards = relationship("SavedCard", back_populates="user", cascade="all, delete-orphan")
    saved_bank_accounts = relationship("SavedBankAccount", back_populates="user", cascade="all, delete-orphan")
    ai_logs = relationship("AIQueryLog", back_populates="user", cascade="all, delete-orphan")


# class Transaction(Base):
#     __tablename__ = "transactions"

#     id = Column(String(100), primary_key=True)
#     user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     amount = Column(Numeric(15, 2), nullable=False)
#     merchant = Column(String(255), nullable=False)
#     category = Column(DbEnum(TransactionCategory), nullable=False)
#     # transaction_date = Column(Date, nullable=False, server_default=func.current_date())

#     transaction_date = Column(
#     Date,
#     nullable=False,
#     server_default=text("(CURRENT_DATE)")
# )
#     location = Column(String(255), default="Online Gateway")
#     risk_score = Column(Integer, default=0)
#     risk_status = Column(DbEnum(RiskStatusLevel), default=RiskStatusLevel.low)
#     risk_reason = Column(Text, nullable=True)
#     is_recurring = Column(Boolean, default=False)
#     created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

#     user = relationship("User", back_populates="transactions")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    amount = Column(Numeric(15, 2), nullable=False)
    merchant = Column(String(255), nullable=False)

    # Temporarily use String instead of Enum
    category = Column(String(50), nullable=False)

    # Remove server_default temporarily
    transaction_date = Column(Date, nullable=False)

    location = Column(String(255), default="Online Gateway")
    risk_score = Column(Integer, default=0)

    # Temporarily use String instead of Enum
    risk_status = Column(String(20), default="low")

    risk_reason = Column(Text)
    is_recurring = Column(Boolean, default=False)

    created_at = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP")
    )

    user = relationship("User", back_populates="transactions")


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    type = Column(DbEnum(AlertType), nullable=False)
    risk_score = Column(Integer, nullable=False)
    merchant = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    reason = Column(String(500), nullable=False)
    details = Column(Text, nullable=True)
    alert_date = Column(Date, nullable=False, server_default=text("(CURRENT_DATE)"))
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="fraud_alerts")


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(15, 2), nullable=False)
    saved_amount = Column(Numeric(15, 2), default=0.00)
    deadline_months = Column(Integer, nullable=False)
    monthly_savings_needed = Column(Numeric(15, 2), nullable=False)
    category = Column(String(100), nullable=False)
    probability = Column(Numeric(5, 2), default=100.00)
    savings_plan = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="financial_goals")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    cost = Column(Numeric(15, 2), nullable=False)
    billing_interval = Column(DbEnum(BillingInterval), default=BillingInterval.monthly, nullable=False)
    category = Column(String(100), default="Utilities")
    savings_potential = Column(Numeric(15, 2), default=0.00)
    recommendation = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="subscriptions")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    pocket_money = Column(Numeric(15, 2), default=0.00)
    allowance = Column(Numeric(15, 2), default=0.00)
    hostel_budget = Column(Numeric(15, 2), default=0.00)
    food_budget = Column(Numeric(15, 2), default=0.00)
    books_budget = Column(Numeric(15, 2), default=0.00)
    courses_budget = Column(Numeric(15, 2), default=0.00)
    travel_budget = Column(Numeric(15, 2), default=0.00)
    career_goals = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="student_profile")


class SavedCard(Base):
    __tablename__ = "saved_cards"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_holder = Column(String(255), nullable=False)
    card_number = Column(String(255), nullable=False)
    expiry = Column(String(10), nullable=False)
    card_type = Column(String(50), default="Visa")
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="saved_cards")


class SavedBankAccount(Base):
    __tablename__ = "saved_bank_accounts"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_holder = Column(String(255), nullable=False)
    bank_name = Column(String(255), nullable=False)
    account_number = Column(String(100), nullable=False)
    ifsc = Column(String(50), nullable=False)
    balance = Column(Numeric(15, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="saved_bank_accounts")


class AIQueryLog(Base):
    __tablename__ = "ai_query_logs"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    agent_type = Column(String(50), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="ai_logs")


class FriendExpense(Base):
    __tablename__ = "friend_expenses"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_by = Column(String(255), nullable=False)
    split_mode = Column(String(50), default="equal")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User")


class FriendExpenseMember(Base):
    __tablename__ = "friend_expense_members"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id = Column(String(100), ForeignKey("friend_expenses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    contribution_amount = Column(Numeric(15, 2), nullable=True)
    contribution_percent = Column(Numeric(5, 2), nullable=True)
    owes_amount = Column(Numeric(15, 2), nullable=True)
    is_settled = Column(Boolean, default=False)

    expense = relationship("FriendExpense")


class FriendSettlement(Base):
    __tablename__ = "friend_settlements"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id = Column(String(100), ForeignKey("friend_expenses.id", ondelete="CASCADE"), nullable=False)
    from_member = Column(String(255), nullable=False)
    to_member = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    is_settled = Column(Boolean, default=False)
    settled_at = Column(DateTime(timezone=True), nullable=True)

    expense = relationship("FriendExpense")
