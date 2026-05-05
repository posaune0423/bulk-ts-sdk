import type { components } from "../generated/openapi.ts";

export type FullAccount = components["schemas"]["FullAccount"];
export type OrderState = components["schemas"]["OrderState"];
export type Fill = components["schemas"]["Fill"];
export type ClosedPosition = components["schemas"]["ClosedPosition"];
export type FundingPayment = components["schemas"]["FundingPayment"];
export type OrderHistoryEntry = components["schemas"]["OrderHistoryEntry"];
export type FeeState = components["schemas"]["FeeState"];
export type MultisigProposalsSnapshot = components["schemas"]["MultisigProposalsSnapshot"];

export type AccountData = components["schemas"]["AccountData"];

export type AccountQuery = {
  type: string;
  user: string;
  [key: string]: unknown;
};
