
"use client";
import type { TokenBalance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Wallet, Copy, RefreshCw, AlertCircle, Loader2, Network, Coins } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

interface WalletOverviewProps {
  account: string | null; // Can be null if not connected
  balance: TokenBalance[];
  networkName?: string;
  onRefresh?: () => void;
  isLoading: boolean;
}

export function WalletOverview({ account, balance, networkName, onRefresh, isLoading }: WalletOverviewProps) {
  const { toast } = useToast();

  const shortAccount = account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "N/A";
  
  const totalValueUSD = balance.reduce((sum, token) => sum + (token.valueUSD || 0), 0);

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
        .then(() => {
          toast({ title: "Address Copied!", description: "Wallet address copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy address.", variant: "destructive" });
          console.error('Failed to copy address: ', err);
        });
    }
  };
  
  let totalPortfolioValueDisplay: React.ReactNode;
  if (isLoading && balance.length === 0) {
     totalPortfolioValueDisplay = <p className="text-2xl font-bold text-primary flex items-center"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...</p>;
  } else if (balance.length === 0 && !isLoading) {
    totalPortfolioValueDisplay = <p className="text-lg font-semibold text-muted-foreground">N/A (No token balances found)</p>;
  } else if (balance.length > 0 && totalValueUSD === 0 && balance.every(t => t.valueUSD === undefined)) {
    totalPortfolioValueDisplay = (
      <div>
        <p className="text-3xl font-extrabold text-primary">$0.00</p>
        <p className="text-xs font-normal text-muted-foreground mt-1">(Price data unavailable for total)</p>
      </div>
    );
  } else { 
    totalPortfolioValueDisplay = <p className="text-3xl font-extrabold text-primary">
      ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>;
  }

  return (
    <section id="wallet-overview">
      <Card className="glass-card p-4 md:p-6 overflow-hidden">
        <CardHeader className="pb-4 px-0 pt-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center">
              <Wallet className="mr-3 h-6 w-6 text-primary" />
              Wallet Overview
            </CardTitle>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="flex items-center gap-2 text-xs sm:ml-auto">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-4">
          <div className="glass-card !bg-card/50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Connected Account</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-foreground truncate" title={account || "Not Connected"}>{shortAccount}</p>
                {account && (
                  <Button variant="ghost" size="icon" onClick={handleCopyAddress} className="h-7 w-7" title="Copy address">
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Network</p>
              <div className="flex items-center text-sm text-foreground">
                <Network className="h-4 w-4 mr-2 text-primary" /> {networkName || "Loading..."}
              </div>
            </div>
          </div>

          <div className="glass-card !bg-card/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Estimated Value</p>
            {totalPortfolioValueDisplay}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center"><Coins className="mr-2 h-5 w-5 text-primary" /> Token Balances</h3>
            {isLoading && balance.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Fetching balances...
              </div>
            ) : balance.length > 0 ? (
              <ScrollArea className="h-[150px] pr-3">
                <div className="space-y-3">
                  {balance.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-3 bg-background/60 rounded-md shadow-sm hover:bg-accent/40 transition-colors">
                      <div className="flex items-center">
                        {token.logoUrl ? (
                           <Image src={token.logoUrl} alt={token.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint={`${token.symbol} crypto logo`}/>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3 text-muted-foreground text-xs font-bold">
                            {token.symbol.substring(0,3).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{token.name} ({token.symbol})</p>
                          <p className="text-xs text-muted-foreground">
                            {token.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {typeof token.valueUSD === 'number' ? 
                            `$${token.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : <span className="text-xs text-muted-foreground">Price data unavailable</span>
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg bg-background/30 p-3">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                No token balances found.
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center italic">
              Currently, only native currency balance is displayed. Full token discovery is a future enhancement.
            </p>
          </div>

        </CardContent>
      </Card>
    </section>
  );
}
