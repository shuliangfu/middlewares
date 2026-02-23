/**
 * @module @dreamer/middlewares/body-parser
 *
 * Body parser middleware. Parses request body (JSON, URL-encoded form, text, raw)
 * and attaches to context. Exports bodyParser and BodyParserOptions.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * Body Parser 中间件的配置选项。
 *
 * 用于控制 JSON、URL-encoded、text、raw 等请求体的解析与大小限制。
 */
export interface BodyParserOptions {
  /** JSON 请求体解析选项；未配置则使用默认 limit 1MB */
  json?: {
    /** 最大 body 大小（字节），默认 1MB */
    limit?: number;
    /** 是否严格模式（仅接受数组和对象） */
    strict?: boolean;
  };
  /** application/x-www-form-urlencoded 表单解析选项 */
  urlencoded?: {
    /** 最大 body 大小（字节） */
    limit?: number;
    /** 是否扩展模式（暂未实现，保留接口） */
    extended?: boolean;
  };
  /** 文本请求体解析选项 */
  text?: {
    /** 最大 body 大小（字节） */
    limit?: number;
    /** 默认字符集 */
    defaultCharset?: string;
  };
  /** 原始二进制请求体解析选项 */
  raw?: {
    /** 最大 body 大小（字节） */
    limit?: number;
  };
}

/**
 * 创建 Body Parser 中间件。
 *
 * 根据 Content-Type 解析请求体为 JSON、表单、文本或原始 Buffer，并挂到 ctx.state.body。
 *
 * @param options - 各类型 body 的解析选项与大小限制；未传则使用默认 limit 1MB
 * @returns 符合 {@link Middleware} 的 body 解析中间件
 *
 * @example
 * ```typescript
 * app.use(bodyParser({ json: { limit: 1024 * 1024 } }));
 * ```
 */
export function bodyParser(
  options: BodyParserOptions = {},
): Middleware<HttpContext> {
  const {
    json = { limit: 1024 * 1024 }, // 默认 1MB
    urlencoded = { limit: 1024 * 1024 },
    text = { limit: 1024 * 1024 },
    raw = { limit: 1024 * 1024 },
  } = options;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 只处理有请求体的方法
    if (
      ctx.method === "GET" ||
      ctx.method === "HEAD" ||
      ctx.method === "OPTIONS"
    ) {
      await next();
      return;
    }

    const contentType = ctx.headers.get("Content-Type") || "";
    const contentLength = ctx.headers.get("Content-Length");

    // 检查大小限制
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const limit = getLimit(contentType, { json, urlencoded, text, raw });
      if (limit && size > limit) {
        ctx.response = new Response("Request Entity Too Large", {
          status: 413,
        });
        return;
      }
    }

    try {
      // 解析请求体
      if (contentType.includes("application/json")) {
        const text = await ctx.request.text();
        if (text) {
          ctx.body = JSON.parse(text);
        }
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await ctx.request.text();
        if (text) {
          const params = new URLSearchParams(text);
          const formData: Record<string, string> = {};
          params.forEach((value, key) => {
            formData[key] = value;
          });
          ctx.body = formData;
        }
      } else if (contentType.startsWith("text/")) {
        ctx.body = await ctx.request.text();
      } else if (contentType.includes("multipart/form-data")) {
        // multipart/form-data 需要特殊处理
        const formData = await ctx.request.formData();
        const data: Record<string, string | File> = {};
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        ctx.body = data;
      } else if (contentType.includes("application/octet-stream")) {
        ctx.body = await ctx.request.arrayBuffer();
      } else {
        // 默认尝试解析为文本
        const text = await ctx.request.text();
        if (text) {
          ctx.body = text;
        }
      }
    } catch {
      ctx.response = new Response("Bad Request", { status: 400 });
      return;
    }

    await next();
  };
}

/**
 * 根据 Content-Type 获取大小限制
 *
 * @param contentType Content-Type 头
 * @param options Body Parser 选项
 * @returns 大小限制（字节）
 */
function getLimit(
  contentType: string,
  options: BodyParserOptions,
): number | undefined {
  if (contentType.includes("application/json")) {
    return options.json?.limit;
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return options.urlencoded?.limit;
  }
  if (contentType.startsWith("text/")) {
    return options.text?.limit;
  }
  if (contentType.includes("application/octet-stream")) {
    return options.raw?.limit;
  }
  return undefined;
}
