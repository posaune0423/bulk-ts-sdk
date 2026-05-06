# ARCHITECTURE

## Overview

`bulk-ts-sdk` は Bulk Trade API を TypeScript から安全かつ簡潔に扱うための SDK です。 SDK は root client
方式を採用します。

```ts
const client = new BulkClient({ privateKey });
client.market;
client.account;
client.trade;
client.ws;
```

public interface は simple に保ちつつ、内部実装は責務ごとに module を分離します。

```txt
BulkClient
  ├─ MarketClient
  ├─ AccountClient
  ├─ TradeClient
  └─ WsClient
shared
  ├─ HttpTransport
  ├─ WsTransport
  ├─ KeychainSigner
  ├─ builders
  ├─ validation
  ├─ generated types
  └─ errors
```

## Design Principles

### 1. Simple public API

SDK user は基本的に `BulkClient` だけを生成します。

```ts
const client = new BulkClient({
  privateKey: Deno.env.get("BULK_PRIVATE_KEY"),
});
```

用途別に以下の namespace を使います。

```ts
await client.market.ticker("BTC-USD");
await client.account.fullAccount(user);
await client.trade.placeLimitOrder(params);
await client.ws.trades("BTC-USD", handler);
```

### 2. Internal separation

public API は root client に集約しますが、内部実装は module ごとに分離します。 理由:

- test しやすくする
- REST / WebSocket / signing の責務を混ぜない
- 将来的に advanced export を追加しやすくする
- high-level helper と low-level transport を分離する
- OpenAPI coverage を endpoint 単位で追いやすくする

### 3. No custom signing serialization

SDK は Bulk transaction signing internals を再実装しません。 以下はすべて `bulk-keychain` に委譲します。

- canonical serialization
- signature generation
- order id generation
- transaction bytes generation
- price / size fixed-point encoding SDK の責務は以下です。

```txt
user-friendly params
  -> bulk-keychain input
  -> signed transaction
  -> normalized transaction
  -> HTTP / WS submit
```

### 4. REST and WebSocket are both first-class

Bulk Trade は REST と WebSocket の両方を提供します。 SDK では以下をサポートします。

- REST market data
- REST account data
- REST signed transaction submit
- WebSocket realtime subscription
- WebSocket signed transaction submit signed transaction は同じ `SignedTransaction` 型で HTTP / WS
  の両方に流せるようにします。

```ts
await client.trade.placeLimitOrder(params, { via: "http" });
await client.trade.placeLimitOrder(params, { via: "ws" });
```

default は HTTP とします。

### 5. Type-safe but not over-validated on hot path

SDK は TypeScript 型を重視します。 一方で、WebSocket の hot path において重い runtime validation を常時実行しません。
方針:

- user input は validation してよい
- environment variables は validation する
- REST response validation は optional にする
- WebSocket message validation は debug / test / optional mode にする
- production hot path は軽量な type guard と topic routing を優先する

## Folder Structure

```bash
bulk-ts-sdk/
  README.md
  deno.json
  deno.lock
  .env.example
  .gitignore
  docs/
    PRD.md
    TECH.md
    TEST.md
    ARCHITECTURE.md
  references/
    openapi.yml
  scripts/
    generate_openapi_types.ts
  src/
    mod.ts
    client.ts
    constants.ts
    errors.ts
    generated/
      openapi.ts
    types/
      index.ts
      common.ts
      market.ts
      account.ts
      trade.ts
      ws.ts
    validation/
      index.ts
      common.ts
      market.ts
      account.ts
      trade.ts
      ws.ts
    http/
      index.ts
      http_transport.ts
      market_client.ts
      account_client.ts
      trade_client.ts
    ws/
      index.ts
      ws_client.ts
      subscriptions.ts
      messages.ts
      router.ts
      reconnect.ts
    signing/
      index.ts
      keychain_signer.ts
      normalize_signed_transaction.ts
    builders/
      index.ts
      orders.ts
      transactions.ts
    utils/
      index.ts
      url.ts
      timeout.ts
      json.ts
      type_guards.ts
  tests/
    unit/
    integration/
    e2e/
    fixtures/
    helpers/
```

## Module Responsibilities

## `src/mod.ts`

Deno package の public entry point です。 原則として SDK user が import するものは `mod.ts` から export します。

```ts
export { BulkClient } from "./client.ts";
export * from "./types/index.ts";
export * from "./errors.ts";
```

MVP では advanced module export は不要です。 将来的に必要であれば以下を追加します。

```ts
export * from "./http/index.ts";
export * from "./ws/index.ts";
export * from "./signing/index.ts";
```

## `src/client.ts`

`BulkClient` を定義します。 責務:

- SDK config を受け取る
- `HttpTransport` を生成する
- `WsClient` を生成する
- `KeychainSigner` を生成する
- `MarketClient` / `AccountClient` / `TradeClient` を生成する
- root namespace を提供する 想定 API:

```ts
const client = new BulkClient({
  privateKey: Deno.env.get("BULK_PRIVATE_KEY"),
});
client.market;
client.account;
client.trade;
client.ws;
client.accountPublicKey;
```

実装イメージ:

```ts
export type BulkClientConfig = {
  httpUrl?: string;
  wsUrl?: string;
  privateKey?: string;
  accountPublicKey?: string;
  timeoutMs?: number;
  validateResponses?: boolean;
};
export class BulkClient {
  readonly market: MarketClient;
  readonly account: AccountClient;
  readonly trade: TradeClient;
  readonly ws: WsClient;
  readonly accountPublicKey?: string;
  constructor(config: BulkClientConfig = {}) {
    const http = new HttpTransport({
      baseUrl: config.httpUrl ?? BULK_DEFAULT_HTTP_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });
    const ws = new WsClient({
      url: config.wsUrl ?? BULK_DEFAULT_WS_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });
    const signer = config.privateKey
      ? KeychainSigner.fromPrivateKey(config.privateKey, config.accountPublicKey)
      : undefined;
    this.market = new MarketClient({ http });
    this.account = new AccountClient({ http });
    this.ws = ws;
    this.trade = new TradeClient({ http, ws, signer });
    this.accountPublicKey = signer?.accountPublicKey;
  }
}
```

## `src/constants.ts`

SDK 全体の定数を定義します。 例:

```ts
export const BULK_DEFAULT_HTTP_URL = "https://exchange-api.bulk.trade/api/v1";
export const BULK_DEFAULT_WS_URL = "wss://exchange-ws1.bulk.trade";
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_WS_POST_TIMEOUT_MS = 10_000;
```

## `src/errors.ts`

SDK 共通 error を定義します。 必要な error:

```ts
export class BulkHttpError extends Error {}
export class BulkWsError extends Error {}
export class BulkTimeoutError extends Error {}
export class BulkDecodeError extends Error {}
export class BulkTransactionRejectedError extends Error {}
```

責務ごとに error を分けます。

```txt
HTTP status error
  -> BulkHttpError
WebSocket connection / protocol error
  -> BulkWsError
Timeout
  -> BulkTimeoutError
JSON parse / response decode error
  -> BulkDecodeError
HTTP 200 but transaction status is error
  -> BulkTransactionRejectedError
```

`POST /order` は HTTP 200 でも transaction が rejected になり得るため、HTTP transport layer では成功として扱い、trade
layer で transaction status を検査します。

## Type System

## `src/generated/openapi.ts`

OpenAPI spec から自動生成する型です。 この file は手編集しません。 生成元:

```bash
references/openapi.yml
```

生成先:

```bash
src/generated/openapi.ts
```

生成 script:

```bash
deno task generate:types
```

## `src/types/*`

SDK の public type を定義します。 OpenAPI generated type を直接使えるものは re-export します。 user-facing input
は手書きします。 理由:

- OpenAPI の compact wire format をそのまま user に露出しない
- autocomplete を分かりやすくする
- `side: 'buy' | 'sell'` のような ergonomic API にする
- WebSocket message は OpenAPI 外の仕様も含むため手書きが必要

### `types/common.ts`

```ts
export type Side = "buy" | "sell";
export type TimeInForce = "GTC" | "IOC" | "ALO";
export type TransportKind = "http" | "ws";
export type CandleInterval =
  | "10s"
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";
```

### `types/market.ts`

Market data 関連型を定義します。 基本的には generated type を re-export します。

```ts
import type { components } from "../generated/openapi.ts";
export type MarketInfo = components["schemas"]["MarketInfo"];
export type MarketStats = components["schemas"]["MarketStats"];
export type Candle = components["schemas"]["Candle"];
export type BookUpdate = components["schemas"]["BookUpdate"];
export type Level = components["schemas"]["Level"];
export type ExchangeStats = components["schemas"]["ExchangeStats"];
export type RiskSurfaces = components["schemas"]["RiskSurfaces"];
```

### `types/account.ts`

Account data 関連型を定義します。

```ts
import type { components } from "../generated/openapi.ts";
export type FullAccount = components["schemas"]["FullAccount"];
export type OrderState = components["schemas"]["OrderState"];
export type Fill = components["schemas"]["Fill"];
export type ClosedPosition = components["schemas"]["ClosedPosition"];
export type FundingPayment = components["schemas"]["FundingPayment"];
export type OrderHistoryEntry = components["schemas"]["OrderHistoryEntry"];
export type FeeState = components["schemas"]["FeeState"];
export type MultisigProposalsSnapshot = components["schemas"]["MultisigProposalsSnapshot"];
```

### `types/trade.ts`

Trading input / response 型を定義します。

```ts
export type LimitOrderParams = {
  symbol: string;
  side: Side;
  price: number;
  size: number;
  tif?: TimeInForce;
  reduceOnly?: boolean;
  isolated?: boolean;
};
export type MarketOrderParams = {
  symbol: string;
  side: Side;
  size: number;
  reduceOnly?: boolean;
  isolated?: boolean;
};
export type CancelOrderParams = {
  symbol: string;
  orderId: string;
};
export type CancelAllParams = {
  symbols?: string[];
};
export type TradeOptions = {
  via?: TransportKind;
  timeoutMs?: number;
  throwOnReject?: boolean;
};
```

`SignedTransaction` は SDK 内部で normalize 後の shape を使います。

```ts
export type SignedTransaction = {
  actions: unknown[];
  nonce: number;
  account: string;
  signer: string;
  signature: string;
  orderId?: string;
  orderIds?: string[];
};
```

`bulk-keychain` 由来の transaction は `actions` が string の場合があるため、SDK 境界で normalize します。

```ts
export type KeychainSignedTransaction = {
  actions: string | unknown[];
  nonce: number;
  account: string;
  signer: string;
  signature: string;
  orderId?: string;
  orderIds?: string[];
};
```

### `types/ws.ts`

WebSocket subscription / message 型を定義します。

```ts
export type WsSubscription =
  | { type: "ticker"; symbol: string }
  | { type: "candle"; symbol: string; interval: CandleInterval }
  | { type: "trades"; symbol: string }
  | { type: "risk"; symbol: string }
  | { type: "frontendContext" }
  | {
    type: "l2Snapshot";
    symbol: string;
    nlevels?: number;
    aggregation?: number;
  }
  | { type: "l2Delta"; symbol: string }
  | { type: "account"; user: string | string[] };
export type WsHandler<T> = (message: T) => void | Promise<void>;
export type SubscriptionHandle = {
  topics: string[];
  unsubscribe: () => Promise<void>;
};
```

## Validation

## `src/validation/*`

`valibot` schema を定義します。 主な用途:

- public method の input validation
- environment variables validation
- optional response validation
- test assertion 方針:

```txt
User input
  -> validate
Environment variables
  -> validate
REST response
  -> optional validate
WebSocket hot path
  -> do not always validate
```

### Input validation

例:

```ts
export const limitOrderParamsSchema = v.object({
  symbol: v.string(),
  side: v.union([v.literal("buy"), v.literal("sell")]),
  price: v.number(),
  size: v.number(),
  tif: v.optional(
    v.union([v.literal("GTC"), v.literal("IOC"), v.literal("ALO")]),
  ),
  reduceOnly: v.optional(v.boolean()),
  isolated: v.optional(v.boolean()),
});
```

### Validation mode

`BulkClientConfig` に optional flag を用意します。

```ts
export type BulkClientConfig = {
  validateInputs?: boolean;
  validateResponses?: boolean;
};
```

MVP では `validateInputs` は有効、`validateResponses` は無効でもよいです。

## HTTP Architecture

## `src/http/http_transport.ts`

REST の low-level transport です。 責務:

- base URL 管理
- path 結合
- query string 生成
- JSON encode
- JSON decode
- timeout
- AbortSignal support
- HTTP status error handling 想定 API:

```ts
export class HttpTransport {
  constructor(config: HttpTransportConfig);
  get<T>(path: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T>;
}
```

実装イメージ:

```ts
export type HttpTransportConfig = {
  baseUrl: string;
  timeoutMs: number;
  headers?: Record<string, string>;
};
export type HttpRequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
};
export class HttpTransport {
  constructor(private readonly config: HttpTransportConfig) {}
  async get<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    return await this.request<T>("GET", path, undefined, options);
  }
  async post<T>(
    path: string,
    body?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    return await this.request<T>("POST", path, body, options);
  }
  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    options: HttpRequestOptions,
  ): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path, options.query);
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
          ...this.config.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options.signal ?? controller.signal,
      });
      const text = await response.text();
      const json = text.length > 0 ? safeJsonParse(text) : undefined;
      if (!response.ok) {
        throw new BulkHttpError(response.status, json);
      }
      return json as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new BulkTimeoutError(`HTTP request timed out: ${method} ${path}`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
```

## `src/http/market_client.ts`

`client.market` の実装です。 OpenAPI の Market Data endpoints を cover します。

```ts
export class MarketClient {
  constructor(private readonly deps: { http: HttpTransport }) {}
  metrics(): Promise<Record<string, unknown>>;
  verify(): Promise<VerifyResult>;
  exchangeInfo(): Promise<MarketInfo[]>;
  ticker(symbol: string): Promise<MarketStats>;
  klines(params: KlinesParams): Promise<Candle[]>;
  l2Book(params: L2BookParams): Promise<BookUpdate>;
  stats(params?: ExchangeStatsParams): Promise<ExchangeStats>;
  riskSurfaces(market: string): Promise<RiskSurfaces>;
}
```

実装例:

```ts
async ticker(symbol: string): Promise<MarketStats> {
  return await this.deps.http.get<MarketStats>(
    `/ticker/${encodeURIComponent(symbol)}`,
  )
}
```

`l2Book` は API 仕様上 `type=l2book` が必要なため、SDK 側で自動付与します。

```ts
async l2Book(params: L2BookParams): Promise<BookUpdate> {
  return await this.deps.http.get<BookUpdate>('/l2book', {
    query: {
      type: 'l2book',
      coin: params.symbol,
      nlevels: params.nlevels,
      aggregation: params.aggregation,
    },
  })
}
```

## `src/http/account_client.ts`

`client.account` の実装です。 `POST /account` は unsigned read-only API です。 OpenAPI response は `AccountData[]`
なので、SDK 側で user-friendly に flatten します。

```ts
export class AccountClient {
  constructor(private readonly deps: { http: HttpTransport }) {}
  fullAccount(user: string): Promise<FullAccount>;
  openOrders(user: string): Promise<OrderState[]>;
  fills(user: string): Promise<Fill[]>;
  positions(user: string): Promise<ClosedPosition[]>;
  fundingHistory(user: string): Promise<FundingPayment[]>;
  orderHistory(user: string): Promise<OrderHistoryEntry[]>;
  feeTier(user: string, params?: { symbol?: string }): Promise<FeeState>;
  feeState(): Promise<FeeState>;
  multisigProposals(pubkey: string): Promise<MultisigProposalsSnapshot>;
}
```

内部共通 method:

```ts
private async queryAccount<T>(
  body: AccountQuery,
  pick: (row: AccountData) => T | undefined,
): Promise<T[]> {
  const rows = await this.deps.http.post<AccountData[]>('/account', body)
  return rows
    .map(pick)
    .filter((value): value is T => value !== undefined)
}
```

`fullAccount` は single result を返します。

```ts
async fullAccount(user: string): Promise<FullAccount> {
  const rows = await this.deps.http.post<AccountData[]>('/account', {
    type: 'fullAccount',
    user,
  })
  const row = rows.find((row) => 'fullAccount' in row)
  if (!row?.fullAccount) {
    throw new BulkDecodeError('fullAccount response is empty')
  }
  return row.fullAccount
}
```

## `src/http/trade_client.ts`

`client.trade` の実装です。 責務:

- user-friendly params を builder に渡す
- `KeychainSigner` で署名する
- `SignedTransaction` を normalize する
- HTTP または WS で submit する
- transaction response status を検査する 想定 API:

```ts
export class TradeClient {
  submit(
    tx: SignedTransaction | KeychainSignedTransaction,
    options?: TradeOptions,
  ): Promise<OrderResponse>;
  placeLimitOrder(
    params: LimitOrderParams,
    options?: TradeOptions,
  ): Promise<OrderResponse>;
  placeMarketOrder(
    params: MarketOrderParams,
    options?: TradeOptions,
  ): Promise<OrderResponse>;
  cancelOrder(
    params: CancelOrderParams,
    options?: TradeOptions,
  ): Promise<OrderResponse>;
  cancelAll(
    params?: CancelAllParams,
    options?: TradeOptions,
  ): Promise<OrderResponse>;
  batch(
    inputs: KeychainOrderInput[],
    options?: TradeOptions,
  ): Promise<OrderResponse>;
}
```

実装方針:

```ts
async submit(
  tx: SignedTransaction | KeychainSignedTransaction,
  options: TradeOptions = {},
): Promise<OrderResponse> {
  const normalized = normalizeSignedTransaction(tx)
  const via = options.via ?? 'http'
  const response = via === 'ws'
    ? await this.deps.ws.post(normalized, options)
    : await this.deps.http.post<OrderResponse>('/order', normalized, options)
  if (options.throwOnReject !== false) {
    assertOrderResponseOk(response)
  }
  return response
}
```

`assertOrderResponseOk` は `status: "error"` を検出します。

```ts
export function assertOrderResponseOk(response: OrderResponse): void {
  if (response.status === "error") {
    throw new BulkTransactionRejectedError(response);
  }
}
```

## Signing Architecture

## `src/signing/keychain_signer.ts`

`bulk-keychain` の wrapper です。 SDK 内部では `bulk-keychain` を直接あちこちで import せず、この module
に閉じ込めます。 責務:

- private key から signer を生成
- target account public key を保持する
- order input を署名
- batch input を署名
- native `bulk-keychain` が target account signing を提供しない場合は、別accountへの署名をlocalで拒否する
- signed transaction を normalize 想定 API:

```ts
export class KeychainSigner {
  readonly accountPublicKey: string;
  static fromPrivateKey(privateKey: string, targetAccountPublicKey?: string): KeychainSigner;
  sign(input: KeychainSignInput): SignedTransaction;
  signGroup(inputs: KeychainOrderInput[]): SignedTransaction;
  signAll(inputs: KeychainOrderInput[]): SignedTransaction[];
}
```

実装イメージ:

```ts
import { NativeKeypair, NativeSigner } from "bulk-keychain";
export class KeychainSigner {
  private constructor(
    private readonly nativeSigner: NativeSigner,
    private readonly targetAccountPublicKey?: string,
  ) {}
  static fromPrivateKey(privateKey: string, targetAccountPublicKey?: string): KeychainSigner {
    const keypair = NativeKeypair.fromBase58(privateKey);
    const nativeSigner = new NativeSigner(keypair);
    return new KeychainSigner(nativeSigner, targetAccountPublicKey);
  }
  get accountPublicKey(): string {
    return this.targetAccountPublicKey ?? this.nativeSigner.pubkey;
  }
  sign(input: KeychainSignInput): SignedTransaction {
    if (input.type === "agentWalletCreation") {
      return this.signAgentWallet(input);
    }
    return this.signActions([input]);
  }
  signGroup(inputs: KeychainOrderInput[]): SignedTransaction {
    return this.signActions(inputs);
  }
  signAll(inputs: KeychainOrderInput[]): SignedTransaction[] {
    return this.nativeSigner.signAll(inputs).map(normalizeSignedTransaction);
  }
  private signActions(inputs: KeychainOrderInput[]): SignedTransaction {
    this.assertCanSignTargetAccount();
    return normalizeSignedTransaction(
      this.nativeSigner.signOrder(inputs, this.nextNonce()),
    );
  }
  private assertCanSignTargetAccount(): void {
    if (this.targetAccountPublicKey && this.targetAccountPublicKey !== this.nativeSigner.pubkey) {
      throw new Error("target-account signing support is required");
    }
  }
}
```

Deno runtime で npm package と native addon を利用する場合、permission や install 設定が必要になる可能性があります。
そのため、`bulk-keychain` import / runtime compatibility は以下で検証します。

- unit test
- e2e signed trading test
- CI
- `TECH.md`
- `TEST.md`

## `src/signing/normalize_signed_transaction.ts`

`bulk-keychain` の signed transaction を SDK 標準形式に変換します。 `bulk-keychain` の example では `signed.actions` を
`JSON.parse` してから API に送ります。 SDK user にこれを手動で書かせないため、SDK 内部で normalize します。

```ts
export function normalizeSignedTransaction(
  signed: SignedTransaction | KeychainSignedTransaction,
): SignedTransaction {
  return {
    actions: typeof signed.actions === "string" ? safeJsonParse(signed.actions) : signed.actions,
    nonce: signed.nonce,
    // API wire field: target account public key.
    account: signed.account,
    signer: signed.signer,
    signature: signed.signature,
    orderId: signed.orderId,
    orderIds: signed.orderIds,
  };
}
```

## Builders

## `src/builders/orders.ts`

user-friendly input を `bulk-keychain` input に変換します。 例:

```ts
export function toKeychainLimitOrder(
  params: LimitOrderParams,
): KeychainOrderInput {
  return {
    type: "order",
    symbol: params.symbol,
    isBuy: params.side === "buy",
    price: params.price,
    size: params.size,
    reduceOnly: params.reduceOnly ?? false,
    iso: params.isolated ?? false,
    orderType: {
      type: "limit",
      tif: params.tif ?? "GTC",
    },
  };
}
```

Market order:

```ts
export function toKeychainMarketOrder(
  params: MarketOrderParams,
): KeychainOrderInput {
  return {
    type: "order",
    symbol: params.symbol,
    isBuy: params.side === "buy",
    size: params.size,
    reduceOnly: params.reduceOnly ?? false,
    iso: params.isolated ?? false,
    orderType: {
      type: "market",
    },
  };
}
```

Cancel order:

```ts
export function toKeychainCancelOrder(
  params: CancelOrderParams,
): KeychainOrderInput {
  return {
    type: "cancel",
    symbol: params.symbol,
    orderId: params.orderId,
  };
}
```

Cancel all:

```ts
export function toKeychainCancelAll(
  params: CancelAllParams = {},
): KeychainOrderInput {
  return {
    type: "cancelAll",
    symbols: params.symbols ?? [],
  };
}
```

## `src/builders/transactions.ts`

batch / raw transaction helper を置きます。 MVP では minimal でよいです。

```ts
export function createBatch(
  inputs: KeychainOrderInput[],
): KeychainOrderInput[] {
  return inputs;
}
```

将来的に以下を追加します。

- conditional orders
- transfer
- sub-account operations
- multisig raw action builders
- admin / oracle raw helpers

## WebSocket Architecture

## `src/ws/ws_client.ts`

`client.ws` の実装です。 責務:

- WebSocket 接続管理
- subscribe / unsubscribe
- message routing
- WebSocket post
- request id correlation
- reconnect / resubscribe hook 想定 API:

```ts
export class WsClient {
  connect(): Promise<void>;
  close(): Promise<void>;
  subscribe<T>(
    subscription: WsSubscription,
    handler: WsHandler<T>,
  ): Promise<SubscriptionHandle>;
  ticker(
    symbol: string,
    handler: WsHandler<TickerMessage>,
  ): Promise<SubscriptionHandle>;
  candles(
    params: CandleSubscriptionParams,
    handler: WsHandler<CandleMessage>,
  ): Promise<SubscriptionHandle>;
  trades(
    symbol: string,
    handler: WsHandler<TradeMessage>,
  ): Promise<SubscriptionHandle>;
  risk(
    symbol: string,
    handler: WsHandler<RiskMessage>,
  ): Promise<SubscriptionHandle>;
  frontendContext(
    handler: WsHandler<FrontendContextMessage>,
  ): Promise<SubscriptionHandle>;
  l2Snapshot(
    params: L2SnapshotSubscriptionParams,
    handler: WsHandler<L2SnapshotMessage>,
  ): Promise<SubscriptionHandle>;
  l2Delta(
    symbol: string,
    handler: WsHandler<L2DeltaMessage>,
  ): Promise<SubscriptionHandle>;
  account(
    user: string | string[],
    handler: WsHandler<AccountStreamEvent>,
  ): Promise<SubscriptionHandle>;
  post(tx: SignedTransaction, options?: WsPostOptions): Promise<OrderResponse>;
}
```

## Connection lifecycle

`WsClient` は lazy connect を基本にします。 つまり、以下のどちらでも動くようにします。

```ts
await client.ws.connect();
await client.ws.trades("BTC-USD", handler);
```

```ts
await client.ws.trades("BTC-USD", handler);
```

後者では `trades()` 内で未接続なら自動 connect します。

## Subscription flow

```txt
client.ws.trades(symbol, handler)
  -> build subscription object
  -> calculate expected topics
  -> register handler in router
  -> send subscribe message
  -> return SubscriptionHandle
```

subscribe message:

```ts
{
  method: 'subscribe',
  subscription: [
    {
      type: 'trades',
      symbol: 'BTC-USD',
    },
  ],
}
```

unsubscribe:

```ts
{
  method: 'unsubscribe',
  topic: 'trades.BTC-USD',
}
```

The API response returns topics, so the SDK removes local handlers by topic and sends the same topic in the server-side
unsubscribe message.

```ts
const sub = await client.ws.trades("BTC-USD", handler);
await sub.unsubscribe();
```

Local unsubscribe responsibilities:

- Remove the handler from the local router
- Send a topic-based unsubscribe message to the server

## `src/ws/subscriptions.ts`

subscription object と topic mapping を定義します。

```ts
export function topicOf(subscription: WsSubscription): string[] {
  switch (subscription.type) {
    case "ticker":
      return [`ticker.${subscription.symbol}`];
    case "candle":
      return [`candle.${subscription.symbol}.${subscription.interval}`];
    case "trades":
      return [`trades.${subscription.symbol}`];
    case "risk":
      return [`risk.${subscription.symbol}`];
    case "frontendContext":
      return ["frontendContext"];
    case "l2Snapshot":
      return [`l2snapshot.${subscription.symbol}`];
    case "l2Delta":
      return [`l2delta.${subscription.symbol}`];
    case "account":
      return Array.isArray(subscription.user)
        ? subscription.user.map((user) => `account.${user}`)
        : [`account.${subscription.user}`];
  }
}
```

## `src/ws/router.ts`

WebSocket message を topic 単位で handler に dispatch します。 内部構造:

```ts
type HandlerSet = Set<WsHandler<unknown>>;
export class WsRouter {
  private readonly handlers = new Map<string, HandlerSet>();
  add(topic: string, handler: WsHandler<unknown>): void;
  remove(topic: string, handler: WsHandler<unknown>): void;
  dispatch(topic: string, message: unknown): void;
}
```

実装方針:

```ts
dispatch(topic: string, message: unknown): void {
  const handlers = this.handlers.get(topic)
  if (!handlers || handlers.size === 0) {
    return
  }
  for (const handler of handlers) {
    queueMicrotask(() => {
      void handler(message)
    })
  }
}
```

handler 実行を `queueMicrotask` に逃がすことで、1 handler の遅延が WebSocket receive loop
を直接詰まらせないようにします。

## WebSocket message handling

受信 message は 1 回だけ `JSON.parse` します。

```ts
private handleMessage(raw: string): void {
  const message = safeJsonParse(raw)
  if (isWsPostResponse(message)) {
    this.handlePostResponse(message)
    return
  }
  if (isWsSubscriptionMessage(message)) {
    this.router.dispatch(message.topic, message)
    return
  }
  if (isWsSubscriptionResponse(message)) {
    this.handleSubscriptionResponse(message)
    return
  }
  this.handleUnknownMessage(message)
}
```

## WebSocket post

WebSocket 経由の transaction submit は request id で response を対応付けます。 request:

```ts
{
  method: 'post',
  request: {
    type: 'action',
    payload: signedTransaction,
  },
  id: 1,
}
```

response:

```ts
{
  type: 'post',
  id: 1,
  data: {
    type: 'action',
    payload: orderResponse,
  },
}
```

内部構造:

```ts
private nextRequestId = 1
private readonly pendingPosts = new Map<
  number,
  {
    resolve: (response: OrderResponse) => void
    reject: (error: unknown) => void
    timer: number
  }
>()
```

実装方針:

```ts
async post(
  tx: SignedTransaction,
  options: WsPostOptions = {},
): Promise<OrderResponse> {
  await this.ensureConnected()
  const id = this.nextRequestId++
  const timeoutMs = options.timeoutMs ?? this.config.timeoutMs
  const promise = new Promise<OrderResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      this.pendingPosts.delete(id)
      reject(new BulkTimeoutError(`WS post timed out: ${id}`))
    }, timeoutMs)
    this.pendingPosts.set(id, { resolve, reject, timer })
  })
  this.send({
    method: 'post',
    request: {
      type: 'action',
      payload: tx,
    },
    id,
  })
  return await promise
}
```

response handling:

```ts
private handlePostResponse(message: WsPostResponse): void {
  const pending = this.pendingPosts.get(message.id)
  if (!pending) {
    return
  }
  clearTimeout(pending.timer)
  this.pendingPosts.delete(message.id)
  pending.resolve(message.data.payload)
}
```

## `src/ws/reconnect.ts`

MVP では minimal reconnect でよいです。 段階的に以下を実装します。

### Phase 1

- manual reconnect only
- close 時に pending post を reject
- active handler は local に残す

### Phase 2

- automatic reconnect
- exponential backoff
- reconnect 後に active subscription を resubscribe
- reconnect 中の post は reject

### Phase 3

- connection state event
- heartbeat / ping-pong
- stale connection detection
- max retry
- custom reconnect strategy

## Realtime Helpers

MVP では必須ではありません。 ただし、architecture 上は追加しやすい構造にします。

### OrderBook helper

将来的に以下を追加します。

```ts
const book = await client.ws.orderBook("BTC-USD", {
  nlevels: 20,
  aggregation: 0.5,
});
book.onUpdate((state) => {
  console.log(state.bestBid, state.bestAsk);
});
```

内部 state:

```ts
class OrderBook {
  private bids = new Map<number, Level>();
  private asks = new Map<number, Level>();
  apply(update: BookUpdate): void;
  snapshot(): OrderBookSnapshot;
  bestBid(): Level | undefined;
  bestAsk(): Level | undefined;
}
```

注意点:

- L2 delta に sequence number がない場合、gap detection はできない
- reconnect 後は snapshot を取り直す
- 長時間稼働時は定期 resync を検討する

### AccountStore helper

将来的に以下を追加します。

```ts
const account = await client.ws.watchAccount(user);
account.onUpdate((state) => {
  console.log(state.margin);
});
```

内部 state:

```ts
type AccountState = {
  user: string;
  margin?: Margin;
  positions: Map<string, Position>;
  openOrders: Map<string, OrderState>;
  fills: Fill[];
  lastUpdatedAt?: number;
};
```

account stream event を reducer に通して state を更新します。

## Error Handling

## Error classification

SDK は error を以下に分類します。

```txt
BulkHttpError
  REST status code error
BulkWsError
  WebSocket connection / protocol error
BulkTimeoutError
  HTTP / WS timeout
BulkDecodeError
  JSON parse / response shape error
BulkTransactionRejectedError
  transaction response status is error
```

## Transaction rejection

`POST /order` は HTTP 200 でも transaction が失敗する可能性があります。 そのため、`TradeClient` は response body の
`status` を検査します。

```ts
function assertOrderResponseOk(response: OrderResponse): void {
  if (response.status === "error") {
    throw new BulkTransactionRejectedError(response);
  }
}
```

default は reject 時に throw します。

```ts
await client.trade.placeLimitOrder(params);
```

raw response が欲しい場合:

```ts
const response = await client.trade.placeLimitOrder(params, {
  throwOnReject: false,
});
```

## Timeout handling

HTTP / WS post は timeout をサポートします。

```ts
await client.market.ticker("BTC-USD", {
  timeoutMs: 5_000,
});
await client.trade.placeLimitOrder(params, {
  timeoutMs: 5_000,
});
```

MVP では method 単位の timeout option は trading / transport layer から実装し、market/account
に広げるかは実装時に判断します。

## Environment

`.env` は test / e2e 用に使用します。 SDK runtime は直接 `.env` を読みに行きません。 理由:

- library が global environment に依存しないようにする
- consumer 側が自由に env 管理できるようにする
- test helper でのみ env validation すればよい e2e helper で `t3-env` を使用します。

```ts
export const env = createEnv({
  server: {
    BULK_PRIVATE_KEY: z.string().min(1),
    BULK_HTTP_URL: z.string().url().optional(),
    BULK_WS_URL: z.string().url().optional(),
  },
  runtimeEnv: Deno.env.toObject(),
});
```

## Deno Runtime Notes

この SDK は Deno を package manager / runtime / linter / formatter / test runner として使用します。 Deno project
configuration は `deno.json` に集約します。 例:

```json
{
  "tasks": {
    "check": "deno check src/mod.ts",
    "fmt": "deno fmt",
    "lint": "deno lint",
    "test": "deno test --allow-net --allow-env --allow-read",
    "test:e2e": "deno test tests/e2e --allow-net --allow-env --allow-read --allow-ffi",
    "generate:types": "deno run --allow-read --allow-write --allow-net scripts/generate_openapi_types.ts"
  },
  "imports": {
    "valibot": "npm:valibot",
    "bulk-keychain": "npm:bulk-keychain"
  }
}
```

`bulk-keychain` が native dependency を必要とする場合、Deno permission / node modules 設定が必要になる可能性があります。
この制約は `TECH.md` と e2e test で明示的に検証します。

## HTTP Data Flow

Market data の例:

```txt
client.market.ticker('BTC-USD')
  -> MarketClient.ticker()
  -> HttpTransport.get('/ticker/BTC-USD')
  -> fetch()
  -> JSON decode
  -> MarketStats
```

Account data の例:

```txt
client.account.openOrders(user)
  -> AccountClient.openOrders()
  -> HttpTransport.post('/account', { type: 'openOrders', user })
  -> AccountData[]
  -> flatten openOrder rows
  -> OrderState[]
```

Trading の例:

```txt
client.trade.placeLimitOrder(params)
  -> validate params
  -> toKeychainLimitOrder(params)
  -> KeychainSigner.sign(input)
  -> normalizeSignedTransaction(signed)
  -> TradeClient.submit(tx)
  -> HttpTransport.post('/order', tx)
  -> assertOrderResponseOk(response)
  -> OrderResponse
```

## WebSocket Data Flow

Subscription の例:

```txt
client.ws.trades('BTC-USD', handler)
  -> create subscription
  -> topicOf(subscription)
  -> router.add('trades.BTC-USD', handler)
  -> ensureConnected()
  -> send subscribe message
  -> return SubscriptionHandle
```

Message receive の例:

```txt
WebSocket message
  -> JSON.parse once
  -> detect post response / subscription message
  -> extract topic
  -> router.dispatch(topic, message)
  -> call topic handlers
```

WebSocket post の例:

```txt
client.trade.placeLimitOrder(params, { via: 'ws' })
  -> sign transaction
  -> client.ws.post(tx)
  -> assign request id
  -> send WS post message
  -> wait pendingPosts[id]
  -> receive response with same id
  -> resolve OrderResponse
```

## API Coverage Strategy

API coverage は以下の順で実装します。

### Phase 1: REST read-only

- `client.market.*`
- `client.account.*`
- OpenAPI generated response types
- HTTP transport
- basic errors

### Phase 2: Signed REST trading

- `KeychainSigner`
- `normalizeSignedTransaction`
- `client.trade.submit`
- `placeLimitOrder`
- `placeMarketOrder`
- `cancelOrder`
- `cancelAll`
- `batch`

### Phase 3: Basic WebSocket

- `client.ws.connect`
- `client.ws.close`
- `client.ws.subscribe`
- market subscriptions
- account subscription
- topic router

### Phase 4: WebSocket post

- `client.ws.post`
- request id correlation
- timeout
- `client.trade.*({ via: 'ws' })`

### Phase 5: Advanced helpers

- conditional order helpers
- transfer helpers
- sub-account helpers
- orderbook helper
- account store helper
- reconnect / resubscribe hardening

### Phase 6: Full OpenAPI coverage

- multisig helpers
- admin / oracle helpers
- raw action builders
- e2e endpoint coverage 100%

## Testing Architecture

詳細は `TEST.md` に記載します。 Architecture 上の方針:

```txt
unit tests
  -> pure functions / builders / normalize / router
integration tests
  -> REST / WS endpoint behavior
e2e tests
  -> real wallet / signed transaction / endpoint coverage
```

e2e は `.env` の wallet を使います。

```txt
.env
  BULK_PRIVATE_KEY=...
  BULK_HTTP_URL=...
  BULK_WS_URL=...
```

MVP では e2e を通常 test とは分離します。

```bash
deno task test
deno task test:e2e
```

## Public API Stability

MVP では以下を stable とします。

```ts
new BulkClient(config)
client.market.*
client.account.*
client.trade.submit()
client.trade.placeLimitOrder()
client.trade.placeMarketOrder()
client.trade.cancelOrder()
client.trade.cancelAll()
client.ws.*
```

以下は experimental として扱います。

- raw action builders
- advanced conditional orders
- account store
- orderbook helper
- reconnect strategy
- multisig helpers
- admin / oracle helpers

## Implementation Rules

### Rule 1: Do not expose compact wire format by default

User-facing API では以下のような params を使います。

```ts
{
  symbol: 'BTC-USD',
  side: 'buy',
  price: 100000,
  size: 0.1,
}
```

以下のような compact action は通常 user に書かせません。

```ts
{
  l: {
    c: 'BTC-USD',
    b: true,
    px: 100000,
    sz: 0.1,
    tif: 'GTC',
    r: false,
    i: false,
  },
}
```

raw submit では compact action / signed transaction を扱えるようにします。

### Rule 2: Keep transports low-level

`HttpTransport` / `WsClient` は domain logic を持ちすぎないようにします。 HTTP transport は HTTP request/response
だけを扱います。 Trade-specific rejection handling は `TradeClient` で行います。

### Rule 3: Keep signing isolated

`bulk-keychain` dependency は `src/signing` に閉じ込めます。 `MarketClient` / `AccountClient` / `WsRouter` などが
`bulk-keychain` に依存してはいけません。

### Rule 4: Normalize at SDK boundary

外部 library 由来の shape は SDK 境界で normalize します。 特に `signed.actions` は必ず `unknown[]` に変換します。

### Rule 5: Prefer explicit errors

失敗時に plain `Error` を投げるのではなく、SDK 固有 error を使います。

### Rule 6: Avoid global mutable state

nonce / signer / ws connection / subscriptions は client instance に閉じ込めます。 global singleton は作りません。

### Rule 7: Make raw access possible

high-level helper が未実装でも、raw submit で API に到達できる設計にします。

```ts
await client.trade.submit(signedTransaction);
await client.ws.post(signedTransaction);
```

## Future Extensions

将来的に以下を追加できます。

### Browser / WASM support

- `KeychainSigner` interface を導入
- native signer と wasm signer を差し替え可能にする
- import path を分離する

### External wallet support

- `prepareTransaction`
- `finalizeTransaction`
- external signature injection
- wallet adapter interface

### Advanced state helpers

- `client.ws.orderBook()`
- `client.ws.watchAccount()`
- local account state reducer
- optimistic order tracking

### Advanced package exports

```ts
import { BulkClient } from "bulk-ts-sdk";
import { MarketClient } from "bulk-ts-sdk/http";
import { WsClient } from "bulk-ts-sdk/ws";
import { KeychainSigner } from "bulk-ts-sdk/signing";
```

MVP では不要です。

## Summary

この SDK の architecture は以下を重視します。

- simple root client
- separated internal modules
- type-safe public API
- REST / WebSocket 両対応
- `bulk-keychain` への signing 委譲
- topic-based high-performance WebSocket routing
- raw submit による API coverage の担保
- MVP から full OpenAPI coverage へ段階的に拡張可能な構造
