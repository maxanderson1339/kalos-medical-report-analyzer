"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("How many members have had 3+ scans?");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    const next = [...messages, { role: "user", content: question } as Message];
    setMessages(next);
    setLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_MEMBERGPT_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setMessages([...next, { role: "assistant", content: data.answer || "No answer returned." }]);
    setQuestion("");
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-semibold">MemberGPT</h1>
      <p className="mt-2 text-gray-600">Ask grounded questions about member DEXA scan data.</p>
      <div className="mt-6 space-y-3 rounded-xl border p-4">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-lg p-3 ${m.role === "user" ? "bg-gray-100" : "bg-blue-50"}`}>
            <strong>{m.role === "user" ? "Coach" : "MemberGPT"}:</strong> {m.content}
          </div>
        ))}
        {loading ? <p>Thinking...</p> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <input className="flex-1 rounded-md border p-3" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button onClick={ask} className="rounded-md bg-black px-4 py-2 text-white">Send</button>
      </div>
    </main>
  );
}