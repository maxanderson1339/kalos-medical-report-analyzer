import { MemberGPTClient } from "@/components/membergpt-client";

export default function MemberGPTPage() {
  return (
    <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>MemberGPT</h1>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>Ask questions about member scan data. No login required.</p>
        <MemberGPTClient />
      </div>
    </main>
  );
}
