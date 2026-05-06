<div align="center">
  <h1>💪🏻 bulk-ts-sdk (Unofficial)</h1>
  <p><strong>A high-performance, type-safe, community-supported TypeScript SDK for Bulk Trade.</strong></p>

<p>
    <a href="https://github.com/posaune0423/bulk-ts-sdk/actions/workflows/ci.yml"><img src="https://github.com/posaune0423/bulk-ts-sdk/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
    <a href="https://jsr.io/@posaune0423/bulk-ts-sdk"><img src="https://jsr.io/badges/@posaune0423/bulk-ts-sdk" alt="JSR" /></a>
    <a href="https://www.npmjs.com/package/bulk-ts-sdk"><img src="https://img.shields.io/npm/v/bulk-ts-sdk.svg" alt="NPM Version" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  </p>

<p>
    <a href="#-links">Links</a> •
    <a href="#-features">Features</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-api-structure">API Structure</a>
  </p>
</div>

---

## 🔗 Links

- **Official Website**: [bulk.trade](https://bulk.trade)
- **API Documentation**: [docs.bulk.trade](https://docs.bulk.trade)
- **Github**: [@Bulk-trade](https://github.com/Bulk-trade)
- **Official X (Twitter)**: [@bulktrade](https://x.com/bulktrade)

---

## 🚀 Features

- **⚡ High Performance**: Built with zero-dependency core logic and optimized for speed.
- **🛡️ Fully Type-Safe**: Comprehensive TypeScript definitions for all API responses and requests.
- **🔌 Unified Client**: Simple interface for HTTP (Market/Account) and WebSocket (Real-time) interactions.
- **🔑 Seamless Signing**: Integrated `KeychainSigner` for easy order signing and multi-sig support.
- **🌐 Dual Compatibility**: Works perfectly in Deno, Bun, Node.js, and browser environments.

---

## 📦 Installation

### Deno (via JSR)

```bash
deno add jsr:@posaune0423/bulk-ts-sdk
```

### Node.js / Bun / pnpm

```bash
# Using bun
bun add bulk-ts-sdk

# Using npm
npm install bulk-ts-sdk

# Using pnpm
pnpm add bulk-ts-sdk
```

---

## 🏃 Quick Start

### Initialize the Client

```typescript
import { BulkClient } from "bulk-ts-sdk";
import process from "node:process";

const client = new BulkClient({
  privateKey: process.env.MAIN_WALLET_PRIVATE_KEY!,
});
```

The client can be used without a key for public market data. A `privateKey` is required only when you call signing
methods such as `client.trade.placeLimitOrder()`, `client.trade.cancelOrder()`, or `client.trade.manageAgentWallet()`.

| Option             | Required | Purpose                                                                                      |
| :----------------- | :------- | :------------------------------------------------------------------------------------------- |
| `httpUrl`          | No       | HTTP API base URL. Defaults to Bulk production.                                              |
| `wsUrl`            | No       | WebSocket API URL. Defaults to Bulk production.                                              |
| `privateKey`       | No       | Wallet private key used for signing trade and agent-wallet actions.                          |
| `accountPublicKey` | No       | Target account public key. Only needed when signing with an agent wallet for a main account. |
| `timeoutMs`        | No       | Request timeout in milliseconds.                                                             |

Use one of these environment variable sets:

- Main wallet only: set `MAIN_WALLET_PRIVATE_KEY`.
- Agent wallet for a main wallet: set both `AGENT_WALLET_PRIVATE_KEY` and `MAIN_WALLET_PUBLIC_KEY`.

For normal trading with the main wallet key, pass `MAIN_WALLET_PRIVATE_KEY` as `privateKey`. In that case
`client.accountPublicKey` is derived from the signer and can be reused for account queries.

```typescript
const client = new BulkClient({
  privateKey: process.env.MAIN_WALLET_PRIVATE_KEY!,
});

const accountPublicKey = client.accountPublicKey;
if (!accountPublicKey) throw new Error("privateKey is required for account-scoped examples");
```

When signing for a main wallet through its registered agent wallet, pass `AGENT_WALLET_PRIVATE_KEY` as `privateKey` and
the target `MAIN_WALLET_PUBLIC_KEY` as `accountPublicKey`. Target-account order signing depends on native
`bulk-keychain` support for signing that target account; unsupported native builds fail before submitting an invalid
signature.

```typescript
const client = new BulkClient({
  privateKey: process.env.AGENT_WALLET_PRIVATE_KEY!,
  accountPublicKey: process.env.MAIN_WALLET_PUBLIC_KEY!,
});
```

### Fetch Market Data

```typescript
const info = await client.market.exchangeInfo();
const ticker = await client.market.ticker("BTC-USD");
const candles = await client.market.klines({
  symbol: "BTC-USD",
  interval: "1m",
  limit: 100,
});
const book = await client.market.l2Book({
  symbol: "BTC-USD",
  nlevels: 20,
});
const stats = await client.market.stats({ symbol: "BTC-USD" });
const risk = await client.market.riskSurfaces("BTC-USD");

console.log(info.length, ticker.lastPrice, candles.length, book, stats, risk);
```

### Read Account Data

Account history methods take the account public key you want to inspect. If the client was created with a main wallet
`privateKey`, use `client.accountPublicKey`.

```typescript
const accountPublicKey = client.accountPublicKey;
if (!accountPublicKey) throw new Error("privateKey is required");

const full = await client.account.fullAccount(accountPublicKey);
const openOrders = await client.account.openOrders(accountPublicKey);
const fills = await client.account.fills(accountPublicKey);
const positions = await client.account.positions(accountPublicKey);
const funding = await client.account.fundingHistory(accountPublicKey);
const orders = await client.account.orderHistory(accountPublicKey);
const feeTier = await client.account.feeTier(accountPublicKey);

// Global fee state does not require an account public key.
const feeState = await client.account.feeState();

console.log({ full, openOrders, fills, positions, funding, orders, feeTier, feeState });
```

Multisig proposal snapshots are available when you already have a multisig account public key:

```typescript
const proposals = await client.account.multisigProposals("multisig-account-public-key");
console.log(proposals.proposals);
```

### Trade

```typescript
const order = await client.trade.placeLimitOrder({
  symbol: "BTC-USD",
  side: "buy",
  price: 50000,
  size: 0.1,
  tif: "GTC",
});

const firstStatus = order.response.data.statuses[0];
if (firstStatus && "resting" in firstStatus && firstStatus.resting) {
  console.log(`Order ID: ${firstStatus.resting.oid}`);
}

await client.trade.cancelAll({ symbols: ["BTC-USD"] });
```

Market orders, single-order cancel, and batch submission use the same signer:

```typescript
await client.trade.placeMarketOrder({
  symbol: "BTC-USD",
  side: "sell",
  size: 0.05,
});

await client.trade.cancelOrder({
  symbol: "BTC-USD",
  orderId: "order-id",
});

import { toKeychainCancelOrder, toKeychainLimitOrder } from "bulk-ts-sdk";

await client.trade.batch([
  toKeychainLimitOrder({
    symbol: "BTC-USD",
    side: "buy",
    price: 49000,
    size: 0.001,
  }),
  toKeychainCancelOrder({
    symbol: "BTC-USD",
    orderId: "order-id",
  }),
]);
```

### Agent Wallet Registration

Register an agent wallet with the main wallet signer:

```typescript
const agentWalletClient = new BulkClient({
  privateKey: process.env.AGENT_WALLET_PRIVATE_KEY!,
});

const agentWalletPublicKey = agentWalletClient.accountPublicKey;
if (!agentWalletPublicKey) throw new Error("AGENT_WALLET_PRIVATE_KEY is required");

await client.trade.manageAgentWallet({
  agent: agentWalletPublicKey,
  remove: false,
});
```

### Real-time Subscriptions (WebSocket)

```typescript
await client.ws.connect();

const subscription = await client.ws.subscribe({ type: "ticker", symbol: "BTC-USD" }, (data) => {
  console.log("Real-time Update:", data);
});

await subscription.unsubscribe();
await client.ws.close();
```

You can also submit signed trades over WebSocket:

```typescript
await client.ws.connect();

const order = await client.trade.placeLimitOrder(
  {
    symbol: "BTC-USD",
    side: "buy",
    price: 50000,
    size: 0.001,
  },
  { via: "ws" },
);

console.log(order.status);
```

---

## 🔧 API Structure

The `BulkClient` is organized into focused sub-clients:

| Sub-Client | Description                                                  |
| :--------- | :----------------------------------------------------------- |
| `market`   | Public data like tickers, candles (klines), and order books. |
| `account`  | Private data like balances, open orders, and trade history.  |
| `trade`    | Execution operations (limit/market orders, cancels, batch).  |
| `ws`       | WebSocket management and real-time subscriptions.            |

---

## 🧪 Testing

E2E tests read `.env` through Deno's `--env-file=.env` support.

```bash
cp .env.example .env
```

For normal account/trade E2E with the main wallet key, only this wallet variable is required:

```bash
MAIN_WALLET_PRIVATE_KEY=main-wallet-private-key
```

For agent-wallet tests or examples targeting the main wallet, set both values:

```bash
AGENT_WALLET_PRIVATE_KEY=agent-wallet-private-key
MAIN_WALLET_PUBLIC_KEY=main-wallet-public-key
```

Optional test/example variables:

```bash
MULTISIG_PUBKEY=multisig-account-public-key
```

```bash
# Run all tests
deno task test

# Run e2e tests
deno task test:e2e
```

---

## 🤖 For Agent

Read [llm.txt](./llm.txt)

## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.
