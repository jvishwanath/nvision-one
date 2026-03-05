import { z } from "zod";
import { addWatchlistSymbol, ensureDefaultWatchlist } from "@/server/repositories/finance";
import { jsonError, requireUserId } from "@/server/api";

const createSchema = z.object({ symbol: z.string().min(1) });

export async function GET() {
  try {
    const userId = await requireUserId();
    const entries = await ensureDefaultWatchlist(userId);
    return Response.json(entries);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load watchlist", 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const entry = await addWatchlistSymbol(userId, parsed.data.symbol);
    return Response.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to add symbol", 500, error);
  }
}
