import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const getCurrentTime = async (): Promise<number> => {
  return (
    await hre.ethers.provider.getBlock(
      await hre.ethers.provider.getBlockNumber()
    )
  ).timestamp;
};

export const getCurrentBlockNumber = async (): Promise<number> => {
  return await hre.ethers.provider.getBlockNumber();
};

export const increaseTime = async (seconds: number) => {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
  await hre.network.provider.send("evm_mine");
};

export const mineBlock = async (timestamp?: number) => {
  if (typeof timestamp === "undefined") {
    await hre.network.provider.send("evm_mine");
  } else {
    await hre.network.provider.send("evm_mine", [timestamp]);
  }
};
