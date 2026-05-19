import { BrowserProvider, Contract, formatEther } from 'ethers';
import { getEthereumProvider } from '@/store/wallet.store';
import { BlockchainCredential } from '@/types';

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80002');
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Simplified ABI - only the functions we need
const CONTRACT_ABI = [
  'function verifyCredential(bytes32 credentialHash) view returns (bool exists, bool revoked, address issuer, address student)',
  'function getCredential(bytes32 credentialHash) view returns (bytes32, address, address, uint256, bool, string)',
  'function isIssuer(address account) view returns (bool)',
];

export const walletService = {
  // Check if MetaMask is installed
  isMetaMaskInstalled(): boolean {
    return Boolean(getEthereumProvider());
  },

  // Connect wallet
  async connectWallet(): Promise<{ provider: BrowserProvider; address: string; chainId: number }> {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0] as string;

      // Create provider
      const provider = new BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      return { provider, address, chainId };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  },

  // Switch to correct network
  async switchNetwork(targetChainId: number = CHAIN_ID): Promise<void> {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain not added, try to add it
      if (error.code === 4902) {
        await this.addNetwork(targetChainId);
      } else {
        throw error;
      }
    }
  },

  // Add network to MetaMask
  async addNetwork(chainId: number): Promise<void> {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const networks: Record<number, any> = {
      80002: {
        chainId: '0x13882',
        chainName: 'Polygon Amoy Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-amoy.polygon.technology/'],
        blockExplorerUrls: ['https://amoy.polygonscan.com/'],
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
      },
    };

    const networkConfig = networks[chainId];
    if (!networkConfig) {
      throw new Error('Unsupported network');
    }

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig],
    });
  },

  // Sign message for authentication
  async signMessage(provider: BrowserProvider, message: string): Promise<string> {
    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  },

  // Get wallet balance
  async getBalance(provider: BrowserProvider, address: string): Promise<string> {
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  },

  // Verify credential on blockchain
  async verifyCredentialOnChain(
    provider: BrowserProvider,
    credentialHash: string
  ): Promise<{
    exists: boolean;
    revoked: boolean;
    issuer: string;
    student: string;
  }> {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const result = await contract.verifyCredential(credentialHash);

    return {
      exists: result[0],
      revoked: result[1],
      issuer: result[2],
      student: result[3],
    };
  },

  // Get credential details from blockchain
  async getCredentialFromChain(
    provider: BrowserProvider,
    credentialHash: string
  ): Promise<BlockchainCredential> {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const result = await contract.getCredential(credentialHash);

    return {
      credentialHash: result[0],
      issuer: result[1],
      student: result[2],
      issuedAt: Number(result[3]),
      revoked: result[4],
      metadataURI: result[5],
    };
  },

  // Check if address is an issuer
  async isIssuer(provider: BrowserProvider, address: string): Promise<boolean> {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    return await contract.isIssuer(address);
  },

  // Listen to account changes
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    const ethereum = getEthereumProvider();
    if (ethereum) {
      ethereum.on('accountsChanged', callback);
    }
  },

  // Listen to chain changes
  onChainChanged(callback: (chainId: string) => void): void {
    const ethereum = getEthereumProvider();
    if (ethereum) {
      ethereum.on('chainChanged', callback);
    }
  },

  // Remove listeners
  removeListeners(): void {
    const ethereum = getEthereumProvider();
    if (ethereum) {
      ethereum.removeAllListeners('accountsChanged');
      ethereum.removeAllListeners('chainChanged');
    }
  },
};
