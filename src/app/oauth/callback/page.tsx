"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOAuthClient } from "@/lib/auth/client";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function handleCallback() {
      try {
        const client = getOAuthClient();
        const { session } = await client.callback(searchParams);

        // SSRでもユーザー識別ができるようにDIDをCookieに保存
        document.cookie = `did=${session.did}; path=/; max-age=604800; samesite=lax`;

        router.push("/");
      } catch (error) {
        console.error("OAuth callback error:", error);
        router.push("/?error=login_failed");
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Signing you in...</h1>
        <p className="mt-2 text-stone-600">Please wait a moment.</p>
      </div>
    </div>
  );
}
