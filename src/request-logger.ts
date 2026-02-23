/**
 * @module @dreamer/middlewares/request-logger
 *
 * Request logger middleware. Logs request, response, and error info. Exports
 * requestLogger and RequestLoggerOptions.
 */

import type { Logger, LogLevel } from "@dreamer/logger";
import { createLogger } from "@dreamer/logger";
import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * 请求日志中间件的配置选项。
 *
 * 用于配置 logger 实例、日志级别与格式、是否包含头/体、是否详细输出及跳过条件。
 */
export interface RequestLoggerOptions {
  /** 日志实例；未提供则使用 createLogger() */
  logger?: Logger;
  /** 日志级别，默认 "info" */
  level?: LogLevel;
  /** 输出格式："text" 或 "json"，默认 "text" */
  format?: "json" | "text";
  /** 是否在日志中包含请求头 */
  includeHeaders?: boolean;
  /** 是否在日志中包含请求体 */
  includeBody?: boolean;
  /** 是否输出详细日志（含 requestId、query、userAgent），便于生产排查 */
  detailed?: boolean;
  /** 跳过记录：返回 true 的请求不写日志（如 /.well-known/） */
  skip?: (ctx: HttpContext) => boolean;
}

/**
 * 创建请求日志中间件。
 *
 * 在请求完成后记录方法、路径、状态码、耗时等信息，可选包含 requestId、query 等。
 *
 * @param options - 请求日志配置；未传则使用默认 logger 与 info 级别
 * @returns 符合 {@link Middleware} 的请求日志中间件
 *
 * @example
 * ```typescript
 * app.use(requestLogger({ level: "info", includeHeaders: true }));
 * ```
 */
export function requestLogger(
  options: RequestLoggerOptions = {},
): Middleware<HttpContext> {
  const {
    logger = createLogger(),
    level = "info",
    format = "text",
    includeHeaders: _includeHeaders = false,
    includeBody: _includeBody = false,
    detailed = false,
  } = options;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    if (options.skip?.(ctx)) {
      await next();
      return;
    }

    const startTime = Date.now();

    // 执行下一个中间件（仅记录响应日志，不记录请求日志，避免每条请求出现两行）
    await next();

    // 记录响应信息
    const duration = Date.now() - startTime;
    const status = ctx.response?.status || 500;

    const responseInfo: Record<string, unknown> = {
      method: ctx.method,
      path: ctx.path,
      status,
      duration: `${duration}ms`,
    };

    if (detailed) {
      const state = (ctx as { state?: { requestId?: string } }).state;
      if (state?.requestId) responseInfo.requestId = state.requestId;
      const search = ctx.url?.search?.trim();
      if (search) responseInfo.query = search;
      const ua = ctx.request?.headers?.get?.("user-agent");
      if (ua) responseInfo.userAgent = ua;
    }

    if (format === "json") {
      logger[level](JSON.stringify({ type: "response", ...responseInfo }));
    } else if (detailed && Object.keys(responseInfo).length > 4) {
      const parts = [`${ctx.method} ${ctx.path} ${status} ${duration}ms`];
      if (responseInfo.requestId) {
        parts.push(`requestId=${responseInfo.requestId}`);
      }
      if (responseInfo.query) parts.push(`query=${responseInfo.query}`);
      if (responseInfo.userAgent) {
        parts.push(`ua=${String(responseInfo.userAgent).slice(0, 60)}`);
      }
      logger[level](parts.join(" "));
    } else {
      logger[level](
        `${ctx.method} ${ctx.path} ${status} ${duration}ms`,
      );
    }
  };
}
