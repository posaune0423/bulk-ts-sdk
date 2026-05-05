import { BulkClient } from '../src/mod.ts'

const client = new BulkClient()

console.log('--- WebSocket Market Data Example ---')

try {
  const symbol = 'BTC-USD'

  // 1. Subscribe to L2 Book
  console.log(`Subscribing to L2 Book for ${symbol}...`)
  const handle = await client.ws.subscribe(
    { type: 'l2Book', coin: symbol },
    (data) => {
      console.log('\n[WS L2Book Update]')
      console.log('Topic:', (data as any).topic)
      const book = (data as any).data
      if (book && book.levels) {
        console.log('Top Bid:', book.levels[0][0]?.px, '@', book.levels[0][0]?.sz)
        console.log('Top Ask:', book.levels[1][0]?.px, '@', book.levels[1][0]?.sz)
      }
    },
  )

  // 2. Wait for some messages
  console.log('\nListening for 10 seconds...')
  await new Promise((resolve) => setTimeout(resolve, 10000))

  // 3. Unsubscribe
  console.log('\nUnsubscribing...')
  await handle.unsubscribe()

  // 4. Close connection
  console.log('Closing WebSocket...')
  await client.ws.close()

  console.log('Example finished.')
} catch (error) {
  console.error('Error during WebSocket example:', error instanceof Error ? error.message : error)
}
