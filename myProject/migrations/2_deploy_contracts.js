const RegistryContract = artifacts.require("RegistryContract");
const ProductContract = artifacts.require("ProductContract");
const TransferContract = artifacts.require("TransferContract");

module.exports = async function (deployer) {

  // Step 1: Deploy RegistryContract
  await deployer.deploy(RegistryContract);
  const registry = await RegistryContract.deployed();

  console.log("RegistryContract deployed at:", registry.address);

  // Step 2: Deploy ProductContract with Registry address
  await deployer.deploy(ProductContract, registry.address);
  const product = await ProductContract.deployed();

  console.log("ProductContract deployed at:", product.address);

  // Step 3: Deploy TransferContract with Registry + Product address
  await deployer.deploy(
    TransferContract,
    registry.address,
    product.address
  );

  const transfer = await TransferContract.deployed();

  console.log("TransferContract deployed at:", transfer.address);
};