import type { AthubCollection } from "./collections";

const AT_URI_RE = /^at:\/\/([^/]+)\/([^/]+)\/([^/?#]+)$/;

export function parseAtUri(uri: string): {
  did: string;
  collection: string;
  rkey: string;
} | null {
  const match = AT_URI_RE.exec(uri);
  if (!match) return null;

  return {
    did: match[1],
    collection: match[2],
    rkey: match[3],
  };
}

export function buildAtUri(
  did: string,
  collection: AthubCollection,
  rkey: string,
): string {
  return `at://${did}/${collection}/${rkey}`;
}

export function getRkeyFromUri(uri: string): string | null {
  return parseAtUri(uri)?.rkey ?? null;
}

export function atUriToBskyWebUrl(uri: string): string | null {
  const parsed = parseAtUri(uri);
  if (!parsed) return null;
  return `https://bsky.app/profile/${parsed.did}/post/${parsed.rkey}`;
}
