import { CeloProvider, CeloWallet } from "@celo-tools/celo-ethers-wrapper";
import { CeloContract, newKitFromWeb3 } from "@celo/contractkit";
import HDWalletProvider from "@truffle/hdwallet-provider";
import { BigNumber } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatNetworkHDAccountsConfig } from "hardhat/types";
import Web3 from "web3";
import { fornoURLs, parseNetwork } from "./networks";
export * from "./networks";

export const derivationPath = "m/44'/52752'/0'/0/";

extendEnvironment((hre) => {
  hre.celo = lazyObject(() => {
    const { networks } = hre.config;
    const currentNetwork = networks[hre.network.name];
    const network = parseNetwork(hre.network.config.chainId);

    // TODO(igm): support more than HD wallets
    const accountsCfg = currentNetwork?.accounts as HardhatNetworkHDAccountsConfig;
    const hdNode = HDNode.fromMnemonic(accountsCfg.mnemonic);

    const provider = new HDWalletProvider({
      mnemonic: accountsCfg.mnemonic,
      providerOrUrl: fornoURLs[network],
      numberOfAddresses: accountsCfg.count,
      derivationPath,
    });
    const web3 = new Web3(provider);
    const kit = newKitFromWeb3(web3);
    kit.setFeeCurrency(CeloContract.GoldToken);

    console.log(`Using network:`, fornoURLs[network]);
    const ethersProvider = new CeloProvider(fornoURLs[network], network);

    // gasPrice/gas overrides
    const { gasPrice, gas } = hre.network.config;
    if (typeof gasPrice === "number") {
      ethersProvider.getGasPrice = async () => BigNumber.from(gasPrice);
    }
    if (typeof gas === "number") {
      ethersProvider.estimateGas = async () => BigNumber.from(gas);
    }

    const getSigners = () =>
      Array(accountsCfg.count)
        .fill(null)
        .map((_, i) => {
          const { privateKey, address } = hdNode.derivePath(
            `${derivationPath}${i}`
          );
          return new CeloWallet(
            {
              privateKey,
              address,
            },
            ethersProvider
          );
        });

    return {
      kit,
      ethersProvider,
      getSigners,
    };
  });
});
