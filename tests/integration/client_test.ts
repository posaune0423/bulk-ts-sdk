import { assertEquals, assertRejects } from "@std/assert";
import { stub } from "@std/testing/mock";
import { BulkClient } from "../../src/client.ts";

const DUMMY_PRIVATE_KEY = "J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1";

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

  const mockResponse = new Response(JSON.stringify({ status: "ok", response: { type: "order", status: "filled" } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const fetchStub = stub(globalThis, "fetch", () => Promise.resolve(mockResponse));

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
    const proposals = await client.account.multisigProposals("abc123");

    assertEquals(proposals.proposals, []);
    assertEquals(
      fetchStub.calls[0].args[0].toString(),
      "https://api.example.com/multisig/abc123/proposals",
    );
    const requestInit = fetchStub.calls[0].args[1] as RequestInit;
    assertEquals(requestInit?.method, "GET");
  } finally {
    fetchStub.restore();
  }
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
