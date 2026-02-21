import { NextRequest, NextResponse } from "next/server";
import { fetchBskyThreadSummary } from "@/lib/atproto/bsky";

export async function GET(request: NextRequest) {
  const uri = request.nextUrl.searchParams.get("uri")?.trim();

  if (!uri || !uri.startsWith("at://")) {
    return NextResponse.json(
      { error: "A valid at:// uri is required" },
      { status: 400 },
    );
  }

  const summary = await fetchBskyThreadSummary(uri);
  if (!summary) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json({ summary });
}
