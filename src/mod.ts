/**
 * @module @dreamer/middlewares
 *
 * 内置 HTTP 中间件包入口。提供 body 解析、压缩、CORS、CSRF、错误处理、健康检查、
 * 指标、性能分析、限流、Request ID、请求日志、签名、校验、响应缓存、安全头、
 * 静态文件与超时等中间件，兼容 @dreamer/server 及基于 HttpContext 的框架。
 *
 * @see {@link bodyParser} - 请求体解析（JSON / 表单 / 文本 / 原始）
 * @see {@link compression} - 响应压缩（gzip / Brotli）
 * @see {@link cors} - 跨域
 * @see {@link errorHandler} - 统一错误处理
 * @see {@link requestId} - 请求 ID
 * @see {@link requestLogger} - 请求日志
 * @see {@link staticFiles} - 静态文件
 * @see {@link timeout} - 请求超时
 */

export { bodyParser, type BodyParserOptions } from "./body-parser.ts";
export { compression, type CompressionOptions } from "./compression.ts";
export { cors, type CorsOptions } from "./cors.ts";
export { csrf, type CsrfOptions, type CsrfTokenGenerator } from "./csrf.ts";
export { errorHandler, type ErrorHandlerOptions } from "./error-handler.ts";
export { healthCheck, type HealthCheckOptions } from "./health-check.ts";
export {
  getMetricsStats,
  metrics,
  type MetricsOptions,
  resetMetrics,
} from "./metrics.ts";
export {
  clearPerformanceData,
  getPerformanceStats,
  performanceAnalyzer,
  type PerformanceAnalyzerOptions,
} from "./performance-analyzer.ts";
export { rateLimit, type RateLimitOptions } from "./rate-limit.ts";
export { requestId, type RequestIdOptions } from "./request-id.ts";
export { requestLogger, type RequestLoggerOptions } from "./request-logger.ts";
export {
  generateRequestSignature,
  type HmacAlgorithm,
  requestSignature,
  type RequestSignatureOptions,
} from "./request-signature.ts";
export {
  requestValidator,
  type RequestValidatorOptions,
  type ValidationRule,
} from "./request-validator.ts";
export {
  clearResponseCache,
  getResponseCacheStats,
  responseCache,
  type ResponseCacheOptions,
} from "./response-cache.ts";
export {
  type DynamicSecurityPolicy,
  securityHeaders,
  type SecurityHeadersOptions,
} from "./security-headers.ts";
export { staticFiles, type StaticFilesOptions } from "./static-files.ts";
export { timeout, type TimeoutOptions } from "./timeout.ts";
export { detectLocale, type Locale, setMiddlewaresLocale } from "./i18n.ts";
