# bulk-ts-sdk simple npm use

This example is a separate npm project that consumes the published `bulk-ts-sdk` package from npm.

```bash
bun install
cp .env.example .env
bun run check
bun start
```

Runtime scripts load `./.env`.

Available scripts:

```bash
bun run get-market
bun run market
bun run account
bun run trade
bun run ws
```

Optional environment variables:

```dotenv
PRIVATE_KEY=0x...
BULK_HTTP_URL=https://...
BULK_WS_URL=wss://...
BULK_SYMBOL=BTC-USD
```
