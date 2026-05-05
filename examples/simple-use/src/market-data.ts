import { createClient, readSymbol } from "./client.ts";
import process from "node:process";

const client = createClient();
const symbol = readSymbol();

console.log("--- Market Data Example ---");

try {
  console.log("\nFetching Exchange Info...");
  const info = await client.market.exchangeInfo();
  console.log(`Found ${info.length} markets.`);
  if (info.length > 0) {
    console.log("First market:", info[0].symbol);
  }

  console.log(`\nFetching Ticker for ${symbol}...`);
  const ticker = await client.market.ticker(symbol);
  console.log("Last Price:", ticker.lastPrice);
  console.log("24h Volume:", ticker.volume);

  console.log(`\nFetching L2 Order Book for ${symbol}...`);
  const book = await client.market.l2Book({ symbol, nlevels: 5 });
  console.log("Top Bids:", book.levels?.[0]?.slice(0, 3).map((level) => `${level.px} @ ${level.sz}`));
  console.log("Top Asks:", book.levels?.[1]?.slice(0, 3).map((level) => `${level.px} @ ${level.sz}`));

  console.log(`\nFetching Klines (1h) for ${symbol}...`);
  const klines = await client.market.klines({ symbol, interval: "1h", limit: 5 });
  console.log(`Received ${klines.length} candles.`);
  if (klines.length > 0) {
    console.log("Latest Candle Close:", klines[klines.length - 1].c);
  }
} catch (error) {
  console.error("Error fetching market data:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
