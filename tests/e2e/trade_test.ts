import { assert, assertEquals } from "@std/assert";
import { BulkClient } from "../../src/client.ts";
import type { OrderResponse } from "../../src/types/trade.ts";
import { getEnv } from "../helpers/env.ts";

function restingOidFromOrderResponse(order: OrderResponse): string | undefined {
  const first = order.response.data.statuses[0];
  if (!first || !("resting" in first) || !first.resting) return undefined;
  return first.resting.oid;
}

const env = getEnv();
const client = new BulkClient({
  httpUrl: env.BULK_HTTP_URL,
  wsUrl: env.BULK_WS_URL,
  privateKey: env.PRIVATE_KEY,
});

Deno.test("E2E: Trade - Limit Order Flow", async () => {
  // 1. Create a limit order far from market price
  const order = await client.trade.placeLimitOrder({
    symbol: "BTC-USD",
    side: "buy",
    price: 50000,
    size: 0.001,
    tif: "GTC",
  });

  assert(order.status === "ok");
  const orderId = restingOidFromOrderResponse(order);
  assert(orderId !== undefined);

  // 2. Verify order exists in open orders
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const openOrders = await client.account.openOrders(accountId);
  const found = openOrders.find((o) => o.orderId === orderId);
  assert(found !== undefined, "Order should be found in open orders");

  // 3. Cancel the order
  const cancel = await client.trade.cancelOrder({
    symbol: "BTC-USD",
    orderId: orderId,
  });
  assertEquals(cancel.status, "ok");

  // 4. Verify order is gone from open orders
  const openOrdersAfter = await client.account.openOrders(accountId);
  const foundAfter = openOrdersAfter.find((o) => o.orderId === orderId);
  assert(foundAfter === undefined, "Order should be removed from open orders");
});

Deno.test("E2E: Trade - Cancel All", async () => {
  await client.trade.cancelAll({ symbols: ["BTC-USD"] });
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const openOrders = await client.account.openOrders(accountId);
  const btcOrders = openOrders.filter((o) => o.symbol === "BTC-USD");
  assertEquals(btcOrders.length, 0);
});
