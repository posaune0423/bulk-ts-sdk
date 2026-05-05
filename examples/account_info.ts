import { BulkClient } from '../src/mod.ts'

const privateKey = Deno.env.get('BULK_PRIVATE_KEY')
if (!privateKey) {
  console.error('Error: BULK_PRIVATE_KEY environment variable is required.')
  console.log('Usage: BULK_PRIVATE_KEY=0x... deno run -A examples/account_info.ts')
  Deno.exit(1)
}

const client = new BulkClient({ privateKey })

console.log('--- Account Info Example ---')
console.log('Account Address:', client.accountId)

try {
  // 1. Fetch Full Account Info
  console.log('\nFetching Full Account Info...')
  const account = await client.account.fullAccount(client.accountId!)
  console.log('Total Balance:', account.margin?.totalBalance)
  console.log('Available Balance:', account.margin?.availableBalance)
  console.log('Positions:', account.positions?.length)

  // 2. Fetch Open Orders
  console.log('\nFetching Open Orders...')
  const orders = await client.account.openOrders(client.accountId!)
  console.log(`Found ${orders.length} open orders.`)
  orders.forEach((o) => {
    const side = (o.size ?? 0) > 0 ? 'Buy' : 'Sell'
    console.log(`- ${o.symbol} ${side} @ ${o.price} (Size: ${Math.abs(o.size ?? 0)})`)
  })

  // 3. Fetch Recent Fills
  console.log('\nFetching Recent Fills...')
  const fills = await client.account.fills(client.accountId!)
  console.log(`Found ${fills.length} recent fills.`)
} catch (error) {
  console.error('Error fetching account info:', error instanceof Error ? error.message : error)
}
