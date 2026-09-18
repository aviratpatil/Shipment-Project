import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Trash2, Loader2, Sparkles } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const AI_SERVICE_URL = "http://localhost:5002";
const SESSION_KEY = "shipbot_session_id";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Simple markdown-to-HTML: bold, code, line breaks
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
    .replace(/\n/g, "<br/>");
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatBot Component
// ─────────────────────────────────────────────────────────────────────────────

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm **ShipBot** 🚢, your logistics assistant. Ask me anything about shipments, delivery statuses, or how to use ShipmentPro!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnread(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${AI_SERVICE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      const data = await res.json();

      // New API contract: { response: string, session_id: string }
      const isError = !res.ok;
      const botMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: isError
          ? (data.error ?? "Something went wrong. Please try again.")
          : (data.response ?? "I received an empty response."),
        timestamp: new Date(),
        isError,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "⚠️ Could not reach ShipBot. Make sure the `ai-service` is running on port 5002.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId, isOpen]);

  const clearHistory = async () => {
    try {
      await fetch(`${AI_SERVICE_URL}/chat/${sessionId}`, { method: "DELETE" });
    } catch { /* silent */ }
    setMessages([{
      id: "welcome_reset",
      role: "assistant",
      content: "Conversation cleared! How can I help you?",
      timestamp: new Date(),
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Bubble ── */}
      <button
        id="chatbot-toggle"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 1000,
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 8px 28px rgba(59,130,246,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 12px 36px rgba(59,130,246,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(59,130,246,0.45)";
        }}
        title="Open AI Assistant"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              border: "2px solid #fff",
              animation: "pulse-dot 1.5s ease infinite",
            }}
          />
        )}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          id="chatbot-panel"
          style={{
            position: "fixed",
            bottom: "100px",
            right: "28px",
            zIndex: 999,
            width: "380px",
            maxHeight: "560px",
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: "hidden",
            animation: "modalIn 0.25s ease both",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>ShipBot AI</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
                Logistics Assistant · Online
              </div>
            </div>
            <button
              onClick={clearHistory}
              title="Clear conversation"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              minHeight: 0,
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: "8px",
                  animation: "fadeUp 0.2s ease both",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                        : msg.isError
                        ? "#fef2f2"
                        : "#f1f5f9",
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={13} color="#fff" />
                  ) : (
                    <Bot size={13} color={msg.isError ? "#ef4444" : "#6366f1"} />
                  )}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: "75%" }}>
                  <div
                    style={{
                      padding: "10px 13px",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 4px 16px 16px"
                          : "4px 16px 16px 16px",
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                          : msg.isError
                          ? "#fef2f2"
                          : "#f8faff",
                      border: msg.isError ? "1px solid #fecaca" : "none",
                      fontSize: "13px",
                      lineHeight: 1.55,
                      color:
                        msg.role === "user"
                          ? "#fff"
                          : msg.isError
                          ? "#991b1b"
                          : "#1e293b",
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginTop: "3px",
                      textAlign: msg.role === "user" ? "right" : "left",
                      paddingInline: "4px",
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={13} color="#6366f1" />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "4px 16px 16px 16px",
                    background: "#f8faff",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#6366f1",
                        animation: `pulse-dot 1s ease ${delay}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              backgroundColor: "#fafbff",
            }}
          >
            <input
              ref={inputRef}
              id="chatbot-input"
              type="text"
              placeholder="Ask ShipBot anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "9px 13px",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none",
                backgroundColor: "#fff",
                transition: "border-color 0.15s ease",
                color: "#0f172a",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
            <button
              id="chatbot-send"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                border: "none",
                background:
                  !input.trim() || isLoading
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: !input.trim() || isLoading ? "#94a3b8" : "#fff",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              {isLoading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
