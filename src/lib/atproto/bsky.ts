import { atUriToBskyWebUrl } from "@/lib/athub/uri";

export interface BskyThreadSummary {
  uri: string;
  text: string | null;
  authorHandle: string | null;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  webUrl: string | null;
}

export async function fetchBskyThreadSummary(
  uri: string,
): Promise<BskyThreadSummary | null> {
  const endpoint = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=1`;
  const response = await fetch(endpoint, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    thread?: {
      post?: {
        uri?: string;
        author?: { handle?: string };
        replyCount?: number;
        repostCount?: number;
        likeCount?: number;
        record?: { text?: string };
      };
    };
  };

  const post = data.thread?.post;
  if (!post?.uri) return null;

  return {
    uri: post.uri,
    text: post.record?.text ?? null,
    authorHandle: post.author?.handle ?? null,
    replyCount: post.replyCount ?? 0,
    repostCount: post.repostCount ?? 0,
    likeCount: post.likeCount ?? 0,
    webUrl: atUriToBskyWebUrl(post.uri),
  };
}
