# @dreamer/middlewares 测试报告

## 📊 测试概览

- **包名**：`@dreamer/middlewares`
- **版本**：**1.1.0**（与 `deno.json`/`package.json` 一致）
- **测试框架**：@dreamer/test@^1.2.3
- **报告日期**：**2026-07-23**
- **测试环境**：Deno 2.9+ / Bun 1.3+ / Node.js 22+

---

## 如何运行

在 **middlewares 包根目录** 执行：

```bash
# Deno
deno task test

# Bun
bun test tests/

# Node.js 22+
npm install
npm run test:node
# 等价：node --import tsx --test-force-exit test-node.mjs
```

---

## 📈 测试结果

### 运行时兼容性

| 运行时  | 版本  | 通过      | 失败  | 文件   | 耗时   |
| ------- | ----- | --------- | ----- | ------ | ------ |
| Deno    | 2.9+  | **209**   | **0** | 17     | ~5s    |
| Bun     | 1.3+  | **191**   | **0** | 17     | ~1.5s  |
| Node.js | 22+   | **17/17** | **0** | 17     | ~15s   |

> 17 个测试文件均为纯单元测试——无浏览器测试、无外部服务、无需排除。
> Deno/Bun 条数因运行器计数方式不同而异——以 **0 失败** 为准。

### 测试文件统计

| #  | 测试文件                       | 用例数 | 状态        |
| -- | ------------------------------ | ------ | ----------- |
| 1  | `body-parser.test.ts`          | 8      | ✅ 全部通过 |
| 2  | `compression.test.ts`          | 8      | ✅ 全部通过 |
| 3  | `cors.test.ts`                 | 9      | ✅ 全部通过 |
| 4  | `csrf.test.ts`                 | 16     | ✅ 全部通过 |
| 5  | `error-handler.test.ts`        | 10     | ✅ 全部通过 |
| 6  | `health-check.test.ts`         | 8      | ✅ 全部通过 |
| 7  | `metrics.test.ts`              | 19     | ✅ 全部通过 |
| 8  | `performance-analyzer.test.ts` | 14     | ✅ 全部通过 |
| 9  | `rate-limit.test.ts`           | 7      | ✅ 全部通过 |
| 10 | `request-id.test.ts`           | 12     | ✅ 全部通过 |
| 11 | `request-logger.test.ts`       | 6      | ✅ 全部通过 |
| 12 | `request-signature.test.ts`    | 18     | ✅ 全部通过 |
| 13 | `request-validator.test.ts`    | 16     | ✅ 全部通过 |
| 14 | `response-cache.test.ts`       | 21     | ✅ 全部通过 |
| 15 | `security-headers.test.ts`     | 15     | ✅ 全部通过 |
| 16 | `static-files.test.ts`         | 16     | ✅ 全部通过 |
| 17 | `timeout.test.ts`              | 6      | ✅ 全部通过 |

---

## 🔍 功能测试详情

### 1. Body Parser 中间件 (body-parser.test.ts) - 8 项

- ✅ JSON 解析、非法 JSON 处理
- ✅ URL 编码表单解析、文本请求体解析
- ✅ 自定义 JSON/表单/文本大小限制

### 2. Compression 中间件 (compression.test.ts) - 8 项

- ✅ 创建压缩中间件，gzip/brotli 压缩
- ✅ 对不可压缩响应跳过压缩
- ✅ 自定义压缩级别、文件类型过滤、大小阈值

### 3. CORS 中间件 (cors.test.ts) - 9 项

- ✅ 创建 CORS 中间件、OPTIONS 预检、添加 CORS 头
- ✅ 自定义 origin、methods、allowed headers、credentials、maxAge

### 4. CSRF 防护中间件 (csrf.test.ts) - 16 项

- ✅ 创建中间件、GET 生成 token、跳过安全方法
- ✅ 校验 POST token、header/表单字段 token、拒绝无效 token
- ✅ 自定义 cookie/header/表单字段名、token
  生成、shouldSkip/shouldVerify、错误信息、cookie 选项

### 5. Error Handler 中间件 (error-handler.test.ts) - 10 项

- ✅ 创建错误处理中间件、同步/异步错误处理
- ✅ 自定义 formatError、includeDetails、开发模式、错误修复建议
- ✅ 开发/生产模式下 JSON 响应格式化

### 6. Health Check 中间件 (health-check.test.ts) - 8 项

- ✅ 创建健康检查中间件、响应健康检查、忽略非健康检查路径
- ✅ 自定义路径、响应体、状态码、检查函数

### 7. Metrics 中间件 (metrics.test.ts) - 19 项

- ✅ 创建 Metrics 中间件、请求统计、状态码分布
- ✅ 自定义路径、shouldSkip、getMetricsStats、resetMetrics
- ✅ 多请求累计、延迟统计

### 8. Performance Analyzer 中间件 (performance-analyzer.test.ts) - 14 项

- ✅ 创建性能分析中间件、记录耗时、clearPerformanceData、getPerformanceStats
- ✅ 自定义 shouldSkip、多中间件链耗时

### 9. Rate Limit 中间件 (rate-limit.test.ts) - 7 项

- ✅ 创建限流中间件、限制请求数、时间窗重置、自定义 key、skip

### 10. Request ID 中间件 (request-id.test.ts) - 12 项

- ✅ 创建中间件、生成 Request ID、写入响应头、存入 ctx.state
- ✅ 从请求头读取已有 ID、自定义头名、禁用响应头、自定义生成器、禁用从请求头读取
- ✅ 多请求使用不同 ID

### 11. Request Logger 中间件 (request-logger.test.ts) - 6 项

- ✅ 创建请求日志中间件、记录请求与响应状态码
- ✅ 自定义日志格式、跳过日志

### 12. Request Signature 中间件 (request-signature.test.ts) - 18 项

- ✅ 创建签名校验中间件，拒绝缺失签名/时间戳/无效签名/过期/未来时间戳
- ✅ 接受有效签名，自定义算法/头名/过期时间/时间戳容差/shouldSkip/错误信息
- ✅ 签名生成、不同请求不同签名、签名包含 query 与 body

### 13. Request Validator 中间件 (request-validator.test.ts) - 16 项

- ✅ 创建校验中间件、未配置请求放行
- ✅ 请求体大小与 URL 长度、查询参数数量限制
- ✅ 必填字段、字段格式、合法值、自定义错误信息、校验函数返回错误
- ✅ 自定义/异步自定义校验函数、shouldSkip、自定义错误格式化

### 14. Response Cache 中间件 (response-cache.test.ts) - 21 项

- ✅ 创建响应缓存中间件、缓存 GET、跳过非 GET/HEAD、仅缓存 2xx
- ✅ ETag 生成、If-None-Match、禁用 ETag
- ✅ Last-Modified、If-Modified-Since、禁用 Last-Modified
- ✅ public/private/no-cache 策略，基于 URL/query/自定义
  key，shouldCache/shouldSkip
- ✅ 缓存统计、清空缓存

### 15. Security Headers 中间件 (security-headers.test.ts) - 15 项

- ✅ 创建安全头中间件、默认安全头
- ✅
  COEP、COOP、CORP、X-DNS-Prefetch-Control、X-Download-Options、X-Permitted-Cross-Domain-Policies
- ✅ 动态/异步动态安全策略、配置校验、COEP 与 COOP 组合告警
- ✅ 禁用默认安全头、自定义安全头取值

### 16. Static Files 中间件 (static-files.test.ts) - 16 项

- ✅ 创建静态文件中间件、自定义根目录与路径前缀、提供静态文件
- ✅ 自定义 index 文件、缓存控制、ETag、Last-Modified
- ✅ 启用/禁用内存缓存、缓存最大容量与 TTL、从缓存读取、文件变更后缓存更新

### 17. Timeout 中间件 (timeout.test.ts) - 6 项

- ✅ 创建超时中间件、超时内通过、超时返回
- ✅ 自定义错误信息、skip 函数

---

## 📊 覆盖率分析

| 覆盖项           | 说明                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| **API 方法覆盖** | ✅ 所有导出的中间件工厂（如 requestId、cors、bodyParser）均有对应测试文件 |
| **配置项覆盖**   | ✅ 各中间件主要配置（如 headerName、skip、limit、shouldCache）均有用例    |
| **边界情况覆盖** | ✅ 非法 JSON、缺失签名、过期时间戳、超时、大请求体、条件请求等均有测试    |
| **错误处理覆盖** | ✅ 错误处理中间件、限流/签名/校验失败响应、超时响应均已覆盖               |
| **运行时兼容**   | ✅ 使用 @dreamer/server HttpContext 与 CookieManager，兼容 Deno/Bun       |

---

## ✅ 优点

- 每个内置中间件有独立测试文件，与源码一一对应
- 测试覆盖创建、默认行为、配置项、边界情况与错误路径
- 使用统一的 createTestContext 与 @dreamer/server 类型便于维护
- Request ID 存于 ctx.state，与 error-handler 等中间件一致
- 静态文件与响应缓存使用 @dreamer/runtime-adapter 实现跨运行时支持

---

## 📝 结论

✅ **Deno：209 通过 | Bun：191 通过 | Node.js：17/17 文件通过——三端均 0 失败**

@dreamer/middlewares 提供 17 个内置中间件，功能与配置均有测试覆盖。可与
@dreamer/server 或任意兼容 HttpContext 的框架配合使用。全面兼容 Deno 2.9+、
Bun 1.3+ 和 Node.js 22+。

---

_最后更新：2026-07-23_
