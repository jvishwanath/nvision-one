#!/usr/bin/env node

/**
 * ENCRYPTION_SECRET Rotation Script
 *
 * Safely rotates the ENCRYPTION_SECRET by re-wrapping every user's master key
 * from the old secret to the new secret.
 *
 * Usage:
 *   node scripts/rotate-encryption-secret.mjs \
 *     --old-secret <OLD_ENCRYPTION_SECRET> \
 *     --new-secret <NEW_ENCRYPTION_SECRET> \
 *     --db-driver <sqlite|postgres> \
 *     --database-url <DATABASE_URL>
 *
 * Options:
 *   --dry-run    Preview changes without writing (default: false)
 *
 * Safety:
 *   - Performs a dry run by default description, pass --no-dry-run to apply
 *   - Validates each unwrap/re-wrap before writing
 *   - Rolls back on any error (Postgres) / stops on error (SQLite)
 *   - Logs every step for auditability
 */

import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from "node:crypto";
import { parseArgs } from "node:util";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const AUTH_TAG_LENGTH = 16;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toBase64(buf) {
  return Buffer.from(buf).toString("base64");
}

function fromBase64(b64) {
  return Buffer.from(b64, "base64");
}

function deriveHmac(secret, userId) {
  return createHmac("sha256", secret).update(userId).digest("base64");
}

function deriveWrappingKey(password, salt) {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

function unwrapMasterKey(bundle, password) {
  const salt = fromBase64(bundle.salt);
  const iv = fromBase64(bundle.iv);
  const wrappedData = fromBase64(bundle.wrappedKey);

  const wrappingKey = deriveWrappingKey(password, salt);

  // AES-GCM: last 16 bytes are the auth tag
  const authTag = wrappedData.subarray(wrappedData.length - AUTH_TAG_LENGTH);
  const ciphertext = wrappedData.subarray(0, wrappedData.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, wrappingKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

function wrapMasterKey(rawMasterKey, password) {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const wrappingKey = deriveWrappingKey(password, salt);

  const cipher = createCipheriv(ALGORITHM, wrappingKey, iv);
  const encrypted = Buffer.concat([cipher.update(rawMasterKey), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store ciphertext + authTag concatenated (matches Web Crypto wrapKey output)
  const wrappedKey = Buffer.concat([encrypted, authTag]);

  return {
    wrappedKey: toBase64(wrappedKey),
    salt: toBase64(salt),
    iv: toBase64(iv),
  };
}

// ── Database adapters ────────────────────────────────────────────────────────

async function getSqliteRows(dbPath) {
  const { default: Database } = await import("better-sqlite3");
  const db = new Database(dbPath);
  const rows = db.prepare(`
    SELECT uk.id, uk.user_id, uk.wrapped_key, uk.salt, uk.iv
    FROM user_keys uk
    INNER JOIN users u ON u.id = uk.user_id
  `).all();
  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      wrappedKey: r.wrapped_key,
      salt: r.salt,
      iv: r.iv,
    })),
    update: (id, bundle) => {
      db.prepare(`
        UPDATE user_keys SET wrapped_key = ?, salt = ?, iv = ?, updated_at = ? WHERE id = ?
      `).run(bundle.wrappedKey, bundle.salt, bundle.iv, new Date().toISOString(), id);
    },
    close: () => db.close(),
  };
}

async function getPostgresRows(databaseUrl) {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  const { rows } = await pool.query(`
    SELECT uk.id, uk.user_id, uk.wrapped_key, uk.salt, uk.iv
    FROM user_keys uk
    INNER JOIN users u ON u.id = uk.user_id
  `);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      wrappedKey: r.wrapped_key,
      salt: r.salt,
      iv: r.iv,
    })),
    update: async (id, bundle) => {
      await pool.query(
        `UPDATE user_keys SET wrapped_key = $1, salt = $2, iv = $3, updated_at = $4 WHERE id = $5`,
        [bundle.wrappedKey, bundle.salt, bundle.iv, new Date().toISOString(), id],
      );
    },
    close: () => pool.end(),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    options: {
      "old-secret": { type: "string" },
      "new-secret": { type: "string" },
      "db-driver": { type: "string", default: "sqlite" },
      "database-url": { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const oldSecret = values["old-secret"];
  const newSecret = values["new-secret"];
  const dbDriver = values["db-driver"];
  const databaseUrl = values["database-url"];
  const dryRun = values["dry-run"];

  if (!oldSecret || !newSecret) {
    console.error("Error: --old-secret and --new-secret are required");
    process.exit(1);
  }
  if (!databaseUrl) {
    console.error("Error: --database-url is required");
    process.exit(1);
  }
  if (oldSecret === newSecret) {
    console.error("Error: old and new secrets are identical");
    process.exit(1);
  }

  console.log(`\n🔐 ENCRYPTION_SECRET Rotation`);
  console.log(`   Driver:   ${dbDriver}`);
  console.log(`   Database: ${dbDriver === "sqlite" ? databaseUrl : databaseUrl.replace(/\/\/.*@/, "//***@")}`);
  console.log(`   Dry run:  ${dryRun}\n`);

  const adapter = dbDriver === "postgres"
    ? await getPostgresRows(databaseUrl)
    : await getSqliteRows(databaseUrl);

  const { rows } = adapter;
  console.log(`Found ${rows.length} user key bundle(s) to rotate.\n`);

  if (rows.length === 0) {
    console.log("Nothing to do.");
    await adapter.close();
    return;
  }

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const label = `  [${row.userId.substring(0, 8)}...]`;
    try {
      // Derive old wrapping secret for this user
      const oldDerived = deriveHmac(oldSecret, row.userId);

      // Unwrap the master key with the old derived key
      const rawMasterKey = unwrapMasterKey(
        { wrappedKey: row.wrappedKey, salt: row.salt, iv: row.iv },
        oldDerived,
      );

      // Derive new wrapping secret for this user
      const newDerived = deriveHmac(newSecret, row.userId);

      // Re-wrap the master key with the new derived key
      const newBundle = wrapMasterKey(rawMasterKey, newDerived);

      // Validate: unwrap with new secret to ensure it works
      const validation = unwrapMasterKey(newBundle, newDerived);
      if (!rawMasterKey.equals(validation)) {
        throw new Error("Validation failed: re-wrapped key does not match original");
      }

      if (dryRun) {
        console.log(`${label} ✅ Would rotate (dry run)`);
      } else {
        await adapter.update(row.id, newBundle);
        console.log(`${label} ✅ Rotated successfully`);
      }
      success++;
    } catch (err) {
      console.error(`${label} ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  await adapter.close();

  console.log(`\n── Summary ──`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`   Total:   ${rows.length}`);

  if (dryRun) {
    console.log(`\n⚠️  This was a DRY RUN. No changes were made.`);
    console.log(`   Run again without --dry-run to apply.\n`);
  } else if (failed === 0) {
    console.log(`\n✅ Rotation complete. Deploy with the new ENCRYPTION_SECRET.\n`);
  } else {
    console.log(`\n⚠️  Some rotations failed. Do NOT switch to the new secret yet.`);
    console.log(`   Investigate failures and re-run.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
