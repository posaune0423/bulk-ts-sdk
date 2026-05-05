/**
 * Downloads the published OpenAPI spec and overwrites docs/references/openapi.yml.
 */
const OPENAPI_URL = "https://docs.bulk.trade/api-reference/openapi.yaml";

async function main(): Promise<void> {
  const res = await fetch(OPENAPI_URL);
  if (!res.ok) {
    throw new Error(`OpenAPI fetch failed: ${res.status} ${res.statusText}`);
  }
  const body = await res.text();
  const out = new URL("../docs/references/openapi.yml", import.meta.url);
  await Deno.writeTextFile(out, body);
  console.log(`Updated docs/references/openapi.yml (${body.length} bytes)`);
}

try {
  await main();
} catch (e) {
  console.error(e);
  Deno.exit(1);
}
