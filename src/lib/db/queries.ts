
import type { AccountTable, QuestCacheTable, ProposalCacheTable, ContributionCacheTable, BadgeCacheTable } from "@/lib/db";
import type { BadgeType, AthubCollection } from "@/lib/athub/collections";

// DBレス設計のため、全てのDB操作をスタブ化、またはXRPC経由の取得に置き換えます。

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

// 書き込み系: 何もしない
export async function upsertAccount(_data: AccountTable): Promise<void> {}
export async function deleteAccount(_did: string): Promise<void> {}
export async function upsertQuestCache(_data: QuestCacheTable): Promise<void> {}
export async function deleteQuestCache(_uri: string): Promise<void> {}
export async function upsertProposalCache(_data: ProposalCacheTable): Promise<void> {}
export async function deleteProposalCache(_uri: string): Promise<void> {}
export async function upsertContributionCache(_data: ContributionCacheTable): Promise<void> {}
export async function deleteContributionCache(_uri: string): Promise<void> {}
export async function upsertBadgeCache(_data: BadgeCacheTable): Promise<void> {}
export async function deleteBadgeCache(_uri: string): Promise<void> {}

// 読み取り系: 現時点では空のデータを返す。
// TODO: XRPC (ATProto) から直接データを取得するように実装を置き換える。

export async function listQuestsByDid(_did: string, _limit = 50): Promise<QuestView[]> {
  return [];
}

export async function listLatestQuests(_limit = 50): Promise<QuestView[]> {
  return [];
}

export async function getQuestByDidRkey(_did: string, _rkey: string): Promise<QuestView | null> {
  return null;
}

export async function getQuestByUri(_uri: string): Promise<QuestView | null> {
  return null;
}

export async function listProposalsByQuest(_questUri: string, _limit = 200): Promise<ProposalView[]> {
  return [];
}

export async function getProposalByUri(_uri: string): Promise<ProposalView | null> {
  return null;
}

export async function getProposalByDidRkey(_did: string, _rkey: string): Promise<ProposalView | null> {
  return null;
}

export async function listContributionsByQuest(_questUri: string, _limit = 300): Promise<ContributionView[]> {
  return [];
}

export async function listBadgesBySubject(_subjectUri: string): Promise<BadgeView[]> {
  return [];
}

export async function listBadgesBySubjects(_subjectUris: string[]): Promise<Record<string, BadgeView[]>> {
  return {};
}

export async function getStrongRefByUri(_uri: string): Promise<{ uri: string; cid: string } | null> {
  return null;
}

export async function getAccountHandleByDid(_did: string): Promise<string | null> {
  return null;
}

export async function getPinnedQuests(_did: string, _limit = 2): Promise<QuestView[]> {
  return [];
}

export async function getContributionHeatmap(_did: string, days = 30): Promise<Array<{ date: string; count: number }>> {
  const result: Array<{ date: string; count: number }> = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    result.push({ date: date.toISOString().slice(0, 10), count: 0 });
  }
  return result;
}

export async function getContributionCountLastDays(_did: string, days = 30): Promise<number> {
  return 0;
}

export async function getRecentActivity(_limit = 10): Promise<ActivityView[]> {
  return [];
}

export async function searchQuests(_keyword: string): Promise<QuestView[]> {
  return [];
}

export function getCollectionByUri(uri: string): AthubCollection | null {
  if (uri.includes("/app.athub.repo/")) return "app.athub.repo";
  if (uri.includes("/app.athub.issue/")) return "app.athub.issue";
  if (uri.includes("/app.athub.commit/")) return "app.athub.commit";
  if (uri.includes("/app.athub.award/")) return "app.athub.award";
  return null;
}
