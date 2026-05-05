import { BulkDecodeError } from "../errors.ts";
import type { HttpTransport } from "./http_transport.ts";
import type {
  AccountData,
  AccountQuery,
  ClosedPosition,
  FeeState,
  Fill,
  FullAccount,
  FundingPayment,
  MultisigProposalsSnapshot,
  OrderHistoryEntry,
  OrderState,
} from "../types/account.ts";

export class AccountClient {
  constructor(private readonly deps: { http: HttpTransport }) {}

  async fullAccount(user: string): Promise<FullAccount> {
    const rows = await this.deps.http.post<AccountData[]>("/account", {
      type: "fullAccount",
      user,
    });
    const row = rows.find((r) => "fullAccount" in r);
    if (!row || !("fullAccount" in row) || !row.fullAccount) {
      throw new BulkDecodeError("fullAccount response is empty");
    }
    return row.fullAccount;
  }

  async openOrders(user: string): Promise<OrderState[]> {
    return await this.queryAccount<OrderState>(
      { type: "openOrders", user },
      (row) => ("openOrder" in row && row.openOrder ? [row.openOrder] : undefined),
    );
  }

  async fills(user: string): Promise<Fill[]> {
    return await this.queryAccount<Fill>(
      { type: "fills", user },
      (row) => ("fills" in row && row.fills ? [row.fills] : undefined),
    );
  }

  async positions(user: string): Promise<ClosedPosition[]> {
    return await this.queryAccount<ClosedPosition>(
      { type: "positions", user },
      (row) => ("positions" in row && row.positions ? [row.positions] : undefined),
    );
  }

  async fundingHistory(user: string): Promise<FundingPayment[]> {
    return await this.queryAccount<FundingPayment>(
      { type: "fundingHistory", user },
      (row) => ("fundingPayment" in row && row.fundingPayment ? [row.fundingPayment] : undefined),
    );
  }

  async orderHistory(user: string): Promise<OrderHistoryEntry[]> {
    return await this.queryAccount<OrderHistoryEntry>(
      { type: "orderHistory", user },
      (row) => ("orderHistory" in row && row.orderHistory ? [row.orderHistory] : undefined),
    );
  }

  async feeTier(user: string, params?: { symbol?: string }): Promise<FeeState> {
    const rows = await this.deps.http.post<AccountData[]>("/account", {
      type: "feeTier",
      user,
      ...params,
    });
    const row = rows.find((r) => "feeTier" in r);
    if (!row || !("feeTier" in row) || !row.feeTier) {
      throw new BulkDecodeError("feeTier response is empty");
    }
    return row.feeTier as FeeState;
  }

  async feeState(): Promise<FeeState> {
    return await this.deps.http.get<FeeState>("/feeState");
  }

  async multisigProposals(pubkey: string): Promise<MultisigProposalsSnapshot> {
    return await this.deps.http.get<MultisigProposalsSnapshot>(
      `/multisig/${encodeURIComponent(pubkey)}/proposals`,
    );
  }

  private async queryAccount<T>(
    body: AccountQuery,
    pick: (row: AccountData) => T[] | undefined,
  ): Promise<T[]> {
    const rows = await this.deps.http.post<AccountData[]>("/account", body);
    const results: T[] = [];
    for (const row of rows) {
      const data = pick(row);
      if (data !== undefined) {
        results.push(...data);
      }
    }
    return results;
  }
}
