import { jsonError, requireUserId } from "@/server/api";
import { stockPriceService } from "@/lib/services";
import { logger } from "@/lib/logger";
import { cacheQuotes, getCachedQuotes } from "@/lib/services/quote-cache";

export async function GET(request: Request) {
  try {
    await requireUserId();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Auth check failed", 500, error);
  }

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
    const hasLive = quotes.some((q) => q.price > 0);
    if (hasLive) {
      cacheQuotes(quotes);
      return Response.json(quotes);
    }
    // All prices zero — try cache
    const cached = getCachedQuotes(symbols);
    if (cached) {
      logger.warn("Serving cached quotes (live returned zero prices)");
      return Response.json(cached);
    }
    return Response.json(quotes);
  } catch (quoteError) {
    logger.warn("Quote provider batch request failed", quoteError);
    const cached = getCachedQuotes(symbols);
    if (cached) {
      logger.warn("Serving cached quotes (live request failed)");
      return Response.json(cached);
    }
    return Response.json([]);
  }
}
