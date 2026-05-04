# PRD

bulk-ts-sdkはbulk tradeのapiをTypescriptで安全に扱うためのUnofficial SDKです。

公開されている[API仕様](./references/openai.yml)の全てのAPIをcoverします。

## Tips

`POST /order` などのsignが必要なtxには専用のlibrary: [bulk-keychain](https://github.com/Bulk-trade/bulk-keychain)を使用します。

e.g.

```ts
import { NativeKeypair, NativeSigner, randomHash } from 'bulk-keychain'

// Generate or import keypair
const keypair = new NativeKeypair()
// Or: NativeKeypair.fromBase58('your-secret-key...')

// Create signer
const signer = new NativeSigner(keypair)

// Sign a single order
const signed = signer.sign({
  type: 'order',
  symbol: 'BTC-USD',
  isBuy: true,
  price: 100000,
  size: 0.1,
  orderType: { type: 'limit', tif: 'GTC' },
})

// Submit to API
await fetch('https://api.bulk.exchange/api/v1/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    actions: JSON.parse(signed.actions),
    nonce: signed.nonce,
    account: signed.account,
    signer: signed.signer,
    signature: signed.signature,
  }),
})
```
