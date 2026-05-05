# bulk-ts-sdk simple npm use

This example is a separate npm project that consumes the published `bulk-ts-sdk` package from npm.

```bash
bun install
bun run check
bun start
```

Available scripts:

```bash
bun run get-market
bun run market
BULK_PRIVATE_KEY=0x... bun run account
BULK_PRIVATE_KEY=0x... bun run trade
bun run ws
```

Optional environment variables:

```bash
BULK_HTTP_URL=https://... BULK_WS_URL=wss://... BULK_SYMBOL=BTC-USD bun start
```
