import RegistryABI from '../contracts/RegistryContract.json';
import ProductABI  from '../contracts/ProductContract.json';

const getAddress = (artifact) => {
  if (!artifact || !artifact.networks) return null;
  const networks = Object.keys(artifact.networks);
  if (networks.length > 0) {
    const networkId = networks.includes('5777') ? '5777' : networks[0];
    return artifact.networks[networkId]?.address || null;
  }
  return null;
};

export const REGISTRY_ADDRESS  = getAddress(RegistryABI);
export const PRODUCT_ADDRESS   = getAddress(ProductABI);
export const TRANSFER_ADDRESS  = null;
export const TRACE_ADDRESS     = null;

export const REGISTRY_ABI  = RegistryABI.abi;
export const PRODUCT_ABI   = ProductABI.abi;
export const TRANSFER_ABI  = [];
export const TRACE_ABI     = [];
