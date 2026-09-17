# 🤖 AI Assistant Service

**Module 4** – Python/Flask chatbot microservice powered by **Groq AI** (llama-3.3-70b-versatile).

## Tech Stack
- **Python** · **Flask** · **Groq Python SDK**

## Setup

```bash
# Navigate to this directory
cd ai-service

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and add your Groq API key
```

### `.env` Configuration
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=5002
MAX_HISTORY_MESSAGES=20
```

Get your free API key at: https://console.groq.com

```bash
# Start the service
python app.py
```

Server runs on **http://localhost:5002**

## API

### `POST /chat`

Send a message and receive an AI response.

**Request Body:**
```json
{
  "message": "What does OUT_FOR_DELIVERY status mean?",
  "session_id": "optional-session-id-for-history"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "session_abc123",
  "message": "OUT_FOR_DELIVERY means the package is with the delivery agent...",
  "model": "llama-3.3-70b-versatile",
  "usage": {
    "prompt_tokens": 215,
    "completion_tokens": 89,
    "total_tokens": 304
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### `GET /chat/:session_id/history`
Returns conversation history for a session.

### `DELETE /chat/:session_id`
Clears conversation history for a session.

### `GET /health`
Returns service status and API key configuration state.

## Features
- **Conversation history** – Maintains context per session_id
- **Logistics domain prompt** – ShipBot is tuned for logistics Q&A
- **Error handling** – Rate limits, connection errors, API errors all handled gracefully
- **Max history** – Configurable via `MAX_HISTORY_MESSAGES` env var
