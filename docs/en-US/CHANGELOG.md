# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.0] - 2026-07-23

### Added

- **Node.js 22+ compatibility**: Full support for Node.js 22+ alongside Deno and
  Bun. All `@dreamer/*` dependencies upgraded to Node-compatible versions
  (runtime-adapter ^1.2.2, server ^1.2.1, i18n ^1.1.2, middleware ^1.1.0, logger
  ^1.1.0, test ^1.2.3).
- **Node.js test infrastructure**: `test-node.mjs` runner (main-process execution,
  no fork/IPC), `tsconfig.json` (Bundler module resolution), `test:node` script
  in deno.json and package.json.
- **9-job CI matrix**: 3 Deno v2.9 + 3 Bun + 3 Node 22 (Linux/macOS/Windows).
  Upgraded from 6-job (Deno v2.5 + Bun only). No Chromium, no external services.
- `engines.node: ">=22"` in package.json.
- `minimumDependencyAge: "0"` in deno.json for global JSR dependency resolution.
- `.gitignore` ignores `package-lock.json`.

### Changed

- `deno.json` and `package.json` dependency versions synchronized (both use `^`
  ranges for `@dreamer/*` packages).
- Deno version in CI upgraded from v2.5 to v2.9.
- CI Deno test command includes `--minimum-dependency-age=0`.

### Notes

- **src is runtime-agnostic**: zero `Deno.*` API calls, zero `IS_NODE` checks —
  pure logic + cross-runtime Web API. No source code changes needed for Node.js
  support; all runtime differences are abstracted through `@dreamer/runtime-adapter`.
- Test assertions are locale-safe: `csrf.test.ts` and `request-validator.test.ts`
  use `setMiddlewaresLocale("en-US")` to lock English assertions (CI-safe).
- `performance-analyzer.ts` `location.reload()` is client-side `<script>` HTML
  output, not server-side code — no Node.js guard needed.
- `rate-limit.ts` `setInterval` type is implicitly inferred; `clearInterval` works
  across all runtimes.

---

## [1.0.4] - 2026-02-25

### Removed

- **i18n exports**: `detectLocale`, `setMiddlewaresLocale`, and `Locale` are no
  longer exported from the main entry. i18n remains used internally for
  middleware messages; use `@dreamer/i18n` directly if you need locale
  utilities.

---

## [1.0.3] - 2026-02-23

### Added

- **CI**: Bun test jobs (`test-linux-bun`, `test-macos-bun`, `test-windows-bun`)
  for Linux, macOS, and Windows; run `bun install` and `bun test tests/` to
  verify compatibility with Bun.

### Changed

- **Compression**: Brotli is now loaded via dynamic `import("brotli")` only when
  `compressBrotli()` is called (e.g. when compression middleware is used with
  `enableBrotli` and a request needs Brotli). This avoids loading the Brotli
  Emscripten bundle at module load time, fixing CI failures on Bun
  (Linux/macOS/Windows) with "(void 0) is not a function" when any code imports
  from `@dreamer/middlewares`.
- **JSDoc**: Expanded documentation for options and factory functions
  (compression, body-parser, cors, error-handler, request-id, request-logger,
  health-check, static-files, timeout, csrf, response-cache); added class and
  method JSDoc for `FileCache` and `ResponseCache` (and internal `CacheItem`);
  improved module doc in main entry with `@see` links.

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
