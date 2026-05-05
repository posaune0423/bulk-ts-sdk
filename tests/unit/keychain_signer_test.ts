import { assertEquals, assertThrows } from "@std/assert";
import { toKeychainCancelAll, toKeychainLimitOrder } from "../../src/builders/orders.ts";
import { KeychainSigner } from "../../src/signing/keychain_signer.ts";
import { normalizeSignedTransaction } from "../../src/signing/normalize_signed_transaction.ts";
import type { KeychainOrderInput, SignedTransaction } from "../../src/types/trade.ts";

const DUMMY_PRIVATE_KEY = "J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1vPZ1J1";

type NativeSignerFixture = {
  pubkey: string;
  sign(input: KeychainOrderInput): SignedTransaction;
  signGroup(inputs: KeychainOrderInput[]): SignedTransaction;
  signAll(inputs: KeychainOrderInput[]): SignedTransaction[];
  signOrder(actions: KeychainOrderInput[], nonce: number): SignedTransaction;
};

function newSignerForNativeFixture(nativeSigner: NativeSignerFixture): KeychainSigner {
  const TestKeychainSigner = KeychainSigner as unknown as new (
    nativeSigner: NativeSignerFixture,
  ) => KeychainSigner;
  return new TestKeychainSigner(nativeSigner);
}

Deno.test("KeychainSigner - signs grouped actions with one nonce", () => {
  const signer = KeychainSigner.fromPrivateKey(DUMMY_PRIVATE_KEY);
  const order = toKeychainLimitOrder({
    symbol: "BTC-USD",
    side: "buy",
    price: 100000,
    size: 0.1,
  });
  const cancelAll = toKeychainCancelAll({ symbols: ["BTC-USD"] });

  const signed = signer.signGroup([order, cancelAll]);

  assertEquals(Array.isArray(signed.actions), true);
  assertEquals(signed.actions.length, 2);
  assertEquals(typeof signed.signature, "string");
  assertEquals(signed.account, signer.accountPublicKey);
  assertEquals(signed.signer, signer.accountPublicKey);
});

Deno.test("KeychainSigner - signs each action separately", () => {
  const signer = KeychainSigner.fromPrivateKey(DUMMY_PRIVATE_KEY);
  const first = toKeychainLimitOrder({
    symbol: "BTC-USD",
    side: "buy",
    price: 100000,
    size: 0.1,
  });
  const second = toKeychainLimitOrder({
    symbol: "ETH-USD",
    side: "sell",
    price: 5000,
    size: 1,
  });

  const signed = signer.signAll([first, second]);

  assertEquals(signed.length, 2);
  assertEquals(signed.every((tx) => Array.isArray(tx.actions)), true);
  assertEquals(signed.map((tx) => tx.actions.length), [1, 1]);
});

Deno.test("KeychainSigner - rejects agent wallet signing when native binding lacks support", () => {
  const signer = newSignerForNativeFixture({
    pubkey: "account",
    sign: () => {
      throw new Error("unused");
    },
    signGroup: () => {
      throw new Error("unused");
    },
    signAll: () => {
      throw new Error("unused");
    },
    signOrder: () => {
      throw new Error("unused");
    },
  });

  assertThrows(
    () => signer.sign({ type: "agentWalletCreation", agent: "agent-public-key", remove: false }),
    Error,
    "agent wallet signing",
  );
});

Deno.test("normalizeSignedTransaction - falls back to an empty action list for invalid encoded actions", () => {
  const normalized = normalizeSignedTransaction({
    actions: "not-json",
    nonce: 1,
    account: "account",
    signer: "signer",
    signature: "signature",
  });

  assertEquals(normalized.actions, []);
});
