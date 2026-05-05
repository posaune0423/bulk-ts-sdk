import { BulkClient } from "../src/mod.ts";

const privateKey = Deno.env.get("BULK_PRIVATE_KEY");
if (!privateKey) {
  console.error("Error: BULK_PRIVATE_KEY environment variable is required.");
  console.log("Usage: BULK_PRIVATE_KEY=0x... deno run -A examples/trade_lifecycle.ts");
  Deno.exit(1);
}

const client = new BulkClient({ privateKey });

console.log("--- Trade Lifecycle Example ---");
console.log("Account Address:", client.accountId);

try {
  const symbol = "BTC-USD";

  // 1. Place a Limit Order
  console.log(`\nPlacing a limit order for ${symbol}...`);
  const orderResponse = await client.trade.placeLimitOrder({
    symbol,
    side: "B", // Buy
    price: 10000, // Very low price for safety
    size: 0.001,
    timeInForce: "Gtc",
  });

  if (orderResponse.status === "ok") {
    const orderId = (orderResponse as any).response.data.statuses[0].resting.oid;
    console.log(`Order placed successfully. ID: ${orderId}`);

    // 2. Fetch Open Orders to verify
    console.log("\nChecking open orders...");
    const orders = await client.account.openOrders(client.accountId!);
    const found = orders.find((o) => o.oid === orderId);
    if (found) {
      console.log(`Found order ${orderId} in open orders.`);
    }

    // 3. Cancel the Order
    console.log(`\nCanceling order ${orderId}...`);
    const cancelResponse = await client.trade.cancelOrder({
      symbol,
      oid: orderId,
    });

    if (cancelResponse.status === "ok") {
      console.log("Order canceled successfully.");
    } else {
      console.error("Failed to cancel order:", JSON.stringify(cancelResponse));
    }
  } else {
    console.error("Failed to place order:", JSON.stringify(orderResponse));
  }
} catch (error) {
  console.error("Error during trade lifecycle:", error instanceof Error ? error.message : error);
}
