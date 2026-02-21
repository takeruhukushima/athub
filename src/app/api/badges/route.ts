import { NextRequest, NextResponse } from "next/server";
import { ATHUB_COLLECTIONS, isBadgeType } from "@/lib/athub/collections";
import type { BadgeRecord } from "@/lib/athub/types";
import { getSession } from "@/lib/auth/session";
import { createRecord } from "@/lib/atproto/xrpc";
import {
  getStrongRefByUri,
  listBadgesBySubject,
  upsertBadgeCache,
} from "@/lib/db/queries";
import { getRkeyFromUri } from "@/lib/athub/uri";

export async function GET(request: NextRequest) {
  const subjectUri = request.nextUrl.searchParams.get("subjectUri")?.trim();
  if (!subjectUri) {
    return NextResponse.json({ error: "subjectUri is required" }, { status: 400 });
  }

  const badges = await listBadgesBySubject(subjectUri);
  return NextResponse.json({ badges });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    subjectUri?: string;
    badgeType?: string;
    comment?: string;
  };

  const subjectUri = body.subjectUri?.trim();
  const badgeType = body.badgeType?.trim();
  const comment = body.comment?.trim();

  if (!subjectUri || !badgeType || !comment) {
    return NextResponse.json(
      { error: "subjectUri, badgeType and comment are required" },
      { status: 400 },
    );
  }

  if (!isBadgeType(badgeType)) {
    return NextResponse.json({ error: "Invalid badge type" }, { status: 400 });
  }

  if (comment.length > 300) {
    return NextResponse.json(
      { error: "Badge comment must be 300 characters or less" },
      { status: 400 },
    );
  }

  const subject = await getStrongRefByUri(subjectUri);
  if (!subject) {
    return NextResponse.json({ error: "Referenced subject not found" }, { status: 400 });
  }

  const record: BadgeRecord = {
    subject,
    badgeType,
    comment,
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await createRecord(session, ATHUB_COLLECTIONS.badge, record);
    const rkey = getRkeyFromUri(created.uri);

    if (!rkey) {
      return NextResponse.json({ error: "Invalid AT URI returned" }, { status: 502 });
    }

    await upsertBadgeCache({
      uri: created.uri,
      did: session.did,
      rkey,
      cid: created.cid,
      subjectUri: subject.uri,
      subjectCid: subject.cid,
      badgeType,
      comment,
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
    const message = error instanceof Error ? error.message : "Failed to create badge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
