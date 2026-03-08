import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";
import { requireUserId, jsonError } from "@/server/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const { userKeys } = getSchema();
    const [row] = await db
      .select()
      .from(userKeys)
      .where(eq(userKeys.userId, userId))
      .limit(1);

    if (!row) {
      return Response.json({ exists: false }, { status: 404 });
    }

    return Response.json({
      wrappedKey: row.wrappedKey,
      salt: row.salt,
      iv: row.iv,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to fetch key", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const { wrappedKey, salt, iv } = body;
    if (
      typeof wrappedKey !== "string" ||
      typeof salt !== "string" ||
      typeof iv !== "string"
    ) {
      return jsonError("Invalid key bundle", 400);
    }

    const { userKeys } = getSchema();
    const now = new Date().toISOString();

    const [existing] = await db
      .select({ id: userKeys.id })
      .from(userKeys)
      .where(eq(userKeys.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userKeys)
        .set({ wrappedKey, salt, iv, updatedAt: now })
        .where(eq(userKeys.userId, userId));
    } else {
      await db.insert(userKeys).values({
        id: crypto.randomUUID(),
        userId,
        wrappedKey,
        salt,
        iv,
        createdAt: now,
        updatedAt: now,
      });
    }

    return Response.json({ saved: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to save key", 500);
  }
}
