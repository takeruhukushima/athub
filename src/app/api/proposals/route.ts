import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ATHUB_COLLECTIONS } from "@/lib/athub/collections";
import type { ProposalRecord } from "@/lib/athub/types";
import { createRecord } from "@/lib/atproto/xrpc";
import {
  getQuestByUri,
  listProposalsByQuest,
  upsertProposalCache,
} from "@/lib/db/queries";
import { getRkeyFromUri } from "@/lib/athub/uri";

export async function GET(request: NextRequest) {
  const questUri = request.nextUrl.searchParams.get("questUri")?.trim();
  if (!questUri) {
    return NextResponse.json({ error: "questUri is required" }, { status: 400 });
  }

  const proposals = await listProposalsByQuest(questUri);
  return NextResponse.json({ proposals });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    questUri?: string;
    title?: string;
    body?: string;
    bskyThreadUri?: string;
  };

  const questUri = body.questUri?.trim();
  const title = body.title?.trim();
  const proposalBody = body.body?.trim();
  const bskyThreadUri = body.bskyThreadUri?.trim();

  if (!questUri || !title) {
    return NextResponse.json(
      { error: "questUri and title are required" },
      { status: 400 },
    );
  }

  if (title.length > 100) {
    return NextResponse.json(
      { error: "Proposal title must be 100 characters or less" },
      { status: 400 },
    );
  }

  if (proposalBody && proposalBody.length > 3000) {
    return NextResponse.json(
      { error: "Proposal body must be 3000 characters or less" },
      { status: 400 },
    );
  }

  const quest = await getQuestByUri(questUri);
  if (!quest) {
    return NextResponse.json({ error: "Referenced quest not found" }, { status: 400 });
  }

  const record: ProposalRecord = {
    repoRef: {
      uri: quest.uri,
      cid: quest.cid,
    },
    title,
    body: proposalBody || undefined,
    state: "open",
    bskyThreadUri: bskyThreadUri || undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await createRecord(session, ATHUB_COLLECTIONS.proposal, record);
    const rkey = getRkeyFromUri(created.uri);

    if (!rkey) {
      return NextResponse.json({ error: "Invalid AT URI returned" }, { status: 502 });
    }

    await upsertProposalCache({
      uri: created.uri,
      did: session.did,
      rkey,
      cid: created.cid,
      questUri: quest.uri,
      questCid: quest.cid,
      title: record.title,
      body: record.body ?? null,
      state: record.state,
      bskyThreadUri: record.bskyThreadUri ?? null,
      createdAt: record.createdAt,
      indexedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      uri: created.uri,
      cid: created.cid,
      rkey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
