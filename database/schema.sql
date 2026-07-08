-- ======================================================================
--   NEXUS FINANCIAL ARCHITECTURE: PRODUCTION MYSQL SCHEMA BLUEPRINT
--   Highly Optimized Relational Database DDL Model for MySQL 8.0+
-- ======================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'professional') DEFAULT 'professional',
    finance_score INT DEFAULT 80,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    income DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_finance_score CHECK (finance_score BETWEEN 0 AND 100),
    CONSTRAINT chk_balance CHECK (balance >= -50000.00),
    CONSTRAINT chk_income CHECK (income >= 0.00)
);

CREATE INDEX idx_users_email ON users(email);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    category ENUM('Food', 'Shopping', 'Travel', 'Bills', 'Education', 'Healthcare', 'Entertainment') NOT NULL,
    transaction_date DATE NOT NULL,
    location VARCHAR(255) DEFAULT 'Online Gateway',
    risk_score INT DEFAULT 0,
    risk_status ENUM('low', 'medium', 'high') DEFAULT 'low',
    risk_reason TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_tx_amount CHECK (amount > 0.00),
    CONSTRAINT chk_tx_risk CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_transactions_user_timeline ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);

-- 3. FRAUD ALERTS TABLE
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('behavioral', 'location_anomaly', 'scam_trend') NOT NULL,
    risk_score INT NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    details TEXT,
    alert_date DATE NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_alert_risk CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_fraud_alerts_unresolved ON fraud_alerts(user_id, is_resolved);

-- 4. FINANCIAL GOALS TABLE
CREATE TABLE IF NOT EXISTS financial_goals (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    saved_amount DECIMAL(15, 2) DEFAULT 0.00,
    deadline_months INT NOT NULL,
    monthly_savings_needed DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    probability DECIMAL(5, 2) DEFAULT 100.00,
    savings_plan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_goal_target CHECK (target_amount > 0.00),
    CONSTRAINT chk_goal_saved CHECK (saved_amount >= 0.00),
    CONSTRAINT chk_goal_deadline CHECK (deadline_months > 0),
    CONSTRAINT chk_goal_monthly CHECK (monthly_savings_needed >= 0.00),
    CONSTRAINT chk_goal_prob CHECK (probability BETWEEN 0.00 AND 100.00)
);

CREATE INDEX idx_financial_goals_user ON financial_goals(user_id);

-- 5. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    billing_interval ENUM('monthly', 'yearly') DEFAULT 'monthly' NOT NULL,
    category VARCHAR(100) DEFAULT 'Utilities',
    savings_potential DECIMAL(15, 2) DEFAULT 0.00,
    recommendation VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_cost CHECK (cost > 0.00)
);

CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, is_active);

-- 6. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id VARCHAR(100) PRIMARY KEY,
    pocket_money DECIMAL(15, 2) DEFAULT 0.00,
    allowance DECIMAL(15, 2) DEFAULT 0.00,
    hostel_budget DECIMAL(15, 2) DEFAULT 0.00,
    food_budget DECIMAL(15, 2) DEFAULT 0.00,
    books_budget DECIMAL(15, 2) DEFAULT 0.00,
    courses_budget DECIMAL(15, 2) DEFAULT 0.00,
    travel_budget DECIMAL(15, 2) DEFAULT 0.00,
    career_goals JSON, -- Using standard MySQL JSON type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_pocket CHECK (pocket_money >= 0.00),
    CONSTRAINT chk_allowance CHECK (allowance >= 0.00),
    CONSTRAINT chk_hostel CHECK (hostel_budget >= 0.00),
    CONSTRAINT chk_food CHECK (food_budget >= 0.00),
    CONSTRAINT chk_books CHECK (books_budget >= 0.00),
    CONSTRAINT chk_courses CHECK (courses_budget >= 0.00),
    CONSTRAINT chk_travel CHECK (travel_budget >= 0.00)
);

-- 7. SAVED PAYMENT METHODS (CARDS & BANKS)
CREATE TABLE IF NOT EXISTS saved_cards (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    card_holder VARCHAR(255) NOT NULL,
    card_number VARCHAR(255) NOT NULL,
    expiry VARCHAR(10) NOT NULL,
    card_type VARCHAR(50) DEFAULT 'Visa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_bank_accounts (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    ifsc VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_cards_user ON saved_cards(user_id);
CREATE INDEX idx_saved_banks_user ON saved_bank_accounts(user_id);

-- 8. TRANSACTION AUDITING & AI QUERY LOGS
CREATE TABLE IF NOT EXISTS ai_query_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_agent CHECK (agent_type IN ('copilot', 'assistant', 'investigator', 'advisor'))
);

CREATE INDEX idx_ai_logs_user_date ON ai_query_logs(user_id, created_at DESC);

-- 9. FRIEND EXPENSE SPLITTER TABLES
CREATE TABLE IF NOT EXISTS friend_expenses (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_by VARCHAR(255) NOT NULL,
    split_mode VARCHAR(50) DEFAULT 'equal',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_expense_members (
    id VARCHAR(100) PRIMARY KEY,
    expense_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contribution_amount DECIMAL(15,2),
    contribution_percent DECIMAL(5,2),
    owes_amount DECIMAL(15,2),
    is_settled BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (expense_id) REFERENCES friend_expenses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_settlements (
    id VARCHAR(100) PRIMARY KEY,
    expense_id VARCHAR(100) NOT NULL,
    from_member VARCHAR(255) NOT NULL,
    to_member VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMP NULL,
    FOREIGN KEY (expense_id) REFERENCES friend_expenses(id) ON DELETE CASCADE
);

CREATE INDEX idx_friends_user ON friend_expenses(user_id);
