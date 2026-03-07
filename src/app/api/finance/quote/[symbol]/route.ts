import { jsonError, requireUserId } from "@/server/api";
import { stockPriceService } from "@/lib/services";
import { logger } from "@/lib/logger";
import { cacheDetail, getCachedDetail } from "@/lib/services/quote-cache";
import { z } from "zod";

const paramsSchema = z.object({ symbol: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ symbol: string }> }) {
  try {
    await requireUserId();
    const params = paramsSchema.parse(await context.params);

    try {
      const detail = await stockPriceService.getDetailedQuote(params.symbol);
      if (detail.price > 0) {
        cacheDetail(detail);
        return Response.json(detail);
      }
      // Price zero — try cache
      const cached = getCachedDetail(params.symbol);
      if (cached) {
        logger.warn(`Serving cached detail for ${params.symbol} (live returned zero price)`);
        return Response.json(cached);
      }
      return Response.json(detail);
    } catch (quoteError) {
      logger.warn("Detailed quote request failed", quoteError);
      const cached = getCachedDetail(params.symbol);
      if (cached) {
        logger.warn(`Serving cached detail for ${params.symbol} (live request failed)`);
        return Response.json(cached);
      }
      return Response.json({ symbol: params.symbol, name: params.symbol, price: 0, change: 0, changePercent: 0, currency: "USD" });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to fetch detailed quote", 500, error);
  }
}
