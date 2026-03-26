import { BrowserOAuthClient } from "@atproto/oauth-client-browser";

export const SCOPE =
  "atproto repo:app.athub.repo repo:app.athub.issue repo:app.athub.commit repo:app.athub.award";

const PUBLIC_URL = process.env.NEXT_PUBLIC_URL || "http://127.0.0.1:3000";

export const clientMetadata = {
  client_name: "athub",
  client_id: `${PUBLIC_URL}/oauth-client-metadata.json`,
  client_uri: PUBLIC_URL,
  redirect_uris: [`${PUBLIC_URL}/oauth/callback`],
  scope: SCOPE,
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  application_type: "web",
  token_endpoint_auth_method: "none",
  dpop_bound_access_tokens: true,
};

let client: BrowserOAuthClient | null = null;

export function getOAuthClient(): BrowserOAuthClient {
  if (typeof window === "undefined") {
    throw new Error("getOAuthClient must be called on the client side");
  }

  if (client) return client;

  client = new BrowserOAuthClient({
    clientMetadata,
    handleResolver: "https://bsky.social",
  });

  return client;
}
