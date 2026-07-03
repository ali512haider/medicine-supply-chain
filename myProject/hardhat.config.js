import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

// Derive private key from mnemonic using ethers v6
function getPrivateKey() {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) throw new Error("MNEMONIC not set in .env");
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  return wallet.privateKey;
}

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
    },
  },
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: [getPrivateKey()],
      chainId: 11155111,
      // Removed hardcoded gas and gasPrice so Hardhat automatically estimates
      // them based on network state, which saves transaction fees and requires less upfront balance.
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./build/hardhat-artifacts",
    cache: "./build/hardhat-cache",
  },
};
