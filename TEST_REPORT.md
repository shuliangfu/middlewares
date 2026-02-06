# @dreamer/middlewares Test Report

## 📊 Test Overview

- **Test Library Version**: @dreamer/test@^1.0.0-beta.40
- **Runtime Adapter**: @dreamer/runtime-adapter@^1.0.0-beta.22
- **Test Framework**: @dreamer/test (compatible with Deno and Bun)
- **Test Date**: 2026-02-03
- **Test Environment**:
  - Deno 2.6+
  - Bun 1.3.5

---

## 📈 Test Results

### Overall Statistics

- **Total Tests**: 192
- **Passed**: 192 ✅
- **Failed**: 0
- **Pass Rate**: 100% ✅
- **Execution Time**: ~4–5s
- **Test Files**: 17

### Test File Statistics

| # | Test File | Tests | Status |
|---|-----------|-------|--------|
| 1 | `body-parser.test.ts` | 7 | ✅ All passed |
| 2 | `compression.test.ts` | 7 | ✅ All passed |
| 3 | `cors.test.ts` | 8 | ✅ All passed |
| 4 | `csrf.test.ts` | 15 | ✅ All passed |
| 5 | `error-handler.test.ts` | 9 | ✅ All passed |
| 6 | `health-check.test.ts` | 7 | ✅ All passed |
| 7 | `metrics.test.ts` | 18 | ✅ All passed |
| 8 | `performance-analyzer.test.ts` | 13 | ✅ All passed |
| 9 | `rate-limit.test.ts` | 6 | ✅ All passed |
| 10 | `request-id.test.ts` | 11 | ✅ All passed |
| 11 | `request-logger.test.ts` | 5 | ✅ All passed |
| 12 | `request-signature.test.ts` | 17 | ✅ All passed |
| 13 | `request-validator.test.ts` | 15 | ✅ All passed |
| 14 | `response-cache.test.ts` | 20 | ✅ All passed |
| 15 | `security-headers.test.ts` | 14 | ✅ All passed |
| 16 | `static-files.test.ts` | 15 | ✅ All passed |
| 17 | `timeout.test.ts` | 5 | ✅ All passed |

---

## 🔍 Functional Test Details

### 1. Body Parser Middleware (body-parser.test.ts) - 7 tests

- ✅ JSON parsing, invalid JSON handling
- ✅ URL-encoded form parsing, text request body parsing
- ✅ Custom JSON/form/text size limits

### 2. Compression Middleware (compression.test.ts) - 7 tests

- ✅ Create compression middleware, gzip/brotli compression
- ✅ Skip compression for non-compressible responses
- ✅ Custom compression level, file type filter, size threshold

### 3. CORS Middleware (cors.test.ts) - 8 tests

- ✅ Create CORS middleware, OPTIONS preflight, add CORS headers
- ✅ Custom origin, methods, allowed headers, credentials, maxAge

### 4. CSRF Protection Middleware (csrf.test.ts) - 15 tests

- ✅ Create middleware, GET token generation, skip safe methods
- ✅ Verify POST token, header/form field token, reject invalid token
- ✅ Custom cookie/header/form field names, token generation, shouldSkip/shouldVerify, error messages, cookie options

### 5. Error Handler Middleware (error-handler.test.ts) - 9 tests

- ✅ Create error handler middleware, sync/async error handling
- ✅ Custom formatError, includeDetails, dev mode, error fix suggestions
- ✅ JSON response formatting in dev/production mode

### 6. Health Check Middleware (health-check.test.ts) - 7 tests

- ✅ Create health check middleware, respond to health check, ignore non-health-check paths
- ✅ Custom path, response body, status code, check function

### 7. Metrics Middleware (metrics.test.ts) - 18 tests

- ✅ Create Metrics middleware, request statistics, status code distribution
- ✅ Custom path, shouldSkip, getMetricsStats, resetMetrics
- ✅ Multi-request accumulation, latency statistics

### 8. Performance Analyzer Middleware (performance-analyzer.test.ts) - 13 tests

- ✅ Create performance analyzer middleware, record duration, clearPerformanceData, getPerformanceStats
- ✅ Custom shouldSkip, multi-middleware chain duration

### 9. Rate Limit Middleware (rate-limit.test.ts) - 6 tests

- ✅ Create rate limit middleware, limit request count, window reset, custom key, skip

### 10. Request ID Middleware (request-id.test.ts) - 11 tests

- ✅ Create middleware, generate Request ID, write to response header, store in ctx.state
- ✅ Read existing ID from request header, custom header name, disable response header, custom generator, disable reading from request header
- ✅ Different IDs for multiple requests

### 11. Request Logger Middleware (request-logger.test.ts) - 5 tests

- ✅ Create request logger middleware, log request and response status code
- ✅ Custom log format, skip logging

### 12. Request Signature Middleware (request-signature.test.ts) - 17 tests

- ✅ Create signature verification middleware, reject missing signature/timestamp/invalid signature/expired/future timestamp
- ✅ Accept valid signature, custom algorithm/header names/expiry/timestamp tolerance/shouldSkip/error messages
- ✅ Signature generation, different signatures for different requests, query params and body in signature

### 13. Request Validator Middleware (request-validator.test.ts) - 15 tests

- ✅ Create validator middleware, unconfigured requests pass
- ✅ Request body size and URL length, query param count limits
- ✅ Required fields, field format, valid values, custom error messages, validator function returns error
- ✅ Custom/async custom validator functions, shouldSkip, custom error formatting

### 14. Response Cache Middleware (response-cache.test.ts) - 20 tests

- ✅ Create response cache middleware, cache GET, skip non-GET/HEAD, cache only 2xx
- ✅ ETag generation, If-None-Match, disable ETag
- ✅ Last-Modified, If-Modified-Since, disable Last-Modified
- ✅ public/private/no-cache policies, URL/query params/custom key based, shouldCache/shouldSkip
- ✅ Cache statistics, clear cache

### 15. Security Headers Middleware (security-headers.test.ts) - 14 tests

- ✅ Create security headers middleware, default security headers
- ✅ COEP, COOP, CORP, X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-Policies
- ✅ Dynamic/async dynamic security policies, config validation, COEP and COOP combination warning
- ✅ Disable default security headers, custom security header values

### 16. Static Files Middleware (static-files.test.ts) - 15 tests

- ✅ Create static files middleware, custom root directory and path prefix, serve static files
- ✅ Custom index file, cache control, ETag, Last-Modified
- ✅ Enable/disable memory cache, cache max size and TTL, fetch from cache, cache update on file change

### 17. Timeout Middleware (timeout.test.ts) - 5 tests

- ✅ Create timeout middleware, pass within timeout, return on timeout
- ✅ Custom error message, skip function

---

## 📊 Coverage Analysis

| Coverage Item | Description |
|---------------|-------------|
| **API Method Coverage** | ✅ All exported middleware factory functions (e.g. requestId, cors, bodyParser) have corresponding test files |
| **Config Options Coverage** | ✅ Main config options for each middleware (e.g. headerName, skip, limit, shouldCache) have test cases |
| **Edge Case Coverage** | ✅ Invalid JSON, missing signature, expired timestamp, timeout, large request body, conditional requests are all tested |
| **Error Handling Coverage** | ✅ Error handler middleware, rate limit/signature/validation failure responses, timeout responses are covered |
| **Runtime Compatibility** | ✅ Uses @dreamer/server HttpContext and CookieManager, compatible with Deno/Bun |

---

## ✅ Strengths

- Each built-in middleware has a dedicated test file, one-to-one with source code
- Tests cover creation, default behavior, config options, edge cases and error paths
- Uses unified createTestContext and @dreamer/server types for maintainability
- Request ID stored in ctx.state, consistent with error-handler and other middlewares
- Static files and response cache use @dreamer/runtime-adapter for cross-runtime support

---

## 📝 Conclusion

✅ **All 192 tests passed, 100% pass rate**

@dreamer/middlewares covers 17 built-in middlewares with tests for both functionality and configuration. It can be used with @dreamer/server or any framework compatible with HttpContext.

---

*Last updated: 2026-02-03*
