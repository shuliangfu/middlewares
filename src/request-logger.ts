/**
 * 请求日志中间件
 *
 * 记录请求信息、响应信息、错误信息
 */

import type { Logger, LogLevel } from "@dreamer/logger";
import { createLogger } from "@dreamer/logger";
import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * 请求日志配置选项
 */
export interface RequestLoggerOptions {
  /** Logger 实例（可选，如果提供则使用，否则创建默认 logger） */
  logger?: Logger;
  /** 日志级别（默认：info） */
  level?: LogLevel;
  /** 日志格式（默认：text） */
  format?: "json" | "text";
  /** 是否包含请求头 */
  includeHeaders?: boolean;
  /** 是否包含请求体 */
  includeBody?: boolean;
  /** 是否输出详细日志（含 requestId、query、userAgent，便于 prod 排查） */
  detailed?: boolean;
  /** 跳过日志的路径（返回 true 则不记录，如过滤 /.well-known/ 等内部请求） */
  skip?: (ctx: HttpContext) => boolean;
}

/**
 * 创建请求日志中间件
 *
 * @param options 请求日志配置选项
 * @returns 请求日志中间件函数
 *
 * @example
 * ```typescript
 * app.use(requestLogger({
 *   level: "info",
 *   includeHeaders: true,
 * }));
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
