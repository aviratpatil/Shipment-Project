"""
ShipmentPro AI Assistant — Data Ingestion Script
=================================================
Embeds platform knowledge text chunks using OpenAI text-embedding-3-small
and upserts them into the document_chunks table in PostgreSQL (pgvector).

Usage:
    python ingest.py

Run this once before starting the AI service, and re-run whenever you
update the knowledge base below.
"""

import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import psycopg2
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
EMBED_MODEL     = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
DATABASE_URL    = os.getenv("DATABASE_URL", "")

# ─────────────────────────────────────────────────────────────────────────────
# ShipmentPro Platform Knowledge Base
# Each entry is {"source": "<category>", "content": "<text chunk>"}
# Add, edit or remove chunks here as your website content changes.
# ─────────────────────────────────────────────────────────────────────────────
KNOWLEDGE_BASE = [
    # ── Platform Overview ────────────────────────────────────────────────────
    {
        "source": "overview/platform",
        "content": (
            "ShipmentPro is a modern, full-stack logistics and supply chain management platform. "
            "It is designed for shipping and courier companies to manage customers, shipments, truck fleets, "
            "and driver teams from a single web dashboard. The platform provides real-time parcel tracking, "
            "an automated dispatch system, audit trails, analytics, and a dedicated driver mobile portal."
        ),
    },
    {
        "source": "overview/technology",
        "content": (
            "ShipmentPro is built with a React 19 + TypeScript frontend powered by Vite, "
            "and a Node.js + Express + TypeScript backend API. Data is stored in a PostgreSQL "
            "relational database and accessed via the Prisma ORM. Authentication is JWT-based "
            "with role-based access control. The platform exposes a RESTful API at port 5000 "
            "and the frontend runs on port 5173."
        ),
    },

    # ── User Roles ────────────────────────────────────────────────────────────
    {
        "source": "roles/overview",
        "content": (
            "ShipmentPro has three user roles: ADMIN, USER, and DRIVER. "
            "Each role has different access levels and permissions within the platform."
        ),
    },
    {
        "source": "roles/admin",
        "content": (
            "The ADMIN role (Logistics Manager / System Administrator) has full elevated access. "
            "Admins can do everything a USER can do, plus: soft-delete customer profiles, "
            "manage user accounts and promote users to ADMIN, view all audit histories, "
            "access analytics and sales reporting, manage driver approvals and truck assignments."
        ),
    },
    {
        "source": "roles/user",
        "content": (
            "The USER role (Dispatch Operator / Logistics Staff) represents frontline coordinators. "
            "Users can: register and login, view their own profile, create and manage customers, "
            "create and track shipments, update shipment statuses, and view audit logs. "
            "Users cannot soft-delete customers or manage other user accounts."
        ),
    },
    {
        "source": "roles/driver",
        "content": (
            "The DRIVER role gives access to the Driver Portal — a dedicated interface for truck drivers. "
            "Drivers can view their assigned truck and its shipment manifest, start and end journeys, "
            "update delivery status in real-time, and view their profile information including license number "
            "and on-duty status. Drivers must be approved by an ADMIN before they can use the portal."
        ),
    },

    # ── Shipment Lifecycle ────────────────────────────────────────────────────
    {
        "source": "features/shipment-lifecycle",
        "content": (
            "ShipmentPro tracks each parcel through 5 statuses: "
            "1. PENDING: The order is booked and packed at the warehouse floor, awaiting truck loading. "
            "2. IN_TRANSIT: Parcels are loaded into a truck via the Manifest tab. When the driver or staff "
            "   clicks 'Start Journey', all parcels automatically move to IN_TRANSIT and the truck becomes ACTIVE. "
            "3. OUT_FOR_DELIVERY: When the truck arrives at the destination hub and the driver clicks "
            "   'Reached Destination', all parcels automatically update to OUT_FOR_DELIVERY for local delivery agents. "
            "4. DELIVERED: Final confirmation when the customer physically receives their parcel. "
            "5. CANCELLED: The order was revoked before dispatch."
        ),
    },
    {
        "source": "features/shipment-audit",
        "content": (
            "Every shipment status change in ShipmentPro is automatically recorded in an audit log "
            "called ShipmentStatusHistory. Each history entry records the status and the exact timestamp "
            "of the change. This provides a complete, immutable trail for every parcel's journey. "
            "If a shipment is deleted, its history is cascade-deleted too."
        ),
    },
    {
        "source": "features/shipment-creation",
        "content": (
            "To create a shipment in ShipmentPro, a logged-in USER or ADMIN navigates to the Shipments tab "
            "and fills in the tracking number, selects a customer, and provides the origin and destination. "
            "The API endpoint is POST /api/shipments. A shipment starts in PENDING status automatically."
        ),
    },
    {
        "source": "features/shipment-tracking",
        "content": (
            "To track a shipment, you can use the tracking number (e.g. TRK-1001). "
            "The Shipments tab lists all shipments with their current status and customer. "
            "You can also use the AI assistant by typing the tracking number directly — ShipBot will "
            "look up the live status, route, assigned truck, and customer name instantly."
        ),
    },

    # ── Customer Management ───────────────────────────────────────────────────
    {
        "source": "features/customers",
        "content": (
            "The Customers tab in ShipmentPro provides a full corporate client directory. "
            "Each customer has a name, email, company name, and status (Active or Inactive). "
            "Customers can be created, updated, searched, and soft-deleted. Soft deletion sets "
            "isDeleted=true and status=Inactive — the customer record is preserved to protect "
            "historical shipment data integrity. Only ADMINs can soft-delete customers. "
            "The API supports pagination and search by name, company, or email."
        ),
    },

    # ── Fleet & Truck Management ──────────────────────────────────────────────
    {
        "source": "features/fleet",
        "content": (
            "The Fleet tab shows all registered trucks in the ShipmentPro system. "
            "Each truck has a name, license plate number, capacity (max parcels), and a status. "
            "Truck statuses are: "
            "NO_ALLOTMENT: Truck is loaded at the warehouse but has no driver assigned. "
            "READY: A driver has been assigned and the truck is ready to depart. "
            "ACTIVE: The truck is actively moving on the road. "
            "INACTIVE: The truck is under repair or maintenance and unavailable. "
            "ADMINs can assign drivers to trucks and manage the fleet directory."
        ),
    },
    {
        "source": "features/manifest",
        "content": (
            "The Manifest tab is where shipments are physically loaded onto trucks. "
            "Staff or drivers can add pending parcels to a specific truck's manifest, "
            "subject to the truck's capacity limit. Once the manifest is ready, the driver "
            "clicks 'Start Journey' to begin the delivery run — this automatically sets "
            "all loaded parcels to IN_TRANSIT and the truck to ACTIVE status. "
            "When the truck arrives at its destination, clicking 'Reached Destination' "
            "transitions all parcels to OUT_FOR_DELIVERY."
        ),
    },

    # ── Driver Portal ─────────────────────────────────────────────────────────
    {
        "source": "features/driver-portal",
        "content": (
            "The Driver Portal is a dedicated interface for truck drivers in ShipmentPro. "
            "After logging in with their DRIVER account, drivers can see their assigned truck, "
            "view the full parcel manifest, start their journey, and mark arrival at destination. "
            "Drivers must be approved by an ADMIN before their portal is active. "
            "Driver profiles include their phone number, address, license number, and a profile photo."
        ),
    },
    {
        "source": "features/driver-registration",
        "content": (
            "To register as a driver in ShipmentPro: "
            "1. Register a user account with role DRIVER at POST /api/auth/register. "
            "2. Complete the driver profile (phone, address, license number) in the Driver Portal. "
            "3. Wait for an ADMIN to approve your driver profile. "
            "4. Once approved (isApproved=true), you can be assigned to a truck and begin deliveries."
        ),
    },

    # ── Analytics & Dashboard ─────────────────────────────────────────────────
    {
        "source": "features/dashboard",
        "content": (
            "The ShipmentPro Dashboard provides a real-time operational overview. "
            "It shows total active shipments, delivered parcels count, registered customers, "
            "fleet size, and revenue milestones. The dashboard includes live charts for "
            "shipment status distribution and recent activity feeds. "
            "It is the first screen after login for both ADMINs and USERs."
        ),
    },
    {
        "source": "features/analytics",
        "content": (
            "The Analytics module in ShipmentPro provides sales performance reporting. "
            "It tracks revenue by salesperson and region, allowing managers to identify "
            "top performers and regional trends. The analytics data is stored in the SalesRecord "
            "model and accessible only to ADMIN users."
        ),
    },

    # ── Authentication & Security ─────────────────────────────────────────────
    {
        "source": "features/authentication",
        "content": (
            "ShipmentPro uses JWT (JSON Web Token) authentication. "
            "To log in: POST /api/auth/login with email and password. "
            "The response includes a signed JWT token valid for 24 hours. "
            "Include this token in all protected requests as: Authorization: Bearer <token>. "
            "To register: POST /api/auth/register with name, email, password, and optional role. "
            "To view your profile: GET /api/auth/me (requires Bearer token)."
        ),
    },
    {
        "source": "features/security",
        "content": (
            "All passwords in ShipmentPro are hashed using bcrypt with 10 salt rounds before storage. "
            "The platform uses Zod schema validation on all incoming request bodies to prevent "
            "malformed data from reaching the database. Role-based access control (RBAC) ensures "
            "that only authorized roles can access protected endpoints."
        ),
    },

    # ── API Reference ─────────────────────────────────────────────────────────
    {
        "source": "api/auth",
        "content": (
            "Authentication API endpoints: "
            "POST /api/auth/register — Create a new user account (public). "
            "POST /api/auth/login — Login and receive a signed JWT token (public). "
            "GET /api/auth/me — Fetch the current logged-in user's profile (requires Bearer token)."
        ),
    },
    {
        "source": "api/shipments",
        "content": (
            "Shipment API endpoints: "
            "POST /api/shipments — Create a new shipment (requires auth). "
            "GET /api/shipments — List all shipments with customer summary (public). "
            "GET /api/shipments/:id — Get full shipment details with audit trail (public). "
            "PATCH /api/shipments/:id/status — Update shipment status atomically with history log (requires auth)."
        ),
    },
    {
        "source": "api/customers",
        "content": (
            "Customer API endpoints: "
            "POST /api/customers — Create a new customer (requires auth). "
            "GET /api/customers — Get paginated customer list, supports ?page, ?limit, ?search (public). "
            "GET /api/customers/:id — Get customer details with all linked shipments (public). "
            "PUT /api/customers/:id — Update customer fields like name, company, status (requires auth). "
            "DELETE /api/customers/:id — Soft delete customer (ADMIN only)."
        ),
    },

    # ── Setup & Installation ──────────────────────────────────────────────────
    {
        "source": "setup/installation",
        "content": (
            "To install ShipmentPro on a new machine: "
            "1. Clone the repository: git clone <repo-url>. "
            "2. Backend setup: cd backend && npm install. "
            "3. Create backend/.env with PORT=5000, DATABASE_URL, and JWT_SECRET. "
            "4. Run database migrations: npx prisma migrate dev. "
            "5. Seed demo data: npm run seed. "
            "6. Start backend: npm run dev (runs on http://localhost:5000). "
            "7. Frontend setup: cd frontend && npm install && npm run dev (runs on http://localhost:5173)."
        ),
    },
    {
        "source": "setup/default-credentials",
        "content": (
            "After running 'npm run seed' in the backend directory, "
            "the following demo accounts are available with password 'password123': "
            "admin@system.com (ADMIN role — full access), "
            "driver1@system.com (DRIVER — Michael Vance, assigned to truck TRK-8821-NY), "
            "driver2@system.com (DRIVER — Sarah Jenkins, assigned to truck TRK-4019-TX), "
            "driver3@system.com (DRIVER — David Rodriguez, assigned to truck TRK-1092-GA)."
        ),
    },

    # ── Announcements ─────────────────────────────────────────────────────────
    {
        "source": "features/announcements",
        "content": (
            "ShipmentPro includes a system announcements feature for broadcasting important updates "
            "to all platform users. Announcements include a title, content body, and an optional category "
            "(e.g. 'System Update', 'Maintenance'). They are visible on the dashboard and managed by ADMINs."
        ),
    },

    # ── ShipBot AI Assistant ───────────────────────────────────────────────────
    {
        "source": "features/shipbot",
        "content": (
            "ShipBot is the AI-powered logistics assistant embedded in the ShipmentPro platform. "
            "It appears as a floating chat widget on the bottom-right corner of the web dashboard. "
            "ShipBot can answer questions about shipment statuses, platform features, driver management, "
            "fleet operations, and how to use ShipmentPro. It is strictly focused on logistics topics "
            "and will not answer off-topic questions or generate programming code. "
            "ShipBot maintains conversation context across messages within the same session."
        ),
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Embedding & Ingestion Logic
import math
import hashlib
from openai import OpenAIError, RateLimitError


def _hash_embedding(text: str, dim: int = 1536) -> list[float]:
    """
    Fallback deterministic feature vector used when OpenAI API quota is exhausted.
    Computes a normalized bag-of-words hash embedding so retrieval still functions.
    """
    vec = [0.0] * dim
    words = text.lower().split()
    for w in words:
        h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16) % dim
        vec[h] += 1.0
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def get_embedding(client: OpenAI, text: str) -> list[float]:
    """Call OpenAI Embeddings API and return the embedding vector."""
    response = client.embeddings.create(
        model=EMBED_MODEL,
        input=text.replace("\n", " "),
    )
    return response.data[0].embedding


def setup_schema(conn) -> bool:
    """
    Ensure document_chunks table exists.
    Attempts pgvector vector(1536) first; if the extension is not installed in PostgreSQL,
    falls back cleanly to native DOUBLE PRECISION[] array.
    Returns True if pgvector is available, False otherwise.
    """
    cur = conn.cursor()
    has_pgvector = False

    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()
        has_pgvector = True
        print("[OK] pgvector extension enabled.")
    except Exception:
        conn.rollback()
        print("[INFO] pgvector extension is not installed in PostgreSQL.")
        print("       Using native PostgreSQL DOUBLE PRECISION[] vector storage with cosine search.")

    if has_pgvector:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id         SERIAL PRIMARY KEY,
                content    TEXT            NOT NULL,
                source     TEXT            NOT NULL,
                embedding  vector(1536),
                created_at TIMESTAMPTZ     DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
                ON document_chunks
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 50);
        """)
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id         SERIAL PRIMARY KEY,
                content    TEXT                NOT NULL,
                source     TEXT                NOT NULL,
                embedding  DOUBLE PRECISION[]  DEFAULT '{}',
                created_at TIMESTAMPTZ         DEFAULT NOW()
            );
        """)

    conn.commit()
    cur.close()
    return has_pgvector


def ingest():
    if not OPENAI_API_KEY or OPENAI_API_KEY.startswith("sk-your"):
        print("[ERROR] OPENAI_API_KEY is not set. Please update ai-service/.env")
        sys.exit(1)

    if not DATABASE_URL:
        print("[ERROR] DATABASE_URL is not set. Please update ai-service/.env")
        sys.exit(1)

    print("[*] Connecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)

    has_pgvector = setup_schema(conn)
    print("[OK] Schema verified.")

    cur = conn.cursor()
    # Clear existing chunks to allow clean re-ingestion
    cur.execute("DELETE FROM document_chunks;")
    conn.commit()
    print(f"[*] Cleared existing chunks. Ingesting {len(KNOWLEDGE_BASE)} chunks...")

    client = OpenAI(api_key=OPENAI_API_KEY)
    using_fallback = False

    for i, doc in enumerate(KNOWLEDGE_BASE, 1):
        content = doc["content"]
        source  = doc["source"]

        if not using_fallback:
            try:
                embedding = get_embedding(client, content)
            except RateLimitError as e:
                print("\n" + "=" * 70)
                print("[WARN] OpenAI RateLimitError: Insufficient quota / 0 credit balance.")
                print("       Your OpenAI account has no remaining credits ($0 balance).")
                print("       Visit https://platform.openai.com/settings/organization/billing/ to add credits.")
                print("       Switching to fallback deterministic hash vectors so the database is populated now.")
                print("=" * 70 + "\n")
                using_fallback = True
                embedding = _hash_embedding(content)
            except OpenAIError as e:
                print(f"\n[WARN] OpenAI API Error ({e}). Using fallback embedding.")
                using_fallback = True
                embedding = _hash_embedding(content)
        else:
            embedding = _hash_embedding(content)

        if has_pgvector:
            cur.execute(
                "INSERT INTO document_chunks (content, source, embedding) VALUES (%s, %s, %s::vector)",
                (content, source, embedding),
            )
        else:
            cur.execute(
                "INSERT INTO document_chunks (content, source, embedding) VALUES (%s, %s, %s)",
                (content, source, embedding),
            )
        conn.commit()
        tag = "[fallback]" if using_fallback else "[openai]"
        print(f"  [{i:02d}/{len(KNOWLEDGE_BASE)}] [OK] Embedded {tag}: {source}")

    cur.close()
    conn.close()

    if using_fallback:
        print(f"\n[OK] Ingestion complete! {len(KNOWLEDGE_BASE)} chunks stored in document_chunks with fallback embeddings.")
        print("[TIP] Once you add credits to your OpenAI account, simply re-run 'python ingest.py' to generate OpenAI text-embedding-3-small vectors.")
    else:
        print(f"\n[SUCCESS] Ingestion complete! All {len(KNOWLEDGE_BASE)} chunks stored with OpenAI text-embedding-3-small vectors.")


if __name__ == "__main__":
    ingest()

