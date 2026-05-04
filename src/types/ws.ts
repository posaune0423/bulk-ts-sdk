import type { CandleInterval } from './common.ts'
import type { SignedTransaction } from './trade.ts'

export type WsSubscription =
  | { type: 'ticker'; symbol: string }
  | { type: 'candle'; symbol: string; interval: CandleInterval }
  | { type: 'trades'; symbol: string }
  | { type: 'risk'; symbol: string }
  | { type: 'frontendContext' }
  | {
    type: 'l2Snapshot'
    symbol: string
    nlevels?: number
    aggregation?: number
  }
  | { type: 'l2Delta'; symbol: string }
  | { type: 'account'; user: string | string[] }

export type WsHandler<T> = (message: T) => void | Promise<void>

export type SubscriptionHandle = {
  topics: string[]
  unsubscribe: () => Promise<void>
}

export type WsPostOptions = {
  timeoutMs?: number
}

/** Outbound JSON-RPC style messages sent over the Bulk WebSocket. */
export type WsClientOutbound =
  | { method: 'subscribe'; subscription: WsSubscription[] }
  | { method: 'unsubscribe'; subscription: WsSubscription[] }
  | {
    method: 'post'
    id: number
    request: { type: 'action'; payload: SignedTransaction }
  }
