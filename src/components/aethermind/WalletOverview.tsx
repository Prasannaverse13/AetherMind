
"use client";
import type { TokenBalance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { DollarSign, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface WalletOverviewProps {
  account: string;
  balance: TokenBalance[];
}

export function WalletOverview({ account, balance }: WalletOverviewProps) {
  const { error: walletError, loading: walletLoading } = useWallet();

  const totalValueUSD = balance.reduce((sum, token) => sum + (token.valueUSD || 0), 0);
  const shortAccount = account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "N/A";

  return (
    <section id="wallet-overview">
      <Card className="glass-card p-2 md:p-4 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
                <Wallet className="mr-3 h-7 w-7 text-primary" />
                Wallet Overview
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Connected Account: {shortAccount}
              </CardDescription>
            </div>
            <div className="text-right bg-primary/10 p-3 rounded-lg shadow-inner min-w-[200px]">
                <p className="text-sm text-primary font-medium">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-primary">
                  {balance.length > 0 && totalValueUSD > 0 ? 
                    `$${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : (balance.length > 0 && totalValueUSD === 0 ? "$0.00 (Price data unavailable)" : "N/A (No balances or price data)")
                  }
                </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {walletLoading && !balance.length ? (
             <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 animate-pulse" />
              Loading wallet balance...
            </div>
          ) : walletError ? (
            <div className="text-center py-8 text-destructive border border-dashed border-destructive/50 rounded-lg bg-destructive/10 p-4">
              <AlertCircle className="h-10 w-10 mx-auto mb-2" />
              Error: {walletError}
            </div>
          ) : balance.length > 0 ? (
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-4">
                {balance.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 bg-background/50 rounded-lg shadow-sm hover:bg-accent/30 transition-colors">
                    <div className="flex items-center">
                      {token.logoUrl ? (
                         <Image src={token.logoUrl} alt={token.name} width={40} height={40} className="rounded-full mr-4" data-ai-hint={`${token.symbol} crypto logo`}/>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-4 text-muted-foreground text-sm font-bold">
                          {token.symbol.substring(0,3).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{token.name} ({token.symbol})</p>
                        <p className="text-sm text-muted-foreground">
                          {token.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})} {token.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {typeof token.valueUSD === 'number' ? 
                          `$${token.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "Price data unavailable"
                        }
                      </p>
                      {typeof token.valueUSD === 'number' && token.valueUSD > 0 && token.balance > 0 && (
                        <p className="text-sm text-muted-foreground">
                          @{ (token.valueUSD / token.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: token.symbol === 'ETH' || token.balance === 0 ? 2 : 4 })} / token
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-background/30 p-4">
              <TrendingUp className="h-10 w-10 mx-auto mb-2" />
              No token balances found for this account, or live data is unavailable.
              <br />
              Currently, only native currency (e.g. ETH) balance is fetched.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
