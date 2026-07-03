import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Step 1: Deploy RegistryContract
  console.log("\n--- Deploying RegistryContract ---");
  const RegistryContract = await hre.ethers.getContractFactory("RegistryContract");
  const registry = await RegistryContract.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("RegistryContract deployed at:", registryAddr);

  // Step 2: Deploy ProductContract
  console.log("\n--- Deploying ProductContract ---");
  const ProductContract = await hre.ethers.getContractFactory("ProductContract");
  const product = await ProductContract.deploy(registryAddr);
  await product.waitForDeployment();
  const productAddr = await product.getAddress();
  console.log("ProductContract deployed at:", productAddr);

  // Step 3: Deploy TransferContract
  console.log("\n--- Deploying TransferContract ---");
  const TransferContract = await hre.ethers.getContractFactory("TransferContract");
  const transfer = await TransferContract.deploy(registryAddr, productAddr);
  await transfer.waitForDeployment();
  const transferAddr = await transfer.getAddress();
  console.log("TransferContract deployed at:", transferAddr);

  // Step 4: Deploy TraceContract
  console.log("\n--- Deploying TraceContract ---");
  const TraceContract = await hre.ethers.getContractFactory("TraceContract");
  const trace = await TraceContract.deploy(registryAddr, productAddr, transferAddr);
  await trace.waitForDeployment();
  const traceAddr = await trace.getAddress();
  console.log("TraceContract deployed at:", traceAddr);

  // Step 5: Post-deploy linking
  console.log("\n--- Linking contracts ---");
  const authTx = await product.setAuthorisedCaller(transferAddr, true);
  await authTx.wait();
  console.log("TransferContract authorised in ProductContract.");

  const traceTx = await transfer.setTraceContract(traceAddr);
  await traceTx.wait();
  console.log("TraceContract linked to TransferContract.");

  console.log("\n=== Deployment Complete ===");
  console.log("Registry :", registryAddr);
  console.log("Product  :", productAddr);
  console.log("Transfer :", transferAddr);
  console.log("Trace    :", traceAddr);
  console.log("Admin    :", deployer.address);

  // Save addresses to a JSON file for reference
  const addresses = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    RegistryContract: registryAddr,
    ProductContract: productAddr,
    TransferContract: transferAddr,
    TraceContract: traceAddr,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to:", outPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
