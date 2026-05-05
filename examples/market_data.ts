import { BulkClient } from "../src/mod.ts";

const client = new BulkClient();

console.log("--- Market Data Example ---");

try {
  // 1. Fetch Exchange Info
  console.log("\nFetching Exchange Info...");
  const info = await client.market.exchangeInfo();
  console.log(`Found ${info.length} markets.`);
  if (info.length > 0) {
    console.log("First market:", info[0].symbol);
  }

  // 2. Fetch Ticker for BTC-USD
  const symbol = "BTC-USD";
  console.log(`\nFetching Ticker for ${symbol}...`);
  const ticker = await client.market.ticker(symbol);
  console.log("Last Price:", ticker.lastPrice);
  console.log("24h Volume:", ticker.volume);

  // 3. Fetch L2 Book
  console.log(`\nFetching L2 Order Book for ${symbol}...`);
  const book = await client.market.l2Book({ symbol, nlevels: 5 });
  console.log("Top Bids:", book.levels?.[0]?.slice(0, 3).map((l) => `${l.px} @ ${l.sz}`));
  console.log("Top Asks:", book.levels?.[1]?.slice(0, 3).map((l) => `${l.px} @ ${l.sz}`));

  // 4. Fetch Klines (Candles)
  console.log(`\nFetching Klines (1h) for ${symbol}...`);
  const klines = await client.market.klines({ symbol, interval: "1h", limit: 5 });
  console.log(`Received ${klines.length} candles.`);
  if (klines.length > 0) {
    console.log("Latest Candle Close:", klines[klines.length - 1].c);
  }
} catch (error) {
  console.error("Error fetching market data:", error instanceof Error ? error.message : error);
}
