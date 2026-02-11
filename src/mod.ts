/**
 * @module @dreamer/middlewares
 *
 * Main entry point. Exports all built-in HTTP middlewares: body parser, compression,
 * CORS, CSRF, error handler, health check, metrics, performance analyzer, rate limit,
 * request id, request logger, request signature, request validator, response cache,
 * security headers, static files, and timeout. Compatible with @dreamer/server and
 * HttpContext-based frameworks.
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
