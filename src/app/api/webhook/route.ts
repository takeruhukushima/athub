import { NextRequest, NextResponse } from "next/server";
import {
  ATHUB_COLLECTIONS,
  isAthubCollection,
  type AthubCollection,
} from "@/lib/athub/collections";
import { buildAtUri } from "@/lib/athub/uri";
import {
  parseBadgeRecord,
  parseContributionRecord,
  parseProposalRecord,
  parseQuestRecord,
} from "@/lib/athub/parsers";
import {
  deleteAccount,
  deleteBadgeCache,
  deleteContributionCache,
  deleteProposalCache,
  deleteQuestCache,
  upsertAccount,
  upsertBadgeCache,
  upsertContributionCache,
  upsertProposalCache,
  upsertQuestCache,
} from "@/lib/db/queries";

const TAP_ADMIN_PASSWORD = process.env.TAP_ADMIN_PASSWORD;

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function isAuthorizedTapRequest(
  authHeader: string | null,
  password: string,
): boolean {
  if (!authHeader) return false;

  if (authHeader === `Bearer ${password}`) {
    return true;
  }

  if (authHeader.startsWith("Basic ")) {
    const encoded = authHeader.slice("Basic ".length).trim();
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const maybePassword = decoded.includes(":")
        ? decoded.split(":").slice(1).join(":")
        : decoded;
      return maybePassword === password;
    } catch {
      return false;
    }
  }

  return false;
}

function getEventUri(
  did: string,
  collection: AthubCollection,
  rkey: string,
  rawUri: unknown,
): string {
  const uri = asString(rawUri);
  return uri || buildAtUri(did, collection, rkey);
}

async function handleRecordUpsert(
  did: string,
  collection: AthubCollection,
  rkey: string,
  cid: string,
  record: unknown,
  uriRaw: unknown,
): Promise<void> {
  const indexedAt = new Date().toISOString();
  const uri = getEventUri(did, collection, rkey, uriRaw);

  if (collection === ATHUB_COLLECTIONS.quest) {
    const parsed = parseQuestRecord(record);
    if (!parsed) return;

    await upsertQuestCache({
      uri,
      did,
      rkey,
      cid,
      name: parsed.name,
      description: parsed.description ?? null,
      topicsJson: JSON.stringify(parsed.topics ?? []),
      createdAt: parsed.createdAt,
      indexedAt,
    });
    return;
  }

  if (collection === ATHUB_COLLECTIONS.proposal) {
    const parsed = parseProposalRecord(record);
    if (!parsed) return;

    await upsertProposalCache({
      uri,
      did,
      rkey,
      cid,
      questUri: parsed.repoRef.uri,
      questCid: parsed.repoRef.cid,
      title: parsed.title,
      body: parsed.body ?? null,
      state: parsed.state,
      bskyThreadUri: parsed.bskyThreadUri ?? null,
      createdAt: parsed.createdAt,
      indexedAt,
    });
    return;
  }

  if (collection === ATHUB_COLLECTIONS.contribution) {
    const parsed = parseContributionRecord(record);
    if (!parsed) return;

    await upsertContributionCache({
      uri,
      did,
      rkey,
      cid,
      questUri: parsed.repoRef.uri,
      questCid: parsed.repoRef.cid,
      message: parsed.message,
      body: parsed.body ?? null,
      mediaJson: JSON.stringify(parsed.media ?? []),
      createdAt: parsed.createdAt,
      indexedAt,
    });
    return;
  }

  const parsed = parseBadgeRecord(record);
  if (!parsed) return;

  await upsertBadgeCache({
    uri,
    did,
    rkey,
    cid,
    subjectUri: parsed.subject.uri,
    subjectCid: parsed.subject.cid,
    badgeType: parsed.badgeType,
    comment: parsed.comment,
    createdAt: parsed.createdAt,
    indexedAt,
  });
}

async function handleRecordDelete(
  did: string,
  collection: AthubCollection,
  rkey: string,
  rawUri: unknown,
): Promise<void> {
  const uri = getEventUri(did, collection, rkey, rawUri);

  if (collection === ATHUB_COLLECTIONS.quest) {
    await deleteQuestCache(uri);
    return;
  }

  if (collection === ATHUB_COLLECTIONS.proposal) {
    await deleteProposalCache(uri);
    return;
  }

  if (collection === ATHUB_COLLECTIONS.contribution) {
    await deleteContributionCache(uri);
    return;
  }

  await deleteBadgeCache(uri);
}

export async function POST(request: NextRequest) {
  if (TAP_ADMIN_PASSWORD) {
    const authHeader = request.headers.get("authorization");
    if (!isAuthorizedTapRequest(authHeader, TAP_ADMIN_PASSWORD)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = asObject(payload);
  if (!event) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type === "identity") {
    const did = asString(event.did);
    if (!did) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    if (event.status === "deleted") {
      await deleteAccount(did);
      return NextResponse.json({ success: true });
    }

    const handle = asString(event.handle) ?? did;
    const isActive = asBoolean(event.isActive);

    await upsertAccount({
      did,
      handle,
      active: isActive === false ? 0 : 1,
      indexedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  }

  if (event.type === "record") {
    const did = asString(event.did);
    const collection = asString(event.collection);
    const rkey = asString(event.rkey);
    const action = asString(event.action);

    if (!did || !collection || !rkey || !action || !isAthubCollection(collection)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    if (action === "delete") {
      await handleRecordDelete(did, collection, rkey, event.uri);
      return NextResponse.json({ success: true });
    }

    if (action === "create" || action === "update") {
      await handleRecordUpsert(
        did,
        collection,
        rkey,
        asString(event.cid) ?? "unknown",
        event.record,
        event.uri,
      );
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ success: true });
}
