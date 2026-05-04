import { BulkDecodeError } from '../errors.ts'
import type { HttpTransport } from './http_transport.ts'
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
} from '../types/account.ts'

export class AccountClient {
  constructor(private readonly deps: { http: HttpTransport }) {}

  async fullAccount(user: string): Promise<FullAccount> {
    const rows = await this.deps.http.post<AccountData[]>('/account', {
      type: 'fullAccount',
      user,
    })
    const row = rows.find((r) => 'fullAccount' in r)
    if (!(row as any)?.fullAccount) {
      throw new BulkDecodeError('fullAccount response is empty')
    }
    return (row as any).fullAccount
  }

  async openOrders(user: string): Promise<OrderState[]> {
    return await this.queryAccount<OrderState[]>(
      { type: 'openOrders', user },
      (row) => (row as any).openOrder ? [(row as any).openOrder] : undefined,
    )
  }

  async fills(user: string): Promise<Fill[]> {
    return await this.queryAccount<Fill[]>(
      { type: 'fills', user },
      (row) => (row as any).fills ? [(row as any).fills] : undefined,
    )
  }

  async positions(user: string): Promise<ClosedPosition[]> {
    return await this.queryAccount<ClosedPosition[]>(
      { type: 'positions', user },
      (row) => (row as any).position ? [(row as any).position] : undefined,
    )
  }

  async fundingHistory(user: string): Promise<FundingPayment[]> {
    return await this.queryAccount<FundingPayment[]>(
      { type: 'fundingHistory', user },
      (row) => (row as any).fundingPayment ? [(row as any).fundingPayment] : undefined,
    )
  }

  async orderHistory(user: string): Promise<OrderHistoryEntry[]> {
    return await this.queryAccount<OrderHistoryEntry[]>(
      { type: 'orderHistory', user },
      (row) => (row as any).orderHistory ? [(row as any).orderHistory] : undefined,
    )
  }

  async feeTier(user: string, params?: { symbol?: string }): Promise<FeeState> {
    const rows = await this.deps.http.post<AccountData[]>('/account', {
      type: 'feeTier',
      user,
      ...params,
    })
    const row = rows.find((r) => 'feeTier' in r)
    if (!(row as any)?.feeTier) {
      throw new BulkDecodeError('feeTier response is empty')
    }
    return (row as any).feeTier as FeeState
  }

  async feeState(): Promise<FeeState> {
    const rows = await this.deps.http.post<AccountData[]>('/account', {
      type: 'feeState',
    })
    const row = rows.find((r) => 'feeState' in r)
    if (!(row as any)?.feeState) {
      throw new BulkDecodeError('feeState response is empty')
    }
    return (row as any).feeState
  }

  async multisigProposals(pubkey: string): Promise<MultisigProposalsSnapshot> {
    const rows = await this.deps.http.post<AccountData[]>('/account', {
      type: 'multisigProposals',
      pubkey,
    })
    const row = rows.find((r) => 'multisigProposals' in r)
    if (!(row as any)?.multisigProposals) {
      throw new BulkDecodeError('multisigProposals response is empty')
    }
    return (row as any).multisigProposals
  }

  private async queryAccount<T extends any[]>(
    body: AccountQuery,
    pick: (row: AccountData) => T | undefined,
  ): Promise<T> {
    const rows = await this.deps.http.post<AccountData[]>('/account', body)
    const results: any[] = []
    for (const row of rows) {
      const data = pick(row)
      if (data !== undefined) {
        results.push(...data)
      }
    }
    return results as T
  }
}
