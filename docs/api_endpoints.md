# NEXUS FINANCIAL INTELLIGENCE PLATFORM: API ENDPOINT CATALOG

This page details the official REST APIs constructed inside the **Nexus Python Backend Layer**. All request and response parameters are strongly validated using Pydantic (v2) layers.

---

## 1. Authentication & Security Control
Base Path: `/api/auth`

### POST `/register`
Registers a new user and sets a session cookie (`user_id`) for subsequent requests.
* **Request Body:**
  ```json
  {
    "name": "Sarah Jenkins",
    "email": "sarah.j@tech-pro.io",
    "password": "SecurePassword123!",
    "role": "professional" // or 'student'
  }
  ```
* **Response (201 Created):** JSON object containing the created `user` and session cookie is set.

### POST `/login`
Authenticates existing profiles and sets a session cookie (`user_id`).
* **Request Body:**
  ```json
  {
    "email": "sarah.j@tech-pro.io",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK):** JSON with `user` profile; session cookie is set for subsequent requests.

### GET `/me`
Verifies account session validity (cookie or `X-User-ID` header) and returns the user object.
* **Response (200 OK):** User details object.

### POST `/role`
Changes current operating mode (Student mode with allowance vs Professional mode).
* **Request Body:**
  ```json
  {
    "role": "student"
  }
  ```
* **Response (200 OK):** Updated user object with recalibrated balances.

---

## 2. Transactions Control Ledger
Base Path: `/api/transactions`

### GET ``
Lists transactions chronologically scoped by active profile.
* **Authentication:** Cookie `user_id` or header `X-User-ID` may be used.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "tx_281938392",
      "user_id": "usr_17830238",
      "amount": 420.00,
      "merchant": "Uber Rides Local",
      "category": "Travel",
      "transaction_date": "2026-06-20",
      "location": "Downtown District",
      "risk_score": 5,
      "risk_status": "low",
      "risk_reason": "Behavioural profile consistent with baseline spending limits.",
      "is_recurring": false,
      "created_at": "2026-06-20T08:12:00Z"
    }
  ]
  ```

### POST ``
Registers spend, immediately conducting automated overseas travel, volume, and scanning audits.
* **Authentication:** Cookie `user_id` or header `X-User-ID` may be used.
* **Request Body:**
  ```json
  {
    "amount": 25000.00,
    "merchant": "Luxury Watch Hub",
    "category": "Shopping",
    "location": "Paris, France"
  }
  ```
* **Response (200 OK):** Transaction object with triggered high-alert security scores:
  ```json
  {
    "id": "tx_28190029",
    "amount": 25000.00,
    "merchant": "Luxury Watch Hub",
    "category": "Shopping",
    "risk_score": 88,
    "risk_status": "high",
    "risk_reason": "Transaction meets extreme high-value signature thresholds. Flagged for takeover check."
  }
  ```

---

## 3. Financial Savers Objectives (Vault Goals)
Base Path: `/api/goals`

### GET ``
Lists active user saving goals targets.
* **Response (200 OK):** Array of goal objectives.

### POST ``
Provisions a new goal and generates structured, database-driven recommendations and success projections based on user financial data.
* **Request Body:**
  ```json
  {
    "name": "Apple Vision Pro Fund",
    "target_amount": 350000.00,
    "deadline_months": 10,
    "category": "High Tech Assets"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "goal_129383",
    "name": "Apple Vision Pro Fund",
    "target_amount": 350000.00,
    "monthly_savings_needed": 35000.00,
    "probability": 74.00,
    "savings_plan": "Projections indicate 74% likelihood of completion. Recommendations: Downgrade subscription tiers to save ₹1,500; reduce discretionary coffee dining by ₹2,000 monthly."
  }
  ```

### POST `/{goal_id}/deposit`
Locks funds from main account wallet balance into the targeted vault.
* **Request Body:**
  ```json
  {
    "amount": 5000.00
  }
  ```
* **Response (200 OK):** Updated FinancialGoal object with lowered ledger wallet assets.

---

## 4. Cyber Safety, Alert Auditing & Scam Trends
Base Path: `/api/fraud`

### GET `/alerts`
Returns location double debit or travel velocity warning coordinates flagged on banking cards.
* **Response (200 OK):** List of live Security anomalies.

### GET `/scam-trends`
Returns dynamically synthesized scam trend summaries based on recent fraud alerts and observed patterns in the database.
* **Response (200 OK):** Formatted scam intelligence objects array.

### POST `/merchant-trust`
Runs automated audits on merchant ratings, physical locations, HTTPS age, and customer reviews (rule-based).
* **Request Body:**
  ```json
  {
    "merchantName": "Vortex Trading Ltd"
  }
  ```
* **Response (200 OK):** Trust index report score, legitimacy verdicts, and Gemini verification commentary.

---

## 5. Subscriptions Management
Base Path: `/api/subscriptions`

### GET ``
Lists active recurring digital services, matching cost-saving recommendations.
* **Response (200 OK):** List of Subscription models.

### POST ``
Registers a monthly subscription invoice.
* **Request Body:**
  ```json
  {
    "name": "HBO Max Premium",
    "cost": 499.00,
    "billing_interval": "monthly",
    "category": "Entertainment"
  }
  ```
* **Response (200 OK):** Subscription registry details.

### DELETE `/{sub_id}`
Simulates or logs the cancellation of a digital platform.
* **Response (200 OK):** `{"success": true}`

---

## 6. Quantum AI Copilot & Shopping Advisors
Base Path: `/api`

### POST `/chat`
Primary interactive assistant endpoint (if enabled). This may call configured generative services; it is optional and not required for core dashboard functionality.
* **Request Body:**
  ```json
  {
    "message": "Is my emergency fund vault on track or should I freeze Netflix to catch up?",
    "chatHistory": []
  }
  ```
* **Response (200 OK):** `{"text": "Markdown-formatted response analyzing target balances..."}`

### POST `/purchase-advisor`
Checks buy-relevance score, affordability impact percentage, and generates 2 optimized refurbished/lite alternatives.
* **Request Body:**
  ```json
  {
    "productName": "Sony PS5 Pro Console",
    "price": 54900.00,
    "purpose": "Entertainment and home gaming rooms."
  }
  ```
* **Response (200 OK):** Affordability scorecard, impact descriptions, alternatives list, and buy verdict recommendation.
