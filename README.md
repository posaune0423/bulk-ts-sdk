<div align="center">
  <h1>📦 bulk-ts-sdk (Unofficial)</h1>
  <p><strong>A high-performance, type-safe, community-supported TypeScript SDK for Bulk Exchange.</strong></p>

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

- **Official Website**: [bulktrade.exchange](https://bulktrade.exchange)
- **API Documentation**: [docs.bulktrade.exchange](https://docs.bulktrade.exchange)
- **Official X (Twitter)**: [@BULK_Exchange](https://twitter.com/BULK_Exchange)

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

const client = new BulkClient({
  privateKey: "0x...", // Required for trading
});
```

### Fetch Market Data

```typescript
// Get current ticker for a symbol
const ticker = await client.market.ticker("BTC-USD");
console.log(`Current Price: ${ticker.last}`);

// Get exchange information
const info = await client.market.exchangeInfo();
```

### Trading Operations

```typescript
// Place a limit order
const order = await client.trade.placeLimitOrder({
  symbol: "BTC-USD",
  side: "buy",
  price: 50000,
  size: 0.1,
});

console.log(`Order ID: ${order.response.data.oid}`);
```

### Real-time Subscriptions (WebSocket)

```typescript
client.ws.subscribe({ type: "ticker", symbol: "BTC-USD" }, (data) => {
  console.log("Real-time Update:", data);
});
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

```bash
# Run all tests
deno task test

# Run e2e tests
deno task test:e2e
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by the Bulk Exchange community</sub>
</div>
