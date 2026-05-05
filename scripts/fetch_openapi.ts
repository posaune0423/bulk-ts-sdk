/**
 * Downloads the published OpenAPI spec and overwrites docs/references/openapi.yml.
 */
const OPENAPI_URL = "https://docs.bulk.trade/api-reference/openapi.yaml";
const FETCH_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(OPENAPI_URL, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`OpenAPI fetch timed out after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

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
