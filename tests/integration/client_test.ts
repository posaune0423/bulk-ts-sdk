import { assertEquals, assertRejects } from '@std/assert'
import { stub } from '@std/testing/mock'
import { BulkClient } from '../../src/client.ts'

const DUMMY_PRIVATE_KEY = 'J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1'

Deno.test('Integration: BulkClient - Market API (GET)', async () => {
  const client = new BulkClient({
    httpUrl: 'https://api.example.com',
  })

  const mockResponse = new Response(JSON.stringify([{ symbol: 'BTC-USD' }]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

  const fetchStub = stub(globalThis, 'fetch', () => Promise.resolve(mockResponse))

  try {
    const info = await client.market.exchangeInfo()
    
    assertEquals(info, [{ symbol: 'BTC-USD' }])
    assertEquals(fetchStub.calls.length, 1)
    assertEquals(fetchStub.calls[0].args[0].toString(), 'https://api.example.com/exchangeInfo')
    assertEquals((fetchStub.calls[0].args[1] as any)?.method, 'GET')
  } finally {
    fetchStub.restore()
  }
})

Deno.test('Integration: BulkClient - Trade API (POST with Signature)', async () => {
  const client = new BulkClient({
    httpUrl: 'https://api.example.com',
    privateKey: DUMMY_PRIVATE_KEY,
  })

  const mockResponse = new Response(JSON.stringify({ status: 'ok', response: { type: 'order', status: 'filled' } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

  const fetchStub = stub(globalThis, 'fetch', () => Promise.resolve(mockResponse))

  try {
    const response = await client.trade.placeLimitOrder({
      symbol: 'BTC-USD',
      side: 'buy',
      price: 100000,
      size: 0.1,
    })

    assertEquals(response.status, 'ok')
    assertEquals(fetchStub.calls.length, 1)
    
    const requestUrl = fetchStub.calls[0].args[0].toString()
    const requestInit = fetchStub.calls[0].args[1] as any
    
    assertEquals(requestUrl, 'https://api.example.com/order')
    assertEquals(requestInit?.method, 'POST')
    
    const body = JSON.parse(requestInit?.body as string)
    // Verify that the body has the expected structure from normalizeSignedTransaction
    assertEquals(Array.isArray(body.actions), true)
    assertEquals(typeof body.signature, 'string')
  } finally {
    fetchStub.restore()
  }
})

Deno.test('Integration: BulkClient - Error Handling', async () => {
  const client = new BulkClient({
    httpUrl: 'https://api.example.com',
  })

  const mockResponse = new Response(JSON.stringify({ error: 'Invalid symbol' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })

  const fetchStub = stub(globalThis, 'fetch', () => Promise.resolve(mockResponse))

  try {
    await assertRejects(
      () => client.market.ticker('INVALID'),
      Error,
      'Invalid symbol',
    )
  } finally {
    fetchStub.restore()
  }
})
