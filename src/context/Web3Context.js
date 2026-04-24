import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  REGISTRY_ADDRESS, PRODUCT_ADDRESS, TRANSFER_ADDRESS, TRACE_ADDRESS,
  REGISTRY_ABI, PRODUCT_ABI, TRANSFER_ABI, TRACE_ABI
} from '../config/contracts';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, error
  const [contracts, setContracts] = useState({
    registry: null,
    product: null,
    transfer: null,
    trace: null
  });

  const ROLE_NAMES = {
    0: 'None',
    1: 'Admin',
    2: 'Manufacturer',
    3: 'Distributor',
    4: 'Supplier',
    5: 'Pharmacist'
  };

  const initContracts = async (signerOrProvider) => {
    if (!REGISTRY_ADDRESS) return null;
    
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signerOrProvider);
    const product  = PRODUCT_ADDRESS  ? new ethers.Contract(PRODUCT_ADDRESS,  PRODUCT_ABI,  signerOrProvider) : null;
    const transfer = TRANSFER_ADDRESS ? new ethers.Contract(TRANSFER_ADDRESS, TRANSFER_ABI, signerOrProvider) : null;
    const trace    = TRACE_ADDRESS    ? new ethers.Contract(TRACE_ADDRESS,    TRACE_ABI,    signerOrProvider) : null;
    
    setContracts({ registry, product, transfer, trace });
    return registry;
  };

  const fetchRole = async (registryContract, address) => {
    try {
      const roleId = await registryContract.getRole(address);
      setRole(ROLE_NAMES[Number(roleId)] || 'None');
    } catch (err) {
      console.error("Error fetching role", err);
      setRole('None');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      setStatus('connecting');
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      
      const registry = await initContracts(web3Signer);
      if (registry) {
        await fetchRole(registry, accounts[0]);
      }
      setStatus('connected');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setRole(null);
    setSigner(null);
    setStatus('idle');
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (contracts.registry) {
             fetchRole(contracts.registry, accounts[0]);
          }
        } else {
          disconnectWallet();
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, [contracts.registry]);

  return (
    <Web3Context.Provider value={{
      provider, signer, account, role, status, contracts, connectWallet, disconnectWallet
    }}>
      {children}
    </Web3Context.Provider>
  );
};
