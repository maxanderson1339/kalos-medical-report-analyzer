"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function MemberGPTClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi coach! Ask me anything about member scan data.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim() || loading) return;

    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.answer || "No answer returned." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Could not reach the API server. Make sure it is running on port 8000." }]);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "white", display: "flex", flexDirection: "column", height: "600px" }}>
      <div style={{ borderBottom: "1px solid #ddd", padding: "16px" }}>
        <h2 style={{ fontSize: "18px", margin: 0 }}>MemberGPT</h2>
        <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0" }}>Ask questions about member scan data</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#f9f9f9" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "75%",
              backgroundColor: m.role === "user" ? "#2563eb" : "white",
              color: m.role === "user" ? "white" : "#111",
              border: m.role === "assistant" ? "1px solid #ddd" : "none",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, marginBottom: "4px", opacity: 0.7 }}>
              {m.role === "user" ? "Coach" : "MemberGPT"}
            </p>
            {m.content}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", color: "#666" }}>
            Thinking...
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #ddd", padding: "12px 16px", display: "flex", gap: "8px" }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder="Ask about a member's scan trends..."
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px" }}
        />
        <button
          onClick={ask}
          disabled={loading}
          suppressHydrationWarning
          style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", opacity: loading ? 0.6 : 1 }}
        >
          Send
        </button>
      </div>

      <div style={{ borderTop: "1px solid #eee", padding: "10px 16px", backgroundColor: "#fafafa" }}>
        <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Quick prompts:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {[
            "How many members have had 3+ scans?",
            "How is Sarah's body fat today?",
            "Show body fat trends for Maria",
            "What should I focus on for David?",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setQuestion(prompt)}
              suppressHydrationWarning
              style={{ padding: "4px 10px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "white", cursor: "pointer" }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
