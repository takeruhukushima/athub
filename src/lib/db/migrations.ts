
import { Kysely, Migration, Migrator } from "kysely";
import { getDb } from ".";

const migrations: Record<string, Migration> = {
  "001": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("auth_state")
        .addColumn("key", "text", (col) => col.primaryKey())
        .addColumn("value", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("auth_session")
        .addColumn("key", "text", (col) => col.primaryKey())
        .addColumn("value", "text", (col) => col.notNull())
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("auth_session").execute();
      await db.schema.dropTable("auth_state").execute();
    },
  },
  "002": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("account")
        .addColumn("did", "text", (col) => col.primaryKey())
        .addColumn("handle", "text", (col) => col.notNull())
        .addColumn("active", "integer", (col) => col.notNull().defaultTo(1))
        .addColumn("indexedAt", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("quest_cache")
        .addColumn("uri", "text", (col) => col.primaryKey())
        .addColumn("did", "text", (col) => col.notNull())
        .addColumn("rkey", "text", (col) => col.notNull())
        .addColumn("cid", "text", (col) => col.notNull())
        .addColumn("name", "text", (col) => col.notNull())
        .addColumn("description", "text")
        .addColumn("topicsJson", "text", (col) => col.notNull().defaultTo("[]"))
        .addColumn("createdAt", "text", (col) => col.notNull())
        .addColumn("indexedAt", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createIndex("quest_cache_did_created_idx")
        .on("quest_cache")
        .columns(["did", "createdAt"])
        .execute();

      await db.schema
        .createTable("proposal_cache")
        .addColumn("uri", "text", (col) => col.primaryKey())
        .addColumn("did", "text", (col) => col.notNull())
        .addColumn("rkey", "text", (col) => col.notNull())
        .addColumn("cid", "text", (col) => col.notNull())
        .addColumn("questUri", "text", (col) => col.notNull())
        .addColumn("questCid", "text", (col) => col.notNull())
        .addColumn("title", "text", (col) => col.notNull())
        .addColumn("body", "text")
        .addColumn("state", "text", (col) => col.notNull())
        .addColumn("bskyThreadUri", "text")
        .addColumn("createdAt", "text", (col) => col.notNull())
        .addColumn("indexedAt", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createIndex("proposal_cache_quest_created_idx")
        .on("proposal_cache")
        .columns(["questUri", "createdAt"])
        .execute();

      await db.schema
        .createTable("contribution_cache")
        .addColumn("uri", "text", (col) => col.primaryKey())
        .addColumn("did", "text", (col) => col.notNull())
        .addColumn("rkey", "text", (col) => col.notNull())
        .addColumn("cid", "text", (col) => col.notNull())
        .addColumn("questUri", "text", (col) => col.notNull())
        .addColumn("questCid", "text", (col) => col.notNull())
        .addColumn("message", "text", (col) => col.notNull())
        .addColumn("body", "text")
        .addColumn("mediaJson", "text", (col) => col.notNull().defaultTo("[]"))
        .addColumn("createdAt", "text", (col) => col.notNull())
        .addColumn("indexedAt", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createIndex("contrib_cache_quest_created_idx")
        .on("contribution_cache")
        .columns(["questUri", "createdAt"])
        .execute();

      await db.schema
        .createIndex("contrib_cache_did_created_idx")
        .on("contribution_cache")
        .columns(["did", "createdAt"])
        .execute();

      await db.schema
        .createTable("badge_cache")
        .addColumn("uri", "text", (col) => col.primaryKey())
        .addColumn("did", "text", (col) => col.notNull())
        .addColumn("rkey", "text", (col) => col.notNull())
        .addColumn("cid", "text", (col) => col.notNull())
        .addColumn("subjectUri", "text", (col) => col.notNull())
        .addColumn("subjectCid", "text", (col) => col.notNull())
        .addColumn("badgeType", "text", (col) => col.notNull())
        .addColumn("comment", "text", (col) => col.notNull())
        .addColumn("createdAt", "text", (col) => col.notNull())
        .addColumn("indexedAt", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createIndex("badge_cache_subject_created_idx")
        .on("badge_cache")
        .columns(["subjectUri", "createdAt"])
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("badge_cache").execute();
      await db.schema.dropTable("contribution_cache").execute();
      await db.schema.dropTable("proposal_cache").execute();
      await db.schema.dropTable("quest_cache").execute();
      await db.schema.dropTable("account").execute();
      await db.schema.dropTable("auth_session").execute();
      await db.schema.dropTable("auth_state").execute();
    },
  },
};

export function getMigrator() {
  const db = getDb();
  return new Migrator({
    db,
    provider: {
      getMigrations: async () => migrations,
    },
  });
}
