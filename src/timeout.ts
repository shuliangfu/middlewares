/**
 * @module @dreamer/middlewares/timeout
 *
 * Request timeout middleware. Aborts long-running requests. Exports
 * timeout and TimeoutOptions.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * 请求超时中间件的配置选项。
 *
 * 用于配置超时时间、超时响应文案与状态码，以及可选的跳过条件。
 */
export interface TimeoutOptions {
  /** 超时时间（毫秒），默认 30000（30 秒） */
  timeout?: number;
  /** 超时时的响应体消息，默认 "Request Timeout" */
  message?: string;
  /** 超时时的 HTTP 状态码，默认 408 */
  statusCode?: number;
  /** 返回 true 时跳过超时检查（如健康检查路径） */
  skip?: (ctx: HttpContext) => boolean;
}

/**
 * 创建请求超时中间件。
 *
 * 在指定时间内未完成响应的请求将被中止并返回可配置的状态码与消息。
 *
 * @param options - 超时配置；未传则 30 秒超时、408、Request Timeout
 * @returns 符合 {@link Middleware} 的超时中间件
 *
 * @example
 * ```typescript
 * app.use(timeout({ timeout: 30000 }));
 * app.use(timeout({ timeout: 300000, message: "Gateway Timeout" }));
 * ```
 */
export function timeout(
  options: TimeoutOptions = {},
): Middleware<HttpContext> {
  const {
    timeout: timeoutMs = 30000, // 30 秒
    message = "Request Timeout",
    statusCode = 408,
    skip = () => false,
  } = options;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 检查是否跳过
    if (skip(ctx)) {
      await next();
      return;
    }

    // 创建超时 Promise，并保存定时器 ID 以便清理
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimeout = false;
    const timeoutPromise = new Promise<void>((resolve) => {
      timeoutId = setTimeout(() => {
        isTimeout = true;
        resolve();
      }, timeoutMs);
    });

    // 创建执行 Promise
    const executePromise = (async () => {
      await next();
    })();

    // 使用 Promise.race 实现超时
    try {
      await Promise.race([executePromise, timeoutPromise]);
    } catch (error) {
      // 如果执行出错，清理定时器并继续抛出
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      throw error;
    } finally {
      // 无论哪个 Promise 先完成，都清理定时器
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }

    // 检查是否超时
    // 如果超时，设置超时响应（无论 ctx.response 是否存在）
    if (isTimeout) {
      // 如果超时，设置超时响应
      ctx.response = new Response(
        JSON.stringify({
          error: message,
          timeout: timeoutMs,
        }),
        {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  };
}
