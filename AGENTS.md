# Project Instruction

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code. YAGNI, KISS, DRY. No backward-compat shims or fallback paths unless they come free without adding cyclomatic complexity.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

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
  	references/
      openapi.yml
  scripts/
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
