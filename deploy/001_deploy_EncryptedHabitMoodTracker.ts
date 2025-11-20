import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying EncryptedHabitMoodTracker...");
  console.log("Deployer address:", deployer);

  const deployment = await deploy("EncryptedHabitMoodTracker", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("EncryptedHabitMoodTracker deployed to:", deployment.address);

};

func.tags = ["EncryptedHabitMoodTracker"];
export default func;

