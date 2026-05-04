import { safeJsonParse } from '../utils/json.ts'
import type { KeychainSignedTransaction, SignedTransaction } from '../types/trade.ts'

/**
 * Normalizes a signed transaction from bulk-keychain.
 * Specifically, it parses the actions string into an array if necessary.
 */
export function normalizeSignedTransaction(
  signed: SignedTransaction | KeychainSignedTransaction,
): SignedTransaction {
  return {
    actions: typeof signed.actions === 'string' ? (safeJsonParse(signed.actions) as unknown[]) ?? [] : signed.actions,
    nonce: signed.nonce,

    account: signed.account,
    signer: signed.signer,
    signature: signed.signature,
    orderId: signed.orderId,
    orderIds: signed.orderIds,
  }
}
