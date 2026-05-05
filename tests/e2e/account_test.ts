import { assert } from "@std/assert";
import { BulkClient } from "../../src/client.ts";
import { getEnv } from "../helpers/env.ts";

const env = getEnv();
const client = new BulkClient({
  httpUrl: env.BULK_HTTP_URL,
  wsUrl: env.BULK_WS_URL,
  privateKey: env.PRIVATE_KEY,
});

Deno.test("E2E: Account - fullAccount", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined, "AccountId should be derived from private key");
  const account = await client.account.fullAccount(accountId);
  assert(account !== undefined);
  assert(account.kind !== undefined);
});

Deno.test("E2E: Account - openOrders", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const orders = await client.account.openOrders(accountId);
  assert(Array.isArray(orders));
});

Deno.test("E2E: Account - fills", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const fills = await client.account.fills(accountId);
  assert(Array.isArray(fills));
});

Deno.test("E2E: Account - positions", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const positions = await client.account.positions(accountId);
  assert(Array.isArray(positions));
});

Deno.test("E2E: Account - fundingHistory", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const funding = await client.account.fundingHistory(accountId);
  assert(Array.isArray(funding));
});

Deno.test("E2E: Account - orderHistory", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const orders = await client.account.orderHistory(accountId);
  assert(Array.isArray(orders));
});

Deno.test("E2E: Account - feeTier", async () => {
  const accountId = client.accountId;
  assert(accountId !== undefined);
  const fee = await client.account.feeTier(accountId);
  assert(fee !== undefined);
});

Deno.test("E2E: Account - feeState", async () => {
  const fee = await client.account.feeState();
  assert(fee !== undefined);
});

Deno.test({
  name: "E2E: Account - multisigProposals",
  async fn(): Promise<void> {
    if (env.MULTISIG_PUBKEY === undefined) {
      console.info("Skipping multisigProposals E2E: MULTISIG_PUBKEY is not set.");
      return;
    }

    const snapshot = await client.account.multisigProposals(env.MULTISIG_PUBKEY);
    assert(snapshot !== undefined);
    assert(Array.isArray(snapshot.proposals));
  },
});
