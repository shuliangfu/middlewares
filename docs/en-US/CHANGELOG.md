# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.2] - 2026-02-19

### Added

- **Internationalization (i18n)**:
  - `src/i18n.ts`: `detectLocale()`, `setMiddlewaresLocale()`, `$tr()`; locale
    from `LANGUAGE` / `LC_ALL` / `LANG`.
  - `src/locales/en-US.json` and `src/locales/zh-CN.json` for all user-facing
    messages.
  - Request signature, compression, security-headers, request-validator, csrf,
    error-handler, performance-analyzer, and static-files middleware now use
    `$tr()` for error and log messages.
  - Exported `detectLocale`, `setMiddlewaresLocale`, and `Locale` from the main
    entry.

---

## [1.0.1] - 2026-02-11

### Added

- CI workflow (`.github/workflows/ci.yml`) for test/check/lint on Linux, macOS,
  and Windows (push/PR to `dev`).
- Documentation structure: `docs/en-US/` and `docs/zh-CN/` with CHANGELOG,
  TEST_REPORT, and zh-CN README.

### Changed

- JSR documentation: added `@module` JSDoc to all 19 entrypoints; added or
  completed symbol JSDoc for exports to improve JSR doc score.
- Test report updated: 209 tests (was 192), execution ~12s; test date
  2026-02-11.

---

## [1.0.0] - 2026-02-06

### Added

First stable release. HTTP middleware library compatible with Deno and Bun,
providing 17 ready-to-use middlewares that integrate with @dreamer/server or any
HttpContext-compatible framework.

#### Request Handling

- **Body Parser** (`bodyParser`): JSON, URL-encoded form, text, and raw body
  parsing with configurable size limits
- **Request Validator** (`requestValidator`): Request body, query, and header
  validation with size limits
- **Request Signature** (`requestSignature`, `generateRequestSignature`): HMAC
  request signature verification and client-side signature generation

#### CORS & Security

- **CORS** (`cors`): Cross-origin configuration (origin, methods, credentials,
  preflight)
- **CSRF** (`csrf`): CSRF protection with dual cookie/header verification
- **Security Headers** (`securityHeaders`): CSP, HSTS, X-Frame-Options, COEP,
  COOP, CORP, and other security headers

#### Observability & Rate Limiting

- **Request ID** (`requestId`): Request ID generation and storage in `ctx.state`
- **Request Logger** (`requestLogger`): Request and response logging with
  customizable format
- **Metrics** (`metrics`): Request count, latency, status code distribution with
  `getMetricsStats` and `resetMetrics`
- **Performance Analyzer** (`performanceAnalyzer`): Middleware duration analysis
  with `clearPerformanceData` and `getPerformanceStats`
- **Rate Limit** (`rateLimit`): In-memory rate limiting with configurable window
  and key

#### Response & Resources

- **Compression** (`compression`): gzip and brotli response compression with
  configurable level and thresholds
- **Response Cache** (`responseCache`): Response caching with ETag,
  Last-Modified, and configurable TTL
- **Static Files** (`staticFiles`): Static file serving with LRU file cache
- **Timeout** (`timeout`): Request timeout handling

#### Error & Health

- **Error Handler** (`errorHandler`): Unified error handling and JSON formatting
  for dev and production
- **Health Check** (`healthCheck`): Health check endpoint with configurable path
  and response

#### Type Exports

- `BodyParserOptions`, `CompressionOptions`, `CorsOptions`, `CsrfOptions`,
  `CsrfTokenGenerator`
- `ErrorHandlerOptions`, `HealthCheckOptions`, `MetricsOptions`,
  `PerformanceAnalyzerOptions`
- `RateLimitOptions`, `RequestIdOptions`, `RequestLoggerOptions`,
  `RequestSignatureOptions`, `HmacAlgorithm`
- `RequestValidatorOptions`, `ValidationRule`, `ResponseCacheOptions`
- `SecurityHeadersOptions`, `DynamicSecurityPolicy`, `StaticFilesOptions`,
  `TimeoutOptions`
