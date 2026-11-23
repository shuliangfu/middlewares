/**
 * @module @dreamer/middlewares/cors
 *
 * CORS middleware. Handles cross-origin requests and preflight. Exports cors
 * and CorsOptions.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * CORS 中间件的配置选项。
 *
 * 用于配置允许的源、方法、请求头、是否携带凭证及预检缓存时间。
 */
export interface CorsOptions {
  /** 允许的源：字符串、字符串数组，或 (origin) => boolean；默认 "*" */
  origin?: string | string[] | ((origin: string) => boolean);
  /** 允许的 HTTP 方法列表，默认含 GET/POST/PUT/DELETE/PATCH/OPTIONS */
  methods?: string[];
  /** 允许的请求头列表，默认含 Content-Type、Authorization */
  allowedHeaders?: string[];
  /** 暴露给前端的响应头列表 */
  exposedHeaders?: string[];
  /** 是否允许携带 Cookie/凭证（credentials: "include"） */
  credentials?: boolean;
  /** 预检请求（OPTIONS）结果缓存时间（秒） */
  maxAge?: number;
}

/**
 * 创建 CORS 中间件。
 *
 * 处理跨域请求与 OPTIONS 预检，设置 Access-Control-* 响应头。
 *
 * @param options - CORS 配置；未传则允许任意源、常用方法与请求头
 * @returns 符合 {@link Middleware} 的 CORS 中间件
 *
 * @example
 * ```typescript
 * app.use(cors({ origin: "https://example.com", credentials: true }));
 * ```
 */
export function cors(options: CorsOptions = {}): Middleware<HttpContext> {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
    exposedHeaders = [],
    credentials = false,
    maxAge,
  } = options;

  // 启动时预计算：白名单 O(1) 查找，响应头字符串避免每个请求 join
  const originSet = Array.isArray(origin) ? new Set(origin) : null;
  const methodsHeader = methods.join(", ");
  const allowedHeadersHeader = allowedHeaders.join(", ");
  const exposedHeadersHeader = exposedHeaders.length > 0
    ? exposedHeaders.join(", ")
    : "";
  const maxAgeHeader = maxAge !== undefined ? String(maxAge) : undefined;

  const originAllowed = (requestOrigin: string): boolean => {
    if (typeof origin === "string") {
      return requestOrigin === origin;
    }
    if (originSet) {
      return originSet.has(requestOrigin);
    }
    if (typeof origin === "function") {
      return origin(requestOrigin);
    }
    return false;
  };

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    const requestOrigin = ctx.headers.get("Origin");

    // 处理 OPTIONS 预检请求
    if (ctx.method === "OPTIONS") {
      const headers = new Headers();

      // 设置 Access-Control-Allow-Origin
      if (requestOrigin && originAllowed(requestOrigin)) {
        headers.set("Access-Control-Allow-Origin", requestOrigin);
      } else if (origin === "*") {
        headers.set("Access-Control-Allow-Origin", "*");
      }

      // 设置 Access-Control-Allow-Methods
      headers.set("Access-Control-Allow-Methods", methodsHeader);

      // 设置 Access-Control-Allow-Headers
      const requestedHeaders = ctx.headers.get(
        "Access-Control-Request-Headers",
      );
      if (requestedHeaders) {
        headers.set("Access-Control-Allow-Headers", requestedHeaders);
      } else {
        headers.set("Access-Control-Allow-Headers", allowedHeadersHeader);
      }

      // 设置 Access-Control-Expose-Headers
      if (exposedHeadersHeader) {
        headers.set("Access-Control-Expose-Headers", exposedHeadersHeader);
      }

      // 设置 Access-Control-Allow-Credentials
      if (credentials) {
        headers.set("Access-Control-Allow-Credentials", "true");
      }

      // 设置 Access-Control-Max-Age
      if (maxAgeHeader !== undefined) {
        headers.set("Access-Control-Max-Age", maxAgeHeader);
      }

      ctx.response = new Response(null, { status: 204, headers });
      return;
    }

    // 处理普通请求
    await next();

    if (ctx.response) {
      const headers = new Headers(ctx.response.headers);

      // 设置 Access-Control-Allow-Origin
      if (requestOrigin && originAllowed(requestOrigin)) {
        headers.set("Access-Control-Allow-Origin", requestOrigin);
      } else if (origin === "*") {
        headers.set("Access-Control-Allow-Origin", "*");
      }

      // 设置 Access-Control-Expose-Headers
      if (exposedHeadersHeader) {
        headers.set("Access-Control-Expose-Headers", exposedHeadersHeader);
      }

      // 设置 Access-Control-Allow-Credentials
      if (credentials) {
        headers.set("Access-Control-Allow-Credentials", "true");
      }

      ctx.response = new Response(ctx.response.body, {
        status: ctx.response.status,
        statusText: ctx.response.statusText,
        headers,
      });
    }
  };
}
