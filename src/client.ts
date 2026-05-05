import { HttpTransport } from "./http/http_transport.ts";
import { MarketClient } from "./http/market_client.ts";
import { AccountClient } from "./http/account_client.ts";
import { TradeClient } from "./http/trade_client.ts";
import { WsClient } from "./ws/ws_client.ts";
import { KeychainSigner } from "./signing/keychain_signer.ts";
import { BULK_DEFAULT_HTTP_URL, BULK_DEFAULT_WS_URL, DEFAULT_TIMEOUT_MS } from "./constants.ts";

/**
 * Configuration options for the BulkClient.
 */
export type BulkClientConfig = {
  /** The base URL for HTTP API requests. Defaults to production URL. */
  httpUrl?: string;
  /** The URL for WebSocket connections. Defaults to production URL. */
  wsUrl?: string;
  /** Optional private key for signing trades. If omitted, trade operations will fail. */
  privateKey?: string;
  /** Request timeout in milliseconds. Defaults to 10 seconds. */
  timeoutMs?: number;
  /** Whether to perform runtime validation on API responses. */
  validateResponses?: boolean;
};

/**
 * The main client for interacting with the Bulk Exchange (Unofficial).
 * Provides access to market data, account management, trading, and real-time updates.
 */
export class BulkClient {
  /** Client for public market data (tickers, order books, etc.). */
  readonly market: MarketClient;
  /** Client for private account data (balances, orders, trade history). */
  readonly account: AccountClient;
  /** Client for trading operations (placing/canceling orders). */
  readonly trade: TradeClient;
  /** Client for WebSocket-based real-time subscriptions. */
  readonly ws: WsClient;
  /** The account ID (address) derived from the provided private key, if any. */
  readonly accountId?: string;

  /**
   * Initializes a new BulkClient instance.
   * @param config Optional configuration for the client.
   */
  constructor(config: BulkClientConfig = {}) {
    const http = new HttpTransport({
      baseUrl: config.httpUrl ?? BULK_DEFAULT_HTTP_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });

    const ws = new WsClient({
      url: config.wsUrl ?? BULK_DEFAULT_WS_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });

    const signer = config.privateKey ? KeychainSigner.fromPrivateKey(config.privateKey) : undefined;

    this.market = new MarketClient({ http });
    this.account = new AccountClient({ http });
    this.ws = ws;
    this.trade = new TradeClient({ http, ws, signer });
    this.accountId = signer?.account;
  }
}
