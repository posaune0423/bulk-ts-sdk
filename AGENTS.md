# Project Instruction

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code. YAGNI, KISS, DRY. No
  backward-compat shims or fallback paths unless they come free without adding cyclomatic complexity.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Commands

Use `deno.json` tasks:

```bash
deno task check
deno task fmt
deno task lint
deno task test
deno task test:coverage
deno task test:integration
deno task test:e2e
deno task generate:types
deno task update:docs
deno task build:npm
deno task hook:install
```

## Code coverage (Git only — not npm / JSR)

Deno has no built-in `deno.json` field that `deno test` reads for the coverage output directory. This repo uses
**`coverageDirectory`** in `deno.json` as the single source of truth; `deno task test` runs
`scripts/run_unit_integration_tests.ts`, which spawns `deno test --coverage=<coverageDirectory>` (and matching
`--allow-write`).

**Directory (default in config):** `docs/coverage/` (`coverageDirectory` in `deno.json`)

| Path                      | Role                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/coverage/lcov.info` | Machine-readable summary (LCOV). **Commit this** as the in-repo coverage SSOT.                                                             |
| `docs/coverage/html/`     | HTML report (many files). **Gitignored** — generated locally when you run `deno task test`; open `html/index.html` in a browser to browse. |
| `docs/coverage/*.json`    | Deno raw profiles — **gitignored**, do not commit.                                                                                         |

**Refresh:** `deno task test` or `deno task test:coverage` (same: unit + integration). Both write under
`coverageDirectory`.

**Git:** Commit **`docs/coverage/lcov.info`** when coverage changes meaningfully. Do **not** commit `html/` or `*.json`.
Coverage is **not** listed in `deno.json` → `publish.include` — npm / JSR packages contain the SDK only.

More context: `docs/TEST.md`.

## Test policy (minimum)

This repository is an SDK. The minimum test guarantee is:

- **E2E is the source of truth**: public Bulk APIs exposed by this SDK should be callable end-to-end via `tests/e2e/`
  using the public client surface. Operational endpoints such as `/metrics` and `/verify` are excluded; see
  `docs/TEST.md`.
- **When adding/updating endpoints**: add/update E2E tests so the new/changed API is exercised at least once
  (happy-path). If the API requires signing, cover the signing flow too.
- **Unit/integration are supportive**: use them for pure transforms/validation/normalization and error mapping, but they
  do not replace E2E coverage for API reachability.
- **Spec-driven workflow**: fetch latest spec with `deno task update:docs` (writes `docs/references/openapi.yml`), then
  regenerate types with `deno task generate:types` when needed.

## Folder Structure

```bash
bulk-ts-sdk/
  README.md
  deno.json
  deno.lock
  .env.example
  .gitignore
  docs/
    PRD.md
    TECH.md
    TEST.md
    coverage/
      lcov.info
  	references/
      openapi.yml
  scripts/
    fetch_openapi.ts
    generate_openapi_types.ts
    run_unit_integration_tests.ts
  src/
    mod.ts
    client.ts
    constants.ts
    errors.ts
    generated/
      openapi.ts
    types/
      index.ts
      common.ts
      market.ts
      account.ts
      trade.ts
      ws.ts
    http/
      index.ts
      http_transport.ts
      market_client.ts
      account_client.ts
      trade_client.ts
    ws/
      index.ts
      ws_client.ts
      subscriptions.ts
      messages.ts
      router.ts
      reconnect.ts
    signing/
      index.ts
      keychain_signer.ts
      normalize_signed_transaction.ts
    utils/      
  tests/
    unit/
    integration/
    e2e/
```
