# 变更日志

本项目的重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.2] - 2026-02-19

### 新增

- **国际化（i18n）**：
  - `src/i18n.ts`：`detectLocale()`、`setMiddlewaresLocale()`、`$tr()`；语言由
    `LANGUAGE` / `LC_ALL` / `LANG` 检测。
  - `src/locales/en-US.json` 与 `src/locales/zh-CN.json`
    提供全部面向用户的文案。
  - 请求签名、压缩、安全头、请求校验、CSRF、错误处理、性能分析、静态文件等中间件的错误与日志文案均改为使用
    `$tr()`。
  - 主入口导出 `detectLocale`、`setMiddlewaresLocale`、`Locale`。

---

## [1.0.1] - 2026-02-11

### 新增

- CI 工作流（`.github/workflows/ci.yml`）：在 Linux、macOS、Windows
  上运行测试/check/lint（推送到 `dev` 或 PR 时触发）。
- 文档结构：`docs/en-US/` 与 `docs/zh-CN/`，内含 CHANGELOG、TEST_REPORT 及中文
  README。

### 变更

- JSR 文档：为 19 个入口补充 `@module` JSDoc；为导出符号补充或完善 JSDoc，提升
  JSR 文档分数。
- 测试报告更新：209 个测试（原 192），执行约 12 秒；测试日期 2026-02-11。

---

## [1.0.0] - 2026-02-06

### 新增

首个稳定版本。兼容 Deno 与 Bun 的 HTTP 中间件库，提供 17 个开箱即用中间件，可与
@dreamer/server 或任意 HttpContext 兼容框架集成。

#### 请求处理

- **Body Parser**（`bodyParser`）：JSON、URL 编码表单、文本与 raw
  请求体解析，支持可配置大小限制
- **Request
  Validator**（`requestValidator`）：请求体、查询参数与请求头校验及大小限制
- **Request Signature**（`requestSignature`、`generateRequestSignature`）：HMAC
  请求签名校验与客户端签名生成

#### 跨域与安全

- **CORS**（`cors`）：跨域配置（origin、methods、credentials、预检）
- **CSRF**（`csrf`）：CSRF 防护，双 cookie/header 校验
- **Security
  Headers**（`securityHeaders`）：CSP、HSTS、X-Frame-Options、COEP、COOP、CORP
  等安全头

#### 可观测与限流

- **Request ID**（`requestId`）：请求 ID 生成并写入 `ctx.state`
- **Request Logger**（`requestLogger`）：请求与响应日志，可配置格式
- **Metrics**（`metrics`）：请求数、延迟、状态码分布，提供
  `getMetricsStats`、`resetMetrics`
- **Performance Analyzer**（`performanceAnalyzer`）：中间件耗时分析，提供
  `clearPerformanceData`、`getPerformanceStats`
- **Rate Limit**（`rateLimit`）：内存限流，可配置时间窗与 key

#### 响应与资源

- **Compression**（`compression`）：gzip 与 brotli 响应压缩，可配置级别与阈值
- **Response Cache**（`responseCache`）：响应缓存，支持 ETag、Last-Modified
  与可配置 TTL
- **Static Files**（`staticFiles`）：静态文件服务，带 LRU 文件缓存
- **Timeout**（`timeout`）：请求超时处理

#### 错误与健康

- **Error Handler**（`errorHandler`）：统一错误处理与 JSON
  格式化，支持开发/生产模式
- **Health Check**（`healthCheck`）：健康检查端点，可配置路径与响应

#### 类型导出

- `BodyParserOptions`、`CompressionOptions`、`CorsOptions`、`CsrfOptions`、`CsrfTokenGenerator`
- `ErrorHandlerOptions`、`HealthCheckOptions`、`MetricsOptions`、`PerformanceAnalyzerOptions`
- `RateLimitOptions`、`RequestIdOptions`、`RequestLoggerOptions`、`RequestSignatureOptions`、`HmacAlgorithm`
- `RequestValidatorOptions`、`ValidationRule`、`ResponseCacheOptions`
- `SecurityHeadersOptions`、`DynamicSecurityPolicy`、`StaticFilesOptions`、`TimeoutOptions`
