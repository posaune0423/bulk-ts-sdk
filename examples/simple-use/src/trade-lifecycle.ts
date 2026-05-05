import type { OrderResponse } from "bulk-ts-sdk";
import { createClient, readSymbol, requireEnv } from "./client.ts";
import process from "node:process";

function restingOrderId(order: OrderResponse): string | undefined {
  const first = order.response.data.statuses[0];
  if (!first || !("resting" in first) || !first.resting) return undefined;
  return first.resting.oid;
}

const privateKey = requireEnv("PRIVATE_KEY");
const client = createClient({ privateKey });
const symbol = readSymbol();

if (!client.accountId) {
  throw new Error("Unable to derive account id from PRIVATE_KEY.");
}

console.log("--- Trade Lifecycle Example ---");
console.log("Account Address:", client.accountId);

try {
  console.log(`\nPlacing a limit order for ${symbol}...`);
  const orderResponse = await client.trade.placeLimitOrder({
    symbol,
    side: "buy",
    price: 10000,
    size: 0.001,
    tif: "GTC",
  });

  if (orderResponse.status !== "ok") {
    console.error("Failed to place order:", JSON.stringify(orderResponse));
    process.exit(1);
  }

  const orderId = restingOrderId(orderResponse);
  if (!orderId) {
    throw new Error("Unable to read resting order id from order response.");
  }
  console.log(`Order placed successfully. ID: ${orderId}`);

  console.log("\nChecking open orders...");
  const orders = await client.account.openOrders(client.accountId);
  const found = orders.find((order) => order.orderId === orderId);
  if (found) {
    console.log(`Found order ${orderId} in open orders.`);
  }

  console.log(`\nCanceling order ${orderId}...`);
  const cancelResponse = await client.trade.cancelOrder({
    symbol,
    orderId,
  });

  if (cancelResponse.status === "ok") {
    console.log("Order canceled successfully.");
  } else {
    console.error("Failed to cancel order:", JSON.stringify(cancelResponse));
    process.exitCode = 1;
  }
} catch (error) {
  console.error("Error during trade lifecycle:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
