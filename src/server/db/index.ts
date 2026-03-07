import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { runMigrations } from "@/server/db/migrate";

const databaseUrl = process.env.DATABASE_URL ?? "./data/lifeos.db";
const dbDriver = process.env.DB_DRIVER ?? "sqlite";
const createSqlite = (path: string) => new Database(path);

if (dbDriver !== "sqlite" && dbDriver !== "postgres") {
  throw new Error(
    `Unsupported DB_DRIVER: ${dbDriver}. Supported values are sqlite and postgres.`
  );
}

const isPostgres = dbDriver === "postgres";
let sqlite: ReturnType<typeof createSqlite> | undefined;
let db: any;
let migrationDb: BetterSQLite3Database | NodePgDatabase;

if (isPostgres) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });
  const pgDb = drizzlePg(pool);
  db = pgDb;
  migrationDb = pgDb;
} else {
  if (!databaseUrl.startsWith("file:") && !databaseUrl.includes("://")) {
    mkdirSync(dirname(databaseUrl), { recursive: true });
  }
  sqlite = createSqlite(databaseUrl);
  const sqliteDb = sqlite;
  sqliteDb.pragma("foreign_keys = ON");
  const sqliteDrizzle = drizzle(sqliteDb);
  db = sqliteDrizzle;
  migrationDb = sqliteDrizzle;
}

if (process.env.NODE_ENV !== "test" && process.env.SKIP_STARTUP_MIGRATIONS !== "1") {
  const journalPath = isPostgres
    ? join(process.cwd(), "src/server/db/migrations-pg/meta/_journal.json")
    : join(process.cwd(), "src/server/db/migrations/meta/_journal.json");

  if (existsSync(journalPath)) {
    void runMigrations(migrationDb, isPostgres ? "postgres" : "sqlite");
  }
}

export { db, sqlite };
