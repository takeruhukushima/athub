import { sql } from "kysely";
import {
  type AccountTable,
  type BadgeCacheTable,
  type ContributionCacheTable,
  getDb,
  type ProposalCacheTable,
  type QuestCacheTable,
} from "@/lib/db";
import type { BadgeType, AthubCollection } from "@/lib/athub/collections";

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    // noop
  }
  return [];
}

function parseMedia(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // noop
  }
  return [];
}

async function resolveHandleMap(dids: string[]): Promise<Map<string, string>> {
  const uniqueDids = Array.from(new Set(dids)).filter(Boolean);
  if (uniqueDids.length === 0) return new Map();

  const rows = await getDb()
    .selectFrom("account")
    .select(["did", "handle"])
    .where("did", "in", uniqueDids)
    .execute();

  return new Map(rows.map((row) => [row.did, row.handle]));
}

export interface QuestView {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  name: string;
  description: string | null;
  topics: string[];
  createdAt: string;
  indexedAt: string;
}

export interface ProposalView {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  questUri: string;
  questCid: string;
  title: string;
  body: string | null;
  state: "open" | "closed";
  bskyThreadUri: string | null;
  createdAt: string;
  indexedAt: string;
  handle: string | null;
}

export interface ContributionView {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  questUri: string;
  questCid: string;
  message: string;
  body: string | null;
  media: unknown[];
  createdAt: string;
  indexedAt: string;
  handle: string | null;
}

export interface BadgeView {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  subjectUri: string;
  subjectCid: string;
  badgeType: BadgeType;
  comment: string;
  createdAt: string;
  indexedAt: string;
  handle: string | null;
}

export interface ActivityView {
  type: "proposal" | "contribution" | "badge";
  uri: string;
  did: string;
  handle: string | null;
  createdAt: string;
  message: string;
}

export async function upsertAccount(data: AccountTable): Promise<void> {
  await getDb()
    .insertInto("account")
    .values(data)
    .onConflict((oc) =>
      oc.column("did").doUpdateSet({
        handle: data.handle,
        active: data.active,
        indexedAt: data.indexedAt,
      }),
    )
    .execute();
}

export async function deleteAccount(did: string): Promise<void> {
  await getDb().deleteFrom("account").where("did", "=", did).execute();
}

export async function upsertQuestCache(data: QuestCacheTable): Promise<void> {
  await getDb()
    .insertInto("quest_cache")
    .values(data)
    .onConflict((oc) =>
      oc.column("uri").doUpdateSet({
        did: data.did,
        rkey: data.rkey,
        cid: data.cid,
        name: data.name,
        description: data.description,
        topicsJson: data.topicsJson,
        createdAt: data.createdAt,
        indexedAt: data.indexedAt,
      }),
    )
    .execute();
}

export async function deleteQuestCache(uri: string): Promise<void> {
  await getDb().deleteFrom("quest_cache").where("uri", "=", uri).execute();
}

export async function upsertProposalCache(data: ProposalCacheTable): Promise<void> {
  await getDb()
    .insertInto("proposal_cache")
    .values(data)
    .onConflict((oc) =>
      oc.column("uri").doUpdateSet({
        did: data.did,
        rkey: data.rkey,
        cid: data.cid,
        questUri: data.questUri,
        questCid: data.questCid,
        title: data.title,
        body: data.body,
        state: data.state,
        bskyThreadUri: data.bskyThreadUri,
        createdAt: data.createdAt,
        indexedAt: data.indexedAt,
      }),
    )
    .execute();
}

export async function deleteProposalCache(uri: string): Promise<void> {
  await getDb().deleteFrom("proposal_cache").where("uri", "=", uri).execute();
}

export async function upsertContributionCache(
  data: ContributionCacheTable,
): Promise<void> {
  await getDb()
    .insertInto("contribution_cache")
    .values(data)
    .onConflict((oc) =>
      oc.column("uri").doUpdateSet({
        did: data.did,
        rkey: data.rkey,
        cid: data.cid,
        questUri: data.questUri,
        questCid: data.questCid,
        message: data.message,
        body: data.body,
        mediaJson: data.mediaJson,
        createdAt: data.createdAt,
        indexedAt: data.indexedAt,
      }),
    )
    .execute();
}

export async function deleteContributionCache(uri: string): Promise<void> {
  await getDb()
    .deleteFrom("contribution_cache")
    .where("uri", "=", uri)
    .execute();
}

export async function upsertBadgeCache(data: BadgeCacheTable): Promise<void> {
  await getDb()
    .insertInto("badge_cache")
    .values(data)
    .onConflict((oc) =>
      oc.column("uri").doUpdateSet({
        did: data.did,
        rkey: data.rkey,
        cid: data.cid,
        subjectUri: data.subjectUri,
        subjectCid: data.subjectCid,
        badgeType: data.badgeType,
        comment: data.comment,
        createdAt: data.createdAt,
        indexedAt: data.indexedAt,
      }),
    )
    .execute();
}

export async function deleteBadgeCache(uri: string): Promise<void> {
  await getDb().deleteFrom("badge_cache").where("uri", "=", uri).execute();
}

export async function listQuestsByDid(
  did: string,
  limit = 50,
): Promise<QuestView[]> {
  const rows = await getDb()
    .selectFrom("quest_cache")
    .selectAll()
    .where("did", "=", did)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .execute();

  return rows.map((row) => ({
    ...row,
    topics: parseJsonArray(row.topicsJson),
  }));
}

export async function listLatestQuests(limit = 50): Promise<QuestView[]> {
  const rows = await getDb()
    .selectFrom("quest_cache")
    .selectAll()
    .orderBy("createdAt", "desc")
    .limit(limit)
    .execute();

  return rows.map((row) => ({
    ...row,
    topics: parseJsonArray(row.topicsJson),
  }));
}

export async function getQuestByDidRkey(
  did: string,
  rkey: string,
): Promise<QuestView | null> {
  const row = await getDb()
    .selectFrom("quest_cache")
    .selectAll()
    .where("did", "=", did)
    .where("rkey", "=", rkey)
    .executeTakeFirst();

  if (!row) return null;
  return {
    ...row,
    topics: parseJsonArray(row.topicsJson),
  };
}

export async function getQuestByUri(uri: string): Promise<QuestView | null> {
  const row = await getDb()
    .selectFrom("quest_cache")
    .selectAll()
    .where("uri", "=", uri)
    .executeTakeFirst();

  if (!row) return null;

  return {
    ...row,
    topics: parseJsonArray(row.topicsJson),
  };
}

export async function listProposalsByQuest(
  questUri: string,
  limit = 200,
): Promise<ProposalView[]> {
  const rows = await getDb()
    .selectFrom("proposal_cache")
    .selectAll()
    .where("questUri", "=", questUri)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .execute();

  const handleMap = await resolveHandleMap(rows.map((row) => row.did));

  return rows.map((row) => ({
    ...row,
    handle: handleMap.get(row.did) ?? null,
  }));
}

export async function getProposalByUri(uri: string): Promise<ProposalView | null> {
  const row = await getDb()
    .selectFrom("proposal_cache")
    .selectAll()
    .where("uri", "=", uri)
    .executeTakeFirst();

  if (!row) return null;

  const handleMap = await resolveHandleMap([row.did]);

  return {
    ...row,
    handle: handleMap.get(row.did) ?? null,
  };
}

export async function getProposalByDidRkey(
  did: string,
  rkey: string,
): Promise<ProposalView | null> {
  const row = await getDb()
    .selectFrom("proposal_cache")
    .selectAll()
    .where("did", "=", did)
    .where("rkey", "=", rkey)
    .executeTakeFirst();

  if (!row) return null;

  const handleMap = await resolveHandleMap([row.did]);

  return {
    ...row,
    handle: handleMap.get(row.did) ?? null,
  };
}

export async function listContributionsByQuest(
  questUri: string,
  limit = 300,
): Promise<ContributionView[]> {
  const rows = await getDb()
    .selectFrom("contribution_cache")
    .selectAll()
    .where("questUri", "=", questUri)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .execute();

  const handleMap = await resolveHandleMap(rows.map((row) => row.did));

  return rows.map((row) => ({
    ...row,
    media: parseMedia(row.mediaJson),
    handle: handleMap.get(row.did) ?? null,
  }));
}

export async function listBadgesBySubject(subjectUri: string): Promise<BadgeView[]> {
  const rows = await getDb()
    .selectFrom("badge_cache")
    .selectAll()
    .where("subjectUri", "=", subjectUri)
    .orderBy("createdAt", "desc")
    .execute();

  const handleMap = await resolveHandleMap(rows.map((row) => row.did));

  return rows.map((row) => ({
    ...row,
    handle: handleMap.get(row.did) ?? null,
  }));
}

export async function listBadgesBySubjects(
  subjectUris: string[],
): Promise<Record<string, BadgeView[]>> {
  if (subjectUris.length === 0) return {};

  const rows = await getDb()
    .selectFrom("badge_cache")
    .selectAll()
    .where("subjectUri", "in", subjectUris)
    .orderBy("createdAt", "desc")
    .execute();

  const handleMap = await resolveHandleMap(rows.map((row) => row.did));
  const grouped: Record<string, BadgeView[]> = {};

  for (const row of rows) {
    const subjectUri = row.subjectUri;
    grouped[subjectUri] ??= [];
    grouped[subjectUri].push({
      ...row,
      handle: handleMap.get(row.did) ?? null,
    });
  }

  return grouped;
}

export async function getStrongRefByUri(
  uri: string,
): Promise<{ uri: string; cid: string } | null> {
  const [quest, proposal, contribution] = await Promise.all([
    getDb()
      .selectFrom("quest_cache")
      .select(["uri", "cid"])
      .where("uri", "=", uri)
      .executeTakeFirst(),
    getDb()
      .selectFrom("proposal_cache")
      .select(["uri", "cid"])
      .where("uri", "=", uri)
      .executeTakeFirst(),
    getDb()
      .selectFrom("contribution_cache")
      .select(["uri", "cid"])
      .where("uri", "=", uri)
      .executeTakeFirst(),
  ]);

  return quest ?? proposal ?? contribution ?? null;
}

export async function getAccountHandleByDid(did: string): Promise<string | null> {
  const row = await getDb()
    .selectFrom("account")
    .select("handle")
    .where("did", "=", did)
    .executeTakeFirst();

  return row?.handle ?? null;
}

export async function getPinnedQuests(
  did: string,
  limit = 2,
): Promise<QuestView[]> {
  return listQuestsByDid(did, limit);
}

export async function getContributionHeatmap(
  did: string,
  days = 30,
): Promise<Array<{ date: string; count: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  const startIso = startDate.toISOString();

  const rows = await getDb()
    .selectFrom("contribution_cache")
    .select(["createdAt"])
    .where("did", "=", did)
    .where("createdAt", ">=", startIso)
    .execute();

  const countMap = new Map<string, number>();
  for (const row of rows) {
    const key = row.createdAt.slice(0, 10);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const result: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    result.push({
      date: key,
      count: countMap.get(key) ?? 0,
    });
  }

  return result;
}

export async function getContributionCountLastDays(
  did: string,
  days = 30,
): Promise<number> {
  const heatmap = await getContributionHeatmap(did, days);
  return heatmap.reduce((sum, day) => sum + day.count, 0);
}

export async function getRecentActivity(limit = 10): Promise<ActivityView[]> {
  const db = getDb();

  const [proposals, contributions, badges] = await Promise.all([
    db.selectFrom("proposal_cache")
      .select(["uri", "did", "title", "createdAt"])
      .orderBy("createdAt", "desc")
      .limit(limit)
      .execute(),
    db.selectFrom("contribution_cache")
      .select(["uri", "did", "message", "createdAt"])
      .orderBy("createdAt", "desc")
      .limit(limit)
      .execute(),
    db.selectFrom("badge_cache")
      .select(["uri", "did", "comment", "createdAt"])
      .orderBy("createdAt", "desc")
      .limit(limit)
      .execute(),
  ]);

  const dids = [
    ...proposals.map((row) => row.did),
    ...contributions.map((row) => row.did),
    ...badges.map((row) => row.did),
  ];
  const handleMap = await resolveHandleMap(dids);

  const activities: ActivityView[] = [
    ...proposals.map((row) => ({
      type: "proposal" as const,
      uri: row.uri,
      did: row.did,
      handle: handleMap.get(row.did) ?? null,
      createdAt: row.createdAt,
      message: `opened proposal: ${row.title}`,
    })),
    ...contributions.map((row) => ({
      type: "contribution" as const,
      uri: row.uri,
      did: row.did,
      handle: handleMap.get(row.did) ?? null,
      createdAt: row.createdAt,
      message: `contributed: ${row.message}`,
    })),
    ...badges.map((row) => ({
      type: "badge" as const,
      uri: row.uri,
      did: row.did,
      handle: handleMap.get(row.did) ?? null,
      createdAt: row.createdAt,
      message: `sent a badge: ${row.comment}`,
    })),
  ];

  activities.sort((a, b) =>
    a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0,
  );

  return activities.slice(0, limit);
}

export async function searchQuests(keyword: string): Promise<QuestView[]> {
  const term = `%${keyword.trim()}%`;
  if (keyword.trim().length === 0) return [];

  const rows = await getDb()
    .selectFrom("quest_cache")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("name", "like", term),
        eb("description", "like", term),
        sql<boolean>`topicsJson LIKE ${term}`,
      ]),
    )
    .orderBy("createdAt", "desc")
    .limit(30)
    .execute();

  return rows.map((row) => ({
    ...row,
    topics: parseJsonArray(row.topicsJson),
  }));
}

export function getCollectionByUri(uri: string): AthubCollection | null {
  if (uri.includes("/app.athub.repo/")) return "app.athub.repo";
  if (uri.includes("/app.athub.issue/")) return "app.athub.issue";
  if (uri.includes("/app.athub.commit/")) return "app.athub.commit";
  if (uri.includes("/app.athub.award/")) return "app.athub.award";
  return null;
}
