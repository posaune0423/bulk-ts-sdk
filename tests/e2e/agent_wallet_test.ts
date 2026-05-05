import { assert, assertEquals, assertRejects } from "@std/assert";
import { BulkClient } from "../../src/client.ts";
import { KeychainSigner } from "../../src/signing/keychain_signer.ts";
import { getEnv } from "../helpers/env.ts";

const env = getEnv();

type AccountWithAgentWallets = {
  authorizedAgentWallets?: string[];
};

async function waitForAgentPresence(
  client: BulkClient,
  accountPublicKey: string,
  agentPublicKey: string,
  expectedPresent: boolean,
  deadline = Date.now() + 15_000,
  lastAgents: string[] = [],
): Promise<string[]> {
  if (Date.now() >= deadline) {
    return lastAgents;
  }

  const account = await client.account.fullAccount(accountPublicKey);
  const agents = (account as AccountWithAgentWallets).authorizedAgentWallets ?? [];
  if (agents.includes(agentPublicKey) === expectedPresent) {
    return agents;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return waitForAgentPresence(client, accountPublicKey, agentPublicKey, expectedPresent, deadline, agents);
}

/**
 * E2E test for Agent Wallet registration.
 *
 * Flow:
 * 1. Register a new Agent Wallet using the Main Wallet.
 * 2. Verify target-account order signing is blocked when the native signer
 *    cannot sign the target account into the signature.
 * 3. Remove the Agent Wallet using the Main Wallet.
 */
Deno.test({
  name: "E2E: Agent Wallet Registration",
  async fn(): Promise<void> {
    if (env.AGENT_WALLET_PRIVATE_KEY === undefined) {
      console.info("Skipping agent wallet E2E: AGENT_WALLET_PRIVATE_KEY is not set.");
      return;
    }

    // 1. Setup Clients
    const mainClient = new BulkClient({
      httpUrl: env.BULK_HTTP_URL,
      wsUrl: env.BULK_WS_URL,
      privateKey: env.PRIVATE_KEY,
    });
    const mainAccountPublicKey = mainClient.accountPublicKey;
    assert(mainAccountPublicKey !== undefined);

    const agentSigner = KeychainSigner.fromPrivateKey(env.AGENT_WALLET_PRIVATE_KEY);
    const agentPubkey = agentSigner.accountPublicKey;

    console.log("Main account public key:", mainAccountPublicKey);
    console.log("Agent wallet public key:", agentPubkey);

    // 2. Register Agent Wallet
    console.log("Registering Agent Wallet...");
    const regRes = await mainClient.trade.manageAgentWallet({
      agent: agentPubkey,
      remove: false,
    });
    assertEquals(regRes.status, "ok");
    console.log("Agent registered.");

    try {
      const registeredAgents = await waitForAgentPresence(mainClient, mainAccountPublicKey, agentPubkey, true);
      assert(
        registeredAgents.includes(agentPubkey),
        "Agent should be visible in account state after registration",
      );

      // 3. Setup Agent Client (acting for Main Account)
      const agentClient = new BulkClient({
        httpUrl: env.BULK_HTTP_URL,
        wsUrl: env.BULK_WS_URL,
        privateKey: env.AGENT_WALLET_PRIVATE_KEY,
        accountPublicKey: mainAccountPublicKey,
      });

      // 4. Verify unsupported target-account signing fails before submit.
      console.log("Verifying target-account order signing guard...");
      await assertRejects(
        () =>
          agentClient.trade.placeLimitOrder({
            symbol: "BTC-USD",
            side: "buy",
            price: 80000.5,
            size: 0.0001,
            tif: "GTC",
          }),
        Error,
        "target-account signing support",
      );
    } finally {
      // 5. Remove Agent Wallet
      console.log("Removing Agent Wallet...");
      const remRes = await mainClient.trade.manageAgentWallet({
        agent: agentPubkey,
        remove: true,
      });
      assertEquals(remRes.status, "ok");
      console.log("Agent removal submitted. Waiting for account state propagation...");

      const agents = await waitForAgentPresence(mainClient, mainAccountPublicKey, agentPubkey, false);
      console.log("Registered Agents after removal:", agents);
      assert(!agents.includes(agentPubkey), "Agent should be removed from account state");
    }
  },
});
