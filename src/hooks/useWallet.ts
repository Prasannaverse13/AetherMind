"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Mock data, in a real app this would come from Metamask/web3
const MOCK_ACCOUNT_1 = "0x1234567890abcdef1234567890abcdef12345678";
const MOCK_ACCOUNT_2 = "0xfedcba0987654321fedcba0987654321fedcba09";

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  logoUrl?: string;
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: TokenBalance[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
}

const initialWalletState: WalletState = {
  isConnected: false,
  account: null,
  balance: [],
  connectWallet: async () => {},
  disconnectWallet: () => {},
  loading: false,
};

// Simulate fetching token prices
const mockTokenPrices: Record<string, number> = {
  ETH: 3000,
  USDC: 1,
  OKT: 15,
  WBTC: 60000,
};

const mockBalances: Record<string, TokenBalance[]> = {
  [MOCK_ACCOUNT_1]: [
    { symbol: 'ETH', name: 'Ethereum', balance: 2.5, valueUSD: 2.5 * mockTokenPrices['ETH'], logoUrl: '/tokens/eth.png' },
    { symbol: 'USDC', name: 'USD Coin', balance: 5000, valueUSD: 5000 * mockTokenPrices['USDC'], logoUrl: '/tokens/usdc.png' },
    { symbol: 'OKT', name: 'OKX Chain Token', balance: 150, valueUSD: 150 * mockTokenPrices['OKT'], logoUrl: '/tokens/okt.png' },
  ],
  [MOCK_ACCOUNT_2]: [
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: 0.1, valueUSD: 0.1 * mockTokenPrices['WBTC'], logoUrl: '/tokens/wbtc.png' },
    { symbol: 'USDC', name: 'USD Coin', balance: 10000, valueUSD: 10000 * mockTokenPrices['USDC'], logoUrl: '/tokens/usdc.png' },
  ],
};


export const useWallet = (): WalletState => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Attempt to re-connect if previously connected (e.g. from localStorage)
    const storedAccount = localStorage.getItem('aethermind_wallet_account');
    if (storedAccount && mockBalances[storedAccount]) {
      setIsConnected(true);
      setAccount(storedAccount);
      setBalance(mockBalances[storedAccount]);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!isMounted) return;
    setLoading(true);
    // Simulate Metamask connection
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    // In a real app, you'd use window.ethereum
    // For now, we'll cycle between mock accounts or pick one
    const newAccount = account === MOCK_ACCOUNT_1 ? MOCK_ACCOUNT_2 : MOCK_ACCOUNT_1;

    if (newAccount && mockBalances[newAccount]) {
      setIsConnected(true);
      setAccount(newAccount);
      setBalance(mockBalances[newAccount]);
      localStorage.setItem('aethermind_wallet_account', newAccount);
      toast({ title: "Wallet Connected", description: `Connected to account: ${newAccount.substring(0,6)}...${newAccount.substring(newAccount.length-4)}` });
    } else {
      toast({ title: "Connection Failed", description: "Could not connect to mock wallet.", variant: "destructive" });
    }
    setLoading(false);
  }, [isMounted, account]);

  const disconnectWallet = useCallback(() => {
    if (!isMounted) return;
    setIsConnected(false);
    setAccount(null);
    setBalance([]);
    localStorage.removeItem('aethermind_wallet_account');
    toast({ title: "Wallet Disconnected" });
  }, [isMounted]);
  
  if (!isMounted) {
    // Return a non-interactive state or loading indicators until mounted
    return { ...initialWalletState, loading: true, connectWallet: async () => {}, disconnectWallet: () => {} };
  }

  return { isConnected, account, balance, connectWallet, disconnectWallet, loading };
};

// Helper function to format balance for AI prompt
export const formatBalanceForAI = (balance: TokenBalance[]): string => {
  if (!balance.length) return "No token holdings.";
  return balance.map(token => `${token.balance.toFixed(4)} ${token.symbol} (valued at $${token.valueUSD.toFixed(2)})`).join(', ');
};
