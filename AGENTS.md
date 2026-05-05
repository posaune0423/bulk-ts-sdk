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

`test:coverage` runs unit and integration tests and writes coverage under `docs/coverage/` (`lcov.info` and `html/`).
Raw profile `*.json` files there are gitignored. See `docs/TEST.md`.

`update:docs` downloads the latest OpenAPI spec from Bulk docs into `docs/references/openapi.yml` (then run
`generate:types` if you regenerate SDK types).

## Test policy (minimum)

This repository is an SDK. The minimum test guarantee is:

- **E2E is the source of truth**: every Bulk API exposed by this SDK must be callable end-to-end via `tests/e2e/` using
  the public client surface.
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
  	references/
      openapi.yml
  scripts/
    fetch_openapi.ts
    generate_openapi_types.ts
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
