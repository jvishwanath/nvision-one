import type { Config } from "drizzle-kit";

const dbDriver = process.env.DB_DRIVER === "postgres" ? "postgres" : "sqlite";

export default {
  schema: "./src/server/db/schema.ts",
  out: dbDriver === "postgres" ? "./src/server/db/migrations-pg" : "./src/server/db/migrations",
  dialect: dbDriver === "postgres" ? "postgresql" : "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./data/lifeos.db",
  },
} satisfies Config;
