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
  /**
   * Private key used to sign order actions.
   * Use the main wallet key for normal trading, or an agent wallet key with
   * accountPublicKey when acting on behalf of a registered main account.
   */
  privateKey?: string;
  /**
   * Optional account public key (base58) to act on.
   * Only required when privateKey belongs to an agent wallet instead of the
   * target main account.
   */
  accountPublicKey?: string;
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
  /**
   * Account public key used for account queries and signed actions.
   * Derived from privateKey unless accountPublicKey is explicitly provided.
   */
  readonly accountPublicKey?: string;
  /** Backward-compatible account identifier alias used by venue integrations. */
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

    const signer = config.privateKey
      ? KeychainSigner.fromPrivateKey(config.privateKey, config.accountPublicKey)
      : undefined;

    this.market = new MarketClient({ http });
    this.account = new AccountClient({ http });
    this.ws = ws;
    this.trade = new TradeClient({ http, ws, signer });
    this.accountPublicKey = config.accountPublicKey ?? signer?.accountPublicKey;
    this.accountId = this.accountPublicKey;
  }
}
