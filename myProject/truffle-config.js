module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Ganache local host
      port: 7545,            // Ganache default port
      network_id: "5777",       // Match any network id
    }
  },

  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        viaIR: true
      }
    }
  }
};