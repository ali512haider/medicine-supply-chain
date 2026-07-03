import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read deployed-addresses.json
const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

const contracts = [
  { name: "RegistryContract", address: addresses.RegistryContract },
  { name: "ProductContract", address: addresses.ProductContract },
  { name: "TransferContract", address: addresses.TransferContract },
  { name: "TraceContract", address: addresses.TraceContract }
];

const targetDir = path.join(__dirname, "..", "..", "src", "contracts");

contracts.forEach(({ name, address }) => {
  const filePath = path.join(targetDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const artifact = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // Inject the networks format like Truffle does
    artifact.networks = artifact.networks || {};
    artifact.networks["11155111"] = {
      events: {},
      links: {},
      address: address,
      transactionHash: ""
    };
    
    fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2), "utf8");
    console.log(`Injected Sepolia address into ${name}.json`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});
