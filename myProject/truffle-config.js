require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "5777",
    },
    sepolia: {
      provider: () => new HDWalletProvider({
        mnemonic: {
          phrase: process.env.MNEMONIC
        },
        providerOrUrl: process.env.ALCHEMY_SEPOLIA_URL,
        pollingInterval: 15000,   // Poll every 15s to avoid BlockTracker crash
      }),
      network_id: 11155111,       // Sepolia chain ID
      gas: 5500000,
      gasPrice: 25000000000,      // 25 gwei (slightly above base to ensure inclusion)
      confirmations: 1,           // Reduced from 2 for faster deployment
      timeoutBlocks: 400,
      networkCheckTimeout: 180000, // 3 minute timeout for slow RPC
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        evmVersion: "paris",
        optimizer: {
          enabled: true,
          runs: 1
        },
        viaIR: true
      }
    }
  }
};
