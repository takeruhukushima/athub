"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth/session";

function readDidCookie(): string | null {
  if (typeof document === "undefined") return null;

  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith("did="));

  if (!entry) return null;

  const value = entry.slice("did=".length).trim();
  return value.length > 0 ? decodeURIComponent(value) : null;
}

export function AuthSessionSync() {
  const router = useRouter();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    async function syncSession() {
      try {
        const session = await getSession();
        const cookieDid = readDidCookie();

        if (session?.did && cookieDid !== session.did) {
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ did: session.did }),
          });

          if (response.ok) {
            router.refresh();
          }
          return;
        }

        if (!session && cookieDid) {
          const response = await fetch("/api/auth/session", {
            method: "DELETE",
          });

          if (response.ok) {
            router.refresh();
          }
        }
      } catch (error) {
        console.error("Failed to sync auth session:", error);
      }
    }

    void syncSession();
  }, [router]);

  return null;
}
