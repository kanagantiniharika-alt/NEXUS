# NEXUS FINANCIAL INTELLIGENCE PLATFORM: ARCHITECTURE BLUEPRINT

This document provides a highly technical, production-ready system architecture blueprint for the **Nexus Financial Intelligence Platform** after refactoring into a full-stack system using a decoupled architecture: **React (Frontend)** + **FastAPI (Python Backend)** + **PostgreSQL (Database Layer)**.

---

## 1. System Topology Overview

The system is configured as a fully decoupled, multi-tier web application designed to support high transactional throughput, real-time forensic model scoring, and secure LLM-assisted conversational planning.

```
                              ┌────────────────────────────────────────┐
                              │           Client Browser (SPA)         │
                              │           React 18 / Tailwind          │
                              └────────────────────────────────────────┘
                                                   │
                                     HTTPS / JSON (cookie or X-User-ID)
                                                   ▼
                              ┌────────────────────────────────────────┐
                              │         FastAPI Network Gateway        │
                              │       CORS / Lifespan / Middleware     │
                              └────────────────────────────────────────┘
                                        │                    │
              SQLAlchemy Session Local  │                    │ Google GenAI Python SDK
                                        ▼                    ▼
                    ┌────────────────────────┐      ┌────────────────────────┐
                    │    PostgreSQL 16+      │      │       Gemini 2.5       │
                    │   Transactions / Logs  │      │   Generative AI Core   │
                    └────────────────────────┘      └────────────────────────┘
```

---

## 2. Dynamic Data-Flow Cycles

### A. Authentication & Session Lifespans
1. **Request:** The user initiates an account signup / login via the React SPA.
2. **Hashing:** The FastAPI backend intercepts the credentials body. Passwords are password-hashed on-the-fly using `passlib[bcrypt]` with custom salt parameters.
3. **Session Management:** On verification checkout the server sets a secure, HTTP-only session cookie (`user_id`) or supports a short-lived `X-User-ID` header for integration testing.
4. **Authorizations:** Subsequent requests should include the session cookie or `X-User-ID` header; no JWT bearer tokens are required.

### B. High-Fidelity Transaction Logging & Advanced Risk Checks
1. **Spend Logging:** Client registers a spend ledger item (e.g. amount, merchant, category, date, location).
2. **Ingest Security Scopes:**
   - **Velocity Check:** Location is checked for geography mismatch (Impossible Travel velocity).
   - **Transaction Limit Check:** Outlays > ₹20,000 automatically trigger critical takeover alerts.
   - **POS Scan Checks:** QR code P2P scanners are flagged with medium warnings.
3. **Database Write:** Session commits the transaction to PostgreSQL, deducting from the linked `users` table wallet balances.
4. **Response:** Sanitized JSON propagates back, updating dashboards within 30ms.

### C. Contextual AI Dialog Memory sweeps
1. **Query:** User chats with the Nexus assistant.
2. **State Vectors Assembly:** The backend fetches user profile indicators, saved banks/cards, savers milestones, current subscriptions, and recent 5 transactions from PostgreSQL in parallel.
3. **Context Injection:** Inject the serialized records directly into the specialized model system instructions block of Gemini.
4. **Inference & Auditing:** The model returns a highly tailored strategic advice response. The request, response, latency times, and token estimations are written to `ai_query_logs` for audibility metrics.

---

## 3. Recommended Production Folder Structure

This setup establishes strict Separation of Concerns (SoC) for multi-scale development:

```
project/
├── backend/                       # Python FastAPI Backend Services
│   ├── config.py                 # Configuration Settings via Pydantic Settings
│   ├── database.py               # Session Local Instance & Engine Configurers
│   ├── main.py                   # App Initialization & Unified Router Assembly
│   ├── models.py                 # SQLAlchemy PostgreSQL Object Relational Models
│   ├── schemas.py                # Pydantic v2 Request / Response Validation Types
│   ├── requirements.txt          # Python Packages Manifest
│   ├── services/                 # Third-Party API Proxy Services
│   │   ├── __init__.py
│   │   └── gemini.py             # Custom Google GenAI SDK Client Core
│   └── routes/                   # Segmented Route Controller Files
│       ├── __init__.py
│       ├── auth.py               # logins / register / profile swaps
│       ├── transactions.py       # financial timeline ledger & risk check routers
│       ├── goals.py              # savings plans & target goal vault routes
│       ├── fraud.py              # behavioral alerts & trust score evaluations
│       ├── subscriptions.py      # recurring invoices & cancellations recommendations
│       ├── payments.py           # card token links & manual cash sweeps
│       └── students.py           # campus split utilities & semester budget bounds
│
├── database/                      # SQL Database Setup & Migrations
│   ├── schema.sql                # Complete PostgreSQL Relational Tables DDL
│   └── seed.sql                  # Non-Mock Seed Data for Pre-Populating Database
│
├── docs/                          # Comprehensive Architectural Documentation
│   ├── architecture.md           # Structural Diagrams & Data Flow Patterns
│   ├── api_endpoints.md          # Interactive API Specification Definitions
│   └── migration_plan.md         # Full step-by-step decoupling instructions
│
└── frontend/                      # React TypeScript Single-Page Application
    ├── src/                      # Source Core
    │   ├── App.tsx               # Main SPA Entry Routing Frame
    │   ├── components/           # Modular Sub-Components (Copilot, Dashboard, etc.)
    │   ├── types.ts              # Declarative UI Type Models
    │   └── index.css             # Tailwind UI Styling Sheets
    ├── package.json              # Client dependencies manifest
    └── vite.config.ts            # Asset bundling pipeline
```
