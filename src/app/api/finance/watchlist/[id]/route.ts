import { z } from "zod";
import { removeWatchlistSymbol } from "@/server/repositories/finance";
import { jsonError, requireUserId } from "@/server/api";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    await removeWatchlistSymbol(userId, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to remove symbol", 500, error);
  }
}
