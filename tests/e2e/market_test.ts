import { assert } from "@std/assert";
import { BulkClient } from "../../src/client.ts";
import { getEnv } from "../helpers/env.ts";

const env = getEnv();
const client = new BulkClient({
  httpUrl: env.BULK_HTTP_URL,
  wsUrl: env.BULK_WS_URL,
  privateKey: env.MAIN_WALLET_PRIVATE_KEY,
});

Deno.test("E2E: Market - exchangeInfo", async () => {
  const info = await client.market.exchangeInfo();
  assert(Array.isArray(info));
  assert(info.length > 0);
  assert(info[0].symbol !== undefined);
});

Deno.test("E2E: Market - ticker", async () => {
  const ticker = await client.market.ticker("BTC-USD");
  assert(ticker !== undefined);
  assert(typeof ticker.lastPrice === "number");
});

Deno.test("E2E: Market - klines", async () => {
  const candles = await client.market.klines({
    symbol: "BTC-USD",
    interval: "1h",
    limit: 10,
  });
  assert(Array.isArray(candles));
  assert(candles.length > 0);
});

Deno.test("E2E: Market - l2Book", async () => {
  const book = await client.market.l2Book({
    symbol: "BTC-USD",
    nlevels: 5,
  });
  assert(book !== undefined);
  assert(book.levels !== undefined);
  assert(Array.isArray(book.levels[0])); // Bids
  assert(Array.isArray(book.levels[1])); // Asks
});

Deno.test("E2E: Market - stats", async () => {
  const stats = await client.market.stats({ symbol: "BTC-USD" });
  assert(stats !== undefined);
});

Deno.test("E2E: Market - riskSurfaces", async () => {
  const riskSurfaces = await client.market.riskSurfaces("BTC-USD");
  assert(riskSurfaces !== undefined);
});
