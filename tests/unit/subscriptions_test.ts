import { assertEquals } from "@std/assert";
import { topicOf } from "../../src/ws/subscriptions.ts";

Deno.test("topicOf - ticker", () => {
  assertEquals(topicOf({ type: "ticker", symbol: "BTC-USD" }), ["ticker.BTC-USD"]);
});

Deno.test("topicOf - candle", () => {
  assertEquals(topicOf({ type: "candle", symbol: "BTC-USD", interval: "1m" }), ["candle.BTC-USD.1m"]);
});

Deno.test("topicOf - trades", () => {
  assertEquals(topicOf({ type: "trades", symbol: "BTC-USD" }), ["trades.BTC-USD"]);
});

Deno.test("topicOf - risk", () => {
  assertEquals(topicOf({ type: "risk", symbol: "BTC-USD" }), ["risk.BTC-USD"]);
});

Deno.test("topicOf - frontendContext", () => {
  assertEquals(topicOf({ type: "frontendContext" }), ["frontendContext"]);
});

Deno.test("topicOf - l2Snapshot", () => {
  assertEquals(topicOf({ type: "l2Snapshot", symbol: "ETH-USD" }), ["l2snapshot.ETH-USD"]);
});

Deno.test("topicOf - l2Snapshot includes nlevels when provided", () => {
  assertEquals(topicOf({ type: "l2Snapshot", symbol: "ETH-USD", nlevels: 20 }), ["l2snapshot.ETH-USD.20"]);
});

Deno.test("topicOf - account", () => {
  assertEquals(topicOf({ type: "account", user: "0x123" }), ["account.0x123"]);
});
