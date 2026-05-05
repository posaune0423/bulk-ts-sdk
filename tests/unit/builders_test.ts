import { assertEquals } from "@std/assert";
import {
  toKeychainCancelAll,
  toKeychainCancelOrder,
  toKeychainLimitOrder,
  toKeychainMarketOrder,
} from "../../src/builders/orders.ts";

Deno.test("toKeychainLimitOrder builder", () => {
  const params = {
    symbol: "BTC-USD",
    side: "buy" as const,
    price: 100000,
    size: 0.1,
    tif: "GTC" as const,
    reduceOnly: false,
    isolated: false,
  };
  const result = toKeychainLimitOrder(params);
  assertEquals(result, {
    type: "order",
    symbol: "BTC-USD",
    isBuy: true,
    price: 100000,
    size: 0.1,
    reduceOnly: false,
    iso: false,
    orderType: {
      type: "limit",
      tif: "GTC",
    },
  });
});

Deno.test("toKeychainMarketOrder builder", () => {
  const params = {
    symbol: "BTC-USD",
    side: "sell" as const,
    size: 0.5,
  };
  const result = toKeychainMarketOrder(params);
  assertEquals(result, {
    type: "order",
    symbol: "BTC-USD",
    isBuy: false,
    size: 0.5,
    reduceOnly: false,
    iso: false,
    orderType: {
      type: "market",
    },
  });
});

Deno.test("toKeychainCancelOrder builder", () => {
  const params = {
    symbol: "ETH-USD",
    orderId: "12345",
  };
  const result = toKeychainCancelOrder(params);
  assertEquals(result, {
    type: "cancel",
    symbol: "ETH-USD",
    orderId: "12345",
  });
});

Deno.test("toKeychainCancelAll builder", () => {
  const result = toKeychainCancelAll({ symbols: ["BTC-USD", "ETH-USD"] });
  assertEquals(result, {
    type: "cancelAll",
    symbols: ["BTC-USD", "ETH-USD"],
  });
});
