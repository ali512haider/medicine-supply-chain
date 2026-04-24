const RegistryContract = artifacts.require("RegistryContract");
const ProductContract  = artifacts.require("ProductContract");

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
};