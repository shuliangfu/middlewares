/**
 * @module @dreamer/middlewares/response-cache
 *
 * Response cache middleware. Caches HTTP responses to speed up APIs. Exports
 * responseCache, clearResponseCache, getResponseCacheStats, and options.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * 单条响应缓存项，包含响应体、状态码、头及时间戳。
 */
interface CacheItem {
  /** 响应体二进制内容 */
  body: Uint8Array;
  /** HTTP 状态码 */
  status: number;
  /** 响应头（含 Cache-Control、ETag、Last-Modified 等） */
  headers: Headers;
  /** 可选 ETag，用于条件请求 304 */
  etag?: string;
  /** 可选 Last-Modified，用于条件请求 304 */
  lastModified?: Date;
  /** 写入缓存时的时间戳，用于 TTL 判断 */
  timestamp: number;
  /** 最近一次访问时间戳，用于 LRU 淘汰 */
  accessTime: number;
}

/**
 * LRU 响应缓存类。
 *
 * 按 key 缓存 HTTP 响应（body + status + headers），支持最大容量与可选 TTL。
 * 供 responseCache 中间件内部使用，按配置创建单例。
 */
class ResponseCache {
  /** 键到缓存项的映射 */
  private cache: Map<string, CacheItem>;
  /** 允许的最大缓存总大小（字节） */
  private maxSize: number;
  /** 当前已缓存响应总大小（字节） */
  private currentSize: number;
  /** 生存时间（毫秒），0 表示不按时间过期 */
  private ttl: number;

  /**
   * 创建响应缓存实例。
   *
   * @param options - 缓存配置；未传则使用默认 maxSize 100MB、ttl 0
   */
  constructor(options: {
    /** 最大缓存总大小（字节），默认 100MB */
    maxSize?: number;
    /** 生存时间（毫秒），0 表示不过期，默认 0 */
    ttl?: number;
  } = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB
    this.currentSize = 0;
    this.ttl = options.ttl || 0;
  }

  /**
   * 根据键获取缓存项。
   *
   * 若存在且未过期会更新 accessTime；若已过期则删除该键并返回 null。
   *
   * @param key - 缓存键（由 keyGenerator 生成）
   * @returns 缓存项，不存在或已过期时返回 null
   */
  get(key: string): CacheItem | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (this.ttl > 0) {
      const age = Date.now() - item.timestamp;
      if (age > this.ttl) {
        this.delete(key);
        return null;
      }
    }

    // 更新访问时间（LRU）
    item.accessTime = Date.now();
    return item;
  }

  /**
   * 写入或覆盖一条响应缓存项。
   *
   * 若单条响应超过 maxSize 则不缓存；若当前容量不足会先按 LRU 淘汰再写入。
   *
   * @param key - 缓存键
   * @param item - 缓存项（不含 timestamp、accessTime，由本方法填充）
   */
  set(key: string, item: Omit<CacheItem, "timestamp" | "accessTime">): void {
    const bodySize = item.body.length;

    // 如果单个响应超过最大缓存大小，不缓存
    if (bodySize > this.maxSize) {
      return;
    }

    // 如果缓存已满，删除最久未使用的项（LRU）
    while (
      this.currentSize + bodySize > this.maxSize && this.cache.size > 0
    ) {
      this.evictLRU();
    }

    // 如果删除后仍然无法容纳，不缓存
    if (this.currentSize + bodySize > this.maxSize) {
      return;
    }

    // 如果键已存在，先删除旧项
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.body.length;
    }

    // 添加新项
    const now = Date.now();
    this.cache.set(key, {
      ...item,
      timestamp: now,
      accessTime: now,
    });
    this.currentSize += bodySize;
  }

  /**
   * 删除指定键的缓存项并释放其占用的容量。
   *
   * @param key - 要删除的缓存键；若不存在则无效果
   */
  delete(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.body.length;
      this.cache.delete(key);
    }
  }

  /**
   * 清空所有缓存项并将当前容量置零。
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * 返回当前缓存的统计信息。
   *
   * @returns 包含 size（当前占用字节）、count（条数）、maxSize（容量上限）、usage（使用率 0–1）的对象
   */
  getStats(): {
    size: number;
    count: number;
    maxSize: number;
    usage: number;
  } {
    return {
      size: this.currentSize,
      count: this.cache.size,
      maxSize: this.maxSize,
      usage: this.maxSize > 0 ? this.currentSize / this.maxSize : 0,
    };
  }

  /**
   * 按访问时间淘汰一条最久未使用的缓存项（LRU）。
   *
   * 在 set 时容量不足时调用以腾出空间；内部使用。
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessTime < oldestTime) {
        oldestTime = item.accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
}

/**
 * 响应缓存中间件的配置选项。
 *
 * 用于配置 Cache-Control、maxAge、ETag/Last-Modified、容量、TTL 及键生成与缓存条件。
 */
export interface ResponseCacheOptions {
  /** Cache-Control 策略：public / private / no-cache，默认 "public" */
  cacheControl?: "public" | "private" | "no-cache";
  /** 缓存时长（秒），会写入 max-age，默认 3600 */
  maxAge?: number;
  /** 是否生成并校验 ETag，默认 true */
  etag?: boolean;
  /** 是否使用 Last-Modified，默认 true */
  lastModified?: boolean;
  /** 内存缓存最大容量（字节），默认 100MB */
  maxSize?: number;
  /** 缓存 TTL（毫秒），0 表示不按时间过期，默认 0 */
  ttl?: number;
  /** 根据请求上下文生成缓存键；未提供则使用默认（method+path+query+部分头） */
  keyGenerator?: (ctx: HttpContext) => string;
  /** 判断该响应是否应被缓存；未提供则仅缓存 2xx */
  shouldCache?: (ctx: HttpContext, response: Response) => boolean;
  /** 判断该请求是否跳过缓存（不读不写）；未提供则跳过非 GET/HEAD */
  shouldSkip?: (ctx: HttpContext) => boolean;
}

/**
 * 根据响应体生成简单 ETag 字符串。
 *
 * @param data - 响应体二进制数据
 * @returns 带引号的 ETag 字符串，如 "a1b2c3"
 */
function generateETag(data: Uint8Array): string {
  // 简单的哈希算法（实际可以使用更复杂的算法）
  let hash = 0;
  for (let i = 0; i < Math.min(data.length, 1000); i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash; // 转换为 32 位整数
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * 默认缓存键生成函数：method + path + 排序后的 query + 部分请求头。
 *
 * @param ctx - 当前请求上下文
 * @returns 唯一标识该请求的缓存键字符串
 */
function defaultKeyGenerator(ctx: HttpContext): string {
  const parts: string[] = [
    ctx.method,
    ctx.path,
  ];

  // 包含查询参数
  if (ctx.query && Object.keys(ctx.query).length > 0) {
    const queryString = Object.entries(ctx.query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    parts.push(queryString);
  }

  // 包含相关请求头（如 Accept、Accept-Language）
  const relevantHeaders = ["accept", "accept-language", "authorization"];
  const headerValues: string[] = [];
  for (const headerName of relevantHeaders) {
    const value = ctx.headers.get(headerName);
    if (value) {
      headerValues.push(`${headerName}:${value}`);
    }
  }
  if (headerValues.length > 0) {
    parts.push(headerValues.join("|"));
  }

  return parts.join("|");
}

/**
 * 默认缓存条件：仅缓存 2xx 响应。
 *
 * @param _ctx - 请求上下文（未使用）
 * @param response - 下游返回的响应
 * @returns 为 true 时将该响应写入缓存
 */
function defaultShouldCache(_ctx: HttpContext, response: Response): boolean {
  // 只缓存成功的响应（2xx）
  return response.status >= 200 && response.status < 300;
}

/**
 * 默认跳过条件：非 GET/HEAD 请求不参与缓存读写。
 *
 * @param ctx - 请求上下文
 * @returns 为 true 时不查缓存、不写缓存
 */
function defaultShouldSkip(ctx: HttpContext): boolean {
  // 跳过非 GET/HEAD 请求
  return ctx.method !== "GET" && ctx.method !== "HEAD";
}

// 全局响应缓存实例（每个配置一个实例）
const cacheInstances = new Map<string, ResponseCache>();

/**
 * 创建响应缓存中间件。
 *
 * 按 keyGenerator 生成的键缓存 GET/HEAD 的响应；命中时直接返回缓存或 304，
 * 未命中时执行下游并依 shouldCache 决定是否写入缓存。支持 ETag、Last-Modified 条件请求。
 *
 * @param options - 响应缓存配置；未传则使用默认 keyGenerator、shouldCache、shouldSkip 等
 * @returns 符合 {@link Middleware} 的响应缓存中间件
 *
 * @example
 * ```typescript
 * app.use(responseCache({ maxAge: 3600, cacheControl: "public" }));
 * ```
 */
export function responseCache(
  options: ResponseCacheOptions = {},
): Middleware<HttpContext> {
  const {
    cacheControl = "public",
    maxAge = 3600,
    etag = true,
    lastModified = true,
    maxSize = 100 * 1024 * 1024, // 100MB
    ttl = 0, // 不过期
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
    shouldSkip = defaultShouldSkip,
  } = options;

  // 获取或创建缓存实例（基于配置生成唯一键）
  const cacheKey = JSON.stringify({
    maxSize,
    ttl,
    cacheControl,
    maxAge,
  });
  if (!cacheInstances.has(cacheKey)) {
    cacheInstances.set(cacheKey, new ResponseCache({ maxSize, ttl }));
  }
  const cache = cacheInstances.get(cacheKey)!;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 如果应该跳过，直接执行下一个中间件
    if (shouldSkip(ctx)) {
      await next();
      // 如果响应已创建，添加跳过标记
      if (ctx.response) {
        ctx.response.headers.set(
          "Cache-Control",
          "no-cache, no-store, must-revalidate",
        );
        ctx.response.headers.set("X-Cache", "SKIP");
      }
      return;
    }

    // 生成缓存键
    const cacheKey = keyGenerator(ctx);

    // 检查条件请求（If-None-Match、If-Modified-Since）
    const ifNoneMatch = ctx.headers.get("If-None-Match");
    const ifModifiedSince = ctx.headers.get("If-Modified-Since");

    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      // 检查 ETag（优先级高于 Last-Modified）
      if (etag && cached.etag && ifNoneMatch) {
        if (ifNoneMatch === cached.etag) {
          ctx.response = new Response(null, {
            status: 304,
            headers: cached.headers,
          });
          return;
        }
      }

      // 检查 Last-Modified（如果没有 ETag 或 ETag 不匹配）
      if (
        lastModified && cached.lastModified && ifModifiedSince
      ) {
        const modifiedSince = new Date(ifModifiedSince).getTime();
        const cachedModified = cached.lastModified.getTime();
        if (cachedModified <= modifiedSince) {
          ctx.response = new Response(null, {
            status: 304,
            headers: cached.headers,
          });
          return;
        }
      }

      // 返回缓存的响应
      const responseHeaders = new Headers(cached.headers);
      responseHeaders.set("X-Cache", "HIT");
      ctx.response = new Response(cached.body as BodyInit, {
        status: cached.status,
        headers: responseHeaders,
      });
      return;
    }

    // 缓存未命中，执行下一个中间件
    await next();

    // 如果响应已创建，检查是否应该缓存
    if (ctx.response && shouldCache(ctx, ctx.response)) {
      // 克隆响应以便读取和缓存
      const responseClone = ctx.response.clone();
      const body = await responseClone.arrayBuffer();
      const bodyBytes = new Uint8Array(body);

      // 生成 ETag
      const etagValue = etag ? generateETag(bodyBytes) : undefined;

      // 获取 Last-Modified（从响应头或使用当前时间）
      let lastModifiedValue: Date | undefined;
      if (lastModified) {
        const lastModifiedHeader = ctx.response.headers.get("Last-Modified");
        lastModifiedValue = lastModifiedHeader
          ? new Date(lastModifiedHeader)
          : new Date();
      }

      // 构建缓存响应头
      const cacheHeaders = new Headers(ctx.response.headers);
      if (etag && etagValue) {
        cacheHeaders.set("ETag", etagValue);
      }
      if (lastModified && lastModifiedValue) {
        cacheHeaders.set("Last-Modified", lastModifiedValue.toUTCString());
      }
      cacheHeaders.set("Cache-Control", `${cacheControl}, max-age=${maxAge}`);
      cacheHeaders.set("X-Cache", "MISS");

      // 存入缓存
      cache.set(cacheKey, {
        body: bodyBytes,
        status: ctx.response.status,
        headers: cacheHeaders,
        etag: etagValue,
        lastModified: lastModifiedValue,
      });

      // 更新原始响应的头
      for (const [key, value] of cacheHeaders.entries()) {
        ctx.response.headers.set(key, value);
      }
    } else if (ctx.response) {
      // 不应该缓存，但添加 Cache-Control 头
      ctx.response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate",
      );
      ctx.response.headers.set("X-Cache", "SKIP");
    }
  };
}

/**
 * 获取与给定配置对应的响应缓存实例的统计信息。
 *
 * 通过 options 中的 maxSize、ttl 匹配创建时的配置，返回该实例的 size、count、maxSize、usage。
 *
 * @param options - 与创建 responseCache 时相同的配置子集（至少 maxSize、ttl 用于匹配）
 * @returns 统计对象；若未找到对应实例则返回全 0
 */
export function getResponseCacheStats(
  options: ResponseCacheOptions = {},
): {
  size: number;
  count: number;
  maxSize: number;
  usage: number;
} {
  const cacheKey = JSON.stringify({
    maxSize: options.maxSize || 100 * 1024 * 1024,
    ttl: options.ttl || 0,
  });
  const cache = cacheInstances.get(cacheKey);
  if (cache) {
    return cache.getStats();
  }
  return {
    size: 0,
    count: 0,
    maxSize: 0,
    usage: 0,
  };
}

/**
 * 清空响应缓存。
 *
 * 传入与创建时相同的 options 则只清空该配置对应的实例；不传则清空所有 responseCache 实例。
 *
 * @param options - 可选；若传入则仅清空匹配该配置的缓存实例，否则清空全部
 */
export function clearResponseCache(
  options?: ResponseCacheOptions,
): void {
  if (options) {
    const cacheKey = JSON.stringify({
      maxSize: options.maxSize || 100 * 1024 * 1024,
      ttl: options.ttl || 0,
    });
    const cache = cacheInstances.get(cacheKey);
    if (cache) {
      cache.clear();
    }
  } else {
    // 清空所有缓存实例
    for (const cache of cacheInstances.values()) {
      cache.clear();
    }
  }
}
