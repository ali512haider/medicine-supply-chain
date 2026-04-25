const RegistryContract  = artifacts.require("RegistryContract");
const ProductContract   = artifacts.require("ProductContract");
const TransferContract  = artifacts.require("TransferContract");
const TraceContract     = artifacts.require("TraceContract");

module.exports = async function (deployer, network, accounts) {
  const admin = accounts[0];

  // Step 1: Deploy RegistryContract (must be first — all others depend on it)
  await deployer.deploy(RegistryContract, admin);
  const registry = await RegistryContract.deployed();
  console.log("RegistryContract deployed at:", registry.address);

  // Step 2: Deploy ProductContract
  await deployer.deploy(ProductContract, registry.address);
  const product = await ProductContract.deployed();
  console.log("ProductContract deployed at:", product.address);

  // Step 3: Deploy TransferContract (needs registry + product)
  await deployer.deploy(TransferContract, registry.address, product.address);
  const transfer = await TransferContract.deployed();
  console.log("TransferContract deployed at:", transfer.address);

  // Step 4: Deploy TraceContract (needs registry + product + transfer)
  await deployer.deploy(TraceContract, registry.address, product.address, transfer.address);
  const trace = await TraceContract.deployed();
  console.log("TraceContract deployed at:", trace.address);

  // Step 5: Post-deploy linking
  console.log("Linking contracts...");

  // Give TransferContract permission to adjust stock in ProductContract
  await product.setAuthorisedCaller(transfer.address, true, { from: admin });
  console.log("TransferContract authorised in ProductContract.");

  // Link TraceContract into TransferContract (can only be set once)
  await transfer.setTraceContract(trace.address, { from: admin });
  console.log("TraceContract linked to TransferContract.");

  console.log("\n=== Deployment Complete ===");
  console.log("Registry :", registry.address);
  console.log("Product  :", product.address);
  console.log("Transfer :", transfer.address);
  console.log("Trace    :", trace.address);
  console.log("Admin    :", admin);
};