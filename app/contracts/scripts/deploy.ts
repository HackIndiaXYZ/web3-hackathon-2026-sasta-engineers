import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying CredentialRegistry contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Deploy contract
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy();

  await credentialRegistry.waitForDeployment();

  const contractAddress = await credentialRegistry.getAddress();

  console.log("✅ CredentialRegistry deployed to:", contractAddress);
  console.log("🔗 Network:", (await ethers.provider.getNetwork()).name);
  console.log("⛽ Gas used:", (await ethers.provider.getTransactionReceipt(credentialRegistry.deploymentTransaction()!.hash))?.gasUsed.toString());

  // Verify deployer has admin role
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const hasAdminRole = await credentialRegistry.hasRole(ADMIN_ROLE, deployer.address);
  console.log("\n👤 Deployer has admin role:", hasAdminRole);

  console.log("\n📋 Contract Details:");
  console.log("   - Contract Address:", contractAddress);
  console.log("   - Admin Address:", deployer.address);
  console.log("   - Paused:", await credentialRegistry.paused());

  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Update backend .env with CONTRACT_ADDRESS:", contractAddress);
  console.log("   2. Verify contract on PolygonScan:");
  console.log("      npx hardhat verify --network <network>", contractAddress);
  console.log("   3. Add issuer addresses using addIssuer() function");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
