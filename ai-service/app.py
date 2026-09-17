"""
Module 4 – AI Assistant Service
Port: 5002
POST /chat  → accepts user message + session_id, returns AI response
"""

import os
import uuid
from collections import defaultdict
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq, APIError, RateLimitError, APIConnectionError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv("PORT", 5002))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_HISTORY = int(os.getenv("MAX_HISTORY_MESSAGES", 20))

# In-memory conversation store  {session_id: [messages]}
conversation_store: dict[str, list[dict]] = defaultdict(list)

# ─────────────────────────────────────────────────────────────────────────────
# System prompt – Logistics domain expert
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are ShipBot, an expert AI assistant for ShipmentPro – a modern logistics management platform.

Your capabilities:
- Answer questions about shipment tracking, delivery statuses, and logistics operations
- Help users understand the platform features (Customers, Shipments, Dashboard, Analytics)
- Provide guidance on best practices for supply chain management
- Explain shipment statuses: PENDING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
- Help troubleshoot common logistics problems
- Answer general questions in a helpful and conversational way

Shipment statuses explained:
- PENDING: Order received, not yet dispatched
- IN_TRANSIT: Package is on the way to destination
- OUT_FOR_DELIVERY: Package is with the delivery agent, expected today
- DELIVERED: Successfully delivered to recipient
- CANCELLED: Order was cancelled

Always be concise, professional, and helpful. If you don't know something specific to this company's data, say so gracefully.
Format responses with markdown where appropriate but keep them scannable and brief."""

# ─────────────────────────────────────────────────────────────────────────────
# Groq client
# ─────────────────────────────────────────────────────────────────────────────

def get_client() -> Groq:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set in environment variables.")
    return Groq(api_key=GROQ_API_KEY)


# ─────────────────────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def index():
    return jsonify({
        "message": "🤖 AI Assistant Service is running!",
        "model": MODEL,
        "port": PORT,
    })


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-assistant",
        "groq_key_configured": bool(GROQ_API_KEY),
    })


# ─────────────────────────────────────────────────────────────────────────────
# POST /chat
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}

    message = (data.get("message") or "").strip()
    session_id = (data.get("session_id") or "").strip() or str(uuid.uuid4())

    if not message:
        return jsonify({"success": False, "error": "Message cannot be empty."}), 400

    if len(message) > 2000:
        return jsonify({"success": False, "error": "Message too long (max 2000 characters)."}), 400

    # Retrieve or initialise history for this session
    history = conversation_store[session_id]

    # Append user message
    history.append({"role": "user", "content": message})

    # Trim history to avoid token overflow
    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
        conversation_store[session_id] = history

    # Build messages list for API call
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    # ── Call Groq API ─────────────────────────────────────────────────────────
    try:
        client = get_client()
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=0.9,
        )

        assistant_reply = completion.choices[0].message.content.strip()

        # Append assistant message to history
        history.append({"role": "assistant", "content": assistant_reply})

        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": assistant_reply,
            "model": MODEL,
            "usage": {
                "prompt_tokens": completion.usage.prompt_tokens,
                "completion_tokens": completion.usage.completion_tokens,
                "total_tokens": completion.usage.total_tokens,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    except RateLimitError:
        # Remove last user message from history on error
        conversation_store[session_id].pop()
        return jsonify({
            "success": False,
            "error": "Rate limit reached. Please wait a moment and try again.",
            "session_id": session_id,
        }), 429

    except APIConnectionError:
        conversation_store[session_id].pop()
        return jsonify({
            "success": False,
            "error": "Could not connect to AI service. Check your internet connection.",
            "session_id": session_id,
        }), 503

    except APIError as exc:
        conversation_store[session_id].pop()
        return jsonify({
            "success": False,
            "error": f"AI API error: {str(exc)}",
            "session_id": session_id,
        }), 502

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 500

    except Exception as exc:
        conversation_store[session_id].pop()
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred. Please try again.",
            "session_id": session_id,
        }), 500


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /chat/:session_id  – clear history
# ─────────────────────────────────────────────────────────────────────────────

@app.delete("/chat/<session_id>")
def clear_history(session_id: str):
    if session_id in conversation_store:
        del conversation_store[session_id]
    return jsonify({"success": True, "message": "Conversation history cleared."})


# ─────────────────────────────────────────────────────────────────────────────
# GET /chat/:session_id/history
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/chat/<session_id>/history")
def get_history(session_id: str):
    history = conversation_store.get(session_id, [])
    return jsonify({"success": True, "session_id": session_id, "messages": history})


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not GROQ_API_KEY:
        print("⚠️  WARNING: GROQ_API_KEY not set. Set it in ai-service/.env")
    print(f"🤖 AI Assistant Service starting on http://localhost:{PORT}")
    print(f"   Model: {MODEL}")
    print(f"   POST /chat – Send a message to the AI assistant")
    app.run(host="0.0.0.0", port=PORT, debug=True)
