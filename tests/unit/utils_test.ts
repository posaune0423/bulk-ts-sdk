import { assertEquals } from "@std/assert";
import { safeJsonParse } from "../../src/utils/json.ts";
import { buildUrl } from "../../src/utils/url.ts";

Deno.test("safeJsonParse - valid JSON", () => {
  assertEquals(safeJsonParse('{"a":1}'), { a: 1 });
});

Deno.test("safeJsonParse - invalid JSON", () => {
  assertEquals(safeJsonParse("invalid"), undefined);
});

Deno.test("buildUrl - no params", () => {
  assertEquals(buildUrl("https://api.com", "/path"), "https://api.com/path");
});

Deno.test("buildUrl - with params", () => {
  assertEquals(buildUrl("https://api.com", "/path", { a: "1", b: "2" }), "https://api.com/path?a=1&b=2");
});

Deno.test("buildUrl - trailing slash in base", () => {
  assertEquals(buildUrl("https://api.com/", "/path"), "https://api.com/path");
});
