import type { components } from "../generated/openapi.ts";

export type MarketInfo = components["schemas"]["MarketInfo"];
export type MarketStats = components["schemas"]["MarketStats"];
export type Candle = components["schemas"]["Candle"];
export type BookUpdate = components["schemas"]["BookUpdate"];
export type Level = components["schemas"]["Level"];
export type ExchangeStats = components["schemas"]["ExchangeStats"];
export type RiskSurfaces = components["schemas"]["RiskSurfaces"];

export type KlinesParams = {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
};

export type L2BookParams = {
  symbol: string;
  nlevels?: number;
  aggregation?: number;
};

export type ExchangeStatsParams = {
  symbol?: string;
};
