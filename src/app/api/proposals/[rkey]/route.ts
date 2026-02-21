import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ATHUB_COLLECTIONS } from "@/lib/athub/collections";
import { putRecord } from "@/lib/atproto/xrpc";
import {
  getProposalByDidRkey,
  upsertProposalCache,
} from "@/lib/db/queries";
import type { ProposalRecord } from "@/lib/athub/types";

type Context = {
  params: Promise<{
    rkey: string;
  }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rkey } = await context.params;
  const current = await getProposalByDidRkey(session.did, rkey);
  if (!current) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    state?: string;
  };

  const nextState = body.state;
  if (nextState !== "open" && nextState !== "closed") {
    return NextResponse.json(
      { error: "state must be open or closed" },
      { status: 400 },
    );
  }

  const record: ProposalRecord = {
    repoRef: { uri: current.questUri, cid: current.questCid },
    title: current.title,
    body: current.body ?? undefined,
    state: nextState,
    bskyThreadUri: current.bskyThreadUri ?? undefined,
    createdAt: current.createdAt,
  };

  try {
    const updated = await putRecord(session, ATHUB_COLLECTIONS.proposal, rkey, record);

    await upsertProposalCache({
      uri: updated.uri,
      did: current.did,
      rkey: current.rkey,
      cid: updated.cid,
      questUri: current.questUri,
      questCid: current.questCid,
      title: current.title,
      body: current.body,
      state: nextState,
      bskyThreadUri: current.bskyThreadUri,
      createdAt: current.createdAt,
      indexedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uri: updated.uri, cid: updated.cid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
