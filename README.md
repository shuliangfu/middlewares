# @dreamer/middlewares

> HTTP middleware library compatible with Deno and Bun. Provides 17 ready-to-use
> middlewares that integrate seamlessly with @dreamer/server or any
> HttpContext-compatible framework.

English | [中文 (Chinese)](./docs/zh-CN/README.md)

[![JSR](https://jsr.io/badges/@dreamer/middlewares)](https://jsr.io/@dreamer/middlewares)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-209%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

---

## 🎯 Features

Provides 17 ready-to-use HTTP middlewares covering request parsing, CORS,
security, rate limiting, logging, caching, static files, and more. Integrates
seamlessly with @dreamer/server or any HttpContext-compatible framework.

---

## 📦 Installation

### Deno

```bash
deno add jsr:@dreamer/middlewares
```

### Bun

```bash
bunx jsr add @dreamer/middlewares
```

---

## 🌍 Environment Compatibility

| Environment      | Version | Status                                                                                   |
| ---------------- | ------- | ---------------------------------------------------------------------------------------- |
| **Deno**         | 2.6+    | ✅ Fully supported                                                                       |
| **Bun**          | 1.3.5+  | ✅ Fully supported                                                                       |
| **Server**       | -       | ✅ Supported (works with Deno and Bun, requires @dreamer/server or compatible framework) |
| **Client**       | -       | ❌ N/A (server-side HTTP middlewares only)                                               |
| **Dependencies** | -       | 📦 @dreamer/server (types), @dreamer/middleware, @dreamer/logger, etc.                   |

---

## ✨ Capabilities

- **Request handling**:
  - body-parser: JSON, URL-encoded form, text, raw parsing
  - request-validator: Request body/query/header validation and size limits
  - request-signature: HMAC request signature verification
- **CORS & security**:
  - cors: CORS configuration (origin, methods, credentials, preflight)
  - csrf: CSRF protection (dual cookie / header verification)
  - security-headers: CSP, HSTS, X-Frame-Options, and other security headers
- **Observability & rate limiting**:
  - request-id: Request ID (stored in ctx.state)
  - request-logger: Request/response logging
  - metrics: Request count, latency, status code distribution
  - performance-analyzer: Middleware duration analysis
  - rate-limit: In-memory rate limiting
- **Response & resources**:
  - compression: gzip/brotli response compression
  - response-cache: Response caching with ETag/Last-Modified
  - static-files: Static file serving (with LRU file cache)
  - timeout: Request timeout
- **Error & health**:
  - error-handler: Unified error handling and formatting
  - health-check: Health check endpoint

---

## 🎯 Use Cases

- Use with @dreamer/server or any HttpContext-compatible framework
- Add CORS, CSRF, security headers, rate limiting, and request logging to HTTP
  apps
- Parse request body, validate requests, verify signatures
- Serve static files, response cache, compression, timeout, and health checks
- Unified error response format and error logging (including
  ctx.state.requestId)

---

## 🚀 Quick Start

```typescript
import { Server } from "@dreamer/server";
import {
  bodyParser,
  cors,
  requestId,
  requestLogger,
} from "@dreamer/middlewares";

const server = new Server({ port: 3000 });

server.use(requestId());
server.use(
  requestLogger({ skip: (ctx) => ctx.path.startsWith("/.well-known/") }),
);
server.use(cors({ origin: "*" }));
server.use(bodyParser());

await server.start();
```

---

## 🎨 Examples

### Error handling and health check

```typescript
import { Http } from "@dreamer/server";
import { errorHandler, healthCheck } from "@dreamer/middlewares";

const app = new Http();
app.use(healthCheck({ path: "/health" }));
app.useError(errorHandler({ isDev: false }));
```

### Rate limiting and request signature

```typescript
import {
  generateRequestSignature,
  rateLimit,
  requestSignature,
} from "@dreamer/middlewares";

app.use(rateLimit({ max: 100, windowMs: 60000 }));
app.use(requestSignature({
  secret: "your-secret",
  getRawBody: (ctx) => Promise.resolve(JSON.stringify(ctx.body ?? "")),
}));
// Client can use generateRequestSignature to generate signatures
```

### Static files and response cache

```typescript
import { responseCache, staticFiles } from "@dreamer/middlewares";

app.use(staticFiles({ root: "./public", prefix: "/static" }));
app.use(responseCache({ ttl: 60, shouldCache: (ctx) => ctx.method === "GET" }));
```

---

## 📚 API Reference

### Built-in middlewares

| Middleware           | Export Name                                    | Description                                                    |
| -------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| Body Parser          | `bodyParser`                                   | Parse JSON/form/text/raw                                       |
| Compression          | `compression`                                  | gzip/brotli response compression                               |
| CORS                 | `cors`                                         | Cross-origin                                                   |
| CSRF                 | `csrf`                                         | CSRF protection                                                |
| Error Handler        | `errorHandler`                                 | Unified error handling (ErrorMiddleware)                       |
| Health Check         | `healthCheck`                                  | Health check                                                   |
| Metrics              | `metrics`                                      | Request metrics, getMetricsStats/resetMetrics                  |
| Performance Analyzer | `performanceAnalyzer`                          | Performance analysis, clearPerformanceData/getPerformanceStats |
| Rate Limit           | `rateLimit`                                    | Rate limiting                                                  |
| Request ID           | `requestId`                                    | Request ID (writes to ctx.state)                               |
| Request Logger       | `requestLogger`                                | Request logging                                                |
| Request Signature    | `requestSignature`, `generateRequestSignature` | Request signature verification and generation                  |
| Request Validator    | `requestValidator`                             | Request validation                                             |
| Response Cache       | `responseCache`                                | Response cache, clearResponseCache/getResponseCacheStats       |
| Security Headers     | `securityHeaders`                              | Security headers                                               |
| Static Files         | `staticFiles`                                  | Static files                                                   |
| Timeout              | `timeout`                                      | Request timeout                                                |

### Type exports

- `BodyParserOptions`, `CompressionOptions`, `CorsOptions`, `CsrfOptions`,
  `CsrfTokenGenerator`
- `ErrorHandlerOptions`, `HealthCheckOptions`, `MetricsOptions`,
  `PerformanceAnalyzerOptions`
- `RateLimitOptions`, `RequestIdOptions`, `RequestLoggerOptions`,
  `RequestSignatureOptions`, `HmacAlgorithm`
- `RequestValidatorOptions`, `ValidationRule`, `ResponseCacheOptions`
- `SecurityHeadersOptions`, `DynamicSecurityPolicy`, `StaticFilesOptions`,
  `TimeoutOptions`

---

## 📝 Changelog

- **v1.0.2** (2026-02-19): Added i18n (en-US / zh-CN) for middleware messages;
  `detectLocale`, `setMiddlewaresLocale`, `Locale` exported.
  [Full changelog](./docs/en-US/CHANGELOG.md)

---

## 📊 Test Report

- **Total tests**: 209
- **Passed**: 209 ✅
- **Failed**: 0
- **Pass rate**: 100%
- **Test date**: 2026-02-11
- **Details**: [TEST_REPORT.md](./docs/en-US/TEST_REPORT.md)

---

## 📝 Notes

- This library provides middleware implementations only. It must be used with
  @dreamer/server or a framework compatible with `Middleware<HttpContext>`.
- Request ID is stored in `ctx.state.requestId`; error handler and other
  middlewares read from there.
- Static files, response cache, etc. use @dreamer/runtime-adapter for Deno/Bun
  compatibility.
- Some middlewares (e.g. request-logger, error-handler) accept an optional
  `logger`; otherwise they use the default createLogger().

---

## 🤝 Contributing

Issues and Pull Requests are welcome.

---

## 📄 License

Apache License 2.0 - see [LICENSE](./LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
