import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type SupportedDbDriver = "sqlite" | "postgres";

type MigrationDatabase = BetterSQLite3Database | NodePgDatabase;

export async function runMigrations(db: MigrationDatabase, driver: SupportedDbDriver) {
  if (driver === "postgres") {
    await migratePostgres(db as NodePgDatabase, {
      migrationsFolder: "./src/server/db/migrations-pg",
    });
    return;
  }

  migrateSqlite(db as BetterSQLite3Database, {
    migrationsFolder: "./src/server/db/migrations",
  });
}
