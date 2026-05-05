import type { components } from "../generated/openapi.ts";

/** Full account snapshot including balances and positions. From OpenAPI `FullAccount`. */
export type FullAccount = components["schemas"]["FullAccount"];

/** Live resting order as returned by account endpoints. From OpenAPI `OrderState`. */
export type OrderState = components["schemas"]["OrderState"];

/** Trade fill record. From OpenAPI `Fill`. */
export type Fill = components["schemas"]["Fill"];

/** Closed position history row. From OpenAPI `ClosedPosition`. */
export type ClosedPosition = components["schemas"]["ClosedPosition"];

/** Funding payment ledger entry. From OpenAPI `FundingPayment`. */
export type FundingPayment = components["schemas"]["FundingPayment"];

/** Historical order summary line. From OpenAPI `OrderHistoryEntry`. */
export type OrderHistoryEntry = components["schemas"]["OrderHistoryEntry"];

/** Current fee tier / discount state. From OpenAPI `FeeState`. */
export type FeeState = components["schemas"]["FeeState"];

/** Pending multisig proposals affecting the account. From OpenAPI `MultisigProposalsSnapshot`. */
export type MultisigProposalsSnapshot = components["schemas"]["MultisigProposalsSnapshot"];

/** Private WebSocket `account` channel payload shape. From OpenAPI `AccountData`. */
export type AccountData = components["schemas"]["AccountData"];

/** Base shape for account subscription/query payloads keyed by `type` and `user`. */
export type AccountQuery = {
  /** Logical query or subscription kind. */
  type: string;
  /** Account public key or identifier expected by the API. */
  user: string;
  [key: string]: unknown;
};
