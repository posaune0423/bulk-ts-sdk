import { assertEquals, assertRejects } from "@std/assert";
import { stub } from "@std/testing/mock";
import { BulkTimeoutError } from "../../src/errors.ts";
import { HttpTransport } from "../../src/http/http_transport.ts";

Deno.test("HttpTransport - times out a stalled request", async () => {
  const transport = new HttpTransport({
    baseUrl: "https://api.example.com",
    timeoutMs: 1,
  });
  const fetchStub = stub(globalThis, "fetch", (_url, init) => {
    const signal = (init as { signal?: AbortSignal } | undefined)?.signal;
    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  });

  try {
    await assertRejects(
      () => transport.get("/slow"),
      BulkTimeoutError,
      "HTTP request timed out: GET /slow",
    );
  } finally {
    fetchStub.restore();
  }
});

Deno.test("HttpTransport - preserves caller aborts", async () => {
  const transport = new HttpTransport({
    baseUrl: "https://api.example.com",
    timeoutMs: 10_000,
  });
  const controller = new AbortController();
  const fetchStub = stub(globalThis, "fetch", (_url, init) => {
    const signal = (init as { signal?: AbortSignal } | undefined)?.signal;
    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("aborted by caller", "AbortError")));
      controller.abort();
    });
  });

  try {
    const error = await assertRejects(
      () => transport.get("/cancelled", { signal: controller.signal }),
      DOMException,
      "aborted by caller",
    );
    assertEquals(error.name, "AbortError");
  } finally {
    fetchStub.restore();
  }
});
