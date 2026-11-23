/**
 * @module @dreamer/middlewares/security-headers
 *
 * Security headers middleware. Sets HTTP security response headers. Exports
 * securityHeaders, DynamicSecurityPolicy, and SecurityHeadersOptions.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";
import { $tr } from "./i18n.ts";

/**
 * Function that returns security header config per request (e.g. CSP) from HttpContext.
 */
export type DynamicSecurityPolicy = (
  ctx: HttpContext,
) => Partial<SecurityHeadersOptions> | Promise<Partial<SecurityHeadersOptions>>;

/**
 * Options for security headers middleware (frame options, CSP, HSTS, etc.).
 */
export interface SecurityHeadersOptions {
  /** 是否启用 X-Frame-Options（默认：true） */
  frameOptions?: boolean | "DENY" | "SAMEORIGIN";
  /** 是否启用 X-Content-Type-Options（默认：true） */
  contentTypeOptions?: boolean;
  /** 是否启用 X-XSS-Protection（默认：true） */
  xssProtection?: boolean | "0" | "1" | "1; mode=block";
  /** 是否启用 Referrer-Policy（默认：true） */
  referrerPolicy?: boolean | string;
  /** 是否启用 Content-Security-Policy（默认：false） */
  contentSecurityPolicy?: boolean | string;
  /** 是否启用 Strict-Transport-Security（默认：false，仅 HTTPS） */
  strictTransportSecurity?: boolean | string;
  /** 是否启用 Permissions-Policy（默认：false） */
  permissionsPolicy?: boolean | string;
  /** 是否启用 Cross-Origin-Embedder-Policy（默认：false） */
  crossOriginEmbedderPolicy?: boolean | "require-corp" | "credentialless";
  /** 是否启用 Cross-Origin-Opener-Policy（默认：false） */
  crossOriginOpenerPolicy?:
    | boolean
    | "same-origin"
    | "same-origin-allow-popups"
    | "unsafe-none";
  /** 是否启用 Cross-Origin-Resource-Policy（默认：false） */
  crossOriginResourcePolicy?:
    | boolean
    | "same-origin"
    | "same-site"
    | "cross-origin";
  /** 是否启用 X-DNS-Prefetch-Control（默认：false） */
  dnsPrefetchControl?: boolean | "on" | "off";
  /** 是否启用 X-Download-Options（默认：false，仅 IE） */
  downloadOptions?: boolean;
  /** 是否启用 X-Permitted-Cross-Domain-Policies（默认：false） */
  permittedCrossDomainPolicies?:
    | boolean
    | "none"
    | "master-only"
    | "by-content-type"
    | "all";
  /** 动态安全策略函数（根据请求动态调整安全头） */
  dynamicPolicy?: DynamicSecurityPolicy;
  /** 是否验证安全头配置（默认：false） */
  validateConfig?: boolean;
}

/**
 * 验证安全头配置
 *
 * @param options 安全头配置选项
 * @throws 如果配置无效
 */
function validateSecurityHeadersConfig(
  options: SecurityHeadersOptions,
): void {
  // 验证 CSP 配置（如果启用）
  if (
    options.contentSecurityPolicy &&
    typeof options.contentSecurityPolicy === "string"
  ) {
    // 基本验证：检查是否包含必要的指令
    const csp = options.contentSecurityPolicy.toLowerCase();
    if (!csp.includes("default-src") && !csp.includes("script-src")) {
      console.warn($tr("middlewares.securityHeaders.cspRecommendation"));
    }
  }

  // 验证 COEP 和 COOP 的组合
  if (
    options.crossOriginEmbedderPolicy &&
    options.crossOriginOpenerPolicy !== "same-origin"
  ) {
    console.warn($tr("middlewares.securityHeaders.coepCoopRecommendation"));
  }
}

/**
 * 创建安全头中间件
 *
 * @param options 安全头配置选项
 * @returns 安全头中间件函数
 *
 * @example
 * ```typescript
 * import { securityHeaders } from "@dreamer/server";
 *
 * // 使用默认配置
 * app.use(securityHeaders());
 *
 * // 自定义配置
 * app.use(securityHeaders({
 *   frameOptions: "SAMEORIGIN",
 *   contentSecurityPolicy: "default-src 'self'",
 *   crossOriginEmbedderPolicy: "require-corp",
 * }));
 *
 * // 动态安全策略
 * app.use(securityHeaders({
 *   dynamicPolicy: (ctx) => {
 *     if (ctx.path.startsWith("/api")) {
 *       return { contentSecurityPolicy: false };
 *     }
 *     return {};
 *   },
 * }));
 * ```
 */
export function securityHeaders(
  options: SecurityHeadersOptions = {},
): Middleware<HttpContext> {
  // 验证配置（如果启用）
  if (options.validateConfig) {
    validateSecurityHeadersConfig(options);
  }

  const { dynamicPolicy } = options;
  // 无动态策略时在启动阶段预计算响应头列表，请求路径只做写入
  const staticHeaderList = buildSecurityHeaderList(options);

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 先执行下一个中间件
    await next();

    // 如果没有响应，直接返回
    if (!ctx.response) {
      return;
    }

    const headerList = dynamicPolicy
      ? buildSecurityHeaderList({
        ...options,
        ...(await dynamicPolicy(ctx)),
      })
      : staticHeaderList;

    // 创建新的响应头
    const headers = new Headers(ctx.response.headers);
    const isHttps = ctx.url.protocol === "https:";
    for (const [name, value] of headerList) {
      if (name === "Strict-Transport-Security" && !isHttps) {
        continue;
      }
      headers.set(name, value);
    }

    // 更新响应
    ctx.response = new Response(ctx.response.body, {
      status: ctx.response.status,
      statusText: ctx.response.statusText,
      headers,
    });
  };
}

/**
 * 根据配置生成要写入的安全头列表（HSTS 是否实际写入仍取决于请求是否 HTTPS）。
 */
function buildSecurityHeaderList(
  finalOptions: SecurityHeadersOptions,
): Array<[string, string]> {
  const headers: Array<[string, string]> = [];

  const frameOptions = finalOptions.frameOptions ?? true;
  if (frameOptions) {
    headers.push([
      "X-Frame-Options",
      frameOptions === true ? "DENY" : frameOptions,
    ]);
  }

  const contentTypeOptions = finalOptions.contentTypeOptions ?? true;
  if (contentTypeOptions) {
    headers.push(["X-Content-Type-Options", "nosniff"]);
  }

  const xssProtection = finalOptions.xssProtection ?? true;
  if (xssProtection) {
    headers.push([
      "X-XSS-Protection",
      xssProtection === true ? "1; mode=block" : xssProtection,
    ]);
  }

  const referrerPolicy = finalOptions.referrerPolicy ?? true;
  if (referrerPolicy) {
    headers.push([
      "Referrer-Policy",
      referrerPolicy === true
        ? "strict-origin-when-cross-origin"
        : referrerPolicy,
    ]);
  }

  const contentSecurityPolicy = finalOptions.contentSecurityPolicy ?? false;
  if (contentSecurityPolicy) {
    headers.push([
      "Content-Security-Policy",
      contentSecurityPolicy === true
        ? "default-src 'self'"
        : contentSecurityPolicy,
    ]);
  }

  const strictTransportSecurity = finalOptions.strictTransportSecurity ?? false;
  if (strictTransportSecurity) {
    headers.push([
      "Strict-Transport-Security",
      strictTransportSecurity === true
        ? "max-age=31536000; includeSubDomains"
        : strictTransportSecurity,
    ]);
  }

  const permissionsPolicy = finalOptions.permissionsPolicy ?? false;
  if (permissionsPolicy) {
    headers.push([
      "Permissions-Policy",
      permissionsPolicy === true
        ? "geolocation=(), microphone=(), camera=()"
        : permissionsPolicy,
    ]);
  }

  const crossOriginEmbedderPolicy = finalOptions.crossOriginEmbedderPolicy ??
    false;
  if (crossOriginEmbedderPolicy) {
    headers.push([
      "Cross-Origin-Embedder-Policy",
      crossOriginEmbedderPolicy === true
        ? "require-corp"
        : crossOriginEmbedderPolicy,
    ]);
  }

  const crossOriginOpenerPolicy = finalOptions.crossOriginOpenerPolicy ?? false;
  if (crossOriginOpenerPolicy) {
    headers.push([
      "Cross-Origin-Opener-Policy",
      crossOriginOpenerPolicy === true
        ? "same-origin"
        : crossOriginOpenerPolicy,
    ]);
  }

  const crossOriginResourcePolicy = finalOptions.crossOriginResourcePolicy ??
    false;
  if (crossOriginResourcePolicy) {
    headers.push([
      "Cross-Origin-Resource-Policy",
      crossOriginResourcePolicy === true
        ? "same-origin"
        : crossOriginResourcePolicy,
    ]);
  }

  const dnsPrefetchControl = finalOptions.dnsPrefetchControl ?? false;
  if (dnsPrefetchControl) {
    headers.push([
      "X-DNS-Prefetch-Control",
      dnsPrefetchControl === true ? "on" : dnsPrefetchControl,
    ]);
  }

  const downloadOptions = finalOptions.downloadOptions ?? false;
  if (downloadOptions) {
    headers.push(["X-Download-Options", "noopen"]);
  }

  const permittedCrossDomainPolicies =
    finalOptions.permittedCrossDomainPolicies ?? false;
  if (permittedCrossDomainPolicies) {
    headers.push([
      "X-Permitted-Cross-Domain-Policies",
      permittedCrossDomainPolicies === true
        ? "none"
        : permittedCrossDomainPolicies,
    ]);
  }

  return headers;
}
