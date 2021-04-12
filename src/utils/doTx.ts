import { ContractTransaction } from "ethers";
import { log } from "./logger";

export const doTx = async (
  action: string,
  tx: Promise<ContractTransaction>
): Promise<void> => {
  log(`Performing ${action}...`);
  const result = await (await tx).wait();
  log(`${action} done at tx ${result.transactionHash}`);
};
