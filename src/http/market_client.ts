import type { HttpTransport } from "./http_transport.ts";
import type {
  BookUpdate,
  Candle,
  ExchangeStats,
  ExchangeStatsParams,
  KlinesParams,
  L2BookParams,
  MarketInfo,
  MarketStats,
  RiskSurfaces,
} from "../types/market.ts";

export class MarketClient {
  constructor(private readonly deps: { http: HttpTransport }) {}

  async metrics(): Promise<Record<string, unknown>> {
    return await this.deps.http.get<Record<string, unknown>>("/metrics");
  }

  async verify(): Promise<unknown> {
    return await this.deps.http.get<unknown>("/verify");
  }

  async exchangeInfo(): Promise<MarketInfo[]> {
    return await this.deps.http.get<MarketInfo[]>("/exchangeInfo");
  }

  async ticker(symbol: string): Promise<MarketStats> {
    return await this.deps.http.get<MarketStats>(
      `/ticker/${encodeURIComponent(symbol)}`,
    );
  }

  async klines(params: KlinesParams): Promise<Candle[]> {
    return await this.deps.http.get<Candle[]>("/klines", {
      query: {
        symbol: params.symbol,
        interval: params.interval,
        startTime: params.startTime,
        endTime: params.endTime,
        limit: params.limit,
      },
    });
  }

  async l2Book(params: L2BookParams): Promise<BookUpdate> {
    return await this.deps.http.get<BookUpdate>("/l2book", {
      query: {
        type: "l2book",
        coin: params.symbol,
        nlevels: params.nlevels,
        aggregation: params.aggregation,
      },
    });
  }

  async stats(params?: ExchangeStatsParams): Promise<ExchangeStats> {
    return await this.deps.http.get<ExchangeStats>("/stats", {
      query: {
        coin: params?.symbol,
      },
    });
  }

  async riskSurfaces(market: string): Promise<RiskSurfaces> {
    return await this.deps.http.get<RiskSurfaces>("/riskSurfaces", {
      query: { market },
    });
  }
}
