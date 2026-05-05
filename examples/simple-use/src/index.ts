import { createClient, readSymbol } from "./client.ts";

const client = createClient();
const symbol = readSymbol();
const info = await client.market.exchangeInfo();
const ticker = await client.market.ticker(symbol);
const book = await client.market.l2Book({ symbol, nlevels: 3 });

console.log("Bulk markets:", info.length);
console.log(`${symbol} last price:`, ticker.lastPrice);
console.log(
  "Top bids:",
  book.levels?.[0]?.map((level) => `${level.px} @ ${level.sz}`) ?? [],
);
console.log(
  "Top asks:",
  book.levels?.[1]?.map((level) => `${level.px} @ ${level.sz}`) ?? [],
);
