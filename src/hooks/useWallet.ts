
"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { TokenBalance } from '@/types'; // Ensure TokenBalance is imported

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: TokenBalance[]; // This will primarily hold native currency balance for now
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  error: string | null;
}

// Helper to format ETH balance from Wei
const formatEth = (wei: string): number => {
  return parseFloat(wei) / 10**18;
};

const initialWalletState: WalletState = {
  isConnected: false,
  account: null,
  balance: [],
  connectWallet: async () => {},
  disconnectWallet: () => {},
  loading: true, // Start with loading true until mount and check
  error: null,
};

export const useWallet = (): WalletState => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true); // Start true
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // Metamask is locked or user has disconnected.
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      fetchBalance(accounts[0]);
      localStorage.setItem('aethermind_wallet_account', accounts[0]);
    }
  }, [account]); // Added 'account' to dependency array

  const fetchBalance = async (currentAccount: string) => {
    if (typeof window.ethereum !== 'undefined' && currentAccount) {
      try {
        setLoading(true);
        const rawBalance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [currentAccount, 'latest'],
        });
        const nativeBalance = formatEth(rawBalance as string);
        
        // For now, we only fetch native currency. USD value and logo are placeholders.
        // Real USD value would require a price oracle.
        setBalance([{
          symbol: 'ETH', // Assuming Ethereum network, this should be dynamic based on chainId
          name: 'Ethereum',
          balance: nativeBalance,
          valueUSD: 0, // Placeholder: Real price feed needed
          // logoUrl: '/tokens/eth.png', // Placeholder: Real logo mapping needed
        }]);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching balance:", err);
        setError("Failed to fetch balance.");
        setBalance([]);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const connectWallet = useCallback(async () => {
    if (!isMounted || typeof window.ethereum === 'undefined') {
      setError("Metamask is not installed. Please install Metamask to connect your wallet.");
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
        await fetchBalance(currentAccount);
        localStorage.setItem('aethermind_wallet_account', currentAccount);
        toast({ title: "Wallet Connected", description: `Connected to account: ${currentAccount.substring(0,6)}...${currentAccount.substring(currentAccount.length-4)}` });
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // Potentially listen for chainChanged as well if network matters
        // window.ethereum.on('chainChanged', (_chainId: string) => window.location.reload());

      } else {
        setError("No accounts found. Please ensure your Metamask wallet is set up.");
        toast({ title: "Connection Failed", description: "No accounts found in Metamask.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err.message || "Failed to connect wallet. User might have rejected the request.");
      toast({ title: "Connection Failed", description: err.message || "User rejected the request.", variant: "destructive" });
      setIsConnected(false);
      setAccount(null);
      setBalance([]);
    } finally {
      setLoading(false);
    }
  }, [isMounted, handleAccountsChanged]);

  const disconnectWallet = useCallback(() => {
    if (!isMounted) return;
    setIsConnected(false);
    setAccount(null);
    setBalance([]);
    localStorage.removeItem('aethermind_wallet_account');
    if (typeof window.ethereum !== 'undefined' && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
    toast({ title: "Wallet Disconnected" });
    setLoading(false); // Ensure loading is false on disconnect
  }, [isMounted, handleAccountsChanged]);

  useEffect(() => {
    setIsMounted(true);
    setLoading(true); // Set loading true initially
    if (typeof window.ethereum !== 'undefined') {
      const storedAccount = localStorage.getItem('aethermind_wallet_account');
      if (storedAccount) {
        // Try to reconnect silently or prompt user if necessary
        // For simplicity, we'll just set the account and fetch balance
        // A more robust solution might check if still connected/permissions exist
        window.ethereum.request({ method: 'eth_accounts' })
          .then((accounts: any) => {
            const accs = accounts as string[];
            if (accs.length > 0 && accs.includes(storedAccount)) {
              setAccount(storedAccount);
              setIsConnected(true);
              fetchBalance(storedAccount);
              window.ethereum.on('accountsChanged', handleAccountsChanged);
            } else {
              // Stored account not available anymore, clear it
              localStorage.removeItem('aethermind_wallet_account');
              setIsConnected(false);
              setAccount(null);
              setBalance([]);
            }
          })
          .catch((err: any) => {
            console.error("Error checking persisted account:", err);
            localStorage.removeItem('aethermind_wallet_account'); // Clear if error
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false); // No stored account, not loading
      }
    } else {
      // Metamask not installed
      setLoading(false);
    }
  }, [handleAccountsChanged]); // Added handleAccountsChanged to dependency array


  if (!isMounted) {
    // Return a non-interactive loading state until mounted
    return { ...initialWalletState, loading: true, connectWallet: async () => {}, disconnectWallet: () => {} };
  }

  return { isConnected, account, balance, connectWallet, disconnectWallet, loading, error };
};

// Helper function to format balance for AI prompt
export const formatBalanceForAI = (balance: TokenBalance[]): string => {
  if (!balance.length) return "No token holdings detected or wallet not connected.";
  // Primarily focuses on native currency for now
  const nativeCurrency = balance.find(token => token.symbol === 'ETH'); // Assuming ETH, adjust if chain-dependent
  if (nativeCurrency) {
    return `${nativeCurrency.balance.toFixed(4)} ${nativeCurrency.symbol}. Other token balances not itemized for this prompt.`;
  }
  return "Native currency balance not available. Other token balances not itemized for this prompt.";
};
