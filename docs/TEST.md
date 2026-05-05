# TEST

testは`tests`以下に実装します。

## Coverage（unit + integration）

`deno task test`（または同等の `deno task test:coverage`）で unit + integration を実行し、`docs/coverage/` を更新する。
出力先は **`deno.json` の `coverageDirectory`**（デフォルト相当は `docs/coverage`）。**Git に乗せるのは `lcov.info` と
`html/index.html` のみ**。ブラウザ用の `html/` はファイル数が多いので entrypoint 以外を **`.gitignore`** する。生の
`*.json` プロファイルも無視する。

```bash
tests/
  unit/
  integration/
  e2e/
```

e2e testは`.env`から実際のwalletを使用して、applicationで実際に使うPublic SDK endpointを実際に叩いてtestしてください。

現在はbeta versionなのでtradeする際は1日1回faucetでもらえる10000USDのmockを使用してtradeなどを行います。

## E2E environment

| Env                        | Required | Purpose                                                                    |
| -------------------------- | -------- | -------------------------------------------------------------------------- |
| `PRIVATE_KEY`              | Yes      | Main wallet private key. Used by the standard App endpoint E2E client.     |
| `AGENT_WALLET_PRIVATE_KEY` | No       | Agent wallet private key. Use only for agent-wallet-specific tests.        |
| `MULTISIG_PUBKEY`          | No       | Existing multisig account pubkey for `multisigProposals` success-path E2E. |

In SDK config, `privateKey` is always the signing key. `accountPublicKey` is only needed when `privateKey` is an agent
wallet key and the client should act on behalf of a main account. Target-account order signing must be supported by the
native `bulk-keychain` binding; otherwise the SDK fails locally before submitting a bad signature.

## App endpoint E2E coverage

E2E必須対象は、通常のapplication機能で使うPublic SDK endpointに限定する。

| Endpoint                           | Public SDK method                          | E2E                         |
| ---------------------------------- | ------------------------------------------ | --------------------------- |
| `GET /exchangeInfo`                | `client.market.exchangeInfo()`             | `tests/e2e/market_test.ts`  |
| `GET /ticker/{symbol}`             | `client.market.ticker(symbol)`             | `tests/e2e/market_test.ts`  |
| `GET /klines`                      | `client.market.klines(params)`             | `tests/e2e/market_test.ts`  |
| `GET /l2book`                      | `client.market.l2Book(params)`             | `tests/e2e/market_test.ts`  |
| `GET /stats`                       | `client.market.stats(params)`              | `tests/e2e/market_test.ts`  |
| `GET /riskSurfaces`                | `client.market.riskSurfaces(market)`       | `tests/e2e/market_test.ts`  |
| `POST /account`                    | `client.account.fullAccount(user)`         | `tests/e2e/account_test.ts` |
| `POST /account`                    | `client.account.openOrders(user)`          | `tests/e2e/account_test.ts` |
| `POST /account`                    | `client.account.fills(user)`               | `tests/e2e/account_test.ts` |
| `POST /account`                    | `client.account.positions(user)`           | `tests/e2e/account_test.ts` |
| `POST /account`                    | `client.account.fundingHistory(user)`      | `tests/e2e/account_test.ts` |
| `POST /account`                    | `client.account.orderHistory(user)`        | `tests/e2e/account_test.ts` |
| `POST /account`                    | `client.account.feeTier(user)`             | `tests/e2e/account_test.ts` |
| `GET /feeState`                    | `client.account.feeState()`                | `tests/e2e/account_test.ts` |
| `GET /multisig/{pubkey}/proposals` | `client.account.multisigProposals(pubkey)` | `tests/e2e/account_test.ts` |
| `POST /order`                      | `client.trade.*`                           | `tests/e2e/trade_test.ts`   |

`GET /multisig/{pubkey}/proposals` は実multisig pubkeyがないと404になり得るため、`MULTISIG_PUBKEY`
が設定されている場合だけ成功系を実行する。未設定の場合はテスト内でskip理由を出してreturnする。

## Excluded operational endpoints

以下は運用・検証系endpointなのでApp endpoint E2E必須対象外。SDK methodとしては残す。

| Endpoint       | Public SDK method         |
| -------------- | ------------------------- |
| `GET /metrics` | `client.market.metrics()` |
| `GET /verify`  | `client.market.verify()`  |
