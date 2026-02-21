
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const DATABASE_PATH = process.env.DATABASE_PATH || "app.db";

let _db: Kysely<DatabaseSchema> | null = null;

export const getDb = (): Kysely<DatabaseSchema> => {
  if (!_db) {
    const sqlite = new Database(DATABASE_PATH);
    sqlite.pragma("journal_mode = WAL");

    _db = new Kysely<DatabaseSchema>({
      dialect: new SqliteDialect({ database: sqlite }),
    });
  }
  return _db;
};

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
