import { assert, assertEquals } from "@std/assert";
import * as path from "jsr:@std/path@1.0.8";

const npmDir = path.fromFileUrl(new URL("../../npm", import.meta.url));

type NpmPackageJson = {
  main: unknown;
  module: unknown;
  types: unknown;
  exports: {
    ".": {
      import: unknown;
      require: unknown;
    };
  };
};

async function readNpmPackageJson(): Promise<NpmPackageJson | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(path.join(npmDir, "package.json")));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.info("Skipping npm package metadata test: run deno task build:npm <version> first.");
      return undefined;
    }
    throw error;
  }
}

Deno.test("npm package exposes Bun-compatible module metadata", async () => {
  const packageJson = await readNpmPackageJson();
  if (packageJson === undefined) return;

  assertEquals(packageJson.main, "./script/mod.js");
  assertEquals(packageJson.module, "./esm/mod.js");
  assertEquals(packageJson.types, "./esm/mod.d.ts");
  assertEquals(packageJson.exports["."].import, {
    types: "./esm/mod.d.ts",
    default: "./esm/mod.js",
  });
  assertEquals(packageJson.exports["."].require, {
    types: "./script/mod.d.ts",
    default: "./script/mod.js",
  });
});

Deno.test("npm package copies native keychain bindings beside generated runtime imports", async () => {
  const packageJson = await readNpmPackageJson();
  if (packageJson === undefined) return;

  const nativeFiles = [
    "bulk-keychain.darwin-arm64.node",
    "bulk-keychain.darwin-x64.node",
    "bulk-keychain.linux-x64-gnu.node",
    "bulk-keychain.win32-x64-msvc.node",
  ];

  const nativePaths = ["esm", "script"].flatMap((runtimeDir) =>
    nativeFiles.map((nativeFile) => path.join(npmDir, runtimeDir, "vendor", "bulk-keychain", nativeFile))
  );
  const stats = await Promise.all(nativePaths.map((nativePath) => Deno.stat(nativePath)));

  for (const stat of stats) {
    assert(stat.isFile);
  }
});
