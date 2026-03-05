import { jsonError, requireUserId } from "@/server/api";
import { stockPriceService } from "@/lib/services";
import { logger } from "@/lib/logger";

function fallbackQuote(symbol: string) {
  return {
    symbol,
    name: symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    currency: "USD",
  };
}

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
      const fetched = await stockPriceService.getQuotes(symbols);
      const bySymbol = new Map(fetched.map((quote) => [quote.symbol.toUpperCase(), quote]));
      const quotes = symbols.map((symbol) => bySymbol.get(symbol) ?? fallbackQuote(symbol));
      return Response.json(quotes);
    } catch (quoteError) {
      logger.warn("Quote provider batch request failed", quoteError);
      return Response.json(symbols.map((symbol) => fallbackQuote(symbol)));
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to fetch quotes", 500, error);
  }
}
