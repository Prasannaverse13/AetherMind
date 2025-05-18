
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { TokenBalance, WalletState } from '@/types';

const formatEth = (wei: string): number => {
  if (!wei || typeof wei !== 'string' || !wei.startsWith('0x')) {
    return 0;
  }
  return parseInt(wei, 16) / 10**18;
};

const getNetworkName = (chainId: string | null): string => {
  if (!chainId) return "Unknown Network";
  // Convert chainId to decimal if it's hex
  const decimalChainId = chainId.startsWith('0x') ? parseInt(chainId, 16).toString() : chainId;

  switch (decimalChainId) {
    case '1': return 'Ethereum Mainnet';
    case '5': return 'Goerli Testnet';
    case '11155111': return 'Sepolia Testnet';
    case '56': return 'BNB Smart Chain';
    case '97': return 'BNB Testnet';
    case '137': return 'Polygon Mainnet';
    case '80001': return 'Polygon Mumbai';
    case '65': return 'OKXChain Testnet';
    case '66': return 'OKXChain Mainnet';
    // Add more common networks as needed
    default: return `Chain ID: ${decimalChainId}`;
  }
};


const initialWalletState: WalletState = {
  isConnected: false,
  account: null,
  balance: [],
  networkName: "Unknown Network",
  connectWallet: async () => { console.warn("connectWallet called on initial state"); },
  disconnectWallet: () => { console.warn("disconnectWallet called on initial state"); },
  refreshBalance: async () => { console.warn("refreshBalance called on initial state"); },
  loading: false, // Set to false initially, true during operations
  error: null,
};

export const useWallet = (): WalletState => {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [networkName, setNetworkName] = useState<string>("Unknown Network");
  const [loading, setLoading] = useState(true); // Start true for initial check
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchNetworkInfo = useCallback(async () => {
    if (!isMounted || typeof window.ethereum === 'undefined') return;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      if (isMounted) setNetworkName(getNetworkName(chainId));
    } catch (err) {
      console.error("Error fetching chainId:", err);
      if (isMounted) setNetworkName("Unknown Network");
    }
  }, [isMounted]);

  const fetchBalanceInternal = useCallback(async (currentAccount: string) => {
    if (!isMounted || typeof window.ethereum === 'undefined' || !currentAccount) {
      if (isMounted) {
        setError("Failed to fetch balance: Invalid parameters or Metamask not available.");
        setBalance([]);
      }
      return;
    }
    setLoading(true);
    try {
      const rawBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest'],
      });
      const nativeBalance = formatEth(rawBalance as string);
      
      // Determine symbol based on network - simplistic, real app might need more robust logic or token lists
      let nativeSymbol = 'ETH';
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      if (chainId === '0x38' || chainId === '0x61') nativeSymbol = 'BNB'; // BNB Smart Chain (Mainnet/Testnet)
      if (chainId === '0x89' || chainId === '0x13881') nativeSymbol = 'MATIC'; // Polygon (Mainnet/Mumbai)
      if (chainId === '0x42' || chainId === '0x41') nativeSymbol = 'OKT'; // OKXChain (Mainnet/Testnet)


      if (isMounted) {
        setBalance([{
          symbol: nativeSymbol, 
          name: getNetworkName(chainId).replace(" Mainnet", "").replace(" Testnet", ""), // Basic name from network
          balance: nativeBalance,
          valueUSD: undefined, // Price fetching is complex, handled separately if needed
        }]);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching balance:", err);
      if (isMounted) {
        setError("Failed to fetch balance.");
        setBalance([]);
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  }, [isMounted, fetchNetworkInfo]);


  const disconnectWallet = useCallback(() => {
    if (!isMounted) return;
    setIsConnected(false);
    setAccount(null);
    setBalance([]);
    setNetworkName("Unknown Network");
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aethermind_wallet_account');
    }
    toast({ title: "Wallet Disconnected" });
    setError(null);
    setLoading(false);
  }, [isMounted, toast]);


  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (!isMounted) return;
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      const newAccount = accounts[0];
      setAccount(newAccount);
      setIsConnected(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aethermind_wallet_account', newAccount);
      }
      await fetchBalanceInternal(newAccount);
      await fetchNetworkInfo();
      toast({ title: "Account Switched", description: `Switched to: ${newAccount.substring(0,6)}...${newAccount.substring(newAccount.length-4)} on ${getNetworkName(await window.ethereum.request({ method: 'eth_chainId' }) as string)}` });
    }
  }, [isMounted, account, disconnectWallet, toast, fetchBalanceInternal, fetchNetworkInfo]);

  const handleChainChanged = useCallback(async (_chainId: string) => {
    if (!isMounted || !account) return;
    await fetchNetworkInfo();
    await fetchBalanceInternal(account); // Re-fetch balance as native token might change
    toast({ title: "Network Changed", description: `Switched to ${getNetworkName(_chainId)}`});
  }, [isMounted, account, toast, fetchBalanceInternal, fetchNetworkInfo]);


  const connectWallet = useCallback(async () => {
    if (!isMounted) return;
    if (typeof window.ethereum === 'undefined') {
      setError("Metamask is not installed. Please install Metamask.");
      toast({ title: "Metamask Not Found", description: "Please install Metamask and try again.", variant: "destructive" });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        setIsConnected(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aethermind_wallet_account', currentAccount);
        }
        await fetchBalanceInternal(currentAccount);
        await fetchNetworkInfo();
        toast({ title: "Wallet Connected", description: `Connected: ${currentAccount.substring(0,6)}...${currentAccount.substring(currentAccount.length-4)} on ${getNetworkName(await window.ethereum.request({ method: 'eth_chainId' }) as string)}` });
      } else {
        setError("No accounts found. Please ensure Metamask is set up.");
        toast({ title: "Connection Failed", description: "No accounts found in Metamask.", variant: "destructive" });
        setIsConnected(false);
        setAccount(null);
        setBalance([]);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      const errorMessage = err.message?.includes("User rejected") ? "Connection request rejected." : "Failed to connect wallet.";
      setError(errorMessage);
      toast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
      setIsConnected(false);
      setAccount(null);
      setBalance([]);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, [isMounted, toast, fetchBalanceInternal, fetchNetworkInfo]);

  const refreshBalance = useCallback(async () => {
    if (account && isConnected) {
      toast({ title: "Refreshing balances..." });
      await fetchBalanceInternal(account);
      await fetchNetworkInfo(); // Also refresh network info
    } else {
      toast({ title: "Wallet not connected", description: "Please connect your wallet to refresh.", variant: "destructive"});
    }
  }, [account, isConnected, fetchBalanceInternal, fetchNetworkInfo, toast]);

  useEffect(() => {
    setIsMounted(true);
    const attemptConnectionRestore = async () => {
      if (typeof window.ethereum === 'undefined') {
        setLoading(false);
        return;
      }
      const storedAccount = typeof localStorage !== 'undefined' ? localStorage.getItem('aethermind_wallet_account') : null;
      if (storedAccount) {
        try {
          const accs = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accs.length > 0 && accs.includes(storedAccount)) {
            setAccount(storedAccount);
            setIsConnected(true);
            await fetchBalanceInternal(storedAccount);
            await fetchNetworkInfo();
          } else {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('aethermind_wallet_account');
          }
        } catch (err) {
          console.error("Error restoring wallet session:", err);
          if (typeof localStorage !== 'undefined') localStorage.removeItem('aethermind_wallet_account');
        }
      }
      setLoading(false);
    };
    attemptConnectionRestore();
  }, [fetchBalanceInternal, fetchNetworkInfo]); // Add dependencies here

  useEffect(() => {
    if (!isMounted || typeof window.ethereum === 'undefined' || !window.ethereum.on) {
      return;
    }
    let isActive = true;
    const accountsChangedCb = (accs: string[]) => { if (isActive) handleAccountsChanged(accs); };
    const chainChangedCb = (chainId: string) => { if (isActive) handleChainChanged(chainId); };

    if (isConnected) {
        window.ethereum.on('accountsChanged', accountsChangedCb);
        window.ethereum.on('chainChanged', chainChangedCb);
    }

    return () => {
      isActive = false;
      if (typeof window.ethereum.removeListener === 'function') {
        window.ethereum.removeListener('accountsChanged', accountsChangedCb);
        window.ethereum.removeListener('chainChanged', chainChangedCb);
      }
    };
  }, [isMounted, isConnected, handleAccountsChanged, handleChainChanged]);
  
  if (!isMounted && typeof window === 'undefined') {
    return { ...initialWalletState, loading: true };
  }
  
  if (!isMounted) {
      return { ...initialWalletState, loading: true };
  }

  return { isConnected, account, balance, networkName, connectWallet, disconnectWallet, refreshBalance, loading, error };
};

export const formatBalanceForAI = (balance: TokenBalance[]): string => {
  if (!balance || balance.length === 0) return "No token holdings detected or wallet not connected.";
  
  // Assuming the first token is the native currency for simplicity, as per current hook logic
  const nativeCurrency = balance[0]; 
  
  if (nativeCurrency && nativeCurrency.balance > 0) {
    return `${nativeCurrency.balance.toFixed(4)} ${nativeCurrency.symbol}. Focus on native currency for now.`;
  } else if (nativeCurrency && nativeCurrency.balance === 0) {
    return `0.0000 ${nativeCurrency.symbol}. Focus on native currency for now.`;
  }
  
  return "Native currency balance not available or is zero.";
};
