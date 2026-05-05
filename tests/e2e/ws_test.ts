import { assert } from "@std/assert";
import { BulkClient } from "../../src/client.ts";
import { getEnv } from "../helpers/env.ts";

const env = getEnv();
const client = new BulkClient({
  httpUrl: env.BULK_HTTP_URL,
  wsUrl: env.BULK_WS_URL,
  privateKey: env.PRIVATE_KEY,
});

type TickerWsMessage = { topic: string; data: { lastPrice: number } };
type CandleWsMessage = { topic: string };

Deno.test("E2E: WebSocket - Connection & Subscriptions", async () => {
  await client.ws.connect();

  // 1. Ticker Subscription
  const tickerPromise = new Promise<TickerWsMessage>((resolve) => {
    client.ws.subscribe({ type: "ticker", symbol: "BTC-USD" }, (msg: unknown) => {
      if ((msg as TickerWsMessage).topic === "ticker.BTC-USD") resolve(msg as TickerWsMessage);
    });
  });

  const tickerMsg = await Promise.race([
    tickerPromise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Ticker timeout")), 10000)),
  ]);
  assert(tickerMsg !== undefined);
  assert(typeof tickerMsg.data.lastPrice === "number");

  // 2. Candle Subscription
  const candlePromise = new Promise<CandleWsMessage>((resolve) => {
    client.ws.subscribe({ type: "candle", symbol: "BTC-USD", interval: "1m" }, (msg: unknown) => {
      if ((msg as CandleWsMessage).topic === "candle.BTC-USD.1m") resolve(msg as CandleWsMessage);
    });
  });

  const candleMsg = await Promise.race([
    candlePromise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Candle timeout")), 10000)),
  ]);
  assert(candleMsg !== undefined);

  // 3. WS Post (cancelAll)
  const response = await client.trade.cancelAll(
    { symbols: ["BTC-USD"] },
    { via: "ws", throwOnReject: false },
  );
  assert(response.status === "ok");

  await client.ws.close();
});
