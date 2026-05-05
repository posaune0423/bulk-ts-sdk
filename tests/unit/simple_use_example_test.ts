import { assert, assertEquals } from "@std/assert";

const examplePackageJson = new URL(
  "../../examples/simple-use/package.json",
  import.meta.url,
);
const exampleEnv = new URL(
  "../../examples/simple-use/.env.example",
  import.meta.url,
);
const accountInfoExample = new URL(
  "../../examples/simple-use/src/account-info.ts",
  import.meta.url,
);
const tradeLifecycleExample = new URL(
  "../../examples/simple-use/src/trade-lifecycle.ts",
  import.meta.url,
);

type ExamplePackageJson = {
  scripts?: Record<string, string>;
};

Deno.test("simple-use runtime scripts load .env", async () => {
  const packageJson = JSON.parse(
    await Deno.readTextFile(examplePackageJson),
  ) as ExamplePackageJson;
  const scripts = packageJson.scripts ?? {};

  assertEquals(scripts.check, "bunx tsc --noEmit");

  for (
    const name of ["account", "get-market", "market", "start", "trade", "ws"]
  ) {
    assert(
      scripts[name]?.startsWith("bun --env-file=.env "),
      `Expected ${name} script to load .env: ${scripts[name]}`,
    );
  }
});

Deno.test("simple-use env example documents consumed variables", async () => {
  const envExample = await Deno.readTextFile(exampleEnv);

  assert(envExample.includes("PRIVATE_KEY="));
  assert(!envExample.includes("BULK_PRIVATE_KEY="));
  assert(envExample.includes("BULK_HTTP_URL="));
  assert(envExample.includes("BULK_WS_URL="));
  assert(envExample.includes("BULK_SYMBOL="));
});

Deno.test("simple-use account and trade examples read PRIVATE_KEY", async () => {
  for (const sourceFile of [accountInfoExample, tradeLifecycleExample]) {
    const source = await Deno.readTextFile(sourceFile);

    assert(source.includes('requireEnv("PRIVATE_KEY")'));
    assert(!source.includes("BULK_PRIVATE_KEY"));
  }
});
