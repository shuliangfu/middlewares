/**
 * @module @dreamer/middlewares/health-check
 *
 * Health check middleware. Exposes a configurable health endpoint for monitoring
 * and load balancers. Exports healthCheck and HealthCheckOptions.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * 健康检查中间件的配置选项。
 *
 * 用于配置健康检查路径与可选的自定义检查逻辑（如数据库、缓存连通性）。
 */
export interface HealthCheckOptions {
  /** 健康检查请求路径，默认 "/health" */
  path?: string;
  /**
   * 自定义检查函数；返回 { healthy, details? }，用于依赖检查（DB、Redis 等）。
   * 未提供则直接返回 200 与 { status: "ok" }。
   */
  check?: () => Promise<
    { healthy: boolean; details?: Record<string, unknown> }
  >;
}

/**
 * 创建健康检查中间件。
 *
 * 对指定路径的 GET/HEAD 请求返回 JSON 健康状态，供监控与负载均衡探测。
 *
 * @param options - 路径与可选检查函数；未传则使用 path="/health"
 * @returns 符合 {@link Middleware} 的健康检查中间件
 *
 * @example
 * ```typescript
 * app.use(healthCheck());
 * app.use(healthCheck({ path: "/healthz", check: async () => ({ healthy: true, details: { db: "ok" } }) }));
 * ```
 */
export function healthCheck(
  options: HealthCheckOptions = {},
): Middleware<HttpContext> {
  const {
    path = "/health",
    check,
  } = options;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 只处理健康检查路径
    if (ctx.path !== path) {
      await next();
      return;
    }

    // 只处理 GET 请求
    if (ctx.method !== "GET" && ctx.method !== "HEAD") {
      await next();
      return;
    }

    try {
      // 如果有自定义检查函数，执行它
      if (check) {
        const result = await check();
        if (result.healthy) {
          // 如果有 details，返回 JSON，否则返回 "OK"
          const body = result.details
            ? JSON.stringify({
              status: "healthy",
              timestamp: new Date().toISOString(),
              ...result.details,
            })
            : "OK";
          ctx.response = new Response(
            body,
            {
              status: 200,
              headers: {
                "Content-Type": result.details
                  ? "application/json"
                  : "text/plain",
              },
            },
          );
        } else {
          ctx.response = new Response(
            JSON.stringify({
              status: "unhealthy",
              timestamp: new Date().toISOString(),
              ...result.details,
            }),
            {
              status: 503,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        }
      } else {
        // 默认健康检查（总是返回健康）
        ctx.response = new Response(
          "OK",
          {
            status: 200,
            headers: {
              "Content-Type": "text/plain",
            },
          },
        );
      }
    } catch (error) {
      // 检查失败，返回不健康状态
      ctx.response = new Response(
        JSON.stringify({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  };
}
