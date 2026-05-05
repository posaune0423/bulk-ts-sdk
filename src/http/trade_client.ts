import { BulkTransactionRejectedError } from "../errors.ts";
import { normalizeSignedTransaction } from "../signing/normalize_signed_transaction.ts";
import {
  toKeychainAgentWalletCreation,
  toKeychainCancelAll,
  toKeychainCancelOrder,
  toKeychainLimitOrder,
  toKeychainMarketOrder,
} from "../builders/orders.ts";
import type { HttpTransport } from "./http_transport.ts";
import type { WsClient } from "../ws/ws_client.ts";
import type { KeychainSigner } from "../signing/keychain_signer.ts";
import type {
  AgentWalletParams,
  CancelAllParams,
  CancelOrderParams,
  KeychainOrderInput,
  KeychainSignedTransaction,
  LimitOrderParams,
  MarketOrderParams,
  OrderResponse,
  SignedTransaction,
  TradeOptions,
} from "../types/trade.ts";

export class TradeClient {
  constructor(
    private readonly deps: {
      http: HttpTransport;
      ws: WsClient;
      signer?: KeychainSigner;
    },
  ) {}

  async submit(
    transaction: SignedTransaction | KeychainSignedTransaction,
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const normalized = normalizeSignedTransaction(transaction);
    const via = options.via ?? "http";

    let response: OrderResponse;
    if (via === "ws") {
      response = await this.deps.ws.post(normalized, {
        timeoutMs: options.timeoutMs,
      });
    } else {
      response = await this.deps.http.post<OrderResponse>("/order", normalized, {
        timeoutMs: options.timeoutMs,
      });
    }

    if (options.throwOnReject !== false) {
      this.assertOrderResponseOk(response);
    }

    return response;
  }

  async placeLimitOrder(
    params: LimitOrderParams,
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const input = toKeychainLimitOrder(params);
    return await this.submitSignedAction(input, options);
  }

  async placeMarketOrder(
    params: MarketOrderParams,
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const input = toKeychainMarketOrder(params);
    return await this.submitSignedAction(input, options);
  }

  async cancelOrder(
    params: CancelOrderParams,
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const input = toKeychainCancelOrder(params);
    return await this.submitSignedAction(input, options);
  }

  async cancelAll(
    params: CancelAllParams = {},
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const input = toKeychainCancelAll(params);
    return await this.submitSignedAction(input, options);
  }

  async manageAgentWallet(
    params: AgentWalletParams,
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const input = toKeychainAgentWalletCreation(params);
    return await this.submitSignedAction(input, options);
  }

  async batch(
    inputs: KeychainOrderInput[],
    options: TradeOptions = {},
  ): Promise<OrderResponse> {
    const signer = this.ensureSigner();
    const signedTransaction = signer.signGroup(inputs);
    return await this.submit(signedTransaction, options);
  }

  private async submitSignedAction(
    input: KeychainOrderInput,
    options: TradeOptions,
  ): Promise<OrderResponse> {
    const signer = this.ensureSigner();
    const signedTransaction = signer.sign(input);
    return await this.submit(signedTransaction, options);
  }

  private ensureSigner(): KeychainSigner {
    if (!this.deps.signer) {
      throw new Error("Signer is required for this operation");
    }
    return this.deps.signer;
  }

  private assertOrderResponseOk(response: OrderResponse): void {
    if (response.status === "error") {
      throw new BulkTransactionRejectedError(response);
    }
  }
}
