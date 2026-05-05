import { assertEquals, assertThrows } from "@std/assert";
import { toKeychainMarketOrder } from "../src/builders/orders.ts";
import { KeychainSigner } from "../src/signing/keychain_signer.ts";
import type { KeychainOrderInput } from "../src/types/trade.ts";

const dummyPrivateKey = "J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1";
const signer = KeychainSigner.fromPrivateKey(dummyPrivateKey);

const legacyMarketOrder = {
  type: "order",
  symbol: "BTC-USD",
  isBuy: false,
  size: 0.1,
  reduceOnly: true,
  iso: false,
  orderType: {
    type: "market",
  },
} as unknown as KeychainOrderInput;

const legacyError = assertThrows(
  () => signer.sign(legacyMarketOrder),
  Error,
  "order.price is required",
);

const marketOrder = toKeychainMarketOrder({
  symbol: "BTC-USD",
  side: "sell",
  size: 0.1,
  reduceOnly: true,
});
const signed = signer.sign(marketOrder);

assertEquals(signed.actions, [
  {
    m: {
      c: "BTC-USD",
      b: false,
      sz: 0.1,
      r: true,
      i: false,
    },
  },
]);

console.log("legacy market order error:", legacyError.message);
console.log("fixed market order keychain input:", JSON.stringify(marketOrder));
console.log("fixed signed API actions:", JSON.stringify(signed.actions));
