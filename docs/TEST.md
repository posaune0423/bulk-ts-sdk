# TEST

testは`tests`以下に実装します。

## Coverage（unit + integration）

`deno task test:coverage` で `docs/coverage/` を更新する。機械可読の SSOT は `lcov.info`、ブラウザ用レポートは
`html/index.html`。Deno が吐く生プロファイル（`*.json`）は `.gitignore` し、上記だけコミットする想定。

```bash
tests/
  unit/
  integration/
  e2e/
```

e2e testは`.env`から実際のwalletを使用して、applicationで実際に使うPublic SDK endpointを実際に叩いてtestしてください。

現在はbeta versionなのでtradeする際は1日1回faucetでもらえる10000USDのmockを使用してtradeなどを行います。

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
