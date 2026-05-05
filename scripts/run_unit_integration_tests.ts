/**
 * Runs unit + integration tests with coverage written to `coverageDirectory` from deno.json.
 */
async function main(): Promise<void> {
  const denoJson = new URL("../deno.json", import.meta.url);
  const config = JSON.parse(await Deno.readTextFile(denoJson)) as {
    coverageDirectory?: string;
  };
  const coverageDir = config.coverageDirectory ?? "coverage";
  const testPaths = Deno.args.length > 0 ? Deno.args : ["tests/unit", "tests/integration"];

  const child = await new Deno.Command(Deno.execPath(), {
    args: [
      "test",
      `--coverage=${coverageDir}`,
      `--allow-write=${coverageDir}`,
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-ffi",
      ...testPaths,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();

  const status = await child.status;
  Deno.exit(status.code);
}

try {
  await main();
} catch (e) {
  console.error(e);
  Deno.exit(1);
}
