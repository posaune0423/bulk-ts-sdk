/** Order side: bid (buy) or ask (sell). */
export type Side = "buy" | "sell";

/** Time-in-force rule for limit orders (Good-Til-Canceled, Immediate-Or-Cancel, Add-Liquidity-Only). */
export type TimeInForce = "GTC" | "IOC" | "ALO";

/** Transport used for trading actions: REST HTTP or WebSocket `post`. */
export type TransportKind = "http" | "ws";

/** Candle bar bucket size accepted by market candle endpoints and WS subscriptions. */
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
