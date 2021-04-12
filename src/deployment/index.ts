import "@nomiclabs/hardhat-ethers";
import {
  deployContract,
  deployCreate2,
} from "@ubeswap/solidity-create2-deployer";
import { ethers, Signer, utils } from "ethers";
import * as fs from "fs/promises";
import { mkdir } from "fs/promises";
import { ActionType, HardhatRuntimeEnvironment } from "hardhat/types";
import { ICeloNetwork, networkNames } from "../networks";
import { DeployCreate2 } from "../utils/deployCreate2";
import { log } from "../utils/logger";

type GetAddressesFn<K extends string, M extends DeployerMap<K>> = (
  ...keys: readonly K[]
) => IAllResults<K, M>;

/**
 * A function that deploys things
 */
export type DeployerFn<R> = <K extends string, M extends DeployerMap<K>>(args: {
  /**
   * Provider for fetching data
   */
  provider: ethers.providers.BaseProvider;
  /**
   * The first wallet
   */
  deployer: Signer;
  /**
   * Get addresses of previous deployments.
   */
  getAddresses: GetAddressesFn<K, M>;
  /**
   * The salt. This can also be set in `process.env.SALT`.
   */
  salt?: string;
  /**
   * Allows deploying a contract deterministically.
   */
  deployCreate2: DeployCreate2;
}) => Promise<R>;

type AsyncReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => Promise<infer U>
  ? U
  : T extends (...args: any) => infer U
  ? U
  : any;

// https://fettblog.eu/typescript-union-to-intersection/
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never;

/**
 * Gets the type of the results of the given steps.
 */
export type IAllResults<
  K extends string,
  M extends DeployerMap<K>
> = UnionToIntersection<AsyncReturnType<M[K]>>;

const makeConfigPath = (step: string, chainId: ICeloNetwork): string =>
  __dirname +
  `/../../deployments/${step}.${networkNames[chainId]}.addresses.json`;

const writeDeployment = async (
  step: string,
  chainId: ICeloNetwork,
  addresses: Record<string, unknown>
): Promise<void> => {
  const configPath = makeConfigPath(step, chainId);
  Object.entries(addresses).forEach(([name, addr]) =>
    console.log(
      `${name}: ${
        typeof addr === "string" ? addr : JSON.stringify(addr, null, 2)
      }`
    )
  );
  await fs.writeFile(configPath, JSON.stringify(addresses, null, 2));
};

/**
 * Makes an environment for either Ethers.js or hardhat-celo, based on the chain
 * id of the env.
 * @param env The current hardhat runtime environment
 * @returns
 */
export const makeCommonEnvironment = async (
  env: HardhatRuntimeEnvironment
): Promise<{
  signer: Signer;
  provider: ethers.providers.BaseProvider;
}> => {
  if (env.network.config.chainId === 31337) {
    const [deployerSigner] = await env.ethers.getSigners();
    if (!deployerSigner) {
      throw new Error("No deployer.");
    }
    return { signer: deployerSigner, provider: env.ethers.provider };
  } else {
    const [deployerSigner] = env.celo.getSigners();
    if (!deployerSigner) {
      throw new Error("No deployer.");
    }
    return { signer: deployerSigner, provider: env.celo.ethersProvider };
  }
};

export type DeployerMap<K extends string> = {
  [step in K]: DeployerFn<unknown>;
};

const defaultSalt =
  process.env.SALT ?? `${utils.hexlify(utils.randomBytes(32))}`;

/**
 * Makes the deploy task
 * @param param0
 * @returns
 */
export const makeDeployTask = <K extends string, M extends DeployerMap<K>>({
  salt = defaultSalt,
  deployers,
}: {
  salt?: string;
  deployers: M;
}): ActionType<{ step: K }> => async ({ step }, env) => {
  if (!process.env.SALT) {
    console.warn(
      `Warning: salt or process.env.SALT not specified; using a random salt (${defaultSalt})`
    );
  }

  const deploymentsDir = `${env.config.paths.root}/deployments`;
  console.log("Creating deployments directory at", deploymentsDir);
  await mkdir(deploymentsDir);

  const chainId = (await env.celo.kit.connection.chainId()) as ICeloNetwork;
  const deployer = deployers[step];
  if (!deployer) {
    throw new Error(`Unknown step: ${step}`);
  }

  const { signer, provider } = await makeCommonEnvironment(env);

  const theDeployCreate2 = (async (name, { signer, factory, args }) => {
    log(`Deploying ${name}...`);
    const result = await deployCreate2({ signer, factory, args, salt });
    log(`Deployed at ${result.address} (tx: ${result.txHash})`);
    return result;
  }) as DeployCreate2;

  const result = await deployer({
    deployer: signer,
    provider,
    getAddresses: (...keys: readonly K[]) =>
      ({
        ...keys.reduce(
          (acc: Record<string, unknown>, k: K) => ({
            ...acc,
            ...require(`${deploymentsDir}/${k}.${networkNames[chainId]}.addresses.json`),
          }),
          {}
        ),
      } as IAllResults<K, M>),
    salt,
    deployCreate2: theDeployCreate2,
  });
  await writeDeployment(step, chainId, result as Record<string, unknown>);
};

export { deployCreate2, deployContract };
