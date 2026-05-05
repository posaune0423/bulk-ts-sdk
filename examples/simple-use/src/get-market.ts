import { createClient, readSymbol } from "./client.ts";

const client = createClient();
const market = await client.market.ticker(readSymbol());

console.log(market);
