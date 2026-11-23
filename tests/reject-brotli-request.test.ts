/**
 * rejectBrotliRequest middleware tests
 */

import { describe, expect, it } from "@dreamer/test";
import {
  contentEncodingIncludesBr,
  rejectBrotliRequest,
} from "../src/reject-brotli-request.ts";
import { createTestContext } from "./helpers.ts";

describe("rejectBrotliRequest", () => {
  it("contentEncodingIncludesBr 识别逗号分隔与大小写", () => {
    expect(contentEncodingIncludesBr(null)).toBe(false);
    expect(contentEncodingIncludesBr("gzip")).toBe(false);
    expect(contentEncodingIncludesBr("br")).toBe(true);
    expect(contentEncodingIncludesBr("BR")).toBe(true);
    expect(contentEncodingIncludesBr("gzip, br")).toBe(true);
    expect(contentEncodingIncludesBr("gzip,br")).toBe(true);
    expect(contentEncodingIncludesBr("brotli")).toBe(false);
  });

  it("请求 Content-Encoding 含 br 时返回 415", async () => {
    const middleware = rejectBrotliRequest();
    const request = new Request("http://localhost:8000/api", {
      method: "POST",
      headers: { "Content-Encoding": "br" },
    });
    const context = createTestContext(request);
    let nextCalled = false;
    await middleware(context, async () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(context.response?.status).toBe(415);
  });

  it("无 br 时放行", async () => {
    const middleware = rejectBrotliRequest();
    const request = new Request("http://localhost:8000/api", {
      method: "POST",
      headers: { "Content-Encoding": "gzip" },
    });
    const context = createTestContext(request);
    let nextCalled = false;
    await middleware(context, async () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("allowBrotliRequestEncoding 为 true 时放行 br", async () => {
    const middleware = rejectBrotliRequest({
      allowBrotliRequestEncoding: true,
    });
    const request = new Request("http://localhost:8000/api", {
      method: "POST",
      headers: { "Content-Encoding": "br" },
    });
    const context = createTestContext(request);
    let nextCalled = false;
    await middleware(context, async () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });
});
