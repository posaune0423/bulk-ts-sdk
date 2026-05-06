import { assert, assertEquals } from "@std/assert";

const rootEnvExample = new URL("../../.env.example", import.meta.url);
const readme = new URL("../../README.md", import.meta.url);
const llmText = new URL("../../llm.txt", import.meta.url);
const docsTest = new URL("../../docs/TEST.md", import.meta.url);
const clientSource = new URL("../../src/client.ts", import.meta.url);
const accountInfoExample = new URL("../../examples/simple-use/src/account-info.ts", import.meta.url);
const tradeLifecycleExample = new URL("../../examples/simple-use/src/trade-lifecycle.ts", import.meta.url);

Deno.test("root env example uses role-specific wallet names", async () => {
  const envExample = await Deno.readTextFile(rootEnvExample);
  const lines = envExample.split(/\r?\n/);

  assert(envExample.includes("MAIN_WALLET_PRIVATE_KEY="));
  assert(envExample.includes("AGENT_WALLET_PRIVATE_KEY="));
  assert(envExample.includes("MAIN_WALLET_PUBLIC_KEY="));
  assert(!lines.includes("AGENT_WALLET_PUBLIC_KEY="));
  assert(!lines.includes("PRIVATE_KEY="));
});

Deno.test("README client examples use ordinary TypeScript process.env names", async () => {
  const source = await Deno.readTextFile(readme);

  assert(source.includes("process.env.MAIN_WALLET_PRIVATE_KEY"));
  assert(source.includes("process.env.AGENT_WALLET_PRIVATE_KEY"));
  assert(source.includes("process.env.MAIN_WALLET_PUBLIC_KEY"));
  assert(source.includes("agentWalletClient.accountPublicKey"));
  assert(!source.includes("process.env.AGENT_WALLET_PUBLIC_KEY"));
  assert(!source.includes("Deno.env.get"));
});

Deno.test("llm guide keeps agent-wallet client initialization explicit", async () => {
  const source = await Deno.readTextFile(llmText);

  assert(source.includes("privateKey: process.env.AGENT_WALLET_PRIVATE_KEY"));
  assert(source.includes("accountPublicKey: process.env.MAIN_WALLET_PUBLIC_KEY"));
  assert(!source.includes("Deno example:"));
  assert(!source.includes("Deno.env.get"));
});

Deno.test("E2E docs match role-specific wallet environment names", async () => {
  const source = await Deno.readTextFile(docsTest);

  assert(source.includes("MAIN_WALLET_PRIVATE_KEY"));
  assert(source.includes("AGENT_WALLET_PRIVATE_KEY"));
  assert(!source.includes("`PRIVATE_KEY`"));
});

Deno.test("agent-wallet client config fact is covered by integration tests", async () => {
  const integrationTest = await Deno.readTextFile(new URL("../integration/client_test.ts", import.meta.url));

  assert(integrationTest.includes("rejects target account signing when native keychain cannot sign it"));
  assert(integrationTest.includes("accountPublicKey: TARGET_ACCOUNT_PUBLIC_KEY"));
  assertEquals(
    integrationTest.includes('"target-account signing support"'),
    true,
  );
});

Deno.test("removed account property is not documented or exposed", async () => {
  const sources = await Promise.all([
    Deno.readTextFile(clientSource),
    Deno.readTextFile(llmText),
    Deno.readTextFile(accountInfoExample),
    Deno.readTextFile(tradeLifecycleExample),
  ]);
  const forbidden = [
    "account" + "Id",
    "account " + "id",
    "account " + "identifier",
  ];

  for (const source of sources) {
    for (const pattern of forbidden) {
      assert(!source.includes(pattern));
    }
  }
});
