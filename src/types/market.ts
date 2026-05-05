import type { components } from "../generated/openapi.ts";

/** Metadata for a tradable market (symbol, status, filters). From OpenAPI `MarketInfo`. */
export type MarketInfo = components["schemas"]["MarketInfo"];

/** Rolling market statistics (volume, open interest, etc.). From OpenAPI `MarketStats`. */
export type MarketStats = components["schemas"]["MarketStats"];

/** OHLCV candle as returned by klines/history endpoints. From OpenAPI `Candle`. */
export type Candle = components["schemas"]["Candle"];

/** Incremental L2 book update payload. From OpenAPI `BookUpdate`. */
export type BookUpdate = components["schemas"]["BookUpdate"];

/** Single price level in an order book. From OpenAPI `Level`. */
export type Level = components["schemas"]["Level"];

/** Exchange-wide or per-symbol statistics snapshot. From OpenAPI `ExchangeStats`. */
export type ExchangeStats = components["schemas"]["ExchangeStats"];

/** Risk-related surfaces for a market. From OpenAPI `RiskSurfaces`. */
export type RiskSurfaces = components["schemas"]["RiskSurfaces"];

/** Query parameters for candlestick (klines) HTTP endpoints. */
export type KlinesParams = {
  /** Market symbol, e.g. `BTC-PERP`. */
  symbol: string;
  /** Candle interval string matching venue semantics (`CandleInterval` lists WS-supported buckets). */
  interval: string;
  /** Start of range (Unix ms), inclusive. */
  startTime?: number;
  /** End of range (Unix ms), inclusive. */
  endTime?: number;
  /** Maximum number of candles to return. */
  limit?: number;
};

/** Query parameters for level-2 order book HTTP endpoints. */
export type L2BookParams = {
  /** Market symbol. */
  symbol: string;
  /** Number of price levels per side. */
  nlevels?: number;
  /** Tick aggregation step for collapsing levels. */
  aggregation?: number;
};

/** Optional filters for exchange statistics endpoints. */
export type ExchangeStatsParams = {
  /** Restrict stats to a single symbol; omit for venue-wide aggregates. */
  symbol?: string;
};
