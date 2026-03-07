import { jsonError, requireUserId } from "@/server/api";
import { stockPriceService } from "@/lib/services";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    await requireUserId();
    const { searchParams } = new URL(request.url);
    const symbolsRaw = searchParams.get("symbols") ?? "";
    const symbols = symbolsRaw
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return Response.json([]);
    }

    try {
      const quotes = await stockPriceService.getQuotes(symbols);
      return Response.json(quotes);
    } catch (quoteError) {
      logger.warn("Quote provider batch request failed", quoteError);
      return Response.json([]);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to fetch quotes", 500, error);
  }
}
