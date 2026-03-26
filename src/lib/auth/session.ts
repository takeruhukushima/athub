import { getOAuthClient } from "./client";
import type { OAuthSession } from "@atproto/oauth-client-browser";

export async function getSession(): Promise<OAuthSession | null> {
  if (typeof window === "undefined") return null;

  try {
    const client = getOAuthClient();
    const { session } = await client.init();
    return session || null;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const client = getOAuthClient();
    const { session } = await client.init();
    if (session) {
      await client.revoke(session.did);
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Cookieを削除
    document.cookie = "did=; path=/; max-age=0; samesite=lax";
  }
}
