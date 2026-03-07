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

if [ "$DB_DRIVER" = "postgres" ]; then
  node <<'NODE'
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for postgres mode");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

async function bootstrapSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text NOT NULL,
      password_hash text NOT NULL,
      name text NOT NULL,
      created_at text NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

    CREATE TABLE IF NOT EXISTS tasks (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text NOT NULL,
      priority text NOT NULL,
      due_date text,
      completed boolean NOT NULL,
      subtasks text NOT NULL DEFAULT '[]',
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
    CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks (user_id);
    CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks (priority);
    CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);

    CREATE TABLE IF NOT EXISTS notes (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      content text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notes_user_idx ON notes (user_id);
    CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at);

    CREATE TABLE IF NOT EXISTS notes_tags (
      note_id text NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      tag text NOT NULL,
      PRIMARY KEY (note_id, tag)
    );
    CREATE INDEX IF NOT EXISTS notes_tags_note_idx ON notes_tags (note_id);

    CREATE TABLE IF NOT EXISTS trades (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol text NOT NULL,
      type text NOT NULL,
      quantity integer NOT NULL,
      price integer NOT NULL,
      timestamp text NOT NULL
    );
    CREATE INDEX IF NOT EXISTS trades_user_idx ON trades (user_id);
    CREATE INDEX IF NOT EXISTS trades_symbol_idx ON trades (symbol);

    CREATE TABLE IF NOT EXISTS watchlist (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol text NOT NULL,
      created_at text NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS watchlist_user_symbol_idx ON watchlist (user_id, symbol);

    CREATE TABLE IF NOT EXISTS trips (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      destination text NOT NULL,
      start_date text NOT NULL,
      end_date text NOT NULL,
      created_at text NOT NULL
    );
    CREATE INDEX IF NOT EXISTS trips_user_idx ON trips (user_id);
    CREATE INDEX IF NOT EXISTS trips_start_date_idx ON trips (start_date);

    CREATE TABLE IF NOT EXISTS itinerary_items (
      id text PRIMARY KEY,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      date text NOT NULL,
      activity text NOT NULL,
      time text NOT NULL,
      notes text NOT NULL,
      tag text NOT NULL
    );
    CREATE INDEX IF NOT EXISTS itinerary_items_trip_idx ON itinerary_items (trip_id);
  `);
}

async function applyMigrations() {
  // Add subtasks column to tasks if missing (migration for existing DBs)
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'subtasks'
  `);
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE tasks ADD COLUMN subtasks text NOT NULL DEFAULT '[]'`);
  }
}

async function main() {
  try {
    await bootstrapSchema();
    await applyMigrations();
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  throw error;
});
NODE
  export SKIP_STARTUP_MIGRATIONS=1
fi

exec node server.js
