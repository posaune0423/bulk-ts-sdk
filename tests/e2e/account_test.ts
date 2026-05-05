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
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined, "accountPublicKey should be derived from private key");
  const account = await client.account.fullAccount(accountPublicKey);
  assert(account !== undefined);
  assert(account.kind !== undefined);
});

Deno.test("E2E: Account - openOrders", async () => {
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const orders = await client.account.openOrders(accountPublicKey);
  assert(Array.isArray(orders));
});

Deno.test("E2E: Account - fills", async () => {
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const fills = await client.account.fills(accountPublicKey);
  assert(Array.isArray(fills));
});

Deno.test("E2E: Account - positions", async () => {
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const positions = await client.account.positions(accountPublicKey);
  assert(Array.isArray(positions));
});

Deno.test("E2E: Account - fundingHistory", async () => {
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const funding = await client.account.fundingHistory(accountPublicKey);
  assert(Array.isArray(funding));
});

Deno.test("E2E: Account - orderHistory", async () => {
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const orders = await client.account.orderHistory(accountPublicKey);
  assert(Array.isArray(orders));
});

Deno.test("E2E: Account - feeTier", async () => {
  const accountPublicKey = client.accountPublicKey;
  assert(accountPublicKey !== undefined);
  const fee = await client.account.feeTier(accountPublicKey);
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
