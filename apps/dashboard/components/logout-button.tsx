"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ callbackUrl = "/login" }: { callbackUrl?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl })}
      suppressHydrationWarning
      style={{ padding: "8px 16px", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}
    >
      Logout
    </button>
  );
}
