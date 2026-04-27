"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function CoachLoginPage() {
  const [email, setEmail] = useState("coach@kalos.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/membergpt",
    });

    if (result?.error) {
      setError("Invalid coach credentials");
      return;
    }

    window.location.href = "/membergpt";
  }

  return (
    <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ marginBottom: "4px", fontSize: "24px" }}>Coach Login</h1>
        <p style={{ marginBottom: "24px", color: "#666", fontSize: "14px" }}>Sign in to access MemberGPT</p>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@kalos.com"
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
            style={{ width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", fontSize: "15px", cursor: "pointer" }}
          >
            Sign in as Coach
          </button>
        </form>

        <div style={{ marginTop: "20px", backgroundColor: "#f9f9f9", border: "1px solid #eee", borderRadius: "4px", padding: "12px" }}>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Demo coach account</p>
          <p style={{ fontSize: "13px" }}>coach@kalos.com / password123</p>
        </div>
      </div>
    </main>
  );
}
