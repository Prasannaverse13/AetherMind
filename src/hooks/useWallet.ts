
"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { TokenBalance } from '@/types';

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: TokenBalance[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  error: string | null;
}

const formatEth = (wei: string): number => {
  if (!wei || typeof wei !== 'string' || !wei.startsWith('0x')) {
    return 0;
  }
  return parseInt(wei, 16) / 10**18;
};

const initialWalletState: WalletState = {
  isConnected: false,
  account: null,
  balance: [],
  connectWallet: async () => {},
  disconnectWallet: () => {},
  loading: false,
  error: null,
};

export const useWallet = (): WalletState => {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchBalance = useCallback(async (currentAccount: string) => {
    if (!isMounted || typeof window.ethereum === 'undefined' || !currentAccount) {
      if (isMounted) setError("Failed to fetch balance: Invalid parameters.");
      return;
    }
    // setLoading(true); // Handled by calling functions
    try {
      const rawBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest'],
      });
      const nativeBalance = formatEth(rawBalance as string);
      
      setBalance([{
        symbol: 'ETH', 
        name: 'Ethereum',
        balance: nativeBalance,
        valueUSD: undefined,
      }]);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching balance:", err);
      setError("Failed to fetch balance.");
      setBalance([]);
    } finally {
      // setLoading(false); // Handled by calling functions
    }
  }, [isMounted]);

  const disconnectWallet = useCallback(() => {
    if (!isMounted) return;
    setIsConnected(false);
    setAccount(null);
    setBalance([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aethermind_wallet_account');
    }
    toast({ title: "Wallet Disconnected" });
    setError(null);
    // Listener removal is handled by the main useEffect
  }, [isMounted]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (!isMounted) return;
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      const newAccount = accounts[0];
      setAccount(newAccount);
      setIsConnected(true); 
      setLoading(true);
      fetchBalance(newAccount).finally(() => {
        if (isMounted) setLoading(false);
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aethermind_wallet_account', newAccount);
      }
    }
  }, [isMounted, account, fetchBalance, disconnectWallet]);

  const connectWallet = useCallback(async () => {
    if (!isMounted) return;
    if (typeof window.ethereum === 'undefined') {
      setError("Metamask is not installed. Please install Metamask to connect your wallet.");
      toast({ title: "Metamask Not Found", description: "Please install Metamask and try again.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        setIsConnected(true); // This will trigger the useEffect to add listeners
        await fetchBalance(currentAccount);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aethermind_wallet_account', currentAccount);
        }
        toast({ title: "Wallet Connected", description: `Connected to account: ${currentAccount.substring(0,6)}...${currentAccount.substring(currentAccount.length-4)}` });
      } else {
        setError("No accounts found. Please ensure your Metamask wallet is set up.");
        toast({ title: "Connection Failed", description: "No accounts found in Metamask.", variant: "destructive" });
        setIsConnected(false);
        setAccount(null);
        setBalance([]);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      const errorMessage = err.message || "Failed to connect wallet. User might have rejected the request.";
      setError(errorMessage);
      toast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
      setIsConnected(false);
      setAccount(null);
      setBalance([]);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, [isMounted, fetchBalance]);

  // Effect for restoring connection and managing listeners
  useEffect(() => {
    if (!isMounted || typeof window.ethereum === 'undefined') return;

    let isActive = true; // To prevent state updates on unmounted component

    const attemptConnectionRestore = async () => {
      setLoading(true);
      const storedAccount = typeof localStorage !== 'undefined' ? localStorage.getItem('aethermind_wallet_account') : null;
      if (storedAccount) {
        try {
          const accs = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (isActive && accs.length > 0 && accs.includes(storedAccount)) {
            setAccount(storedAccount);
            setIsConnected(true); // This will trigger the listener effect below
            await fetchBalance(storedAccount);
          } else if (isActive) {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('aethermind_wallet_account');
            setIsConnected(false);
            setAccount(null);
            setBalance([]);
          }
        } catch (err) {
          if (isActive) {
            console.error("Error restoring wallet session:", err);
            if (typeof localStorage !== 'undefined') localStorage.removeItem('aethermind_wallet_account');
            setIsConnected(false);
            setAccount(null);
            setBalance([]);
            setError("Failed to restore wallet session.");
          }
        }
      }
      if (isActive) setLoading(false);
    };

    if (!isConnected && !account) { // Only attempt restore if not already connected
      attemptConnectionRestore();
    } else if (isConnected && account) {
      // If already connected (e.g. by direct connectWallet call), ensure loading is false
      setLoading(false);
    }
    
    return () => {
      isActive = false;
    };
  }, [isMounted, fetchBalance]); // Dependencies for session restoration

  // Effect solely for managing the accountsChanged listener
  useEffect(() => {
    if (!isMounted || typeof window.ethereum === 'undefined' || !window.ethereum.on) {
      return;
    }

    let isActive = true;
    const currentHandler = (accounts: string[]) => {
      if (isActive) {
        handleAccountsChanged(accounts);
      }
    };

    if (isConnected && account) {
      window.ethereum.on('accountsChanged', currentHandler);
    }

    return () => {
      isActive = false;
      if (typeof window.ethereum.removeListener === 'function') {
        window.ethereum.removeListener('accountsChanged', currentHandler);
      }
    };
  }, [isMounted, isConnected, account, handleAccountsChanged]);


  if (!isMounted && typeof window === 'undefined') { // SSR safety check
    return { ...initialWalletState, loading: true }; // loading true during SSR initial phase
  }
  
  if (!isMounted) { // Still hydrating on client, show generic loading state
      return { ...initialWalletState, loading: true, connectWallet: async () => {}, disconnectWallet: () => {} };
  }

  return { isConnected, account, balance, connectWallet, disconnectWallet, loading, error };
};

export const formatBalanceForAI = (balance: TokenBalance[]): string => {
  if (!balance || balance.length === 0) return "No token holdings detected or wallet not connected.";
  
  const nativeCurrency = balance.find(token => token.symbol === 'ETH'); 
  
  if (nativeCurrency && nativeCurrency.balance > 0) {
    return `${nativeCurrency.balance.toFixed(4)} ${nativeCurrency.symbol}. Other token balances are not itemized for this prompt. Focus on native currency for now.`;
  } else if (nativeCurrency && nativeCurrency.balance === 0) {
    return `0.0000 ${nativeCurrency.symbol}. Other token balances are not itemized for this prompt.`;
  }
  
  return "Native currency balance not available or is zero. Other token balances not itemized for this prompt.";
};

    