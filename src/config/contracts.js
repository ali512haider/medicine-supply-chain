import RegistryABI from '../contracts/RegistryContract.json';
import ProductABI  from '../contracts/ProductContract.json';
import TransferABI from '../contracts/TransferContract.json';
import TraceABI    from '../contracts/TraceContract.json';

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
export const TRANSFER_ADDRESS  = getAddress(TransferABI);
export const TRACE_ADDRESS     = getAddress(TraceABI);

export const REGISTRY_ABI  = RegistryABI.abi;
export const PRODUCT_ABI   = ProductABI.abi;
export const TRANSFER_ABI  = TransferABI.abi;
export const TRACE_ABI     = TraceABI.abi;
