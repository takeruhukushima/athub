
// DBレス設計のため、データベース接続を削除します。
// 型定義のみを残し、既存のコードがコンパイルエラーにならないようにします。

export interface DatabaseSchema {
  auth_state: AuthStateTable;
  auth_session: AuthSessionTable;
  account: AccountTable;
  quest_cache: QuestCacheTable;
  proposal_cache: ProposalCacheTable;
  contribution_cache: ContributionCacheTable;
  badge_cache: BadgeCacheTable;
}

export interface AuthStateTable {
  key: string;
  value: string;
}

export interface AuthSessionTable {
  key: string;
  value: string;
}

export interface AccountTable {
  did: string;
  handle: string;
  active: 0 | 1;
  indexedAt: string;
}

export interface QuestCacheTable {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  name: string;
  description: string | null;
  topicsJson: string;
  createdAt: string;
  indexedAt: string;
}

export interface ProposalCacheTable {
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
}

export interface ContributionCacheTable {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  questUri: string;
  questCid: string;
  message: string;
  body: string | null;
  mediaJson: string;
  createdAt: string;
  indexedAt: string;
}

export interface BadgeCacheTable {
  uri: string;
  did: string;
  rkey: string;
  cid: string;
  subjectUri: string;
  subjectCid: string;
  badgeType: "continuous" | "insightful" | "collaborator" | "brave";
  comment: string;
  createdAt: string;
  indexedAt: string;
}

// 互換性のためのスタブ
export const getDb = (): any => {
  throw new Error("Database is not available in DB-less mode.");
};
