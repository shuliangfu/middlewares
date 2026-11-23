/**
 * @module @dreamer/middlewares/rate-limit
 *
 * Rate limit middleware. Limits request frequency per key (e.g. IP). Exports
 * rateLimit, RateLimitOptions, and RateLimitMiddleware.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * Options for the rate limit middleware (window, max requests, key generator, etc.).
 */
export interface RateLimitOptions {
  /** 时间窗口（毫秒，默认：60000，即 1 分钟） */
  windowMs?: number;
  /** 每个时间窗口内的最大请求数（默认：100） */
  max?: number;
  /** 是否跳过成功响应的计数（默认：false） */
  skipSuccessfulRequests?: boolean;
  /** 是否跳过失败响应的计数（默认：false） */
  skipFailedRequests?: boolean;
  /**
   * 是否信任 `X-Forwarded-For` / `X-Real-IP` / `cf-connecting-ip`。
   * 默认 false。仅在会剥离伪造转发头的反向代理后开启。
   */
  trustProxy?: boolean;
  /** 自定义键生成函数（默认：客户端 IP，见 trustProxy） */
  keyGenerator?: (ctx: HttpContext) => string;
  /** 自定义跳过函数（默认：不跳过） */
  skip?: (ctx: HttpContext) => boolean;
  /** 达到限制时的响应消息（默认：Too Many Requests） */
  message?: string;
  /** 达到限制时的状态码（默认：429） */
  statusCode?: number;
}

/**
 * 限流记录
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * 跨包读取 runtime-adapter 写入的真实远端地址（无需依赖未发布导出）。
 */
function readRemoteAddress(ctx: HttpContext): string | undefined {
  const fromCtx = (ctx as HttpContext & { remoteAddr?: string }).remoteAddr;
  if (fromCtx) return fromCtx;
  const map = (globalThis as unknown as Record<
    symbol,
    WeakMap<Request, string> | undefined
  >)[Symbol.for("@dreamer/runtime-adapter.remoteAddrMap")];
  return map?.get(ctx.request);
}

/**
 * 默认限流键：trustProxy 时才读转发头，否则用真实远端地址；都没有则 "unknown"。
 * 不使用 Host（ctx.url.hostname），避免把虚拟主机头当成客户端 IP。
 */
export function defaultRateLimitKey(
  ctx: HttpContext,
  trustProxy = false,
): string {
  if (trustProxy) {
    const forwarded = ctx.headers.get("X-Forwarded-For") ??
      ctx.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = ctx.headers.get("X-Real-IP") ??
      ctx.headers.get("x-real-ip") ??
      ctx.headers.get("cf-connecting-ip") ??
      ctx.headers.get("CF-Connecting-IP");
    if (realIp) {
      const trimmed = realIp.trim();
      if (trimmed) return trimmed;
    }
  }
  return readRemoteAddress(ctx) || "unknown";
}

/**
 * 创建请求限流中间件
 *
 * @param options 限流配置选项
 * @returns 限流中间件函数
 *
 * @example
 * ```typescript
 * import { rateLimit } from "@dreamer/server";
 *
 * // 限制每分钟 100 个请求
 * app.use(rateLimit({
 *   windowMs: 60000,
 *   max: 100,
 * }));
 *
 * // 限制每个 IP 每分钟 10 个请求
 * app.use(rateLimit({
 *   windowMs: 60000,
 *   max: 10,
 * }));
 * ```
 */
/**
 * Rate limit middleware instance; extends Middleware and may expose cleanup for tests.
 */
export interface RateLimitMiddleware extends Middleware<HttpContext> {
  /** 清理定时器（用于测试） */
  cleanup?: () => void;
}

export function rateLimit(
  options: RateLimitOptions = {},
): RateLimitMiddleware {
  const {
    windowMs = 60000, // 1 分钟
    max = 100,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    trustProxy = false,
    keyGenerator = (ctx) => defaultRateLimitKey(ctx, trustProxy),
    skip = () => false,
    message = "Too Many Requests",
    statusCode = 429,
  } = options;

  // 存储限流记录（键 -> 记录）
  const store = new Map<string, RateLimitRecord>();

  // 定期清理过期的记录
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, windowMs);

  // 清理函数（用于测试）
  const cleanup = () => {
    clearInterval(cleanupInterval);
  };

  // 在 Node.js 环境中，process.on('exit') 可以清理定时器
  // 在 Deno/Bun 中，这个定时器会在进程退出时自动清理

  const middleware = async (
    ctx: HttpContext,
    next: () => Promise<void>,
  ): Promise<void> => {
    // 检查是否跳过
    if (skip(ctx)) {
      await next();
      return;
    }

    // 生成键
    const key = keyGenerator(ctx);

    // 获取或创建记录
    const now = Date.now();
    let record = store.get(key);

    if (!record || now > record.resetTime) {
      // 创建新记录
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    }

    // 检查是否超过限制
    if (record.count >= max) {
      // 计算剩余时间
      const remaining = Math.ceil((record.resetTime - now) / 1000);

      // 设置响应头
      ctx.response = new Response(
        JSON.stringify({
          error: message,
          retryAfter: remaining,
        }),
        {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": max.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
            "Retry-After": remaining.toString(),
          },
        },
      );
      return;
    }

    // 增加计数
    record.count++;

    // 执行下一个中间件
    await next();

    // 根据响应状态决定是否计数
    if (ctx.response) {
      const isSuccess = ctx.response.status >= 200 && ctx.response.status < 300;
      const isFailure = ctx.response.status >= 400;

      if (skipSuccessfulRequests && isSuccess) {
        // 跳过成功请求，减少计数
        record.count = Math.max(0, record.count - 1);
      } else if (skipFailedRequests && isFailure) {
        // 跳过失败请求，减少计数
        record.count = Math.max(0, record.count - 1);
      }

      // 设置响应头
      const remaining = Math.max(0, max - record.count);
      const headers = new Headers(ctx.response.headers);
      headers.set("X-RateLimit-Limit", max.toString());
      headers.set("X-RateLimit-Remaining", remaining.toString());
      headers.set(
        "X-RateLimit-Reset",
        new Date(record.resetTime).toISOString(),
      );
      ctx.response = new Response(ctx.response.body, {
        status: ctx.response.status,
        statusText: ctx.response.statusText,
        headers,
      });
    }
  };

  // 添加清理方法（用于测试）
  (middleware as RateLimitMiddleware).cleanup = cleanup;

  return middleware as RateLimitMiddleware;
}
