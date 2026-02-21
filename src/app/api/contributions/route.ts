import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ATHUB_COLLECTIONS } from "@/lib/athub/collections";
import type { ContributionRecord } from "@/lib/athub/types";
import { createRecord, uploadBlob } from "@/lib/atproto/xrpc";
import {
  getQuestByUri,
  listContributionsByQuest,
  upsertContributionCache,
} from "@/lib/db/queries";
import { getRkeyFromUri } from "@/lib/athub/uri";

const ACCEPTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const questUri = request.nextUrl.searchParams.get("questUri")?.trim();
  if (!questUri) {
    return NextResponse.json({ error: "questUri is required" }, { status: 400 });
  }

  const contributions = await listContributionsByQuest(questUri);
  return NextResponse.json({ contributions });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const questUri = String(formData.get("questUri") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!questUri || !message) {
    return NextResponse.json(
      { error: "questUri and message are required" },
      { status: 400 },
    );
  }

  if (message.length > 300) {
    return NextResponse.json(
      { error: "Contribution message must be 300 characters or less" },
      { status: 400 },
    );
  }

  if (body.length > 3000) {
    return NextResponse.json(
      { error: "Contribution body must be 3000 characters or less" },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${file.name}` },
        { status: 400 },
      );
    }

    if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }
  }

  const quest = await getQuestByUri(questUri);
  if (!quest) {
    return NextResponse.json({ error: "Referenced quest not found" }, { status: 400 });
  }

  try {
    const media = [] as Array<{
      blob: unknown;
      mimeType: string;
      size: number;
      originalName: string;
    }>;

    for (const file of files) {
      const blob = await uploadBlob(session, file);
      media.push({
        blob,
        mimeType: file.type,
        size: file.size,
        originalName: file.name,
      });
    }

    const record: ContributionRecord = {
      repoRef: {
        uri: quest.uri,
        cid: quest.cid,
      },
      message,
      body: body || undefined,
      media,
      createdAt: new Date().toISOString(),
    };

    const created = await createRecord(session, ATHUB_COLLECTIONS.contribution, record);
    const rkey = getRkeyFromUri(created.uri);

    if (!rkey) {
      return NextResponse.json({ error: "Invalid AT URI returned" }, { status: 502 });
    }

    await upsertContributionCache({
      uri: created.uri,
      did: session.did,
      rkey,
      cid: created.cid,
      questUri: quest.uri,
      questCid: quest.cid,
      message: record.message,
      body: record.body ?? null,
      mediaJson: JSON.stringify(record.media ?? []),
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
    const messageText =
      error instanceof Error ? error.message : "Failed to create contribution";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
