import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/server/api";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    logger.info("[sync] Starting user sync");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      logger.error("[sync] Supabase auth error", authError.message);
      return jsonError("Auth error: " + authError.message, 401);
    }

    if (!user?.id || !user.email) {
      logger.error("[sync] No user from Supabase", { id: user?.id, email: user?.email });
      return jsonError("Unauthorized", 401);
    }

    logger.info("[sync] Supabase user found", { id: user.id, email: user.email });

    const { users } = getSchema();
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existing) {
      const name =
        user.user_metadata?.name ??
        user.email.split("@")[0] ??
        "User";

      logger.info("[sync] Inserting new user", { id: user.id, email: user.email, name });
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        name,
        createdAt: new Date().toISOString(),
      });
      logger.info("[sync] User inserted successfully");
    } else {
      logger.info("[sync] User already exists", { id: user.id });
    }

    return Response.json({ synced: true });
  } catch (error) {
    logger.error("[sync] Sync failed", error instanceof Error ? error.message : error);
    return jsonError("Sync failed", 500, error instanceof Error ? error.message : error);
  }
}
