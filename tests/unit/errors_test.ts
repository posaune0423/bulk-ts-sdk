import { assertEquals } from "@std/assert";
import { BulkDecodeError, BulkHttpError, BulkTimeoutError, BulkWsError } from "../../src/errors.ts";

Deno.test("BulkHttpError", () => {
  const error = new BulkHttpError(404, { detail: "not found" });
  assertEquals(error.status, 404);
  assertEquals(error.data, { detail: "not found" });
  assertEquals(error.message, 'HTTP error 404: {"detail":"not found"}');
});

Deno.test("BulkDecodeError", () => {
  const error = new BulkDecodeError("failed to decode");
  assertEquals(error.name, "BulkDecodeError");
  assertEquals(error.message, "failed to decode");
});

Deno.test("BulkWsError", () => {
  const error = new BulkWsError("ws failed");
  assertEquals(error.name, "BulkWsError");
  assertEquals(error.message, "ws failed");
});

Deno.test("BulkTimeoutError", () => {
  const error = new BulkTimeoutError("timed out");
  assertEquals(error.name, "BulkTimeoutError");
  assertEquals(error.message, "timed out");
});
