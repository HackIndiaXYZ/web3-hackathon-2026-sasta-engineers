import { create } from 'zustand';
import { BrowserProvider, Eip1193Provider } from 'ethers';

interface WalletState {
  provider: BrowserProvider | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Actions
  setProvider: (provider: BrowserProvider) => void;
  setAddress: (address: string) => void;
  setChainId: (chainId: number) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  provider: null,
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,

  setProvider: (provider: BrowserProvider) => {
    set({ provider });
  },

  setAddress: (address: string) => {
    set({ address });
  },

  setChainId: (chainId: number) => {
    set({ chainId });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setConnecting: (connecting: boolean) => {
    set({ isConnecting: connecting });
  },

  disconnect: () => {
    set({
      provider: null,
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
    });
  },
}));

// Helper to check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).ethereum?.isMetaMask);
}

// Helper to get ethereum provider
export function getEthereumProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  return (window as any).ethereum || null;
}
