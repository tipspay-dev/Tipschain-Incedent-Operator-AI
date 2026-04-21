import { Ratelimit } from "@upstash/ratelimit";
import type { NextRequest } from "next/server";

import { getRedis } from "@/lib/redis";
import { jsonNoStore } from "@/lib/responses";

type RouteHandler<TContext = unknown> = (
  request: NextRequest,
  context: TContext,
) => Promise<Response>;

export function withRateLimit<TContext>(
  keyBuilder: (request: NextRequest, context: TContext) => Promise<string> | string,
  limit: number,
  windowSeconds: number,
  handler: RouteHandler<TContext>,
): RouteHandler<TContext> {
  return async (request, context) => {
    const redis = getRedis();
    if (!redis) {
      return handler(request, context);
    }

    try {
      const key = await keyBuilder(request, context);
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: true,
        prefix: "tipspay:ratelimit",
      });

      const result = await ratelimit.limit(key);
      if (result.success) {
        return handler(request, context);
      }

      const response = jsonNoStore(
        {
          error: "RATE_LIMITED",
          message: "Too many requests. Please slow down and retry later.",
        },
        { status: 429 },
      );

      const retryAfter = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      ).toString();

      response.headers.set("Retry-After", retryAfter);
      return response;
    } catch (error) {
      console.warn(
        JSON.stringify({
          route: "rate-limit",
          status: "bypassed",
          reason: "redis_unavailable",
          error: error instanceof Error ? error.message : "unknown",
          ts: new Date().toISOString(),
        }),
      );
      return handler(request, context);
    }
  };
}
