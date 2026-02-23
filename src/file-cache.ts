/**
 * 文件缓存实现（LRU Cache）
 *
 * 用于静态文件中间件的内存缓存，支持按容量淘汰与可选 TTL 过期。
 */

/**
 * 单条文件缓存项，包含内容、元数据及时间戳。
 */
interface CacheItem {
  /** 文件二进制内容 */
  content: Uint8Array;
  /** 文件元数据（大小、修改时间、Content-Type、ETag） */
  metadata: {
    /** 文件大小（字节） */
    size: number;
    /** 文件系统修改时间，用于校验是否过期 */
    mtime: number | Date | null;
    /** HTTP Content-Type */
    contentType: string;
    /** 用于条件请求的 ETag 值 */
    etag: string;
  };
  /** 写入缓存时的时间戳，用于 TTL 判断 */
  timestamp: number;
  /** 最近一次访问时间戳，用于 LRU 淘汰 */
  accessTime: number;
}

/**
 * LRU 文件缓存类。
 *
 * 基于最大容量与可选 TTL 的内存缓存，用于静态文件中间件。
 * 容量超限时按访问时间淘汰最久未使用的项；单条超过 maxSize 则不缓存。
 */
export class FileCache {
  /** 键到缓存项的映射 */
  private cache: Map<string, CacheItem>;
  /** 允许的最大缓存总大小（字节） */
  private maxSize: number;
  /** 当前已缓存内容总大小（字节） */
  private currentSize: number;
  /** 生存时间（毫秒），0 表示不按时间过期 */
  private ttl: number;

  /**
   * 创建文件缓存实例。
   *
   * @param options - 缓存配置；未传则使用默认 maxSize 50MB、ttl 0
   */
  constructor(options: {
    /** 最大缓存总大小（字节），默认 50MB */
    maxSize?: number;
    /** 生存时间（毫秒），0 表示不过期，默认 0 */
    ttl?: number;
  } = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB
    this.currentSize = 0;
    this.ttl = options.ttl || 0;
  }

  /**
   * 根据键获取缓存项。
   *
   * 若存在且未过期会更新 accessTime；若已过期则删除该键并返回 null。
   *
   * @param key - 缓存键（通常为文件路径）
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
   * 写入或覆盖一条缓存项。
   *
   * 若单条内容超过 maxSize 则不缓存；若当前容量不足会先按 LRU 淘汰再写入。
   * 若 key 已存在会先减去旧项大小再计入新项。
   *
   * @param key - 缓存键（通常为文件路径）
   * @param content - 文件二进制内容
   * @param metadata - 文件元数据（size、mtime、contentType、etag）
   */
  set(
    key: string,
    content: Uint8Array,
    metadata: CacheItem["metadata"],
  ): void {
    const contentSize = content.length;

    // 如果单个文件超过最大缓存大小，不缓存
    if (contentSize > this.maxSize) {
      return;
    }

    // 如果缓存已满，删除最久未使用的项（LRU）
    while (
      this.currentSize + contentSize > this.maxSize && this.cache.size > 0
    ) {
      this.evictLRU();
    }

    // 如果删除后仍然无法容纳，不缓存
    if (this.currentSize + contentSize > this.maxSize) {
      return;
    }

    // 如果键已存在，先删除旧项
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.content.length;
    }

    // 添加新项
    const now = Date.now();
    this.cache.set(key, {
      content,
      metadata,
      timestamp: now,
      accessTime: now,
    });
    this.currentSize += contentSize;
  }

  /**
   * 删除指定键的缓存项并释放其占用的容量。
   *
   * @param key - 要删除的缓存键；若不存在则无效果
   */
  delete(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.content.length;
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
   * 用于在 set 时容量不足时腾出空间；内部使用，不对外暴露。
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

  /**
   * 根据文件修改时间判断缓存是否已失效。
   *
   * 用于静态文件中间件在命中缓存前校验磁盘上的文件是否被修改。
   *
   * @param key - 缓存键
   * @param mtime - 当前文件的修改时间（来自 stat）
   * @returns 若 key 不存在或 mtime 与缓存中不一致则返回 true（视为过期）
   */
  isStale(key: string, mtime: number | Date | null): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return true;
    }

    const cachedMtime = item.metadata.mtime;
    const newMtime = mtime instanceof Date ? mtime.getTime() : (mtime || 0);
    const cachedMtimeValue = cachedMtime instanceof Date
      ? cachedMtime.getTime()
      : (cachedMtime || 0);

    return newMtime !== cachedMtimeValue;
  }
}
