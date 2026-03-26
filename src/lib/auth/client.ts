import { BrowserOAuthClient } from "@atproto/oauth-client-browser";

export const SCOPE =
  "atproto repo:app.athub.repo repo:app.athub.issue repo:app.athub.commit repo:app.athub.award";

const PUBLIC_URL =
  process.env.NEXT_PUBLIC_URL ||
  process.env.PUBLIC_URL ||
  "http://127.0.0.1:3000";

export const clientMetadata = {
  client_name: "athub",
  client_id: `${PUBLIC_URL}/oauth-client-metadata.json`,
  client_uri: PUBLIC_URL,
  redirect_uris: [`${PUBLIC_URL}/oauth/callback`] as [string, ...string[]],
  scope: SCOPE,
  grant_types: ["authorization_code", "refresh_token"] as [
    "authorization_code",
    "refresh_token",
  ],
  response_types: ["code"] as ["code"],
  application_type: "web" as const,
  token_endpoint_auth_method: "none" as const,
  dpop_bound_access_tokens: true,
};

let client: BrowserOAuthClient | null = null;

export function getOAuthClient(): BrowserOAuthClient {
  if (typeof window === "undefined") {
    throw new Error("getOAuthClient must be called on the client side");
  }

  if (client) return client;

  const isLoopback =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  client = new BrowserOAuthClient({
    // Only provide clientMetadata if NOT on loopback.
    // On loopback, the library will use atprotoLoopbackClientMetadata automatically.
    ...(isLoopback ? {} : { clientMetadata }),
    handleResolver: "https://bsky.social",
  });

  return client;
}
