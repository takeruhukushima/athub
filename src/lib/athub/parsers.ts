import type {
  BadgeRecord,
  ContributionRecord,
  ProposalRecord,
  QuestRecord,
  StrongRef,
} from "@/lib/athub/types";
import { isBadgeType } from "@/lib/athub/collections";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseStrongRef(value: unknown): StrongRef | null {
  const obj = asRecord(value);
  if (!obj) return null;

  const uri = asString(obj.uri);
  const cid = asString(obj.cid);
  if (!uri || !cid) return null;

  return { uri, cid };
}

export function parseQuestRecord(value: unknown): QuestRecord | null {
  const obj = asRecord(value);
  if (!obj) return null;

  const name = asString(obj.name);
  const createdAt = asString(obj.createdAt);
  if (!name || !createdAt) return null;

  const description = asString(obj.description) ?? undefined;
  const topicsRaw = obj.topics;
  const topics =
    Array.isArray(topicsRaw) && topicsRaw.every((v) => typeof v === "string")
      ? (topicsRaw as string[])
      : undefined;

  return { name, description, topics, createdAt };
}

export function parseProposalRecord(value: unknown): ProposalRecord | null {
  const obj = asRecord(value);
  if (!obj) return null;

  const repoRef = parseStrongRef(obj.repoRef);
  const title = asString(obj.title);
  const state = asString(obj.state);
  const createdAt = asString(obj.createdAt);

  if (!repoRef || !title || !createdAt) return null;
  if (state !== "open" && state !== "closed") return null;

  const body = asString(obj.body) ?? undefined;
  const bskyThreadUri = asString(obj.bskyThreadUri) ?? undefined;

  return {
    repoRef,
    title,
    body,
    state,
    bskyThreadUri,
    createdAt,
  };
}

export function parseContributionRecord(value: unknown): ContributionRecord | null {
  const obj = asRecord(value);
  if (!obj) return null;

  const repoRef = parseStrongRef(obj.repoRef);
  const message = asString(obj.message);
  const createdAt = asString(obj.createdAt);

  if (!repoRef || !message || !createdAt) return null;

  const body = asString(obj.body) ?? undefined;
  const mediaRaw = obj.media;
  const media = Array.isArray(mediaRaw)
    ? mediaRaw
        .map((item) => {
          const entry = asRecord(item);
          if (!entry) return null;

          const mimeType = asString(entry.mimeType);
          const size = typeof entry.size === "number" ? entry.size : null;
          if (!mimeType || size === null) return null;

          return {
            blob: entry.blob,
            mimeType,
            size,
            originalName: asString(entry.originalName) ?? undefined,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
    : undefined;

  return {
    repoRef,
    message,
    body,
    media,
    createdAt,
  };
}

export function parseBadgeRecord(value: unknown): BadgeRecord | null {
  const obj = asRecord(value);
  if (!obj) return null;

  const subject = parseStrongRef(obj.subject);
  const badgeType = asString(obj.badgeType);
  const comment = asString(obj.comment);
  const createdAt = asString(obj.createdAt);

  if (!subject || !badgeType || !comment || !createdAt) return null;
  if (!isBadgeType(badgeType)) return null;

  return {
    subject,
    badgeType,
    comment,
    createdAt,
  };
}
