import { CreateTradeSchema } from "@/features/finance/schemas";
import { createTrade, listTrades } from "@/server/repositories/finance";
import { jsonError, requireUserId } from "@/server/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const trades = await listTrades(userId);
    return Response.json(trades);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load trades", 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = CreateTradeSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const trade = await createTrade(userId, parsed.data);
    return Response.json(trade, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to create trade", 500, error);
  }
}
