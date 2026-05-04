import { assert } from '@std/assert'
import { BulkClient } from '../../src/client.ts'
import { getEnv } from '../helpers/env.ts'

const env = getEnv()
const client = new BulkClient({
  httpUrl: env.BULK_HTTP_URL,
  wsUrl: env.BULK_WS_URL,
  privateKey: env.PRIVATE_KEY,
})

Deno.test('E2E: Account - fullAccount', async () => {
  assert(client.accountId !== undefined, 'AccountId should be derived from private key')
  const account = await client.account.fullAccount(client.accountId!)
  assert(account !== undefined)
  assert(account.user === client.accountId)
})

Deno.test('E2E: Account - openOrders', async () => {
  const orders = await client.account.openOrders(client.accountId!)
  assert(Array.isArray(orders))
})

Deno.test('E2E: Account - fills', async () => {
  const fills = await client.account.fills(client.accountId!)
  assert(Array.isArray(fills))
})

Deno.test('E2E: Account - positions', async () => {
  const positions = await client.account.positions(client.accountId!)
  assert(Array.isArray(positions))
})

Deno.test('E2E: Account - feeTier', async () => {
  const fee = await client.account.feeTier(client.accountId!)
  assert(fee !== undefined)
})
