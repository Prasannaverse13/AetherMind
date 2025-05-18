"use client";
import type { TokenBalance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

interface WalletOverviewProps {
  account: string;
  balance: TokenBalance[];
}

export function WalletOverview({ account, balance }: WalletOverviewProps) {
  const totalValueUSD = balance.reduce((sum, token) => sum + token.valueUSD, 0);
  const shortAccount = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;

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
            <div className="text-right bg-primary/10 p-3 rounded-lg shadow-inner">
                <p className="text-sm text-primary font-medium">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-primary">
                  ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balance.length > 0 ? (
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-4">
                {balance.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 bg-background/50 rounded-lg shadow-sm hover:bg-accent/30 transition-colors">
                    <div className="flex items-center">
                      {token.logoUrl ? (
                         <Image src={token.logoUrl} alt={token.name} width={40} height={40} className="rounded-full mr-4" data-ai-hint={`${token.symbol} crypto logo`}/>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-4 text-muted-foreground text-sm font-bold">
                          {token.symbol.substring(0,3)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{token.name} ({token.symbol})</p>
                        <p className="text-sm text-muted-foreground">
                          {token.balance.toLocaleString()} {token.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${token.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{ (token.valueUSD / token.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / token
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-background/30">
              <TrendingUp className="h-10 w-10 mx-auto mb-2" />
              No token balances found.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
