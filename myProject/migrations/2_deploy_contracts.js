const RegistryContract = artifacts.require("RegistryContract");
const ProductContract = artifacts.require("ProductContract");
const TransferContract = artifacts.require("TransferContract");
const TraceContract = artifacts.require("TraceContract");

module.exports = async function (deployer, network, accounts) {
  const admin = accounts[0];

  // Step 1: Deploy RegistryContract
  await deployer.deploy(RegistryContract, admin);
  const registry = await RegistryContract.deployed();
  console.log("RegistryContract deployed at:", registry.address);

  // Step 2: Deploy ProductContract with Registry address
  await deployer.deploy(ProductContract, registry.address);
  const product = await ProductContract.deployed();
  console.log("ProductContract deployed at:", product.address);

  // Step 3: Deploy TransferContract with Registry + Product address
  await deployer.deploy(TransferContract, registry.address, product.address);
  const transfer = await TransferContract.deployed();
  console.log("TransferContract deployed at:", transfer.address);

  // Step 4: Deploy TraceContract with Registry + Product + Transfer address
  await deployer.deploy(TraceContract, registry.address, product.address, transfer.address);
  const trace = await TraceContract.deployed();
  console.log("TraceContract deployed at:", trace.address);

  // Step 5: Post-deployment setup
  console.log("Setting up contract permissions...");
  
  // Link TraceContract to TransferContract
  await transfer.setTraceContract(trace.address, { from: admin });
  console.log("TraceContract linked to TransferContract.");

  // Authorize TransferContract on ProductContract to move stock
  await product.setAuthorisedCaller(transfer.address, true, { from: admin });
  console.log("TransferContract authorized on ProductContract.");
};