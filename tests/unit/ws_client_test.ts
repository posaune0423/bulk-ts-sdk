import { assertEquals, assertRejects } from '@std/assert'
import { delay } from '@std/async/delay'
import { WsClient } from '../../src/ws/ws_client.ts'

class MockWebSocket extends EventTarget {
  readyState: number = WebSocket.CONNECTING
  url: string
  sent: string[] = []

  constructor(url: string) {
    super()
    this.url = url
    // Sync open for tests
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.dispatchEvent(new Event('open'))
    }, 0)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = WebSocket.CLOSED
    this.dispatchEvent(new Event('close'))
  }

  simulateMessage(data: unknown): void {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }))
  }
}

Deno.test('WsClient - connect and close', async () => {
  const originalWebSocket = globalThis.WebSocket
  let lastMock: any = null
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url)
      lastMock = this
    }
  } as any

  try {
    const client = new WsClient({ url: 'ws://localhost:8080', timeoutMs: 1000 })
    await client.connect()
    assertEquals(lastMock?.readyState, WebSocket.OPEN)

    await client.close()
    assertEquals(lastMock?.readyState, WebSocket.CLOSED)
  } finally {
    globalThis.WebSocket = originalWebSocket
  }
})

Deno.test('WsClient - subscribe and unsubscribe', async () => {
  const originalWebSocket = globalThis.WebSocket
  let lastMock: any = null
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url)
      lastMock = this
    }
  } as any

  try {
    const client = new WsClient({ url: 'ws://localhost:8080', timeoutMs: 1000 })
    let received: any = null

    const handle = await client.subscribe({ type: 'ticker', symbol: 'BTC-USD' }, (data) => {
      received = data
    })

    assertEquals(lastMock?.sent.length, 1)
    const sentSub = JSON.parse(lastMock!.sent[0])
    assertEquals(sentSub.method, 'subscribe')

    lastMock.simulateMessage({ topic: 'ticker.BTC-USD', data: { price: '100000' } })
    await delay(10)
    assertEquals(received?.data?.price, '100000')

    await handle.unsubscribe()
    assertEquals(lastMock?.sent.length, 2)
    const sentUnsub = JSON.parse(lastMock!.sent[1])
    assertEquals(sentUnsub.method, 'unsubscribe')
  } finally {
    globalThis.WebSocket = originalWebSocket
  }
})

Deno.test('WsClient - post and handleMessage', async () => {
  const originalWebSocket = globalThis.WebSocket
  let lastMock: any = null
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url)
      lastMock = this
    }
  } as any

  try {
    const client = new WsClient({ url: 'ws://localhost:8080', timeoutMs: 1000 })

    const postPromise = client.post({ actions: [], signature: 'sig' } as any)

    await delay(20)
    assertEquals(lastMock?.sent.length, 1)
    const requestId = JSON.parse(lastMock.sent[0]).id

    lastMock.simulateMessage({
      type: 'post',
      id: requestId,
      data: {
        payload: { status: 'ok', response: { type: 'order', status: 'filled' } },
      },
    })

    const response = await postPromise
    assertEquals(response.status, 'ok')
  } finally {
    globalThis.WebSocket = originalWebSocket
  }
})
