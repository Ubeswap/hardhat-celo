import { TransactionReceipt } from "@ethersproject/providers";
import { ContractFactory, Signer } from "ethers";

type CFClass = (new (signer: Signer) => ContractFactory) & {
  connect: (address: string, signer: Signer) => unknown;
};

// https://stackoverflow.com/questions/63789897/typescript-remove-last-element-from-parameters-tuple-currying-away-last-argum
type Head<T extends any[]> = Required<T> extends [...infer H, any] ? H : never;

export type DeployCreate2 = <C extends CFClass>(
  name: string,
  args: {
    saltExtra?: string;
    signer: Signer;
    factory: C;
    args: C extends new (signer: Signer) => {
      deploy: (...args: infer A) => Promise<unknown>;
    }
      ? Head<A>
      : never;
  }
) => Promise<{
  txHash: string;
  address: string;
  receipt: TransactionReceipt;
  contract: C extends {
    connect: (address: string, signer: Signer) => infer Inst;
  }
    ? Inst
    : never;
}>;
