// From https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/truffle-config.js#L64
export enum ICeloNetwork {
  MAINNET = 42220,
  ALFAJORES = 44787,
  BAKLAVA = 62320,
}

export const parseNetwork = (
  chainId: number = ICeloNetwork.MAINNET
): ICeloNetwork => {
  if (!Object.values(ICeloNetwork).includes(chainId)) {
    throw new Error(`Unknown Celo chain ID: ${chainId}`);
  }
  return chainId as ICeloNetwork;
};

export const fornoURLs: { [K in ICeloNetwork]: string } = {
  [ICeloNetwork.ALFAJORES]: "https://alfajores-forno.celo-testnet.org",
  [ICeloNetwork.BAKLAVA]: "https://baklava-forno.celo-testnet.org",
  [ICeloNetwork.MAINNET]: "https://forno.celo.org",
} as const;

export const networkNames: { [K in ICeloNetwork]: string } = {
  [ICeloNetwork.ALFAJORES]: "alfajores",
  [ICeloNetwork.BAKLAVA]: "baklava",
  [ICeloNetwork.MAINNET]: "mainnet",
} as const;
