import { assert, assertEquals } from "@std/assert";
import { BulkTransactionRejectedError } from "../../src/errors.ts";
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
  privateKey: env.MAIN_WALLET_PRIVATE_KEY,
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
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const openOrders = await client.account.openOrders(accountPublicKey);
  const found = openOrders.find((o) => o.orderId === orderId);
  assert(found !== undefined, "Order should be found in open orders");

  // 3. Cancel the order
  const cancel = await client.trade.cancelOrder({
    symbol: "BTC-USD",
    orderId: orderId,
  });
  assertEquals(cancel.status, "ok");

  // 4. Verify order is gone from open orders
  const openOrdersAfter = await client.account.openOrders(accountPublicKey);
  const foundAfter = openOrdersAfter.find((o) => o.orderId === orderId);
  assert(foundAfter === undefined, "Order should be removed from open orders");
});

Deno.test({
  name: "E2E: Trade - Market Order signing reaches API without bad signature",
  async fn(): Promise<void> {
    let response: OrderResponse;
    try {
      response = await client.trade.placeMarketOrder(
        {
          symbol: "SDK-E2E-INVALID",
          side: "sell",
          size: 0.001,
          reduceOnly: true,
        },
        { throwOnReject: false },
      );
    } catch (error) {
      if (error instanceof BulkTransactionRejectedError) {
        response = error.response as OrderResponse;
      } else {
        throw error;
      }
    }

    assert(["ok", "error"].includes(response.status));
    const encoded = JSON.stringify(response);
    assert(!encoded.includes("bad signature"), encoded);
  },
});

Deno.test("E2E: Trade - Cancel All", async () => {
  await client.trade.cancelAll({ symbols: ["BTC-USD"] });
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const openOrders = await client.account.openOrders(accountPublicKey);
  const btcOrders = openOrders.filter((o) => o.symbol === "BTC-USD");
  assertEquals(btcOrders.length, 0);
});
