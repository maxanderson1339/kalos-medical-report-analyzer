"use client";

import { useState } from "react";

export function ScanUpload({ memberId }: { memberId: string }) {
  const [status, setStatus] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("memberId", memberId);

    setStatus("Uploading...");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    setStatus(json.message || "Done");
    if (res.ok) window.location.reload();
  }

  return (
    <div>
      <label style={{ display: "inline-block", padding: "8px 16px", backgroundColor: "#2563eb", color: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
        Upload DEXA PDF
        <input type="file" accept="application/pdf" onChange={onChange} style={{ display: "none" }} />
      </label>
      {status && <span style={{ marginLeft: "12px", fontSize: "13px", color: "#555" }}>{status}</span>}
    </div>
  );
}
