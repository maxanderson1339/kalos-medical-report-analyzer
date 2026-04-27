"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("sarah@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ marginBottom: "4px", fontSize: "24px" }}>Kalos Member Login</h1>
        <p style={{ marginBottom: "24px", color: "#666", fontSize: "14px" }}>Sign in to see your DEXA scan history</p>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <p style={{ color: "red", fontSize: "14px", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: "20px", backgroundColor: "#f9f9f9", border: "1px solid #eee", borderRadius: "4px", padding: "12px" }}>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Demo accounts (password: password123)</p>
          <p style={{ fontSize: "13px" }}>sarah@example.com — 1 scan</p>
          <p style={{ fontSize: "13px" }}>jordan@example.com — 2 scans</p>
          <p style={{ fontSize: "13px" }}>maria@example.com — 3+ scans</p>
          <p style={{ fontSize: "13px" }}>david@example.com — 5+ scans</p>
        </div>
      </div>
    </main>
  );
}
