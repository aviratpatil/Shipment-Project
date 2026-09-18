"""
ShipmentPro AI Assistant Service — Refactored (RAG + OpenAI + PostgreSQL Sessions)
====================================================================================
Port      : 5002
Provider  : OpenAI GPT-4o-mini
Retrieval : pgvector cosine similarity over document_chunks table
Sessions  : Persisted in PostgreSQL ChatSession / ChatMessage tables
Guardrails: Regex-based input filtering for code injection and off-topic prompts

Endpoints:
    POST   /chat                        → main chat endpoint
    DELETE /chat/<session_id>           → clear session history
    GET    /chat/<session_id>/history   → retrieve session messages
    GET    /health                      → health check
"""

import os
import sys
import re
import math
import uuid
import hashlib
from datetime import datetime, timezone

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import psycopg2
import psycopg2.extras
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI, OpenAIError, RateLimitError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────
PORT             = int(os.getenv("PORT", 5002))
OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY", "").strip()
GROQ_API_KEY     = os.getenv("GROQ_API_KEY", "").strip()
CHAT_MODEL       = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GROQ_MODEL       = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
EMBED_MODEL      = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
DATABASE_URL     = os.getenv("DATABASE_URL", "")
MAX_HISTORY      = int(os.getenv("MAX_HISTORY_MESSAGES", 10))
TOP_K            = int(os.getenv("TOP_K_CHUNKS", 3))
BACKEND_API_URL  = os.getenv("BACKEND_API_URL", "http://localhost:5000/api")

FALLBACK_RESPONSE = "I'm sorry, I couldn't find that information on our website."


# ─────────────────────────────────────────────────────────────────────────────
# LLM Client Factory (supports Groq & OpenAI)
# ─────────────────────────────────────────────────────────────────────────────
def get_llm_client():
    """
    Returns (client, model_name, provider_name).
    Prioritizes Groq if GROQ_API_KEY is configured (free inference),
    otherwise uses OpenAI.
    """
    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    if groq_key and groq_key.startswith("gsk_"):
        client = OpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1",
            max_retries=1,
            timeout=10.0,
        )
        return client, groq_model, "Groq"

    if openai_key and not openai_key.startswith("sk-your"):
        client = OpenAI(
            api_key=openai_key,
            max_retries=1,
            timeout=10.0,
        )
        return client, openai_model, "OpenAI"

    raise ValueError("No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY in ai-service/.env")


# ─────────────────────────────────────────────────────────────────────────────
# PostgreSQL Connection Helper
# ─────────────────────────────────────────────────────────────────────────────
def get_db_conn():
    """Return a new psycopg2 connection. Caller is responsible for close()."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


# ─────────────────────────────────────────────────────────────────────────────
# Input Guardrails
# ─────────────────────────────────────────────────────────────────────────────
_CODE_PATTERNS = [
    r"\bpython\b", r"\bwrite code\b", r"\bscript\b", r"\bprogramming\b",
    r"\bjavascript\b", r"\bjava\b", r"\bc\+\+\b", r"\bhtml\b", r"\bcss\b",
    r"\bsql query\b", r"\bwrite a (program|script|code|function|class)\b",
    r"\bdef\s+[a-zA-Z_]", r"\bimport\s+[a-zA-Z_]", r"\bcan you code\b",
    r"\bwrite me code\b", r"\bcoding\b", r"\balgorithm\b",
]

_OFF_TOPIC_PATTERNS = [
    r"\brecipe\b", r"\bcook\b", r"\bbake\b", r"\bmovie\b", r"\blyrics\b",
    r"\bpoem\b", r"\bessay\b", r"\bpresident\b", r"\bweather\b", r"\bjoke\b",
    r"\briddle\b", r"\bcapital of\b", r"\bcricket\b", r"\bfootball\b",
    r"\bhoroscope\b", r"\btell me a story\b", r"\bwrite a song\b",
]

CODE_REFUSAL = (
    "I am ShipBot, the dedicated assistant for ShipmentPro. I can only assist "
    "with logistics operations, shipment tracking, fleet management, and platform features. "
    "I cannot write or explain programming code."
)

OFF_TOPIC_REFUSAL = (
    "I am ShipBot, dedicated exclusively to ShipmentPro logistics. "
    "I can only assist with shipment tracking, fleet operations, driver management, "
    "and platform features."
)


def _check_code(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in _CODE_PATTERNS)


def _check_off_topic(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in _OFF_TOPIC_PATTERNS)


# ─────────────────────────────────────────────────────────────────────────────
# RAG — Retrieval & Similarity
# ─────────────────────────────────────────────────────────────────────────────
_HAS_PGVECTOR: bool | None = None


def has_pgvector_support() -> bool:
    """Check if the pgvector extension is enabled in PostgreSQL."""
    global _HAS_PGVECTOR
    if _HAS_PGVECTOR is not None:
        return _HAS_PGVECTOR
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector';")
        _HAS_PGVECTOR = bool(cur.fetchone())
        cur.close()
        conn.close()
    except Exception:
        _HAS_PGVECTOR = False
    return _HAS_PGVECTOR


def _hash_embedding(text: str, dim: int = 1536) -> list[float]:
    """Fallback hash vector when OpenAI quota is unavailable."""
    vec = [0.0] * dim
    words = text.lower().split()
    for w in words:
        h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16) % dim
        vec[h] += 1.0
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    return (dot / (norm_a * norm_b)) if (norm_a and norm_b) else 0.0


def embed_query(client: OpenAI, text: str) -> list[float]:
    """Embed the query string using OpenAI text-embedding-3-small."""
    response = client.embeddings.create(
        model=EMBED_MODEL,
        input=text.replace("\n", " "),
    )
    return response.data[0].embedding


def retrieve_context(client: OpenAI, query: str, top_k: int = TOP_K) -> str:
    """
    Embed the query, run similarity search against document_chunks in PostgreSQL,
    and return the top-k chunks concatenated as a single context string.
    Supports both native pgvector <=> operator and PostgreSQL array cosine search.
    """
    try:
        try:
            groq_key = os.getenv("GROQ_API_KEY", "").strip()
            if groq_key and groq_key.startswith("gsk_"):
                embedding = _hash_embedding(query)
            else:
                embedding = embed_query(client, query)
        except Exception as exc:
            # If OpenAI embedding fails (e.g. quota), fall back to deterministic feature vector
            print(f"[INFO] Using fallback query embedding: {exc}")
            embedding = _hash_embedding(query)

        conn = get_db_conn()
        cur  = conn.cursor()

        if has_pgvector_support():
            vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
            cur.execute(
                """
                SELECT content
                FROM   document_chunks
                ORDER  BY embedding <=> %s::vector
                LIMIT  %s
                """,
                (vec_str, top_k),
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            chunks = [row["content"] for row in rows]
        else:
            cur.execute("SELECT content, embedding FROM document_chunks;")
            rows = cur.fetchall()
            cur.close()
            conn.close()

            if not rows:
                return ""

            scored = []
            for row in rows:
                row_emb = row.get("embedding") or []
                sim = cosine_similarity(embedding, row_emb)
                scored.append((sim, row["content"]))

            scored.sort(key=lambda x: x[0], reverse=True)
            chunks = [item[1] for item in scored[:top_k] if item[0] > 0.0]

        return "\n\n---\n\n".join(chunks) if chunks else ""

    except Exception as exc:
        print(f"[WARN] RAG retrieval error: {exc}")
        return ""


# ─────────────────────────────────────────────────────────────────────────────
# Live Data Fetchers (used for tracking number lookups, fleet queries)
# ─────────────────────────────────────────────────────────────────────────────
def _fetch_live_shipments() -> list[dict]:
    try:
        r = requests.get(f"{BACKEND_API_URL}/shipments", timeout=2.5)
        if r.status_code == 200:
            return r.json().get("data", [])
    except Exception:
        pass
    return []


def _fetch_live_trucks() -> list[dict]:
    try:
        r = requests.get(f"{BACKEND_API_URL}/trucks", timeout=2.5)
        if r.status_code == 200:
            return r.json().get("data", [])
    except Exception:
        pass
    return []


def _build_live_snapshot() -> str:
    """Build a brief live data summary string to inject into system context."""
    shipments = _fetch_live_shipments()
    trucks    = _fetch_live_trucks()

    lines = ["\n\n--- LIVE PLATFORM SNAPSHOT ---"]

    if shipments:
        in_transit = sum(1 for s in shipments if s.get("status") == "IN_TRANSIT")
        delivered  = sum(1 for s in shipments if s.get("status") == "DELIVERED")
        lines.append(f"Total shipments in system: {len(shipments)} "
                     f"({in_transit} in transit, {delivered} delivered)")

        # Include concrete tracking number data for live lookups
        trk_lines = []
        for s in shipments[:20]:  # cap to avoid token bloat
            trk  = s.get("trackingNumber", "")
            st   = s.get("status", "")
            orig = s.get("origin", "")
            dest = s.get("destination", "")
            cust = (s.get("customer") or {}).get("name", "")
            trk_lines.append(f"  {trk}: {orig} → {dest} | Status: {st} | Customer: {cust}")
        lines.append("Active shipments:\n" + "\n".join(trk_lines))

    if trucks:
        active = sum(1 for t in trucks if t.get("status") == "ACTIVE")
        lines.append(f"Total trucks: {len(trucks)} ({active} actively on road)")

    lines.append("--- END SNAPSHOT ---")
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Session Persistence — PostgreSQL
# ─────────────────────────────────────────────────────────────────────────────
def _ensure_session(conn, session_id: str) -> None:
    """
    Create a ChatSession row if it doesn't exist.
    Uses the existing Prisma ChatSession table (no userId for anonymous sessions).
    """
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO "ChatSession" (id, "createdAt", "updatedAt")
        VALUES (%s, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
        """,
        (session_id,),
    )
    conn.commit()
    cur.close()


def _load_history(conn, session_id: str, limit: int = MAX_HISTORY) -> list[dict]:
    """Load the last `limit` messages for the session from PostgreSQL."""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT role, content
        FROM   "ChatMessage"
        WHERE  "sessionId" = %s
        ORDER  BY "createdAt" DESC
        LIMIT  %s
        """,
        (session_id, limit),
    )
    rows = cur.fetchall()
    cur.close()
    # Reverse so oldest-first for the LLM messages array
    rows = list(reversed(rows))
    return [{"role": r["role"].lower(), "content": r["content"]} for r in rows]


def _persist_messages(conn, session_id: str, user_msg: str, assistant_msg: str) -> None:
    """Append both the user and assistant turn to ChatMessage."""
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO "ChatMessage" (id, "sessionId", role, content, "createdAt")
        VALUES (%s, %s, 'USER',      %s, NOW()),
               (%s, %s, 'ASSISTANT', %s, NOW())
        """,
        (
            str(uuid.uuid4()), session_id, user_msg,
            str(uuid.uuid4()), session_id, assistant_msg,
        ),
    )
    # Bump session updatedAt
    cur.execute(
        'UPDATE "ChatSession" SET "updatedAt" = NOW() WHERE id = %s',
        (session_id,),
    )
    conn.commit()
    cur.close()


# ─────────────────────────────────────────────────────────────────────────────
# System Prompt Builder
# ─────────────────────────────────────────────────────────────────────────────
_BASE_SYSTEM_PROMPT = """You are ShipBot, the AI assistant for ShipmentPro — a logistics and supply chain management platform.

STRICT RULES:
1. Answer ONLY using the CONTEXT provided below. Do not use any outside knowledge.
2. If the context does not contain enough information to answer the question, respond with exactly:
   "I'm sorry, I couldn't find that information on our website."
3. Do NOT generate, write, explain, or discuss programming code in any language.
4. Do NOT answer questions unrelated to ShipmentPro logistics (e.g. recipes, weather, sports, politics).
5. Be concise, professional, and format responses with markdown bullet points where helpful.
6. When the LIVE PLATFORM SNAPSHOT is provided, use it to give real-time shipment and fleet data.

CONTEXT:
{context}
"""


def _build_system_prompt(context: str, live_snapshot: str) -> str:
    full_context = context
    if live_snapshot:
        full_context = (context + "\n" + live_snapshot) if context else live_snapshot
    return _BASE_SYSTEM_PROMPT.format(context=full_context or "No relevant context found.")


# ─────────────────────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def index():
    return jsonify({
        "message": "🤖 ShipmentPro AI Assistant Service is running!",
        "model":   CHAT_MODEL,
        "port":    PORT,
    })


@app.get("/health")
def health():
    db_ok = False
    try:
        conn  = get_db_conn()
        cur   = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        db_ok = True
    except Exception:
        pass

    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    provider = "none"
    if groq_key and groq_key.startswith("gsk_"):
        provider = "groq"
    elif openai_key and not openai_key.startswith("sk-your"):
        provider = "openai"

    return jsonify({
        "status":         "ok",
        "service":        "ai-assistant",
        "provider":       provider,
        "database_ready": db_ok,
    })


# ─────────────────────────────────────────────────────────────────────────────
# POST /chat  — Main Endpoint
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}

    # ── Input validation ──────────────────────────────────────────────────────
    message    = (data.get("message") or "").strip()
    session_id = (data.get("session_id") or "").strip() or str(uuid.uuid4())

    if not message:
        return jsonify({"error": "Message cannot be empty."}), 400

    if len(message) > 2000:
        return jsonify({"error": "Message too long (max 2000 characters)."}), 400

    # ── Guardrails ─────────────────────────────────────────────────────────────
    if _check_code(message):
        return jsonify({"response": CODE_REFUSAL, "session_id": session_id}), 200

    if _check_off_topic(message):
        return jsonify({"response": OFF_TOPIC_REFUSAL, "session_id": session_id}), 200

    # ── LLM client (Groq or OpenAI) ───────────────────────────────────────────
    try:
        client, model_name, provider = get_llm_client()
    except ValueError as e:
        return jsonify({
            "response": "The AI assistant is not configured. Please set GROQ_API_KEY in ai-service/.env.",
            "session_id": session_id,
        }), 200

    # ── RAG: Embed query + retrieve context ───────────────────────────────────
    try:
        retrieved_context = retrieve_context(client, message)
    except Exception as exc:
        print(f"[WARN] Context retrieval failed: {exc}")
        retrieved_context = ""

    # ── Live snapshot for real-time data ──────────────────────────────────────
    live_snapshot = _build_live_snapshot()

    # If no context was retrieved at all, return canonical fallback immediately
    # (skips LLM call to save cost when there's clearly no relevant data)
    if not retrieved_context and not live_snapshot:
        return jsonify({"response": FALLBACK_RESPONSE, "session_id": session_id}), 200

    # ── Session: Load history from DB ────────────────────────────────────────
    conn = None
    history: list[dict] = []
    try:
        conn = get_db_conn()
        _ensure_session(conn, session_id)
        history = _load_history(conn, session_id)
    except Exception as exc:
        print(f"[WARN] Session load failed: {exc}")
        # Proceed without history rather than failing the request

    # ── Build messages payload for LLM ────────────────────────────────────────
    system_prompt = _build_system_prompt(retrieved_context, live_snapshot)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    # ── Call LLM (Groq or OpenAI) ────────────────────────────────────────────
    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
            top_p=0.9,
        )
        reply = completion.choices[0].message.content.strip()

        # Post-generation safety: strip any accidentally produced code blocks
        if "```" in reply and any(kw in reply for kw in ["def ", "import ", "function ", "const "]):
            reply = CODE_REFUSAL

    except RateLimitError as exc:
        print(f"[WARN] {provider} RateLimitError: {exc}")
        if provider == "Groq":
            err_msg = "⚠️ Groq rate limit reached. Please wait a moment and try again."
        else:
            err_msg = (
                "⚠️ OpenAI API quota exceeded: Your OpenAI account has an active API key, but $0 credit balance remaining. "
                "Please add credits at https://platform.openai.com/settings/organization/billing/ or use Groq (GROQ_API_KEY) in ai-service/.env."
            )
        return jsonify({
            "response": err_msg,
            "session_id": session_id,
        }), 200

    except OpenAIError as exc:
        print(f"[ERROR] {provider} API error: {exc}")
        return jsonify({
            "response": (
                f"I'm currently experiencing technical difficulties contacting the {provider} AI model. "
                "Please check the server logs or try again."
            ),
            "session_id": session_id,
        }), 200

    # ── Persist messages to PostgreSQL ────────────────────────────────────────
    if conn:
        try:
            _persist_messages(conn, session_id, message, reply)
        except Exception as exc:
            print(f"[WARN] Session persist failed: {exc}")
        finally:
            conn.close()

    return jsonify({
        "response":   reply,
        "session_id": session_id,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /chat/<session_id>  — Clear session history
# ─────────────────────────────────────────────────────────────────────────────
@app.delete("/chat/<session_id>")
def clear_history(session_id: str):
    try:
        conn = get_db_conn()
        cur  = conn.cursor()
        # Cascade delete removes ChatMessage rows automatically
        cur.execute('DELETE FROM "ChatSession" WHERE id = %s', (session_id,))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as exc:
        print(f"[WARN] Clear history error: {exc}")

    return jsonify({"success": True, "message": "Conversation history cleared."})


# ─────────────────────────────────────────────────────────────────────────────
# GET /chat/<session_id>/history  — Retrieve session messages
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/chat/<session_id>/history")
def get_history(session_id: str):
    try:
        conn     = get_db_conn()
        messages = _load_history(conn, session_id, limit=50)
        conn.close()
        return jsonify({"success": True, "session_id": session_id, "messages": messages})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not OPENAI_API_KEY or OPENAI_API_KEY.startswith("sk-your"):
        print("[WARN] OPENAI_API_KEY is not configured. Set it in ai-service/.env")
    if not DATABASE_URL:
        print("[WARN] DATABASE_URL is not configured. Session persistence is disabled.")
    print(f"[*] ShipmentPro AI Assistant starting on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=True)
