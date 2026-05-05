import { build, emptyDir } from "jsr:@deno/dnt@0.42.3";
import * as path from "jsr:@std/path@1.0.8";

const version = Deno.args[0]?.replace(/^v/, "");

if (!version) {
  throw new Error(
    "Expected a package version argument, for example: deno run -A scripts/build_npm.ts 0.1.0",
  );
}

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.ts"],
  importMap: "deno.json",
  outDir: "./npm",
  shims: {
    // We need undici or similar for fetch if targeting old Node,
    // but Node 18+ has global fetch.
    // However, dnt shims are usually safer.
    undici: true,
  },
  // Skip typeCheck to avoid generated polyfill diagnostics blocking packaging
  typeCheck: false,
  test: false,
  compilerOptions: {
    target: "ES2022",
    lib: ["ES2022", "DOM"],
  },
  package: {
    name: "bulk-ts-sdk",
    version,
    description:
      "Unofficial TypeScript SDK for Bulk Exchange, providing high-performance, type-safe access to market data and trading operations.",
    author: "posaune0423",
    license: "MIT",
    types: "./esm/mod.d.ts",
    sideEffects: false,
    repository: {
      type: "git",
      url: "https://github.com/posaune0423/bulk-ts-sdk",
    },
    bugs: {
      url: "https://github.com/posaune0423/bulk-ts-sdk/issues",
    },
    homepage: "https://github.com/posaune0423/bulk-ts-sdk#readme",
    engines: {
      node: ">=18.0.0",
    },
    exports: {
      ".": {
        import: {
          types: "./esm/mod.d.ts",
          default: "./esm/mod.js",
        },
        require: {
          types: "./script/mod.d.ts",
          default: "./script/mod.js",
        },
      },
    },
    files: [
      "esm",
      "script",
      "vendor",
      "README.md",
      "LICENSE",
    ],
  },
  async postBuild(): Promise<void> {
    // Copy README and LICENSE
    Deno.copyFileSync("README.md", "npm/README.md");
    try {
      Deno.copyFileSync("LICENSE", "npm/LICENSE");
    } catch {
      // Ignore if LICENSE is missing
    }

    // Copy vendor directory into every runtime location generated code imports from.
    const vendorDir = "./src/vendor";
    const vendorTargets = ["./npm/vendor", "./npm/esm/vendor", "./npm/script/vendor"];
    const bulkKeychainEntries: string[] = [];

    for await (const entry of Deno.readDir(path.join(vendorDir, "bulk-keychain"))) {
      if (entry.isFile) {
        bulkKeychainEntries.push(entry.name);
      }
    }

    async function copyVendorTarget(outVendorDir: string): Promise<void> {
      await emptyDir(outVendorDir);

      await Promise.all(
        bulkKeychainEntries.map(async (entryName) => {
          const src = path.join(vendorDir, "bulk-keychain", entryName);
          const dest = path.join(outVendorDir, "bulk-keychain", entryName);
          await Deno.mkdir(path.dirname(dest), { recursive: true });
          await Deno.copyFile(src, dest);
        }),
      );
    }

    await Promise.all(vendorTargets.map(copyVendorTarget));

    console.log("NPM build complete with vendor assets.");
  },
});
