import type {
  AgentWalletKeychainInput,
  AgentWalletParams,
  CancelAllParams,
  CancelOrderParams,
  KeychainOrderInput,
  LimitOrderParams,
  MarketOrderParams,
} from "../types/trade.ts";

export function toKeychainAgentWalletCreation(params: AgentWalletParams): AgentWalletKeychainInput {
  return {
    type: "agentWalletCreation",
    agent: params.agent,
    remove: params.remove,
  };
}

export function toKeychainLimitOrder(params: LimitOrderParams): KeychainOrderInput {
  return {
    type: "order",
    symbol: params.symbol,
    isBuy: params.side === "buy",
    price: params.price,
    size: params.size,
    reduceOnly: params.reduceOnly ?? false,
    iso: params.isolated ?? false,
    orderType: {
      type: "limit",
      tif: params.tif ?? "GTC",
    },
  };
}

export function toKeychainMarketOrder(params: MarketOrderParams): KeychainOrderInput {
  return {
    type: "order",
    symbol: params.symbol,
    isBuy: params.side === "buy",
    price: 0,
    size: params.size,
    reduceOnly: params.reduceOnly ?? false,
    iso: params.isolated ?? false,
    orderType: {
      type: "market",
      isMarket: true,
      triggerPx: 0,
    },
  };
}

export function toKeychainCancelOrder(params: CancelOrderParams): KeychainOrderInput {
  return {
    type: "cancel",
    symbol: params.symbol,
    orderId: params.orderId,
  };
}

export function toKeychainCancelAll(params: CancelAllParams = {}): KeychainOrderInput {
  return {
    type: "cancelAll",
    symbols: params.symbols ?? [],
  };
}
