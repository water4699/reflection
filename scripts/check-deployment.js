const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function checkDeployment(networkName = "localhost") {
  console.log(`Checking deployment on ${networkName}...`);

  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, "..", "deployments", networkName, "EncryptedHabitMoodTracker.json");

    if (!fs.existsSync(deploymentPath)) {
      console.error(`❌ Deployment file not found: ${deploymentPath}`);
      console.log("Please deploy the contract first using: npm run deploy:local");
      return;
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deployment.address;

    console.log(`✅ Contract deployed at: ${contractAddress}`);

    // Connect to network
    let provider;
    if (networkName === "localhost") {
      provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    } else {
      // For other networks, you would need to configure RPC URLs
      console.log("⚠️  Network checking not implemented for non-localhost networks");
      return;
    }

    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("❌ Contract not found on network");
      return;
    }

    console.log("✅ Contract code found on network");

    // Get network info
    const network = await provider.getNetwork();
    console.log(`📊 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Get latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`📈 Latest block: ${blockNumber}`);

    // Check contract basic functionality (if possible without signer)
    const contract = new ethers.Contract(
      contractAddress,
      [
        "function getDayCount(address user) external view returns (uint256)",
        "function recordExists(address user, uint256 dayIndex) external view returns (bool)",
      ],
      provider
    );

    // Test with zero address
    const zeroAddress = ethers.ZeroAddress;
    const dayCount = await contract.getDayCount(zeroAddress);
    console.log(`📊 Zero address day count: ${dayCount}`);

    console.log("✅ Deployment check completed successfully!");

    // Additional validation checks
    console.log("\n🔍 Additional Validation:");
    console.log("- Contract bytecode length:", code.length);
    console.log("- Deployment timestamp check available");
    console.log("- Network connectivity verified");

  } catch (error) {
    console.error("❌ Deployment check failed:", error.message);
    console.log("\n💡 Troubleshooting tips:");
    console.log("- Ensure the network is running (for localhost)");
    console.log("- Check deployment file exists and is valid JSON");
    console.log("- Verify contract address format");
  }
}

// Check command line arguments
const network = process.argv[2] || "localhost";
checkDeployment(network);






























