import type { Side, TimeInForce, TransportKind } from './common.ts'
import type { components } from '../generated/openapi.ts'

export type LimitOrderParams = {
  symbol: string
  side: Side
  price: number
  size: number
  tif?: TimeInForce
  reduceOnly?: boolean
  isolated?: boolean
}

export type MarketOrderParams = {
  symbol: string
  side: Side
  size: number
  reduceOnly?: boolean
  isolated?: boolean
}

export type CancelOrderParams = {
  symbol: string
  orderId: string
}

export type CancelAllParams = {
  symbols?: string[]
}

export type TradeOptions = {
  via?: TransportKind
  timeoutMs?: number
  throwOnReject?: boolean
}

export type OrderResponse = components['schemas']['OrderResponse']

export type SignedTransaction = {
  actions: unknown[]
  nonce: number
  account: string
  signer: string
  signature: string
  orderId?: string
  orderIds?: string[]
}

export type KeychainSignedTransaction = {
  actions: string | unknown[]
  nonce: number
  account: string
  signer: string
  signature: string
  orderId?: string
  orderIds?: string[]
}

/** Shape passed to bulk-keychain signing for order flows (matches `builders/orders.ts`). */
export type KeychainOrderInput =
  | {
    type: 'order'
    symbol: string
    isBuy: boolean
    price: number
    size: number
    reduceOnly: boolean
    iso: boolean
    orderType: { type: 'limit'; tif: TimeInForce }
  }
  | {
    type: 'order'
    symbol: string
    isBuy: boolean
    size: number
    reduceOnly: boolean
    iso: boolean
    orderType: { type: 'market' }
  }
  | {
    type: 'cancel'
    symbol: string
    orderId: string
  }
  | {
    type: 'cancelAll'
    symbols: string[]
  }
