# TEST

testは`tests`以下に実装します。

```bash
tests/
  unit/
  integration/
  e2e/
```

e2e testは`.env`から実際のwalletを使用して署名・非署名の全てのendpointを実際に叩いてtestしてください。
endpoint coverage 100%を達成してください。

現在はbeta versionなのでtradeする際は1日1回faucetでもらえる10000USDのmockを使用してtradeなどを行います。
