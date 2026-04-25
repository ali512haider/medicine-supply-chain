module.exports = {
  networks: {
    development: {
      host: "localhost",     // Ganache local host
      port: 7545,            // Ganache default port
      network_id: "5777",       // Match any network id
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