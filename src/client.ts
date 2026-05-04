import { HttpTransport } from './http/http_transport.ts'
import { MarketClient } from './http/market_client.ts'
import { AccountClient } from './http/account_client.ts'
import { TradeClient } from './http/trade_client.ts'
import { WsClient } from './ws/ws_client.ts'
import { KeychainSigner } from './signing/keychain_signer.ts'
import { BULK_DEFAULT_HTTP_URL, BULK_DEFAULT_WS_URL, DEFAULT_TIMEOUT_MS } from './constants.ts'

export type BulkClientConfig = {
  httpUrl?: string
  wsUrl?: string
  privateKey?: string
  timeoutMs?: number
  validateResponses?: boolean
}

export class BulkClient {
  readonly market: MarketClient
  readonly account: AccountClient
  readonly trade: TradeClient
  readonly ws: WsClient
  readonly accountId?: string

  constructor(config: BulkClientConfig = {}) {
    const http = new HttpTransport({
      baseUrl: config.httpUrl ?? BULK_DEFAULT_HTTP_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    })

    const ws = new WsClient({
      url: config.wsUrl ?? BULK_DEFAULT_WS_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    })

    const signer = config.privateKey ? KeychainSigner.fromPrivateKey(config.privateKey) : undefined

    this.market = new MarketClient({ http })
    this.account = new AccountClient({ http })
    this.ws = ws
    this.trade = new TradeClient({ http, ws, signer })
    this.accountId = signer?.account
  }
}
