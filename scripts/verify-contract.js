const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  const network = hre.network.name;
  console.log(`Verifying contract on ${network}...`);

  try {
    // Get deployment info
    const deployment = await hre.deployments.get("EncryptedHabitMoodTracker");
    const contractAddress = deployment.address;

    console.log(`Contract address: ${contractAddress}`);

    // Verify contract on Etherscan-like explorer
    if (network === "sepolia" || network === "mainnet") {
      console.log("Verifying contract on Etherscan...");

      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });

      console.log("✅ Contract verified successfully!");
    } else {
      console.log("⚠️  Contract verification only available on live networks");
    }

    // Test basic contract functionality
    console.log("Testing basic contract functionality...");
    const contract = await hre.ethers.getContractAt("EncryptedHabitMoodTracker", contractAddress);

    // Test day count for deployer
    const deployer = (await hre.ethers.getSigners())[0];
    const dayCount = await contract.getDayCount(deployer.address);
    console.log(`Deployer day count: ${dayCount}`);

    console.log("✅ Contract verification and basic tests completed!");

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

































