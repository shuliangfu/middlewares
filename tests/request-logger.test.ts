/**
 * 请求日志中间件测试
 */

import { describe, expect, it } from "@dreamer/test";
import { requestLogger } from "../src/request-logger.ts";
import { createTestContext } from "./helpers.ts";

describe("Request Logger 中间件", () => {
  describe("基础功能", () => {
    it("应该创建请求日志中间件", () => {
      const middleware = requestLogger();
      expect(typeof middleware).toBe("function");
    });

    it("应该记录请求信息", async () => {
      const middleware = requestLogger();
      const request = new Request("http://localhost:8000/api", {
        method: "GET",
      });
      const context = createTestContext(request, new Response("OK"));

      let nextCalled = false;
      await middleware(context, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      // 应该不抛出错误
      expect(context.response).toBeInstanceOf(Response);
    });

    it("应该记录响应状态码", async () => {
      const middleware = requestLogger();
      const request = new Request("http://localhost:8000/api");
      const context = createTestContext(
        request,
        new Response("OK", { status: 200 }),
      );

      await middleware(context, async () => {});

      expect(context.response?.status).toBe(200);
    });
  });

  describe("配置选项", () => {
    it("应该支持自定义日志格式", () => {
      const middleware = requestLogger({
        format: "text",
      });
      expect(typeof middleware).toBe("function");
    });

    it("应该支持 skip 选项跳过日志", async () => {
      let logCalled = false;
      const middleware = requestLogger({
        logger: {
          info: () => {
            logCalled = true;
          },
          warn: () => {},
          error: () => {},
          debug: () => {},
        } as never,
        skip: (ctx) => ctx.path.startsWith("/.well-known/"),
      });
      const request = new Request(
        "http://localhost:8000/.well-known/appspecific/com.chrome.devtools.json",
      );
      const context = createTestContext(request);

      let nextCalled = false;
      await middleware(context, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      // skip 为 true 时不应调用 logger
      expect(logCalled).toBe(false);
    });
  });
});
