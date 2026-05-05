import { BulkClient } from '../src/mod.ts'

const client = new BulkClient({
  privateKey: Deno.env.get('BULK_PRIVATE_KEY') ?? '',
})

const market = await client.market.ticker('BTC-USD')

console.log(market)
