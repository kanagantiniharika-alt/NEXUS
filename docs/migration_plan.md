# NEXUS FINANCIAL INTELLIGENCE PLATFORM: SUCCESSFUL MIGRATION PLAN

This document guides engineering teams on decoupled refactoring, shifting the standalone React SPA to a robust, containerized, PostgreSQL-integrated FastAPI production runtime.

---

## Phase 1: Database Migration & Schema Seeding
First, configure the persistent storage layer.

1. **Deploy PostgreSQL Instance:** Spin up PostgreSQL 16+ on Google Cloud SQL, Supabase, Neon, or inside a persistent local Docker container.
2. **Execute Schema SQL:** Initialize relational schemas by piping `/database/schema.sql`:
   ```bash
   psql -h localhost -U postgres -d nexus_db -f database/schema.sql
   ```
3. **Draft Alembic Framework (Optional):** Wrap the database modeling inside Alembic for continuous migrations:
   ```bash
   pip install alembic
   alembic init alembic
   ```
   Modify `alembic/env.py` to target `backend.models.Base.metadata` for automated migrations tracking.

---

## Phase 2: Backend Container Assembly & Environment Variables
Build the FastAPI environment.

1. **Configure Environment Keys (`.env`):**
  ```env
  DATABASE_URL=postgresql://postgres:<password>@<db-host>:5432/nexus_core
  GEMINI_API_KEY=AIzaSy...
  ENV=production
  ```
2. **Launch the FastAPI Server locally:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## Phase 3: Decoupling the React Client (Axios Client Interceptors)
Transition the React frontend away from mock local variables by connecting to the FastAPI endpoints.

1. **Install Axios Client:**
   ```bash
   cd frontend
   npm install axios
   ```
2. **Write a Centralized API Client Interface (`/src/lib/api.ts`):**
   Create an Axios client configured to handle global bearer authorization tokens seamlessly.
   ```typescript
   import axios from 'axios';

   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

   export const api = axios.create({
     baseURL: API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   });

   // The backend sets an HTTP-only `user_id` cookie on successful login/register.
   // For automated testing you may set a custom `X-User-ID` header when necessary.
   ```

3. **Migrate UI Components to Fetch from DB:**

   Replace the local initial mock values in `src/App.tsx` or similar with life-cycle state hooks.

   *Example: Migrating transaction history logging inside `Dashboard.tsx` or `App.tsx`:*

   **Old Local State Management (React Mock):**
   ```typescript
   const [transactions, setTransactions] = useState<Transaction[]>(defaultMockTxs);

   const handleAddTransaction = (newTx) => {
     setTransactions([newTx, ...transactions]);
   };
   ```

   **New Relational Api Integration (React + FastAPI + PG):**
   ```typescript
   import { api } from '../lib/api';

   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [loading, setLoading] = useState<boolean>(true);

   // Fetch transactions chronologically of user
   useEffect(() => {
     async function fetchTxs() {
       try {
         const res = await api.get('/api/transactions');
         setTransactions(res.data);
       } catch (err) {
         console.error("Failed fetching ledger:", err);
       } finally {
         setLoading(false);
       }
     }
     fetchTxs();
   }, []);

   // Post transactions securely
   const handleAddTransaction = async (formData: { amount: number; merchant: string; category: string; location: string }) => {
     try {
       const res = await api.post('/api/transactions', formData);
       // Prepends new transaction checked by the backend risk engine
       setTransactions(prev => [res.data, ...prev]);
       
       // Sync balances from header response or profile reload
       await reloadUserProfile(); 
     } catch (err) {
       alert("Transaction execution rejected by security engine.");
     }
   };
   ```

---

## Phase 4: Full-Stack Deployment in Production (Docker Compose)
Combine both tiers behind Nginx or Cloud Load Balancing.

Establish a `docker-compose.yml` to orchestrate services:
```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nexus_core
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: production_database_secure_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:production_database_secure_password@database:5432/nexus_core
      GEMINI_API_KEY: AIzaSyYourValidGoogleAPIKeyHere
    depends_on:
      - database
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

This Docker setup enables instantaneous environment setup across any AWS ECS, GCP Cloud Run, or Kubernetes node with zero runtime environment drift.
