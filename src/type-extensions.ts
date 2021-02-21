import { ContractKit } from "@celo/contractkit";
import { ethers } from "ethers";
import "hardhat/types/runtime";

declare module "hardhat/types/runtime" {
  // Beware, adding new types to any hardhat type submodule is not a good practice in a Hardhat plugin.
  // Doing so increases the risk of a type clash with another plugin.
  interface HardhatRuntimeEnvironment {
    celo: {
      kit: ContractKit;
      ethersProvider: ethers.providers.BaseProvider;
      getSigners: () => readonly ethers.Signer[];
    };
  }
}
