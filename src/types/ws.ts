import type { CandleInterval } from "./common.ts";
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
    /** Subscriptions to tear down (matched by topic semantics server-side). */
    subscription: WsSubscription[];
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
