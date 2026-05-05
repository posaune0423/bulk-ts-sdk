import type { Side, TimeInForce, TransportKind } from "./common.ts";
import type { components } from "../generated/openapi.ts";

/** Inputs for placing a limit order via the Bulk Trade HTTP/WebSocket API. */
export type LimitOrderParams = {
  /** Market symbol. */
  symbol: string;
  /** Buy or sell. */
  side: Side;
  /** Limit price. */
  price: number;
  /** Order size (contracts/base units per venue). */
  size: number;
  /** Time in force; defaults if omitted follow venue rules. */
  tif?: TimeInForce;
  /** Only reduce an existing position when true. */
  reduceOnly?: boolean;
  /** Use isolated margin for this order when supported. */
  isolated?: boolean;
};

/** Inputs for placing a market order. */
export type MarketOrderParams = {
  /** Market symbol. */
  symbol: string;
  /** Buy or sell. */
  side: Side;
  /** Order size. */
  size: number;
  /** Only reduce an existing position when true. */
  reduceOnly?: boolean;
  /** Use isolated margin when supported. */
  isolated?: boolean;
};

/** Inputs for cancelling a single open order. */
export type CancelOrderParams = {
  /** Market symbol. */
  symbol: string;
  /** Client or venue order id. */
  orderId: string;
};

/** Inputs for cancelling all open orders, optionally scoped by symbols. */
export type CancelAllParams = {
  /** Symbols to cancel on; omit or empty for all markets on the account. */
  symbols?: string[];
};

/** Register or remove an agent wallet on behalf of the signing account. */
export type AgentWalletParams = {
  /** Agent wallet public key to register or remove for the signing account. */
  agent: string;
  /** `false` registers the agent wallet; `true` removes it. */
  remove: boolean;
};

/** Options controlling trade submission behaviour on `BulkClient.trade` (transport, timeouts, errors). */
export type TradeOptions = {
  /** Send via HTTP or WebSocket `post`. */
  via?: TransportKind;
  /** Per-request timeout override (ms). */
  timeoutMs?: number;
  /** When false, rejected txs resolve instead of throwing `BulkTransactionRejectedError`. */
  throwOnReject?: boolean;
};

/** Canonical API envelope returned after submitting signed trading actions. */
export type OrderResponse = components["schemas"]["OrderResponse"];

/** Signed payload accepted by Bulk HTTP trade endpoints after client-side signing. */
export type SignedTransaction = {
  /** Encoded action list exactly as the signer hashed. */
  actions: unknown[];
  /** Anti-replay nonce from account metadata. */
  nonce: number;
  /** Target account public key being acted on. */
  account: string;
  /** Public key of the wallet that produced the signature. */
  signer: string;
  /** Signature bytes encoding expected by the API. */
  signature: string;
  /** Single-order acknowledgement id when applicable. */
  orderId?: string;
  /** Batch acknowledgement ids when applicable. */
  orderIds?: string[];
};

/** Variant where `actions` may remain encoded as a string for keychain tooling. */
export type KeychainSignedTransaction = {
  /** Encoded actions payload (`string` or decoded objects). */
  actions: string | unknown[];
  /** Anti-replay nonce bound into the signature payload. */
  nonce: number;
  /** Target account public key being acted on. */
  account: string;
  /** Public key of the wallet that produced the signature. */
  signer: string;
  /** Signature bytes encoding expected by the API. */
  signature: string;
  /** Single-order acknowledgement id when applicable. */
  orderId?: string;
  /** Batch acknowledgement ids when applicable. */
  orderIds?: string[];
};

/** Keychain payload for agent-wallet lifecycle transactions. */
export type AgentWalletKeychainInput = {
  /** Discriminator for bulk-keychain agent-wallet flows. */
  type: "agentWalletCreation";
  /** Agent wallet public key to register or remove. */
  agent: string;
  /** When true, removes the agent wallet association instead of registering. */
  remove: boolean;
};

/**
 * Discriminated union passed to bulk-keychain for constructing signatures (aligned with `builders/orders.ts`).
 */
export type KeychainOrderInput =
  | {
    /** Discriminator: builds order-placement signatures. */
    type: "order";
    /** Market symbol. */
    symbol: string;
    /** True when bidding / buying the instrument. */
    isBuy: boolean;
    /** Limit price for limit orders. */
    price: number;
    /** Order size in venue-native units. */
    size: number;
    /** True when the order may only reduce an existing position. */
    reduceOnly: boolean;
    /** True when isolated margin should be used for this order when supported. */
    iso: boolean;
    /** Limit order subtype with time-in-force. */
    orderType: {
      /** Discriminator for limit branch. */
      type: "limit";
      /** Time-in-force policy for the limit order. */
      tif: TimeInForce;
    };
  }
  | {
    /** Discriminator: builds order-placement signatures. */
    type: "order";
    /** Market symbol. */
    symbol: string;
    /** True when bidding / buying the instrument. */
    isBuy: boolean;
    /** Order size in venue-native units. */
    size: number;
    /** True when the order may only reduce an existing position. */
    reduceOnly: boolean;
    /** True when isolated margin should be used for this order when supported. */
    iso: boolean;
    /** Price field required by bulk-keychain; market orders use 0. */
    price: 0;
    /** Market order subtype. */
    orderType: {
      /** Discriminator for market branch. */
      type: "market";
      /** Native keychain market trigger flag. */
      isMarket: true;
      /** Native keychain market trigger price. */
      triggerPx: 0;
    };
  }
  | {
    /** Discriminator: cancel one resting order. */
    type: "cancel";
    /** Market symbol. */
    symbol: string;
    /** Identifier of the order to cancel. */
    orderId: string;
  }
  | {
    /** Discriminator: cancel many orders (optionally scoped by symbol list). */
    type: "cancelAll";
    /** Symbols whose open orders should be cancelled; empty means all markets. */
    symbols: string[];
  };

/** All payloads accepted by the signer facade for trading-related actions. */
export type KeychainSignInput = KeychainOrderInput | AgentWalletKeychainInput;
