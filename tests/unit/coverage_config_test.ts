import { assert, assertEquals } from "@std/assert";

const denoJson = new URL("../../deno.json", import.meta.url);
const gitignore = new URL("../../.gitignore", import.meta.url);

type DenoConfig = {
  tasks?: Record<string, string>;
  test?: {
    exclude?: unknown;
  };
};

Deno.test("test config excludes vendored runtime files", async () => {
  const config = JSON.parse(await Deno.readTextFile(denoJson)) as {
    test?: {
      exclude?: unknown;
    };
  };

  assertEquals(config.test?.exclude, ["src/vendor/"]);
});

Deno.test("test task runs unit and integration coverage directly", async () => {
  const config = JSON.parse(await Deno.readTextFile(denoJson)) as DenoConfig;
  const task = config.tasks?.test ?? "";

  assert(task.startsWith("deno test "));
  assert(task.includes("tests/unit tests/integration"));
  assert(!task.includes("scripts/run_unit_integration_tests.ts"));
});

Deno.test("coverage task generates lcov and html without vendored runtime files", async () => {
  const config = JSON.parse(await Deno.readTextFile(denoJson)) as DenoConfig;
  const task = config.tasks?.test ?? "";

  assert(task.includes("deno coverage --lcov"));
  assert(task.includes("deno coverage --html"));
  assert(task.includes("[\\\\/]vendor[\\\\/]"));
  assert(!task.includes("deno fmt docs/coverage/html/index.html"));
});

Deno.test("git ignores generated coverage html", async () => {
  const ignore = await Deno.readTextFile(gitignore);

  assert(ignore.includes("docs/coverage/html/"));
  assert(!ignore.includes("!docs/coverage/html/index.html"));
});
