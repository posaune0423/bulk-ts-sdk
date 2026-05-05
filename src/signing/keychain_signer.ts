import { NativeKeypair, NativeSigner } from "bulk-keychain";
import { normalizeSignedTransaction } from "./normalize_signed_transaction.ts";
import type { KeychainOrderInput, SignedTransaction } from "../types/trade.ts";

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

export class KeychainSigner {
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

  sign(input: KeychainOrderInput): SignedTransaction {
    if (input.type === "agentWalletCreation") {
      const signed = (this.nativeSigner as NativeSignerWithAgentWallet).signAgentWallet(input.agent, input.remove);
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
    return Date.now() * 1000;
  }

  private assertCanSignTargetAccount(): void {
    if (this.targetAccountPublicKey && this.targetAccountPublicKey !== this.nativeSigner.pubkey) {
      throw new Error(
        "Signing for a separate accountPublicKey requires native bulk-keychain target-account signing support.",
      );
    }
  }
}
