import { createClient, requireEnv } from "./client.ts";
import process from "node:process";

const privateKey = requireEnv("PRIVATE_KEY");
const client = createClient({ privateKey });

if (!client.accountId) {
  throw new Error("Unable to derive account id from PRIVATE_KEY.");
}

console.log("--- Account Info Example ---");
console.log("Account Address:", client.accountId);

try {
  console.log("\nFetching Full Account Info...");
  const account = await client.account.fullAccount(client.accountId);
  console.log("Total Balance:", account.margin?.totalBalance);
  console.log("Available Balance:", account.margin?.availableBalance);
  console.log("Positions:", account.positions?.length);

  console.log("\nFetching Open Orders...");
  const orders = await client.account.openOrders(client.accountId);
  console.log(`Found ${orders.length} open orders.`);
  orders.forEach((order) => {
    const side = (order.size ?? 0) > 0 ? "Buy" : "Sell";
    console.log(`- ${order.symbol} ${side} @ ${order.price} (Size: ${Math.abs(order.size ?? 0)})`);
  });

  console.log("\nFetching Recent Fills...");
  const fills = await client.account.fills(client.accountId);
  console.log(`Found ${fills.length} recent fills.`);
} catch (error) {
  console.error("Error fetching account info:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
