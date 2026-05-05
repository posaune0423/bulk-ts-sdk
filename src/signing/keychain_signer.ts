import { NativeKeypair, NativeSigner } from "bulk-keychain";
import { normalizeSignedTransaction } from "./normalize_signed_transaction.ts";
import type { KeychainOrderInput, KeychainSignInput, SignedTransaction } from "../types/trade.ts";

interface INativeSigner {
  pubkey: string;
  sign(input: KeychainOrderInput): SignedTransaction;
  signGroup(inputs: KeychainOrderInput[]): SignedTransaction;
  signAll(inputs: KeychainOrderInput[]): SignedTransaction[];
  signOrder(
    actions: KeychainOrderInput[],
    nonce: number,
  ): SignedTransaction;
}

type NativeSignerWithAgentWallet = INativeSigner & {
  signAgentWallet(agent: string, remove: boolean): SignedTransaction;
};

function supportsAgentWalletSigning(signer: INativeSigner): signer is NativeSignerWithAgentWallet {
  return "signAgentWallet" in signer && typeof signer.signAgentWallet === "function";
}

export class KeychainSigner {
  private lastNonce = 0;

  private constructor(
    private readonly nativeSigner: INativeSigner,
    private readonly targetAccountPublicKey?: string,
  ) {}

  static fromPrivateKey(privateKey: string, targetAccountPublicKey?: string): KeychainSigner {
    const keypair = NativeKeypair.fromBase58(privateKey);
    const nativeSigner = new NativeSigner(keypair);
    return new KeychainSigner(nativeSigner, targetAccountPublicKey);
  }

  get accountPublicKey(): string {
    return this.targetAccountPublicKey ?? this.nativeSigner.pubkey;
  }

  sign(input: KeychainSignInput): SignedTransaction {
    if (input.type === "agentWalletCreation") {
      if (!supportsAgentWalletSigning(this.nativeSigner)) {
        throw new Error("Native bulk-keychain signer does not support agent wallet signing.");
      }
      const signed = this.nativeSigner.signAgentWallet(input.agent, input.remove);
      return normalizeSignedTransaction(signed);
    }

    return this.signActions([input]);
  }

  signGroup(inputs: KeychainOrderInput[]): SignedTransaction {
    return this.signActions(inputs);
  }

  signAll(inputs: KeychainOrderInput[]): SignedTransaction[] {
    this.assertCanSignTargetAccount();
    return this.nativeSigner.signAll(inputs).map(normalizeSignedTransaction);
  }

  private signActions(actions: KeychainOrderInput[]): SignedTransaction {
    this.assertCanSignTargetAccount();
    const signed = this.nativeSigner.signOrder(
      actions,
      this.nextNonce(),
    );
    return normalizeSignedTransaction(signed);
  }

  private nextNonce(): number {
    const nonce = Date.now() * 1000;
    this.lastNonce = nonce <= this.lastNonce ? this.lastNonce + 1 : nonce;
    return this.lastNonce;
  }

  private assertCanSignTargetAccount(): void {
    if (this.targetAccountPublicKey && this.targetAccountPublicKey !== this.nativeSigner.pubkey) {
      throw new Error(
        "Signing for a separate accountPublicKey requires native bulk-keychain target-account signing support.",
      );
    }
  }
}
