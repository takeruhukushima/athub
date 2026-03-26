import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import fs from "fs";
import path from "path";

const DATABASE_PATH = process.env.DATABASE_PATH || "app.db";

let _db: Kysely<DatabaseSchema> | null = null;

export const getDb = (): Kysely<DatabaseSchema> => {
  if (!_db) {
    let sqlite: Database.Database;
    try {
      // Vercel environment check
      const isVercel = !!process.env.VERCEL;
      const dbPath = isVercel
        ? path.join("/tmp", path.basename(DATABASE_PATH))
        : DATABASE_PATH;

      if (isVercel && !fs.existsSync(dbPath)) {
        const sourcePath = path.resolve(process.cwd(), DATABASE_PATH);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, dbPath);
        } else {
          // If no source DB, just create an empty one in /tmp
          console.warn("No source database found at", sourcePath);
        }
      }

      sqlite = new Database(dbPath);
      sqlite.pragma("journal_mode = WAL");
    } catch (e) {
      console.error("Failed to initialize database:", e);
      // Fallback to in-memory database if file system is completely unavailable
      sqlite = new Database(":memory:");
    }

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
