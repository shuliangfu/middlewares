/**
 * @module @dreamer/middlewares/compression
 *
 * Response compression middleware. Compresses HTTP response body with gzip and
 * optional Brotli. Exports compression and CompressionOptions.
 *
 * Brotli 使用动态 import 延迟加载，避免在 CI（Bun/Linux/Mac）下因顶层加载
 * brotli 的 Emscripten 代码导致 "(void 0) is not a function" 并拖垮构建/服务启动。
 */

import { gzip } from "pako";
import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";
import { $tr } from "./i18n.ts";

/**
 * 响应压缩中间件的配置选项。
 *
 * 用于控制 gzip/br 压缩级别、最小压缩体积、可压缩的 Content-Type 以及是否启用 Brotli。
 */
export interface CompressionOptions {
  /**
   * gzip 压缩级别，1–9，数值越大压缩率越高、耗时越长。
   * 仅对 gzip 生效，默认 6。
   */
  level?: number;
  /**
   * 最小响应体大小（字节），小于此值不压缩，避免小响应被压缩后反而变大。
   * 默认 1024（1KB）。
   */
  threshold?: number;
  /**
   * 根据 Content-Type 决定是否压缩；返回 true 表示可压缩。
   * 未提供时使用默认过滤器（压缩 text/*、application/json、application/javascript 等）。
   */
  filter?: (contentType: string) => boolean;
  /**
   * 是否启用 Brotli（br）压缩；需运行时支持或 brotli 包可用。
   * 默认 false，仅使用 gzip。
   */
  enableBrotli?: boolean;
}

/**
 * 默认的 Content-Type 过滤器
 * 只压缩文本类型的响应
 */
function defaultFilter(contentType: string): boolean {
  const textTypes = [
    "text/",
    "application/json",
    "application/javascript",
    "application/xml",
    "application/rss+xml",
    "application/atom+xml",
    "image/svg+xml",
  ];

  return textTypes.some((type) => contentType.includes(type));
}

/**
 * 压缩数据（gzip）
 *
 * @param data 要压缩的数据
 * @param level 压缩级别
 * @returns 压缩后的数据
 */
function compressGzip(data: Uint8Array, level: number = 6): Uint8Array {
  return gzip(data, { level });
}

/**
 * 压缩数据（brotli）
 *
 * @param data 要压缩的数据
 * @returns 压缩后的数据
 */
async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  // 尝试使用运行时的 brotli 支持
  // Deno 和 Bun 都支持 CompressionStream API，但可能不支持 "br"
  // 如果 CompressionStream 不支持 "br"，使用 npm 包
  if (typeof CompressionStream !== "undefined") {
    try {
      // 尝试使用 CompressionStream（某些运行时可能支持）
      const stream = new CompressionStream("br" as any);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      // 写入数据（转换为新的 ArrayBuffer）
      const buffer = new Uint8Array(data).buffer;
      writer.write(buffer);
      writer.close();

      // 读取压缩后的数据
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // 合并所有块
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } catch {
      // CompressionStream 不支持 "br"，使用 npm 包
      // 继续尝试使用 npm 包
    }
  }

  // 使用 brotli 包进行压缩（跨运行时兼容）；延迟加载避免 CI Bun 下顶层加载报错
  try {
    const { compress: brotliCompress } = await import("brotli");
    const result = brotliCompress(data);
    // brotli 包返回的是 Buffer 或 Uint8Array
    return result instanceof Uint8Array ? result : new Uint8Array(result);
  } catch (error) {
    // 如果 brotli 包不可用，抛出错误
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      $tr("middlewares.compression.brotliNotSupported", { detail }),
    );
  }
}

/**
 * 创建响应压缩中间件。
 *
 * 根据请求头 Accept-Encoding 对响应体进行 gzip 或（可选）Brotli 压缩，
 * 仅压缩满足 threshold 与 filter 的响应，并设置 Content-Encoding、Vary 等头。
 *
 * @param options - 压缩配置；未传则使用默认（level=6, threshold=1024, enableBrotli=false）
 * @returns 符合 {@link Middleware} 的压缩中间件函数
 *
 * @example
 * ```typescript
 * import { compression } from "@dreamer/middlewares";
 *
 * app.use(compression());
 *
 * app.use(compression({
 *   level: 9,
 *   threshold: 2048,
 *   enableBrotli: true,
 * }));
 * ```
 */
export function compression(
  options: CompressionOptions = {},
): Middleware<HttpContext> {
  const {
    level = 6,
    threshold = 1024, // 1KB
    filter = defaultFilter,
    enableBrotli = false,
  } = options;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 先执行下一个中间件，获取响应
    await next();

    // 如果没有响应，直接返回
    if (!ctx.response) {
      return;
    }

    // 检查是否已经压缩
    const contentEncoding = ctx.response.headers.get("Content-Encoding");
    if (contentEncoding) {
      // 已经压缩，不再压缩
      return;
    }

    // 检查 Content-Type
    const contentType = ctx.response.headers.get("Content-Type") || "";
    if (!filter(contentType)) {
      // 不在压缩范围内
      return;
    }

    // 检查 Accept-Encoding
    const acceptEncoding = ctx.headers.get("Accept-Encoding") || "";
    const supportsGzip = acceptEncoding.includes("gzip");
    const supportsBrotli = enableBrotli && acceptEncoding.includes("br");

    if (!supportsGzip && !supportsBrotli) {
      // 客户端不支持压缩
      return;
    }

    // 读取响应体（需要克隆响应，因为响应体只能读取一次）
    const responseClone = ctx.response.clone();
    const responseBody = await responseClone.arrayBuffer();
    const data = new Uint8Array(responseBody);

    // 检查大小阈值
    if (data.length < threshold) {
      // 太小，不压缩
      return;
    }

    try {
      let compressed: Uint8Array;
      let encoding: string;

      // 优先使用 brotli（如果支持且启用）
      if (supportsBrotli && enableBrotli) {
        try {
          compressed = await compressBrotli(data);
          encoding = "br";
        } catch {
          // Brotli 压缩失败，回退到 gzip
          compressed = await compressGzip(data, level);
          encoding = "gzip";
        }
      } else if (supportsGzip) {
        compressed = await compressGzip(data, level);
        encoding = "gzip";
      } else {
        // 不支持任何压缩
        return;
      }

      // 检查压缩是否有效（压缩后应该更小）
      if (compressed.length >= data.length) {
        // 压缩后没有变小，不压缩
        return;
      }

      // 创建新的响应头
      const headers = new Headers(ctx.response.headers);
      headers.set("Content-Encoding", encoding);
      headers.set("Content-Length", compressed.length.toString());
      // 移除 Vary 头中的 Accept-Encoding（如果存在），然后添加
      const vary = headers.get("Vary");
      if (vary && !vary.includes("Accept-Encoding")) {
        headers.set("Vary", `${vary}, Accept-Encoding`);
      } else if (!vary) {
        headers.set("Vary", "Accept-Encoding");
      }

      // 创建压缩后的响应
      ctx.response = new Response(compressed as BodyInit, {
        status: ctx.response.status,
        statusText: ctx.response.statusText,
        headers,
      });
    } catch (error) {
      // 压缩失败，使用原始响应
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(
        $tr("middlewares.compression.compressFailed", { error: errMsg }),
      );
    }
  };
}
