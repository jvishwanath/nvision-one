import * as schemaSqlite from "./schema";
import * as schemaPg from "./schema-pg";

export type Schema = typeof schemaSqlite;

let _schema: Schema | null = null;

export function getSchema(): Schema {
  if (!_schema) {
    _schema = (process.env.DB_DRIVER === "postgres" ? schemaPg : schemaSqlite) as Schema;
  }
  return _schema;
}
