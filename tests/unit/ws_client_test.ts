import { assertEquals, assertRejects } from "@std/assert";
import { delay } from "@std/async/delay";
import { WsClient } from "../../src/ws/ws_client.ts";

class MockWebSocket extends EventTarget {
  readyState: number = WebSocket.OPEN;
  url: string;
  sent: string[] = [];
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(url: string) {
    super();
    this.url = url;
    queueMicrotask(() => {
      const ev = new Event("open");
      this.dispatchEvent(ev);
      if (this.onopen) this.onopen(ev);
    });
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    const ev = new CloseEvent("close");
    this.dispatchEvent(ev);
    if (this.onclose) this.onclose(ev);
  }

  simulateMessage(data: unknown): void {
    const ev = new MessageEvent("message", { data: JSON.stringify(data) });
    this.dispatchEvent(ev);
    if (this.onmessage) this.onmessage(ev);
  }
}

Deno.test("WsClient - connect and close", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    await client.connect();
    assertEquals(lastMock?.readyState, WebSocket.OPEN);

    await client.close();
    assertEquals(lastMock?.readyState, WebSocket.CLOSED);
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - subscribe and unsubscribe", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    let received: unknown = null;

    const handle = await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, (data) => {
      received = data;
    });

    assertEquals(lastMock?.sent.length, 1);
    if (lastMock) {
      const sentSub = JSON.parse(lastMock.sent[0]);
      assertEquals(sentSub.method, "subscribe");

      lastMock.simulateMessage({ topic: "ticker.BTC-USD", data: { price: "100000" } });
    }
    await delay(10);
    // deno-lint-ignore no-explicit-any
    assertEquals((received as any)?.data?.price, "100000");

    await handle.unsubscribe();
    assertEquals(lastMock?.sent.length, 2);
    if (lastMock) {
      const sentUnsub = JSON.parse(lastMock.sent[1]);
      assertEquals(sentUnsub, {
        method: "unsubscribe",
        topic: "ticker.BTC-USD",
      });
    }
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - l2 snapshot subscription handler receives documented book payload type", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    let invoked = false;

    await client.subscribe({ type: "l2Snapshot", symbol: "BTC-USD" }, (message) => {
      invoked = true;
      const levels = message.data.book.levels;
      if (levels) {
        const topBid = levels[0][0]?.px;
        assertEquals(typeof topBid, "number");
      }
    });

    assertEquals(lastMock?.sent.length, 1);
    lastMock?.simulateMessage({
      type: "l2Snapshot",
      topic: "l2snapshot.BTC-USD",
      data: {
        book: {
          updateType: "snapshot",
          symbol: "BTC-USD",
          levels: [[{ px: 100, sz: 1, n: 1 }], [{ px: 101, sz: 1, n: 1 }]],
          timestamp: 1,
        },
      },
    });

    await delay(10);
    assertEquals(invoked, true);
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - dispatches l2 snapshot messages with nested book levels", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    let topBid: number | undefined;

    await client.subscribe({ type: "l2Snapshot", symbol: "BTC-USD" }, (message) => {
      topBid = message.data.book.levels?.[0][0]?.px;
    });

    lastMock?.simulateMessage({
      type: "l2Snapshot",
      topic: "l2snapshot.BTC-USD",
      data: {
        book: {
          updateType: "snapshot",
          symbol: "BTC-USD",
          levels: [[{ px: 100, sz: 1, n: 1 }], [{ px: 101, sz: 1, n: 1 }]],
          timestamp: 1,
        },
      },
    });

    await delay(10);
    assertEquals(topBid, 100);
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - keeps shared server subscription until the last local handler unsubscribes", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });

    const first = await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, () => {});
    assertEquals(lastMock?.sent.length, 1);
    if (lastMock) {
      assertEquals(JSON.parse(lastMock.sent[0]), {
        method: "subscribe",
        subscription: [{ type: "ticker", symbol: "BTC-USD" }],
      });
    }

    const second = await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, () => {});
    assertEquals(lastMock?.sent.length, 1);

    await first.unsubscribe();
    assertEquals(lastMock?.sent.length, 1);

    await second.unsubscribe();
    assertEquals(lastMock?.sent.length, 2);
    if (lastMock) {
      assertEquals(JSON.parse(lastMock.sent[1]), {
        method: "unsubscribe",
        topic: "ticker.BTC-USD",
      });
    }
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - duplicate unsubscribe is a no-op for shared topics", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });

    const first = await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, () => {});
    const second = await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, () => {});

    await first.unsubscribe();
    await first.unsubscribe();
    assertEquals(lastMock?.sent.length, 1);

    await second.unsubscribe();
    assertEquals(lastMock?.sent.length, 2);
    if (lastMock) {
      assertEquals(JSON.parse(lastMock.sent[1]), {
        method: "unsubscribe",
        topic: "ticker.BTC-USD",
      });
    }
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - clears subscription state after socket close", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });

    await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, () => {});
    assertEquals(lastMock?.sent.length, 1);

    await client.close();

    const handle = await client.subscribe({ type: "ticker", symbol: "BTC-USD" }, () => {});
    assertEquals(lastMock?.sent.length, 1);
    if (lastMock) {
      assertEquals(JSON.parse(lastMock.sent[0]), {
        method: "subscribe",
        subscription: [{ type: "ticker", symbol: "BTC-USD" }],
      });
    }

    await handle.unsubscribe();
    assertEquals(lastMock?.sent.length, 2);
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - post and handleMessage", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });

    const postPromise = client.post({ actions: [], signature: "sig" } as unknown as never);

    await delay(20);
    assertEquals(lastMock?.sent.length, 1);
    if (lastMock) {
      const requestId = JSON.parse(lastMock.sent[0]).id;

      // Test ignore non-record message
      lastMock.simulateMessage(null);

      // Test ignore message without type/id
      lastMock.simulateMessage({ some: "field" });

      // Test ignore subscribe/unsubscribe response
      lastMock.simulateMessage({ method: "subscribe" });

      // Test valid post response
      lastMock.simulateMessage({
        type: "post",
        id: requestId,
        data: {
          payload: { status: "ok", response: { type: "order", status: "filled" } },
        },
      });
    }

    const response = await postPromise;
    assertEquals(response.status, "ok");
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - handleClose rejects pending", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    const promise = client.post({ actions: [], signature: "sig" } as unknown as never);

    await delay(20);
    lastMock?.close();

    await assertRejects(() => promise, Error, "WebSocket closed while post was pending");
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - invalid post response", async () => {
  const originalWebSocket = globalThis.WebSocket;
  // deno-lint-ignore no-explicit-any
  let lastMock: any = null;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    const promise = client.post({ actions: [], signature: "sig" } as unknown as never);

    await delay(20);
    if (lastMock) {
      const requestId = JSON.parse(lastMock.sent[0]).id;

      lastMock.simulateMessage({
        type: "post",
        id: requestId,
        data: {}, // Missing payload
      });
    }

    await assertRejects(() => promise, Error, "Invalid post response");
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - timeout", async () => {
  const originalWebSocket = globalThis.WebSocket;
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
    }
  } as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 50 });
    await assertRejects(
      () => client.post({ actions: [], signature: "sig" } as unknown as never),
      Error,
      "WS post timed out",
    );
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});
