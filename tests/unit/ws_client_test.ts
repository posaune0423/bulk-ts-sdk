import { assertEquals, assertRejects } from "@std/assert";
import { delay } from "@std/async/delay";
import { WsClient } from "../../src/ws/ws_client.ts";
import type { SignedTransaction } from "../../src/types/trade.ts";

class MockWebSocket extends EventTarget {
  readyState: number = WebSocket.CONNECTING;
  url: string;
  sent: string[] = [];
  private timer: number | null = null;

  constructor(url: string) {
    super();
    this.url = url;
    this.readyState = WebSocket.OPEN;
  }

  triggerOpen(): void {
    this.dispatchEvent(new Event("open"));
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event("close"));
  }

  simulateMessage(data: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(data) }));
  }
}

Deno.test("WsClient - connect and close", async () => {
  const originalWebSocket = globalThis.WebSocket;
  let lastMock: MockWebSocket | null = null;
  const MockWS = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  };
  // @ts-ignore: Mocking WebSocket
  globalThis.WebSocket = MockWS as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    const connectPromise = client.connect();
    (lastMock as MockWebSocket | null)?.triggerOpen();
    await connectPromise;
    assertEquals((lastMock as MockWebSocket | null)?.readyState, WebSocket.OPEN);

    await client.close();
    assertEquals((lastMock as MockWebSocket | null)?.readyState, WebSocket.CLOSED);
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - subscribe", async () => {
  const originalWebSocket = globalThis.WebSocket;
  let lastMock: MockWebSocket | null = null;
  const MockWS = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  };
  // @ts-ignore: Mocking WebSocket
  globalThis.WebSocket = MockWS as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });
    let received: unknown = null;

    const subPromise = client.subscribe({ type: "ticker", symbol: "BTC-USD" }, (data) => {
      received = data;
    });
    (lastMock as MockWebSocket | null)?.triggerOpen();
    await subPromise;

    assertEquals((lastMock as MockWebSocket | null)?.sent.length, 1);
    if (lastMock) {
      const sent = JSON.parse((lastMock as MockWebSocket).sent[0]);
      assertEquals(sent.method, "subscribe");

      (lastMock as MockWebSocket).simulateMessage({ topic: "ticker.BTC-USD", data: { price: "100000" } });
    }
    await delay(10);
    // @ts-ignore: Accessing data property
    assertEquals(received?.data?.price, "100000");
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

Deno.test("WsClient - post", async () => {
  const originalWebSocket = globalThis.WebSocket;
  let lastMock: MockWebSocket | null = null;
  const MockWS = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  };
  // @ts-ignore: Mocking WebSocket
  globalThis.WebSocket = MockWS as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 1000 });

    const postPromise = client.post({ actions: [], signature: "sig" } as unknown as SignedTransaction);
    (lastMock as MockWebSocket | null)?.triggerOpen();

    await delay(20); // wait for connect and send
    assertEquals((lastMock as MockWebSocket | null)?.sent.length, 1);
    if (lastMock) {
      const sent = JSON.parse((lastMock as MockWebSocket).sent[0]);
      assertEquals(sent.method, "post");
      const requestId = sent.id;

      (lastMock as MockWebSocket).simulateMessage({
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

Deno.test("WsClient - timeout", async () => {
  const originalWebSocket = globalThis.WebSocket;
  let lastMock: MockWebSocket | null = null;
  const MockWS = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastMock = this;
    }
  };
  // @ts-ignore: Mocking WebSocket
  globalThis.WebSocket = MockWS as unknown as typeof WebSocket;

  try {
    const client = new WsClient({ url: "ws://localhost:8080", timeoutMs: 50 });
    const postPromise = client.post({ actions: [], signature: "sig" } as unknown as SignedTransaction);
    (lastMock as MockWebSocket | null)?.triggerOpen();
    await assertRejects(
      () => postPromise,
      Error,
      "WS post timed out",
    );
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});
