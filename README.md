<h1 align="center">
  🚚 ShipmentPro — Logistics & Supply Chain Management Platform
</h1>

<p align="center">
  A full-stack, microservices-based logistics management platform with real-time tracking, AI-powered chat assistant, and analytics.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Python-Flask-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/AI-Groq%20%2F%20OpenAI-FF6B35?style=flat-square" />
</p>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Install PostgreSQL & Create Database](#step-2-install-postgresql--create-database)
  - [Step 3: Setup Backend (Node.js API)](#step-3-setup-backend-nodejs-api)
  - [Step 4: Setup Frontend (React App)](#step-4-setup-frontend-react-app)
  - [Step 5: Setup Analytics Service (Python/Flask)](#step-5-setup-analytics-service-pythonflask)
  - [Step 6: Setup AI Assistant Service (Python/Flask + RAG)](#step-6-setup-ai-assistant-service-pythonflask--rag)
- [Running the Project](#-running-the-project)
- [Default Login Credentials](#-default-login-credentials)
- [Service Ports & URLs](#-service-ports--urls)
- [Environment Variables Reference](#-environment-variables-reference)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Troubleshooting](#-troubleshooting)

---

## 📦 Project Overview

**ShipmentPro** is an enterprise-grade logistics management platform built as a **monorepo with four microservices**:

| Service | Technology | Port | Purpose |
|---|---|---|---|
| **Backend API** | Node.js + Express + TypeScript + Prisma | `5000` | Core REST API, Auth, CRUD, WebSockets |
| **Frontend** | React 19 + TypeScript + Vite | `5173` | Web dashboard UI |
| **Analytics Service** | Python + Flask + Pandas + Plotly | `5001` | Chart generation & sales reports |
| **AI Assistant Service** | Python + Flask + OpenAI/Groq + pgvector | `5002` | RAG-powered ShipBot chatbot |

### Key Features

- 🔐 **JWT Authentication** with Role-Based Access Control (ADMIN / USER / DRIVER)
- 📦 **Shipment Management** — Create, track, and manage shipments end-to-end
- 🚛 **Fleet & Driver Management** — Assign drivers to trucks and shipments
- 📊 **Real-time Analytics** — Interactive charts for revenue and performance
- 📡 **Live Notifications** — WebSocket-based real-time status updates
- 🤖 **ShipBot AI Assistant** — RAG pipeline chatbot powered by Groq or OpenAI
- 📋 **Audit Trails** — Immutable status history for every shipment
- 📢 **Announcements** — Admin-broadcast system alerts

---

## 🏛 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Port 5173)               │
│              React 19 + TypeScript + Vite            │
└──────────┬──────────────┬──────────────┬────────────┘
           │ REST API      │ REST API      │ REST API
           ▼               ▼               ▼
┌──────────────┐  ┌───────────────┐  ┌────────────────┐
│  Backend API │  │   Analytics   │  │   AI Assistant │
│  Node/Express│  │ Python/Flask  │  │  Python/Flask  │
│   Port 5000  │  │   Port 5001   │  │   Port 5002    │
│  Prisma ORM  │  │ Pandas/Plotly │  │ OpenAI/Groq    │
└──────┬───────┘  └───────────────┘  └───────┬────────┘
       │ SQL                                   │ SQL (pgvector)
       ▼                                       ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│    (shipment_db — shared by all services)            │
└─────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Lucide React** (icons)
- Vanilla CSS with glassmorphism & dark-mode design

### Backend API
- **Node.js** + **Express 5** + **TypeScript**
- **Prisma ORM** (schema-first, auto-migrations)
- **JWT** authentication + **bcryptjs** password hashing
- **Zod** request validation
- **WebSockets** (`ws`) for real-time push notifications

### Analytics Service
- **Python 3.10+** + **Flask** + **Flask-CORS**
- **Pandas** (data processing) + **Plotly** (chart generation) + **Kaleido** (PNG export)

### AI Assistant Service
- **Python 3.10+** + **Flask** + **Flask-CORS**
- **OpenAI SDK** (compatible with Groq via base_url override)
- **Groq API** (`qwen/qwen3.8-27b` model — free tier)
- **pgvector** — PostgreSQL vector similarity search
- **psycopg2** — Direct PostgreSQL access for RAG & session persistence

### Database
- **PostgreSQL 14+**
- **pgvector** extension (optional, falls back gracefully)

---

## ✅ Prerequisites

Make sure the following are installed on your machine **before** starting:

| Tool | Minimum Version | Check Command | Download |
|---|---|---|---|
| **Git** | Any | `git --version` | [git-scm.com](https://git-scm.com) |
| **Node.js** | 18+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | `npm --version` | Bundled with Node.js |
| **Python** | 3.10+ | `python --version` | [python.org](https://python.org) |
| **pip** | Any | `pip --version` | Bundled with Python |
| **PostgreSQL** | 14+ | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |

> **Windows users:** During PostgreSQL installation, note your **password** for the `postgres` superuser — you'll need it in Step 2.

---

## 🚀 Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/aviratpatil/Shipment-Project.git
cd Shipment-Project
```

---

### Step 2: Install PostgreSQL & Create Database

#### 2a. Open PostgreSQL shell

**Windows (pgAdmin or psql):**
```bash
psql -U postgres
```
Enter your PostgreSQL password when prompted.

**macOS/Linux:**
```bash
sudo -u postgres psql
```

#### 2b. Create the database

```sql
CREATE DATABASE shipment_db;
\q
```

> The database is now ready. All tables will be auto-created by Prisma in the next step.

---

### Step 3: Setup Backend (Node.js API)

```bash
cd backend
```

#### 3a. Install dependencies

```bash
npm install
```

#### 3b. Configure environment variables

```bash
copy .env.example .env
```
> On **macOS/Linux**, use: `cp .env.example .env`

Open `backend/.env` and fill in your values:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/shipment_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

> Replace `YOUR_PASSWORD` with your actual PostgreSQL `postgres` user password.

#### 3c. Run Prisma migrations (creates all tables)

```bash
npx prisma migrate deploy
```

> If this is a fresh setup and no migrations exist yet:
> ```bash
> npx prisma migrate dev --name init
> ```

#### 3d. Seed the database (sample data)

```bash
npm run seed
```

This populates the database with:
- **1 Admin** user (`admin@system.com`)
- **3 Driver** users (`driver1`, `driver2`, `driver3` `@system.com`)
- **5 Regular** users
- **3 Trucks** with different statuses
- **5 Customers**
- **7 Shipments** with full status history
- **Sales records** for analytics
- **Announcements**

#### 3e. Start the backend server

```bash
npm run dev
```

✅ Backend is running at `http://localhost:5000`

---

### Step 4: Setup Frontend (React App)

Open a **new terminal window**:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend is running at `http://localhost:5173`

---

### Step 5: Setup Analytics Service (Python/Flask)

Open a **new terminal window**:

```bash
cd analytics-service
```

#### 5a. Create a virtual environment (recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 5b. Install dependencies

```bash
pip install -r requirements.txt
```

#### 5c. Configure environment variables

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

`analytics-service/.env` only needs:
```env
PORT=5001
```

#### 5d. Start the analytics service

```bash
python app.py
```

✅ Analytics service running at `http://localhost:5001`

---

### Step 6: Setup AI Assistant Service (Python/Flask + RAG)

Open a **new terminal window**:

```bash
cd ai-service
```

#### 6a. Create a virtual environment (recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 6b. Install dependencies

```bash
pip install -r requirements.txt
```

#### 6c. Configure environment variables

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Open `ai-service/.env` and configure it:

```env
PORT=5002

# ── AI Provider (choose ONE) ────────────────────────────────────────────────
# OPTION A: Groq (FREE — recommended for new users)
# Get your free key at: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# OPTION B: OpenAI (paid)
# Get your key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small

# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/shipment_db
MAX_HISTORY_MESSAGES=10
TOP_K_CHUNKS=3
BACKEND_API_URL=http://localhost:5000/api
```

> **Note:** The service auto-detects which provider to use — Groq takes priority if `GROQ_API_KEY` is set. You only need **one** of the two AI providers.

#### 6d. Ingest knowledge base into the vector store

This step embeds the ShipmentPro platform documentation into PostgreSQL for RAG retrieval:

```bash
python ingest.py
```

You should see output like:
```
[01/45] [OK] Embedded [fallback]: overview/platform
[02/45] [OK] Embedded [fallback]: overview/technology
...
[SUCCESS] Ingestion complete! All 45 chunks stored in document_chunks.
```

> **Note:** If you have a Groq key configured, it uses a fast deterministic hash embedding (no API cost). If you have OpenAI credits, it uses `text-embedding-3-small` for semantic search.

#### 6e. Start the AI service

```bash
python app.py
```

✅ AI Assistant running at `http://localhost:5002`

---

## ▶️ Running the Project

After completing all setup steps, you need **4 terminal windows** running simultaneously:

| Terminal | Directory | Command |
|---|---|---|
| **1** | `backend/` | `npm run dev` |
| **2** | `frontend/` | `npm run dev` |
| **3** | `analytics-service/` | `python app.py` |
| **4** | `ai-service/` | `python app.py` |

Then open your browser and go to: **`http://localhost:5173`**

---

## 🔑 Default Login Credentials

After running `npm run seed` in the backend:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@system.com` | `password123` |
| **Driver 1** | `driver1@system.com` | `password123` |
| **Driver 2** | `driver2@system.com` | `password123` |
| **Driver 3** | `driver3@system.com` | `password123` |
| **User 1** | `user1@example.com` | `password123` |

> ⚠️ **Change these passwords** in a production environment!

---

## 🌐 Service Ports & URLs

| Service | URL | Description |
|---|---|---|
| **Frontend** | `http://localhost:5173` | Main web dashboard |
| **Backend API** | `http://localhost:5000/api` | REST API base URL |
| **Analytics Service** | `http://localhost:5001` | Chart generation endpoint |
| **AI Assistant** | `http://localhost:5002` | ShipBot chat endpoint |
| **Health Check (AI)** | `http://localhost:5002/health` | AI service health check |

---

## ⚙️ Environment Variables Reference

### `backend/.env`

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | ✅ | `5000` | Backend API port |
| `DATABASE_URL` | ✅ | `postgresql://postgres:pass@localhost:5432/shipment_db?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | `my-secret-key` | Secret for signing JWT tokens |

### `analytics-service/.env`

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | ✅ | `5001` | Analytics service port |

### `ai-service/.env`

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | ✅ | `5002` | AI service port |
| `GROQ_API_KEY` | ⚠️ One required | `gsk_...` | Groq API key (free at console.groq.com) |
| `GROQ_MODEL` | — | `qwen/qwen3.8-27b` | Groq chat model |
| `OPENAI_API_KEY` | ⚠️ One required | `sk-...` | OpenAI API key (alternative to Groq) |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | OpenAI chat model |
| `OPENAI_EMBED_MODEL` | — | `text-embedding-3-small` | OpenAI embedding model |
| `DATABASE_URL` | ✅ | `postgresql://...` | Same DB as backend (without `?schema=public`) |
| `MAX_HISTORY_MESSAGES` | — | `10` | Chat history window size |
| `TOP_K_CHUNKS` | — | `3` | Number of RAG context chunks |
| `BACKEND_API_URL` | ✅ | `http://localhost:5000/api` | Points to backend for live data |

---

## 📁 Project Structure

```
Shipment-Project/
├── backend/                    # Node.js + Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (all models)
│   │   ├── seed.ts             # Database seed script
│   │   └── migrations/         # Auto-generated Prisma migrations
│   ├── src/
│   │   ├── server.ts           # App entry point + WebSocket server
│   │   ├── routes/             # Express route handlers
│   │   ├── middleware/         # Auth, validation middleware
│   │   └── types/              # TypeScript type definitions
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx             # Root component + routing
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ChatBot.tsx     # ShipBot AI chat widget
│   │   │   └── ...
│   │   ├── pages/              # Page-level components
│   │   └── index.css           # Global styles + design tokens
│   ├── index.html
│   └── package.json
│
├── analytics-service/          # Python Flask analytics microservice
│   ├── app.py                  # Flask app — chart generation endpoints
│   ├── requirements.txt
│   └── .env.example
│
├── ai-service/                 # Python Flask AI assistant microservice
│   ├── app.py                  # Flask app — /chat RAG endpoint
│   ├── ingest.py               # Knowledge base ingestion script
│   ├── schema.sql              # AI vector store SQL schema
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🔌 API Overview

### Backend API (`http://localhost:5000/api`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login and get JWT token |
| `GET` | `/customers` | ✅ | List all customers |
| `POST` | `/customers` | ✅ Admin | Create customer |
| `GET` | `/shipments` | ✅ | List all shipments |
| `POST` | `/shipments` | ✅ | Create shipment |
| `PATCH` | `/shipments/:id/status` | ✅ | Update shipment status |
| `GET` | `/trucks` | ✅ | List all trucks |
| `POST` | `/trucks` | ✅ Admin | Add truck |
| `GET` | `/drivers` | ✅ | List all drivers |
| `GET` | `/announcements` | ✅ | List announcements |
| `POST` | `/announcements` | ✅ Admin | Create announcement |

### AI Assistant API (`http://localhost:5002`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Send message to ShipBot |
| `GET` | `/chat/:session_id/history` | Get session conversation history |
| `DELETE` | `/chat/:session_id` | Clear session history |
| `GET` | `/health` | Health check with provider status |

**Chat Request Example:**
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ShipmentPro?", "session_id": "my-session-123"}'
```

---

## 🔧 Troubleshooting

### ❌ `prisma migrate deploy` fails
- Make sure PostgreSQL is running and `DATABASE_URL` is correct in `backend/.env`
- Verify database `shipment_db` exists: `psql -U postgres -c "\l"`

### ❌ Backend shows `Cannot find module '@prisma/client'`
```bash
cd backend
npx prisma generate
npm install
```

### ❌ AI service shows "Message cannot be empty" / no response
- Verify the AI service is running: `http://localhost:5002/health`
- Check that `GROQ_API_KEY` or `OPENAI_API_KEY` is set in `ai-service/.env`

### ❌ AI service says "model not found"
- The Groq model `llama-3.3-70b-versatile` may not be available on free tier.
- Set `GROQ_MODEL=qwen/qwen3.8-27b` in `ai-service/.env`

### ❌ `python ingest.py` fails with DB error
- Ensure `DATABASE_URL` in `ai-service/.env` does **not** include `?schema=public`
- Correct format: `postgresql://postgres:password@localhost:5432/shipment_db`

### ❌ Frontend blank screen / API errors
- Make sure the **backend** is running on port `5000` before starting the frontend
- Check browser console for CORS errors — ensure `CORS` is enabled (it is by default)

### ❌ `pip install` fails on Windows for `psycopg2-binary`
```bash
pip install psycopg2-binary --only-binary :all:
```

### ❌ Analytics service crashes on startup
- Install `kaleido` separately if needed: `pip install kaleido`
- On some systems: `pip install kaleido==0.2.1`

---

## 🤖 Getting a Free Groq API Key

The AI assistant works best with a free Groq API key:

1. Go to **[console.groq.com/keys](https://console.groq.com/keys)**
2. Sign in with Google or GitHub (no credit card needed)
3. Click **"Create API Key"**
4. Copy the key (starts with `gsk_...`)
5. Paste it in `ai-service/.env` as `GROQ_API_KEY=gsk_...`
6. Restart the AI service

---

## 📄 License

This project is built for educational and demonstration purposes.

---

<p align="center">
  Built with ❤️ using React, Node.js, Python, PostgreSQL, and Groq AI
</p>
