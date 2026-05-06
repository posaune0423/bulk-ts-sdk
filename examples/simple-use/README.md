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

Wallet environment variables:

```dotenv
MAIN_WALLET_PRIVATE_KEY=0x...
```

Set only `MAIN_WALLET_PRIVATE_KEY` when signing directly with the main wallet. If you adapt this example to use an agent
wallet for a main wallet, use the root `.env.example` pattern: set both `AGENT_WALLET_PRIVATE_KEY` and
`MAIN_WALLET_PUBLIC_KEY`.

Optional environment variables:

```dotenv
BULK_HTTP_URL=https://...
BULK_WS_URL=wss://...
BULK_SYMBOL=BTC-USD
```
