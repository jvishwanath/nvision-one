import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { runMigrations } from "@/server/db/migrate";

const databaseUrl = process.env.DATABASE_URL ?? "./data/lifeos.db";
const dbDriver = process.env.DB_DRIVER ?? "sqlite";

if (dbDriver !== "sqlite") {
  throw new Error(
    `Unsupported DB_DRIVER: ${dbDriver}. Install and configure a postgres driver to enable postgres mode.`
  );
}

const sqlite = new Database(databaseUrl);
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);

if (process.env.NODE_ENV !== "test") {
  const journalPath = join(process.cwd(), "src/server/db/migrations/meta/_journal.json");
  if (existsSync(journalPath)) {
    runMigrations(db);
  }
}

export { sqlite };
