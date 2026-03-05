#!/bin/sh
set -eu

DB_DRIVER="${DB_DRIVER:-sqlite}"

if [ "$DB_DRIVER" = "sqlite" ]; then
  DATABASE_URL="${DATABASE_URL:-/app/data/lifeos.db}"
  DB_PATH="$DATABASE_URL"

  case "$DATABASE_URL" in
    file:*)
      DB_PATH="${DATABASE_URL#file:}"
      ;;
    *://*)
      DB_PATH=""
      ;;
  esac

  if [ -n "$DB_PATH" ]; then
    mkdir -p "$(dirname "$DB_PATH")"
    if [ ! -f "$DB_PATH" ]; then
      touch "$DB_PATH"
    fi
  fi

  if [ -f "/app/src/server/db/migrations/meta/_journal.json" ]; then
    node <<'NODE'
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { migrate } = require("drizzle-orm/better-sqlite3/migrator");

const databaseUrl = process.env.DATABASE_URL || "/app/data/lifeos.db";
if (!databaseUrl.startsWith("file:") && databaseUrl.includes("://")) {
  process.exit(0);
}

const dbPath = databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : databaseUrl;
const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "/app/src/server/db/migrations" });
sqlite.close();
NODE
    export SKIP_STARTUP_MIGRATIONS=1
  fi
fi

exec node server.js
