import { NativeKeypair, NativeSigner } from "bulk-keychain";
import { normalizeSignedTransaction } from "./normalize_signed_transaction.ts";
import type { KeychainOrderInput, SignedTransaction } from "../types/trade.ts";

interface INativeSigner {
  pubkey: string;
  sign(input: KeychainOrderInput): SignedTransaction;
  signGroup(inputs: KeychainOrderInput[]): SignedTransaction;
  signAll(inputs: KeychainOrderInput[]): SignedTransaction[];
}

export class KeychainSigner {
  private constructor(private readonly nativeSigner: INativeSigner) {}

  static fromPrivateKey(privateKey: string): KeychainSigner {
    const keypair = NativeKeypair.fromBase58(privateKey);
    const nativeSigner = new NativeSigner(keypair);
    return new KeychainSigner(nativeSigner);
  }

  get account(): string {
    return this.nativeSigner.pubkey;
  }

  sign(input: KeychainOrderInput): SignedTransaction {
    return normalizeSignedTransaction(this.nativeSigner.sign(input));
  }

  signGroup(inputs: KeychainOrderInput[]): SignedTransaction {
    return normalizeSignedTransaction(this.nativeSigner.signGroup(inputs));
  }

  signAll(inputs: KeychainOrderInput[]): SignedTransaction[] {
    return this.nativeSigner.signAll(inputs).map(normalizeSignedTransaction);
  }
}
