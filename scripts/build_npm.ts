import { build, emptyDir } from 'jsr:@deno/dnt@0.42.3'
import * as path from 'jsr:@std/path@1.0.8'

const version = Deno.args[0]?.replace(/^v/, '')

if (!version) {
  throw new Error(
    'Expected a package version argument, for example: deno run -A scripts/build_npm.ts 0.1.0',
  )
}

await emptyDir('./npm')

await build({
  entryPoints: ['./src/mod.ts'],
  importMap: 'deno.json',
  outDir: './npm',
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
    target: 'ES2022',
    lib: ['ES2022', 'DOM'],
  },
  package: {
    name: 'bulk-ts-sdk',
    version,
    description: 'Official TypeScript SDK for Bulk Exchange, providing high-performance, type-safe access to market data and trading operations.',
    author: 'posaune0423',
    license: 'MIT',
    sideEffects: false,
    repository: {
      type: 'git',
      url: 'https://github.com/posaune0423/bulk-ts-sdk',
    },
    bugs: {
      url: 'https://github.com/posaune0423/bulk-ts-sdk/issues',
    },
    homepage: 'https://github.com/posaune0423/bulk-ts-sdk#readme',
    engines: {
      node: '>=18.0.0',
    },
  },
  async postBuild() {
    // Copy README and LICENSE
    Deno.copyFileSync('README.md', 'npm/README.md')
    try {
      Deno.copyFileSync('LICENSE', 'npm/LICENSE')
    } catch {
      // Ignore if LICENSE is missing
    }

    // Copy vendor directory into npm output
    // We need to maintain the relative structure for native modules
    const vendorDir = './src/vendor'
    const outVendorDir = './npm/vendor'

    await emptyDir(outVendorDir)

    for await (const entry of Deno.readDir(path.join(vendorDir, 'bulk-keychain'))) {
      if (entry.isFile) {
        const src = path.join(vendorDir, 'bulk-keychain', entry.name)
        const dest = path.join(outVendorDir, 'bulk-keychain', entry.name)
        await Deno.mkdir(path.dirname(dest), { recursive: true })
        await Deno.copyFile(src, dest)
      }
    }

    console.log('NPM build complete with vendor assets.')
  },
})
