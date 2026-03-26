import { cookies } from "next/headers";
import type { OAuthSession } from "@atproto/oauth-client-browser";

export async function getSession(): Promise<OAuthSession | null> {
  // サーバーサイドではCookieからDIDを取得
  const cookieStore = await cookies();
  const did = cookieStore.get("did")?.value;
  if (!did) return null;

  // fetchHandlerは提供できないが、DIDのみを返す
  return { did } as OAuthSession;
}
