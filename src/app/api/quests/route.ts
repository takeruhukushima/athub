import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ATHUB_COLLECTIONS } from "@/lib/athub/collections";
import type { QuestRecord } from "@/lib/athub/types";
import { createRecord, describeRepo } from "@/lib/atproto/xrpc";
import {
  listLatestQuests,
  listQuestsByDid,
  searchQuests,
  upsertAccount,
  upsertQuestCache,
} from "@/lib/db/queries";
import { getRkeyFromUri } from "@/lib/athub/uri";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const mine = request.nextUrl.searchParams.get("mine");

  if (q) {
    const quests = await searchQuests(q);
    return NextResponse.json({ quests });
  }

  if (mine === "1") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quests = await listQuestsByDid(session.did);
    return NextResponse.json({ quests });
  }

  const quests = await listLatestQuests();
  return NextResponse.json({ quests });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    topics?: string[];
  };

  const name = body.name?.trim();
  const description = body.description?.trim();
  const topics = Array.isArray(body.topics)
    ? body.topics
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 12)
    : [];

  if (!name) {
    return NextResponse.json({ error: "Quest name is required" }, { status: 400 });
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: "Quest name must be 100 characters or less" },
      { status: 400 },
    );
  }

  const record: QuestRecord = {
    name,
    description: description || undefined,
    topics,
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await createRecord(session, ATHUB_COLLECTIONS.quest, record);
    const rkey = getRkeyFromUri(created.uri);

    if (!rkey) {
      return NextResponse.json({ error: "Invalid AT URI returned" }, { status: 502 });
    }

    await upsertQuestCache({
      uri: created.uri,
      did: session.did,
      rkey,
      cid: created.cid,
      name: record.name,
      description: record.description ?? null,
      topicsJson: JSON.stringify(record.topics ?? []),
      createdAt: record.createdAt,
      indexedAt: new Date().toISOString(),
    });

    try {
      const repo = await describeRepo(session, session.did);
      if (repo.handle) {
        await upsertAccount({
          did: session.did,
          handle: repo.handle,
          active: 1,
          indexedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Handle resolution failure should not block quest creation.
    }

    return NextResponse.json({
      success: true,
      uri: created.uri,
      cid: created.cid,
      rkey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create quest";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
