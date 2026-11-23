/**
 * @module @dreamer/middlewares/reject-brotli-request
 *
 * Reject inbound request bodies advertised as Brotli (`Content-Encoding: br`).
 * This is a request-side guard (HTTP2Shell / CVE-2026-111497); it does not
 * decompress. Response compression remains separate and response-only.
 */

import type { Middleware } from "@dreamer/middleware";
import type { HttpContext } from "@dreamer/server";

/**
 * Options for {@link rejectBrotliRequest}.
 */
export interface RejectBrotliRequestOptions {
  /**
   * Allow a request `Content-Encoding` that includes `br`.
   * Default false (respond 415).
   */
  allowBrotliRequestEncoding?: boolean;
}

/** True when a Content-Encoding header list includes `br` (case-insensitive). */
export function contentEncodingIncludesBr(value: string | null): boolean {
  if (!value) return false;
  return value.split(",").some((part) => part.trim().toLowerCase() === "br");
}

/**
 * Return 415 when the request Content-Encoding includes `br`, unless opted in.
 */
export function rejectBrotliRequest(
  options: RejectBrotliRequestOptions = {},
): Middleware<HttpContext> {
  const { allowBrotliRequestEncoding = false } = options;
  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    if (
      !allowBrotliRequestEncoding &&
      contentEncodingIncludesBr(ctx.headers.get("content-encoding"))
    ) {
      ctx.response = new Response("Unsupported Media Type", { status: 415 });
      return;
    }
    await next();
  };
}
