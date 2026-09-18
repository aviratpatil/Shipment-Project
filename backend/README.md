# 📦 Shipment Management System (Backend API)

A production-ready, enterprise-grade backend REST API for managing logistics, customers, shipments, and real-time status tracking. Built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, **Zod**, and **JWT Authentication**.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [User Roles & Permissions (USER vs ADMIN)](#-user-roles--permissions-user-vs-admin)
3. [System Architecture (How It Works)](#-system-architecture-how-it-works)
4. [Tech Stack](#-tech-stack)
5. [Database Schema & Entity Relationships](#-database-schema--entity-relationships)
6. [Complete Request Lifecycle (How Data Travels)](#-complete-request-lifecycle-how-data-travels)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Setup & Installation Guide](#-setup--installation-guide)
9. [Testing with Postman](#-testing-with-postman)
10. [Folder Structure](#-folder-structure)

---

## 🌟 Project Overview

The **Shipment Management System** is designed for modern logistics operations. It solves the everyday problems of a shipping and courier company:

- **Customer Directory**: Store and manage corporate and individual clients.
- **Shipment Lifecycle Tracking**: Monitor shipments across 5 distinct phases: `PENDING` ➔ `IN_TRANSIT` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED` (or `CANCELLED`).
- **Complete Audit Trail**: Every status change is automatically logged with exact timestamps in a dedicated audit log (`ShipmentStatusHistory`).
- **Soft Deletes**: Clients are never permanently removed from disk to preserve data integrity and prevent broken shipment records.
- **Strict Security & Validation**: Every single incoming payload is strictly validated via Zod schemas before touching business logic or the database.

---

## 👥 User Roles & Permissions (USER vs ADMIN)

The application implements **Role-Based Access Control (RBAC)** using the `UserRole` enum (`ADMIN` | `USER`).

```
                    ┌──────────────────────────────────────┐
                    │            USER ROLES                │
                    └──────────────────┬───────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
        ┌──────────────┐                              ┌──────────────┐
        │     USER     │                              │    ADMIN     │
        │ (Operations) │                              │ (Superuser)  │
        └──────────────┘                              └──────────────┘
```

### 1. `USER` Role (Logistics Staff / Dispatch Operator)
The standard user represents frontline logistics coordinators, warehouse staff, and customer service representatives.

* **What they can do:**
  - **Register & Login**: Authenticate securely using email and password.
  - **View Profile**: View their own profile information (`GET /api/auth/me`).
  - **Create Customers**: Onboard new client accounts (`POST /api/customers`).
  - **Browse & Search Customers**: View paginated lists and search customers by name, company, or email.
  - **View Customer Details**: View a customer along with all their linked shipments.
  - **Create Shipments**: Generate new shipments with tracking numbers (`POST /api/shipments`).
  - **Track & Update Status**: Update live shipment milestones (e.g., mark package as `IN_TRANSIT` or `OUT_FOR_DELIVERY`).
  - **View Audit Logs**: Inspect status transition histories for tracking transparency.

* **Restrictions:**
  - Cannot soft-delete customer profiles.
  - Cannot modify system-wide administrative settings or user accounts.

---

### 2. `ADMIN` Role (Logistics Manager / System Administrator)
The Admin has elevated authority and oversees the entire system.

* **What they can do (Everything `USER` can do, plus):**
  - **Soft Delete Customers**: Safely archive/deactivate customer accounts (`DELETE /api/customers/:id`).
  - **Full Customer & Shipment Management**: Edit company information, override shipment statuses, or re-route shipments.
  - **Audit Oversight**: Monitor all audit histories to detect anomalies or dispatch bottlenecks.
  - **User & Role Administration**: Manage staff accounts, promote users to `ADMIN`, or revoke access.
  - **Analytics & Reporting**: Query sales records and system announcements.

---

### 🛡️ Permissions Matrix

| Feature / Action | Endpoint | Public | `USER` | `ADMIN` |
|---|---|:---:|:---:|:---:|
| Register account | `POST /api/auth/register` | ✅ | ✅ | ✅ |
| Login / Get Token | `POST /api/auth/login` | ✅ | ✅ | ✅ |
| View own profile | `GET /api/auth/me` | ❌ | ✅ | ✅ |
| View customer list & search | `GET /api/customers` | ✅ | ✅ | ✅ |
| View single customer details | `GET /api/customers/:id` | ✅ | ✅ | ✅ |
| Create new customer | `POST /api/customers` | ❌ | ✅ | ✅ |
| Update customer info | `PUT /api/customers/:id` | ❌ | ✅ | ✅ |
| Soft delete customer | `DELETE /api/customers/:id` | ❌ | ❌ | ✅ *(Restricted)* |
| View shipment list | `GET /api/shipments` | ✅ | ✅ | ✅ |
| View shipment details & history | `GET /api/shipments/:id` | ✅ | ✅ | ✅ |
| Create shipment | `POST /api/shipments` | ❌ | ✅ | ✅ |
| Update shipment status | `PATCH /api/shipments/:id/status` | ❌ | ✅ | ✅ |

---

## 🏗️ System Architecture (How It Works)

The project follows the clean **Controller - Service - Repository (Layered Architecture)** pattern:

```
[ Client: Postman / Web App ]
              │
              ▼ HTTP Request
   [ 1. Express Server ] ──────► CORS, JSON Body Parser
              │
              ▼
   [ 2. Route Layer ] ─────────► Matches URL (/api/shipments)
              │
              ▼
   [ 3. Middlewares ] ─────────► authenticateJwt (Validates Bearer token)
              │               ► validate(ZodSchema) (Validates JSON body)
              ▼
   [ 4. Controller Layer ] ────► Extracts req.body, calls Service, sends JSON response
              │
              ▼
   [ 5. Service Layer ] ───────► Pure business logic, transactions, password hashing
              │
              ▼
   [ 6. Prisma ORM ] ──────────► Type-safe SQL query generator
              │
              ▼
   [ 7. PostgreSQL Database ] ─► Physical storage & ACID guarantees
```

### Why this architecture?
1. **Separation of Concerns**: Controllers only handle HTTP (status codes, JSON formatting). Services only care about business rules.
2. **Easy Testing**: Services can be tested independently without needing to spin up Express servers.
3. **Maintainability**: If we ever change the database or web framework, only one isolated layer needs updating.

---

## 💻 Tech Stack

| Technology | Purpose | Why We Use It |
|---|---|---|
| **Node.js** | Runtime Environment | High-throughput asynchronous event-driven I/O. |
| **Express.js (v5)** | Web Framework | Minimalist, flexible routing and middleware pipeline. |
| **TypeScript (v7)** | Programming Language | Strict compile-time type safety, preventing runtime `undefined` bugs. |
| **PostgreSQL** | Relational Database | ACID compliant, reliable relational data modeling. |
| **Prisma ORM (v6)** | Database Client | Automatic migrations, type-safe queries, and relation loading. |
| **Zod** | Schema Validation | Runtime data validation of request bodies, query params, and route params. |
| **JWT (`jsonwebtoken`)** | Authentication | Stateless authentication using Bearer tokens. |
| **`bcryptjs`** | Cryptography | One-way password hashing with 10 salt rounds. |

---

## 🗄️ Database Schema & Entity Relationships

The schema is defined in [`prisma/schema.prisma`](file:///e:/Shipment-Management-System/backend/prisma/schema.prisma):

```
┌──────────────────┐           1 : N           ┌────────────────────────┐
│     Customer     │ ───────────────────────── │        Shipment        │
│──────────────────│                           │────────────────────────│
│ id (PK)          │                           │ id (PK)                │
│ name             │                           │ trackingNumber (Unique)│
│ email (Unique)   │                           │ customerId (FK)        │
│ company          │                           │ origin                 │
│ status           │                           │ destination            │
│ isDeleted        │                           │ status                 │
└──────────────────┘                           └───────────┬────────────┘
                                                           │
                                                           │ 1 : N (Cascade)
                                                           ▼
                                               ┌────────────────────────┐
                                               │ ShipmentStatusHistory  │
                                               │────────────────────────│
                                               │ id (PK)                │
                                               │ shipmentId (FK)        │
                                               │ status                 │
                                               │ updatedAt              │
                                               └────────────────────────┘
```

### Key Highlights:
1. **Customer ➔ Shipment (1-to-Many)**: One customer can have multiple packages sent.
2. **Shipment ➔ ShipmentStatusHistory (1-to-Many with Cascade)**: Every status change creates a history entry. If a shipment is physically deleted, its history is cascade-deleted.
3. **Soft Deletion (`isDeleted: Boolean`)**:
   - When a customer is deleted, we execute:
     `UPDATE "Customer" SET "isDeleted" = true, "status" = 'Inactive'`
   - This ensures shipments associated with past customers never cause orphan records or foreign key crashes.
4. **Prisma Atomic Transaction (`$transaction`)**:
   - In `updateShipmentStatus()`, both the `Shipment` status update and the `ShipmentStatusHistory` insert are executed inside an atomic transaction. If either fails, the entire change rolls back.

---

## 🔄 Complete Request Lifecycle (How Data Travels)

Let's follow a request from start to finish: **`POST /api/shipments`**

1. **Client Sends Request**:
   The client makes a `POST` request with header `Authorization: Bearer <token>` and JSON body:
   ```json
   {
     "trackingNumber": "TRK-1001",
     "customerId": "uuid-here",
     "origin": "New York, NY",
     "destination": "Los Angeles, CA"
   }
   ```
2. **Global Middleware (`server.ts`)**:
   - `cors()` verifies the sender's origin.
   - `express.json()` parses the raw incoming byte stream into a JavaScript object (`req.body`).
3. **Route Match (`shipment.routes.ts`)**:
   - Express matches `POST /api/shipments` and enters the route's middleware chain.
4. **Auth Middleware (`authenticateJwt`)**:
   - Reads `req.headers.authorization`.
   - Strips `"Bearer "` and calls `jwt.verify(token, JWT_SECRET)`.
   - If invalid $\rightarrow$ returns `401 Unauthorized`.
   - If valid $\rightarrow$ attaches decoded user payload to `req.user` and calls `next()`.
5. **Validation Middleware (`validate(createShipmentSchema)`)**:
   - Passes `req.body` into Zod's `createShipmentSchema.parse()`.
   - Checks that `trackingNumber` is $\ge 3$ chars, `customerId` is a valid UUID, etc.
   - If invalid $\rightarrow$ halts and returns `400 Bad Request` with field-level errors.
   - If valid $\rightarrow$ replaces `req.body` with sanitized data and calls `next()`.
6. **Controller (`shipment.controller.ts`)**:
   - Receives clean data, calls `ShipmentService.createShipment(req.body)`.
7. **Service (`shipment.service.ts`)**:
   - Calls `prisma.shipment.create(...)` which generates SQL `INSERT`.
   - Also creates the initial `ShipmentStatusHistory` record with status `PENDING`.
8. **Response Envelope**:
   - Controller sends back HTTP `201 Created` with standard format:
     ```json
     {
       "success": true,
       "message": "Shipment created successfully.",
       "data": { ... }
     }
     ```
9. **Centralized Error Handling (`error.middleware.ts`)**:
   - If any step throws an error, Express forwards it to the global error handler.
   - Prisma errors (e.g. duplicate tracking number `P2002`) are translated into friendly HTTP `409 Conflict` responses automatically.

---

## 📡 API Endpoints Reference

### 1. System Health
| Method | URL | Description | Auth |
|---|---|---|:---:|
| `GET` | `/` | Welcome message | Public |
| `GET` | `/health` | Live PostgreSQL connection health ping | Public |

### 2. Authentication (`/api/auth`)
| Method | URL | Description | Auth |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Login and receive signed JWT (24h) | Public |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Bearer Token |

### 3. Customers (`/api/customers`)
| Method | URL | Description | Auth |
|---|---|---|:---:|
| `POST` | `/api/customers` | Create new customer | Bearer Token |
| `GET` | `/api/customers` | Get paginated customer list (`?page=1&limit=10&search=abc`) | Public |
| `GET` | `/api/customers/:id` | Get customer details with all their shipments | Public |
| `PUT` | `/api/customers/:id` | Update customer fields (name, company, status) | Bearer Token |
| `DELETE`| `/api/customers/:id` | Soft delete customer (`isDeleted = true`) | Bearer Token |

### 4. Shipments (`/api/shipments`)
| Method | URL | Description | Auth |
|---|---|---|:---:|
| `POST` | `/api/shipments` | Create shipment & start audit history | Bearer Token |
| `GET` | `/api/shipments` | List all shipments with customer summary | Public |
| `GET` | `/api/shipments/:id` | Get shipment details with full audit trail | Public |
| `PATCH`| `/api/shipments/:id/status`| Update status (atomic update + history log) | Bearer Token |

---

## 🚀 Setup & Installation Guide

### 🔑 Pre-Seeded Accounts (Password: `password123`)
Running `npm run seed` creates the following ready-to-use user accounts:

| Role | Email | Password | Description |
|---|---|---|---|
| `ADMIN` | `admin@system.com` | `password123` | System Administrator |
| `DRIVER` | `driver1@system.com` | `password123` | Driver 1 (Michael Vance - Truck TRK-8821-NY) |
| `DRIVER` | `driver2@system.com` | `password123` | Driver 2 (Sarah Jenkins - Truck TRK-4019-TX) |
| `DRIVER` | `driver3@system.com` | `password123` | Driver 3 (David Rodriguez - Truck TRK-1092-GA) |

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [PostgreSQL](https://www.postgresql.org/) (running locally or in Docker on port `5432`)

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Environment Variables
Create or verify `.env` inside `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/shipment_db?schema=public"
JWT_SECRET="your_super_secret_jwt_key_for_production"
```

### 3. Database Migration & Seeding
Push the Prisma schema to PostgreSQL and populate initial demo data (7 Shipments, 3 Drivers, 4 Trucks, 5 Customers, Audit Logs, Sales data):
```bash
# Apply schema to database
npx prisma migrate dev

# Seed sample users, drivers, trucks, customers, shipments, and sales data
npm run seed
```

### 4. Run the Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5000` with hot-reload enabled (`tsx watch`).

---

## 🧪 Testing with Postman

We have provided a pre-configured, importable Postman collection file:
📁 **[`backend/postman_collection.json`](file:///e:/Shipment-Management-System/backend/postman_collection.json)**

### How to use:
1. Open **Postman**.
2. Click **Import** (top-left) $\rightarrow$ Select `postman_collection.json`.
3. Open the **1.2 Login** request and click **Send**.
4. ✨ **The collection automatically extracts and saves your JWT token** into collection variables, so all subsequent protected customer & shipment requests work automatically without manual copy-pasting!

---

## 📂 Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma             # PostgreSQL schema definition & models
│   ├── seed.ts                   # Initial seed data script
│   └── migrations/               # SQL migration files
├── src/
│   ├── controllers/              # HTTP Request/Response handlers
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   └── shipment.controller.ts
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.ts    # JWT verification & role authorization
│   │   ├── error.middleware.ts   # Centralized error handler & AppError
│   │   └── validate.middleware.ts# Zod request validation
│   ├── routes/                   # Endpoint definitions & router pipelines
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   └── shipment.routes.ts
│   ├── schemas/                  # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── customer.schema.ts
│   │   └── shipment.schema.ts
│   ├── services/                 # Business logic & Prisma ORM queries
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   └── shipment.service.ts
│   ├── lib/
│   │   └── prisma.ts             # Prisma Client singleton
│   ├── types/
│   │   └── express.d.ts          # Custom Express Request type extension
│   └── server.ts                 # Express application entrypoint
├── postman_collection.json       # Pre-configured Postman testing suite
├── package.json                  # Scripts & dependencies
├── tsconfig.json                 # TypeScript compiler configuration
└── .env                          # Environment secrets
```

---

*Authored for the Shipment Management System. Designed for high reliability, clean architecture, and rapid extensibility.*
