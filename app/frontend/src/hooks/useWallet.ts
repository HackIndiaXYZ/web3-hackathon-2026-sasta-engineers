import { useEffect } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/services/wallet.service';
import { useWalletStore } from '@/store/wallet.store';

const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80002');

export function useWallet() {
  const {
    provider,
    address,
    chainId,
    isConnected,
    isConnecting,
    setProvider,
    setAddress,
    setChainId,
    setConnected,
    setConnecting,
    disconnect,
  } = useWalletStore();

  // Connect wallet
  const connect = async () => {
    if (!walletService.isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to continue');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setConnecting(true);

    try {
      const { provider: newProvider, address: newAddress, chainId: newChainId } =
        await walletService.connectWallet();

      setProvider(newProvider);
      setAddress(newAddress);
      setChainId(newChainId);
      setConnected(true);

      // Check if on correct network
      if (newChainId !== TARGET_CHAIN_ID) {
        toast.warning('Please switch to the correct network');
        await switchNetwork();
      } else {
        toast.success('Wallet connected successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
      disconnect();
    } finally {
      setConnecting(false);
    }
  };

  // Switch network
  const switchNetwork = async () => {
    try {
      await walletService.switchNetwork(TARGET_CHAIN_ID);
      setChainId(TARGET_CHAIN_ID);
      toast.success('Network switched successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network');
    }
  };

  // Sign message
  const signMessage = async (message: string): Promise<string | null> => {
    if (!provider) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const signature = await walletService.signMessage(provider, message);
      return signature;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign message');
      return null;
    }
  };

  // Get balance
  const getBalance = async (): Promise<string | null> => {
    if (!provider || !address) {
      return null;
    }

    try {
      return await walletService.getBalance(provider, address);
    } catch (error) {
      return null;
    }
  };

  // Listen to account and chain changes
  useEffect(() => {
    if (!isConnected) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
        toast.info('Wallet disconnected');
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        toast.info('Account changed');
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      
      if (newChainId !== TARGET_CHAIN_ID) {
        toast.warning('Please switch to the correct network');
      }
    };

    walletService.onAccountsChanged(handleAccountsChanged);
    walletService.onChainChanged(handleChainChanged);

    return () => {
      walletService.removeListeners();
    };
  }, [isConnected, address, disconnect, setAddress, setChainId]);

  return {
    provider,
    address,
    chainId,
    isConnected,
    isConnecting,
    isCorrectNetwork: chainId === TARGET_CHAIN_ID,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    getBalance,
  };
}
