import type { CandleInterval } from "./common.ts";
import type { AccountData } from "./account.ts";
import type { BookUpdate, Candle, MarketStats } from "./market.ts";
import type { SignedTransaction } from "./trade.ts";

/**
 * Subscription descriptor accepted by `WsClient.subscribe` / outbound `subscribe` RPC.
 */
export type WsSubscription =
  | {
    /** Top-of-book ticker updates for one symbol. */
    type: "ticker";
    /** Market symbol to subscribe to. */
    symbol: string;
  }
  | {
    /** Closed OHLCV candles for one symbol and interval. */
    type: "candle";
    /** Market symbol to subscribe to. */
    symbol: string;
    /** Candle bucket width (must match values accepted by the venue). */
    interval: CandleInterval;
  }
  | {
    /** Public trade prints for one symbol. */
    type: "trades";
    /** Market symbol to subscribe to. */
    symbol: string;
  }
  | {
    /** Risk surface feeds for one symbol. */
    type: "risk";
    /** Market symbol to subscribe to. */
    symbol: string;
  }
  | {
    /** Front-end context channel (venue-defined aggregate UI feed). */
    type: "frontendContext";
  }
  | {
    /** Full depth snapshot for an order book symbol. */
    type: "l2Snapshot";
    /** Market symbol to subscribe to. */
    symbol: string;
    /** Number of price levels per side to include. */
    nlevels?: number;
    /** Tick aggregation step when collapsing book levels. */
    aggregation?: number;
  }
  | {
    /** Incremental L2 book deltas for one symbol. */
    type: "l2Delta";
    /** Market symbol to subscribe to. */
    symbol: string;
  }
  | {
    /** Private account stream for one or more accounts. */
    type: "account";
    /** Account public key(s) to receive updates for. */
    user: string | string[];
  };

/** Handler invoked for each decoded realtime message on a subscription. */
export type WsHandler<T> = (
  /** Decoded wire payload routed to this handler. */
  message: T,
) => void | Promise<void>;

/** Realtime ticker payload routed from `ticker.{symbol}` topics. */
export type TickerWsMessage = {
  type: "ticker";
  topic: `ticker.${string}`;
  data: {
    ticker: MarketStats;
  };
};

/** Realtime candle payload routed from `candle.{symbol}.{interval}` topics. */
export type CandleWsMessage = {
  type: "candle";
  topic: `candle.${string}.${CandleInterval}`;
  data: {
    candles: Candle[];
  };
};

/** Public trade print emitted by `trades.{symbol}` topics. */
export type WsTrade = {
  s: string;
  px: number;
  sz: number;
  time: number;
  side: boolean;
  maker: string;
  taker: string;
  maker_fee?: number;
  taker_fee?: number;
  reason?: string;
  reason_code?: number;
};

/** Realtime trade payload routed from `trades.{symbol}` topics. */
export type TradesWsMessage = {
  type: "trades";
  topic: `trades.${string}`;
  data: {
    trades: WsTrade[];
  };
};

/** Risk metrics payload routed from `risk.{symbol}` topics. */
export type RiskWsMessage = {
  type: "risk";
  topic: `risk.${string}`;
  data: {
    symbol: string;
    timestamp?: number;
    regime?: number;
    leverage?: number[];
    notionals?: number[];
    buy?: unknown[][];
    sell?: unknown[][];
    corrs?: Array<[string, number]>;
  };
};

/** Aggregate frontend market context routed from the `frontendContext` topic. */
export type FrontendContextWsMessage = {
  type: "frontendContext";
  topic: "frontendContext";
  data: {
    ctx: Array<{
      symbol: string;
      volume?: number;
      funding?: number;
      oi?: number;
      lastPrice?: number;
      priceChange?: number;
      priceChangePercent?: number;
    }>;
  };
};

/** L2 book snapshot payload routed from `l2snapshot.{symbol}` topics. */
export type L2SnapshotWsMessage = {
  type: "l2Snapshot";
  topic: `l2snapshot.${string}`;
  data: {
    book: BookUpdate;
  };
};

/** L2 book delta payload routed from `l2delta.{symbol}` topics. */
export type L2DeltaWsMessage = {
  type: "l2Delta";
  topic: `l2delta.${string}`;
  data: {
    book: BookUpdate;
  };
};

/** Private account payload routed from `account.{pubkey}` topics. */
export type AccountWsMessage = {
  type: "account";
  topic: `account.${string}`;
  data: AccountData;
};

/** Union of supported inbound WebSocket subscription messages. */
export type WsInboundMessage =
  | TickerWsMessage
  | CandleWsMessage
  | TradesWsMessage
  | RiskWsMessage
  | FrontendContextWsMessage
  | L2SnapshotWsMessage
  | L2DeltaWsMessage
  | AccountWsMessage;

/** Inbound message type for a subscription descriptor. */
export type WsMessageForSubscription<S extends WsSubscription> = S extends { type: "ticker" } ? TickerWsMessage
  : S extends { type: "candle" } ? CandleWsMessage
  : S extends { type: "trades" } ? TradesWsMessage
  : S extends { type: "risk" } ? RiskWsMessage
  : S extends { type: "frontendContext" } ? FrontendContextWsMessage
  : S extends { type: "l2Snapshot" } ? L2SnapshotWsMessage
  : S extends { type: "l2Delta" } ? L2DeltaWsMessage
  : S extends { type: "account" } ? AccountWsMessage
  : WsInboundMessage;

/** Stable topic ids plus an async unsubscribe helper returned by subscribe helpers. */
export type SubscriptionHandle = {
  /** Canonical topic strings used internally for routing. */
  topics: string[];
  /** Removes server subscriptions and tears down local listeners. */
  unsubscribe: () => Promise<void>;
};

/** Timeout overrides for WebSocket `post` RPC calls. */
export type WsPostOptions = {
  /** Max wait for acknowledgement (ms). */
  timeoutMs?: number;
};

/** Outbound JSON-RPC-style payloads accepted by the Bulk WebSocket wire protocol. */
export type WsClientOutbound =
  | {
    /** JSON-RPC method name for subscribing to feeds. */
    method: "subscribe";
    /** One or more subscriptions to activate together. */
    subscription: WsSubscription[];
  }
  | {
    /** JSON-RPC method name for unsubscribing from feeds. */
    method: "unsubscribe";
    /** Topic to tear down server-side. */
    topic: string;
  }
  | {
    /** JSON-RPC method name for submitting signed trading actions. */
    method: "post";
    /** Correlation id echoed on the JSON-RPC response. */
    id: number;
    /** Inner envelope describing the signed payload type. */
    request: {
      /** Discriminator for signed trading payloads. */
      type: "action";
      /** Transaction signed by the client wallet before submission. */
      payload: SignedTransaction;
    };
  };
