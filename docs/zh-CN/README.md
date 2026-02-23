# @dreamer/middlewares

> 兼容 Deno 和 Bun 的 HTTP 中间件包，提供 17 个开箱即用中间件，可与
> @dreamer/server 或 HttpContext 兼容框架无缝集成

[English](../../README.md) | 中文 (Chinese)

[![JSR](https://jsr.io/badges/@dreamer/middlewares)](https://jsr.io/@dreamer/middlewares)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-209%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 功能

提供 17 个开箱即用的 HTTP
中间件，涵盖请求解析、跨域、安全、限流、日志、缓存、静态文件等场景，可与
@dreamer/server 或任意 HttpContext 兼容框架无缝集成。

---

## 📦 安装

### Deno

```bash
deno add jsr:@dreamer/middlewares
```

### Bun

```bash
bunx jsr add @dreamer/middlewares
```

---

## 🌍 环境兼容性

| 环境       | 版本要求 | 状态                                                                |
| ---------- | -------- | ------------------------------------------------------------------- |
| **Deno**   | 2.6+     | ✅ 完全支持                                                         |
| **Bun**    | 1.3.5+   | ✅ 完全支持                                                         |
| **服务端** | -        | ✅ 支持（兼容 Deno 和 Bun，需配合 @dreamer/server 或兼容框架使用）  |
| **客户端** | -        | ❌ 不适用（仅服务端 HTTP 中间件）                                   |
| **依赖**   | -        | 📦 @dreamer/server（类型）、@dreamer/middleware、@dreamer/logger 等 |

---

## ✨ 特性

- **请求处理**：
  - body-parser：JSON、URL 编码表单、文本、raw 解析
  - request-validator：请求体/查询/头校验与大小限制
  - request-signature：HMAC 请求签名校验
- **跨域与安全**：
  - cors：跨域配置（origin、methods、credentials、预检）
  - csrf：CSRF 防护（双 cookie / header 校验）
  - security-headers：CSP、HSTS、X-Frame-Options 等安全头
- **可观测与限流**：
  - request-id：请求 ID（统一存于 ctx.state）
  - request-logger：请求/响应日志
  - metrics：请求数、延迟、状态码分布
  - performance-analyzer：中间件耗时分析
  - rate-limit：内存限流
- **响应与资源**：
  - compression：gzip/brotli 响应压缩
  - response-cache：响应缓存与 ETag/Last-Modified
  - static-files：静态文件服务（含 LRU 文件缓存）
  - timeout：请求超时
- **错误与健康**：
  - error-handler：统一错误处理与格式化
  - health-check：健康检查端点

---

## 🎯 使用场景

- 与 @dreamer/server 或兼容 HttpContext 的框架一起使用
- 为 HTTP 应用添加 CORS、CSRF、安全头、限流、请求日志
- 解析请求体、校验请求、验证签名
- 提供静态文件、响应缓存、压缩、超时与健康检查
- 统一错误响应格式与错误日志（含 ctx.state.requestId）

---

## 🚀 快速开始

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

## 🎨 使用示例

### 错误处理与健康检查

```typescript
import { Http } from "@dreamer/server";
import { errorHandler, healthCheck } from "@dreamer/middlewares";

const app = new Http();
app.use(healthCheck({ path: "/health" }));
app.useError(errorHandler({ isDev: false }));
```

### 限流与请求签名

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
// 客户端可使用 generateRequestSignature 生成签名
```

### 静态文件与响应缓存

```typescript
import { responseCache, staticFiles } from "@dreamer/middlewares";

app.use(staticFiles({ root: "./public", prefix: "/static" }));
app.use(responseCache({ ttl: 60, shouldCache: (ctx) => ctx.method === "GET" }));
```

---

## 📚 API 文档

### 内置中间件一览

| 中间件               | 导出名                                         | 说明                                               |
| -------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Body Parser          | `bodyParser`                                   | 解析 JSON/表单/文本/raw                            |
| Compression          | `compression`                                  | gzip/brotli 响应压缩                               |
| CORS                 | `cors`                                         | 跨域                                               |
| CSRF                 | `csrf`                                         | CSRF 防护                                          |
| Error Handler        | `errorHandler`                                 | 统一错误处理（ErrorMiddleware）                    |
| Health Check         | `healthCheck`                                  | 健康检查                                           |
| Metrics              | `metrics`                                      | 请求指标，getMetricsStats/resetMetrics             |
| Performance Analyzer | `performanceAnalyzer`                          | 性能分析，clearPerformanceData/getPerformanceStats |
| Rate Limit           | `rateLimit`                                    | 限流                                               |
| Request ID           | `requestId`                                    | 请求 ID（写入 ctx.state）                          |
| Request Logger       | `requestLogger`                                | 请求日志                                           |
| Request Signature    | `requestSignature`、`generateRequestSignature` | 请求签名校验与生成                                 |
| Request Validator    | `requestValidator`                             | 请求校验                                           |
| Response Cache       | `responseCache`                                | 响应缓存，clearResponseCache/getResponseCacheStats |
| Security Headers     | `securityHeaders`                              | 安全头                                             |
| Static Files         | `staticFiles`                                  | 静态文件                                           |
| Timeout              | `timeout`                                      | 请求超时                                           |

### 类型导出

- `BodyParserOptions`、`CompressionOptions`、`CorsOptions`、`CsrfOptions`、`CsrfTokenGenerator`
- `ErrorHandlerOptions`、`HealthCheckOptions`、`MetricsOptions`、`PerformanceAnalyzerOptions`
- `RateLimitOptions`、`RequestIdOptions`、`RequestLoggerOptions`、`RequestSignatureOptions`、`HmacAlgorithm`
- `RequestValidatorOptions`、`ValidationRule`、`ResponseCacheOptions`
- `SecurityHeadersOptions`、`DynamicSecurityPolicy`、`StaticFilesOptions`、`TimeoutOptions`

---

## 📝 变更日志

- **v1.0.3**（2026-02-23）：新增 CI Bun 测试（Linux/macOS/Windows）；Brotli
  延迟加载修复 Bun 兼容；补充各中间件与 FileCache/ResponseCache 的
  JSDoc。[完整变更](./CHANGELOG.md)

---

## 📊 测试报告

- **总测试数**：209
- **通过**：209 ✅
- **失败**：0
- **通过率**：100%
- **测试时间**：2026-02-11
- **详情**：[TEST_REPORT.md](./TEST_REPORT.md)

---

## 📝 注意事项

- 本包仅提供中间件实现，需与 @dreamer/server 或兼容 `Middleware<HttpContext>`
  的框架一起使用。
- Request ID 统一存放在 `ctx.state.requestId`，错误处理等中间件从该处读取。
- 静态文件、响应缓存等使用 @dreamer/runtime-adapter，保证 Deno/Bun 兼容。
- 部分中间件（如 request-logger、error-handler）可选传入 `logger`，否则使用默认
  createLogger()。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](../../LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
