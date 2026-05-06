import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { stub } from "@std/testing/mock";
import { BulkClient } from "../../src/client.ts";
import { BulkDecodeError, BulkTransactionRejectedError } from "../../src/errors.ts";

const DUMMY_PRIVATE_KEY = "J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1";
const TARGET_ACCOUNT_PUBLIC_KEY = "synthetic-target-account-public-key";

Deno.test("Integration: BulkClient - Market API (GET)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(JSON.stringify([{ symbol: "BTC-USD" }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const info = await client.market.exchangeInfo();

    assertEquals(info, [{ symbol: "BTC-USD" }]);
    assertEquals(fetchStub.calls.length, 1);
    assertEquals(fetchStub.calls[0].args[0].toString(), "https://api.example.com/exchangeInfo");
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API (POST with Signature)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
  });

  const fetchStub = stub(
    globalThis,
    "fetch",
    () =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "ok", response: { type: "order", status: "filled" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
  );

  try {
    const response = await client.trade.placeLimitOrder({
      symbol: "BTC-USD",
      side: "buy",
      price: 100000,
      size: 0.1,
    });

    assertEquals(response.status, "ok");
    assertEquals(fetchStub.calls.length, 1);

    const requestUrl = fetchStub.calls[0].args[0].toString();
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;

    assertEquals(requestUrl, "https://api.example.com/order");
    assertEquals(requestInit?.method, "POST");

    const body = JSON.parse(requestInit?.body as string);
    // Verify that the body has the expected structure from normalizeSignedTransaction
    assertEquals(Array.isArray(body.actions), true);
    assertEquals(typeof body.signature, "string");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API posts signed market order action", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
  });

  const fetchStub = stub(
    globalThis,
    "fetch",
    () =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "ok", response: { type: "order", status: "filled" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
  );

  try {
    const response = await client.trade.placeMarketOrder({
      symbol: "BTC-USD",
      side: "sell",
      size: 0.1,
      reduceOnly: true,
      isolated: true,
    });

    assertEquals(response.status, "ok");
    assertEquals(fetchStub.calls.length, 1);

    const requestUrl = fetchStub.calls[0].args[0].toString();
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    const body = JSON.parse(requestInit?.body as string);

    assertEquals(requestUrl, "https://api.example.com/order");
    assertEquals(requestInit?.method, "POST");
    assertEquals(body.actions, [
      {
        m: {
          c: "BTC-USD",
          b: false,
          sz: 0.1,
          r: true,
          i: true,
        },
      },
    ]);
    assertEquals(typeof body.signature, "string");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify([
      {
        fullAccount: {
          kind: "MasterEOA",
          margin: { totalBalance: 1000 },
        },
      },
    ]),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const account = await client.account.fullAccount("0x123");

    assertEquals(account.kind, "MasterEOA");
    assertEquals(fetchStub.calls.length, 1);
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    const body = JSON.parse(requestInit?.body as string);
    assertEquals(body.type, "fullAccount");
    assertEquals(body.user, "0x123");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API (openOrders)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify([
      {
        openOrder: {
          symbol: "BTC-USD",
          price: 100000,
          originalSize: 0.1,
        },
      },
    ]),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const orders = await client.account.openOrders("0x123");

    assertEquals(orders.length, 1);
    assertEquals(orders[0].symbol, "BTC-USD");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (klines)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(JSON.stringify([{ t: 123456789, o: 100, c: 110 }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const klines = await client.market.klines({ symbol: "BTC-USD", interval: "1h" });

    assertEquals(klines.length, 1);
    assertEquals(klines[0].t, 123456789);
    assertEquals(fetchStub.calls[0].args[0].toString(), "https://api.example.com/klines?symbol=BTC-USD&interval=1h");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (klines) applies range and limit locally", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify([
      { t: 1000, T: 1999, o: 100, h: 110, l: 90, c: 105, v: 1, n: 1 },
      { t: 2000, T: 2999, o: 105, h: 115, l: 95, c: 110, v: 2, n: 2 },
      { t: 3000, T: 3999, o: 110, h: 120, l: 100, c: 115, v: 3, n: 3 },
      { t: 4000, T: 4999, o: 115, h: 125, l: 105, c: 120, v: 4, n: 4 },
    ]),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const klines = await client.market.klines({
      symbol: "BTC-USD",
      interval: "1m",
      startTime: 1500,
      endTime: 3500,
      limit: 1,
    });

    assertEquals(klines.map((candle) => candle.t), [2000]);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (klines) returns latest candles for limit-only requests", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify([
      { t: 1000, T: 1999, o: 100, h: 110, l: 90, c: 105, v: 1, n: 1 },
      { t: 2000, T: 2999, o: 105, h: 115, l: 95, c: 110, v: 2, n: 2 },
      { t: 3000, T: 3999, o: 110, h: 120, l: 100, c: 115, v: 3, n: 3 },
    ]),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const klines = await client.market.klines({
      symbol: "BTC-USD",
      interval: "1m",
      limit: 2,
    });

    assertEquals(klines.map((candle) => candle.t), [2000, 3000]);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (riskSurfaces)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify({ symbol: "BTC-USD", regimes: [] }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    await client.market.riskSurfaces("BTC-USD");

    assertEquals(
      fetchStub.calls[0].args[0].toString(),
      "https://api.example.com/riskSurfaces?market=BTC-USD",
    );
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (l2Book)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(JSON.stringify({ updateType: "snapshot", symbol: "BTC-USD", levels: [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const book = await client.market.l2Book({
      symbol: "BTC-USD",
      nlevels: 5,
      aggregation: 1,
    });

    assertEquals(book.levels, []);
    assertEquals(
      fetchStub.calls[0].args[0].toString(),
      "https://api.example.com/l2book?type=l2book&coin=BTC-USD&nlevels=5&aggregation=1",
    );
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (stats without symbol)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(JSON.stringify({ markets: [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const stats = await client.market.stats();

    assertEquals(stats.markets, []);
    assertEquals(fetchStub.calls[0].args[0].toString(), "https://api.example.com/stats");
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Market API (stats with symbol)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(JSON.stringify({ markets: [{ symbol: "BTC-USD" }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const stats = await client.market.stats({ symbol: "BTC-USD" });

    assertEquals(stats.markets?.[0].symbol, "BTC-USD");
    assertEquals(fetchStub.calls[0].args[0].toString(), "https://api.example.com/stats?coin=BTC-USD");
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API (cancelOrder)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
  });

  const mockResponse = new Response(JSON.stringify({ status: "ok", response: { type: "cancel", status: "success" } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const response = await client.trade.cancelOrder({
      symbol: "BTC-USD",
      orderId: "Fpa3oVuL3UzjNANAMZZdmrn6D1Zhk83GmBuJpuAWG51F",
    });

    assertEquals(response.status, "ok");
    assertEquals(fetchStub.calls.length, 1);

    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    const body = JSON.parse(requestInit?.body as string);
    assertEquals(Array.isArray(body.actions), true);
    assertEquals(body.actions[0].cx !== undefined, true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API (fills)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify([
      {
        fills: { symbol: "BTC-USD", amount: 0.1 },
      },
    ]),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const fills = await client.account.fills("0x123");
    assertEquals(fills.length, 1);
    assertEquals(fills[0].symbol, "BTC-USD");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API (positions, funding, order history)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const responses = [
    [{ positions: { symbol: "BTC-USD", szi: "0.1" } }],
    [{ fundingPayment: { symbol: "BTC-USD", usdc: "1.23" } }],
    [{ orderHistory: { symbol: "BTC-USD", side: "buy" } }],
  ];
  const fetchStub = stub(globalThis, "fetch", () => {
    const response = responses.shift();
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  try {
    const positions = await client.account.positions("0x123");
    const funding = await client.account.fundingHistory("0x123");
    const orderHistory = await client.account.orderHistory("0x123");

    assertEquals(positions[0].symbol, "BTC-USD");
    assertEquals(funding[0].symbol, "BTC-USD");
    assertEquals(orderHistory[0].symbol, "BTC-USD");
    const requestTypes = fetchStub.calls.map((call) => JSON.parse((call.args[1] as RequestInit).body as string).type);
    assertEquals(requestTypes, ["positions", "fundingHistory", "orderHistory"]);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API (feeTier)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify([
      {
        feeTier: { symbol: "global", makerBps: 10, globalPolicyActive: true },
      },
    ]),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const fee = await client.account.feeTier("0x123");
    assertEquals(fee.globalPolicyActive, true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API rejects missing decoded account payloads", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify([{}]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));

  try {
    await assertRejects(
      () => client.account.fullAccount("0x123"),
      BulkDecodeError,
      "fullAccount response is empty",
    );
    await assertRejects(
      () => client.account.feeTier("0x123"),
      BulkDecodeError,
      "feeTier response is empty",
    );
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API (feeState)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify({ symbol: "global", makerBps: 10, globalPolicyActive: true }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const fee = await client.account.feeState();

    assertEquals(fee.globalPolicyActive, true);
    assertEquals(fetchStub.calls[0].args[0].toString(), "https://api.example.com/feeState");
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Account API (multisigProposals)", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(
    JSON.stringify({ multisig: "abc123", proposals: [] }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    const rawPubkey = "abc/123==";
    const proposals = await client.account.multisigProposals(rawPubkey);

    assertEquals(proposals.proposals, []);
    assertEquals(
      fetchStub.calls[0].args[0].toString(),
      `https://api.example.com/multisig/${encodeURIComponent(rawPubkey)}/proposals`,
    );
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - exposes derived accountPublicKey", () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
  });

  assertEquals(typeof client.accountPublicKey, "string");
});

Deno.test("Integration: BulkClient - exposes explicit accountPublicKey without signer", () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    accountPublicKey: TARGET_ACCOUNT_PUBLIC_KEY,
  });

  assertEquals(client.accountPublicKey, TARGET_ACCOUNT_PUBLIC_KEY);
  assertEquals(client.accountId, TARGET_ACCOUNT_PUBLIC_KEY);
});

Deno.test("Integration: BulkClient - rejects target account signing when native keychain cannot sign it", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
    accountPublicKey: TARGET_ACCOUNT_PUBLIC_KEY,
  });

  assertEquals(client.accountPublicKey, TARGET_ACCOUNT_PUBLIC_KEY);
  await assertRejects(
    () =>
      client.trade.placeLimitOrder({
        symbol: "BTC-USD",
        side: "buy",
        price: 100000,
        size: 0.1,
      }),
    Error,
    "target-account signing support",
  );
});

Deno.test("Integration: BulkClient - signing nonce is monotonic within same millisecond", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
  });

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ status: "ok", response: { type: "order", status: "filled" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));
  const nowStub = stub(Date, "now", () => 1234567890);

  try {
    await client.trade.placeLimitOrder({
      symbol: "BTC-USD",
      side: "buy",
      price: 100000,
      size: 0.1,
    });
    await client.trade.placeLimitOrder({
      symbol: "BTC-USD",
      side: "buy",
      price: 100001,
      size: 0.1,
    });

    const firstRequestInit = fetchStub.calls[0].args[1] as { body?: string };
    const secondRequestInit = fetchStub.calls[1].args[1] as { body?: string };
    assertExists(firstRequestInit.body);
    assertExists(secondRequestInit.body);
    const firstBody = JSON.parse(firstRequestInit.body);
    const secondBody = JSON.parse(secondRequestInit.body);
    assertEquals(firstBody.nonce, 1234567890000);
    assertEquals(secondBody.nonce, 1234567890001);
  } finally {
    nowStub.restore();
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API batches signed actions", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
    privateKey: DUMMY_PRIVATE_KEY,
  });

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ status: "ok", response: { type: "order", data: { statuses: [] } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));

  try {
    const response = await client.trade.batch([
      {
        type: "order",
        symbol: "BTC-USD",
        isBuy: true,
        price: 100000,
        size: 0.1,
        reduceOnly: false,
        iso: false,
        orderType: { type: "limit", tif: "GTC" },
      },
      { type: "cancelAll", symbols: ["BTC-USD"] },
    ]);

    assertEquals(response.status, "ok");
    const requestInit = fetchStub.calls[0].args[1] as { body?: string };
    assertExists(requestInit.body);
    const body = JSON.parse(requestInit.body);
    assertEquals(body.actions.length, 2);
    assertEquals(body.actions[1], { cxa: { c: ["BTC-USD"] } });
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API rejects error order responses by default", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ status: "error", response: "insufficient margin" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));

  try {
    await assertRejects(
      () =>
        client.trade.submit({
          actions: [],
          nonce: 1,
          account: "account",
          signer: "signer",
          signature: "signature",
        }),
      BulkTransactionRejectedError,
      "insufficient margin",
    );
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API can resolve rejected order responses when requested", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ status: "error", response: "post only would cross" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));

  try {
    const response = await client.trade.submit(
      {
        actions: [],
        nonce: 1,
        account: "account",
        signer: "signer",
        signature: "signature",
      },
      { throwOnReject: false },
    );

    assertEquals(response.status, "error");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API submits signed transactions over WebSocket", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });
  const wsPostStub = stub(
    client.ws,
    "post",
    () => Promise.resolve({ status: "ok", response: { type: "order", data: { statuses: [] } } }),
  );

  try {
    const response = await client.trade.submit(
      {
        actions: [{ type: "order" }],
        nonce: 1,
        account: "account",
        signer: "signer",
        signature: "signature",
      },
      { via: "ws", timeoutMs: 123 },
    );

    assertEquals(response.status, "ok");
    assertEquals(wsPostStub.calls.length, 1);
    assertEquals(wsPostStub.calls[0].args[0].actions, [{ type: "order" }]);
    assertEquals(wsPostStub.calls[0].args[1], { timeoutMs: 123 });
  } finally {
    wsPostStub.restore();
  }
});

Deno.test("Integration: BulkClient - Trade API requires a signer for generated trading actions", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  await assertRejects(
    () =>
      client.trade.cancelAll({
        symbols: ["BTC-USD"],
      }),
    Error,
    "Signer is required",
  );
});

Deno.test("Integration: BulkClient - Error Handling", async () => {
  const client = new BulkClient({
    httpUrl: "https://api.example.com",
  });

  const mockResponse = new Response(JSON.stringify({ error: "Invalid symbol" }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

  try {
    await assertRejects(
      () => client.market.ticker("INVALID"),
      Error,
      "Invalid symbol",
    );
  } finally {
    fetchStub.restore();
  }
});
