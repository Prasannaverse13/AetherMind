
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast'; // Ensure this import is present and correct
import type { TokenBalance, WalletState } from '@/types';

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
  // These will be replaced by the hook's functions
  connectWallet: async () => { console.warn("connectWallet called on initial state"); },
  disconnectWallet: () => { console.warn("disconnectWallet called on initial state"); },
  loading: true,
  error: null,
};

export const useWallet = (): WalletState => {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // This is where the error occurs if useToast is not defined
  const { toast: showToast } = useToast(); 

  useEffect(() => {
    setIsMounted(true);
    // Attempt to restore connection on mount
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
            // Fetch balance for restored account will be triggered by account state change effect
          } else {
            if (typeof localStorage !== 'undefined') localStorage.removeItem('aethermind_wallet_account');
          }
        } catch (err) {
          console.error("Error restoring wallet session:", err);
          if (typeof localStorage !== 'undefined') localStorage.removeItem('aethermind_wallet_account');
          setError("Failed to restore wallet session.");
        }
      }
      setLoading(false);
    };
    attemptConnectionRestore();
  }, []);

  const fetchBalance = useCallback(async (currentAccount: string) => {
    if (!isMounted || typeof window.ethereum === 'undefined' || !currentAccount) {
      if (isMounted) setError("Failed to fetch balance: Invalid parameters or Metamask not available.");
      setBalance([]); // Clear balance on error
      return;
    }
    setLoading(true); // Set loading true when fetching balance
    try {
      const rawBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest'],
      });
      const nativeBalance = formatEth(rawBalance as string);
      
      if (isMounted) {
        setBalance([{
          symbol: 'ETH', 
          name: 'Ethereum',
          balance: nativeBalance,
          valueUSD: undefined, 
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
  }, [isMounted]);

  const disconnectWallet = useCallback(() => {
    if (!isMounted) return;
    setIsConnected(false);
    setAccount(null);
    setBalance([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aethermind_wallet_account');
    }
    showToast({ title: "Wallet Disconnected" });
    setError(null);
  }, [isMounted, showToast]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (!isMounted) return;
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      const newAccount = accounts[0];
      setAccount(newAccount); // This will trigger the useEffect below to fetch balance
      setIsConnected(true); 
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aethermind_wallet_account', newAccount);
      }
      showToast({ title: "Account Switched", description: `Switched to: ${newAccount.substring(0,6)}...${newAccount.substring(newAccount.length-4)}` });
    }
  }, [isMounted, account, disconnectWallet, showToast]);

  const connectWallet = useCallback(async () => {
    if (!isMounted) return;
    if (typeof window.ethereum === 'undefined') {
      setError("Metamask is not installed. Please install Metamask.");
      showToast({ title: "Metamask Not Found", description: "Please install Metamask and try again.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        setAccount(currentAccount); // Triggers balance fetch via useEffect
        setIsConnected(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aethermind_wallet_account', currentAccount);
        }
        showToast({ title: "Wallet Connected", description: `Connected: ${currentAccount.substring(0,6)}...${currentAccount.substring(currentAccount.length-4)}` });
      } else {
        setError("No accounts found. Please ensure Metamask is set up.");
        showToast({ title: "Connection Failed", description: "No accounts found in Metamask.", variant: "destructive" });
        setIsConnected(false);
        setAccount(null);
        setBalance([]);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      const errorMessage = err.message?.includes("User rejected") ? "Connection request rejected." : "Failed to connect wallet.";
      setError(errorMessage);
      showToast({ title: "Connection Failed", description: errorMessage, variant: "destructive" });
      setIsConnected(false);
      setAccount(null);
      setBalance([]);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, [isMounted, showToast]);

  useEffect(() => {
    if (isMounted && account && isConnected) {
      fetchBalance(account);
    }
  }, [isMounted, account, isConnected, fetchBalance]);

  useEffect(() => {
    if (!isMounted || typeof window.ethereum === 'undefined' || !window.ethereum.on) {
      return;
    }
    let isActive = true;
    const accountsChangedHandler = (accounts: string[]) => {
        if (isActive) handleAccountsChanged(accounts);
    };

    if (isConnected) { // Only listen if connected
        window.ethereum.on('accountsChanged', accountsChangedHandler);
    }

    return () => {
      isActive = false;
      if (typeof window.ethereum.removeListener === 'function') {
        window.ethereum.removeListener('accountsChanged', accountsChangedHandler);
      }
    };
  }, [isMounted, isConnected, handleAccountsChanged]);
  
  if (!isMounted && typeof window === 'undefined') {
    // SSR fallback, ensure functions are defined but perhaps less functional
    return { ...initialWalletState, loading: true };
  }
  
  // While isMounted is false but window is defined (very initial client render before first useEffect)
  if (!isMounted) {
      return { ...initialWalletState, loading: true }; // Keep loading true until isMounted
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

    