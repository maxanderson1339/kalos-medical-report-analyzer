"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "How many members have had 3+ scans?",
  "How is Sarah's body fat today?",
  "Show body fat trends for Maria",
  "What should I focus on for David?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi coach! Ask me anything about member scan data." },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.answer || "No answer returned." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f5f5f5" }}>

      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 700 }}>M</span>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>MemberGPT</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Ask questions about member DEXA scan data</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                backgroundColor: m.role === "user" ? "#2563eb" : "white",
                color: m.role === "user" ? "white" : "#111827",
                border: m.role === "assistant" ? "1px solid #e5e7eb" : "none",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "12px 16px",
                fontSize: "14px",
                lineHeight: "1.6",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, opacity: 0.6 }}>
                {m.role === "user" ? "Coach" : "MemberGPT"}
              </p>
              <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", fontSize: "14px", color: "#9ca3af", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <span>Thinking</span>
              <span style={{ animation: "none" }}>...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ backgroundColor: "white", borderTop: "1px solid #f3f4f6", padding: "10px 16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => ask(p)}
            suppressHydrationWarning
            style={{ padding: "5px 12px", fontSize: "12px", border: "1px solid #e5e7eb", borderRadius: "20px", backgroundColor: "white", cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ backgroundColor: "white", borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) ask(); }}
          placeholder="Ask about a member's scan trends..."
          suppressHydrationWarning
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "24px", fontSize: "14px", outline: "none", backgroundColor: "#f9fafb" }}
        />
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          suppressHydrationWarning
          style={{
            width: "40px", height: "40px", borderRadius: "50%",
            backgroundColor: loading || !question.trim() ? "#e5e7eb" : "#2563eb",
            border: "none", cursor: loading || !question.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
