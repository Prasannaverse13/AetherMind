"use client";

import { useWallet, formatBalanceForAI } from '@/hooks/useWallet';
import { WalletOverview } from './WalletOverview';
import { SimulationArea } from './SimulationArea';
import { DeFiStrategyInfo } from './DeFiStrategyInfo';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const generalStrategies = [
  {
    id: 'yield-farming',
    name: 'Yield Farming',
    description: 'Earn rewards by staking or lending your crypto assets in DeFi protocols.',
    icon: <Image src="https://placehold.co/40x40.png" alt="Yield Farming" width={40} height={40} className="rounded-md" data-ai-hint="abstract finance" />
  },
  {
    id: 'flash-loans',
    name: 'Flash Loans',
    description: 'Borrow assets without collateral, provided the loan is repaid within the same transaction block.',
    icon: <Image src="https://placehold.co/40x40.png" alt="Flash Loans" width={40} height={40} className="rounded-md" data-ai-hint="speed lightning" />
  },
  {
    id: 'liquidity-providing',
    name: 'Liquidity Providing',
    description: 'Provide assets to liquidity pools and earn trading fees.',
    icon: <Image src="https://placehold.co/40x40.png" alt="Liquidity Providing" width={40} height={40} className="rounded-md" data-ai-hint="water pool" />
  }
];


export function AetherMindClientPage() {
  const { isConnected, account, balance, connectWallet, loading: walletLoading } = useWallet();

  if (walletLoading && !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h2 className="text-3xl font-semibold mb-2">Loading AetherMind...</h2>
        <p className="text-muted-foreground max-w-md">
          Preparing your intelligent DeFi navigator. Please wait a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {!isConnected ? (
        <section className="text-center py-12 md:py-20 bg-gradient-to-br from-background to-accent/20 rounded-xl">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Unlock DeFi with AI-Powered Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              AetherMind helps you simulate DeFi strategies using real-time OKX DEX data and your portfolio. Connect your wallet to get personalized insights and make smarter financial decisions.
            </p>
            <Button
              size="lg"
              onClick={connectWallet}
              disabled={walletLoading}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium tracking-wide text-primary-foreground transition-all duration-200 ease-in-out rounded-xl shadow-lg hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background bg-primary hover:bg-primary/90"
            >
              {walletLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5 group-hover:animate-pulse"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              )}
              Connect Metamask Wallet
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">Securely connect to explore possibilities.</p>
          </div>
          
          <div className="mt-16 container mx-auto px-4">
            <h3 className="text-2xl font-semibold mb-8 text-foreground">Popular DeFi Strategies Explained</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {generalStrategies.map(strategy => (
                <DeFiStrategyInfo key={strategy.id} strategy={strategy} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <WalletOverview account={account!} balance={balance} />
          <SimulationArea 
            userTokenHoldingsString={formatBalanceForAI(balance)} 
          />
          {/* Placeholder for Recent Simulations */}
          <section id="recent-simulations" className="glass-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Recent Simulations</h2>
            <div className="border border-dashed border-border p-8 rounded-lg text-center bg-background/50">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Your recent simulation history will appear here.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a new simulation to see it listed.
              </p>
            </div>
          </section>
        </>
      )}

      <section id="learn-more" className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-foreground">Understanding DeFi Risks</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Decentralized Finance offers exciting opportunities but also comes with inherent risks. AetherMind aims to provide clarity, but always do your own research (DYOR) before investing.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              { title: "Impermanent Loss", description: "Risk in liquidity providing where the value of your staked assets can decrease compared to simply holding them." , icon: <Image src="https://placehold.co/48x48.png" alt="Impermanent Loss" width={48} height={48} className="rounded-lg" data-ai-hint="balance scale"/>},
              { title: "Smart Contract Risk", description: "Bugs or vulnerabilities in a protocol's code can lead to loss of funds.", icon: <Image src="https://placehold.co/48x48.png" alt="Smart Contract" width={48} height={48} className="rounded-lg" data-ai-hint="code bug"/> },
              { title: "Liquidation Risk", description: "If the value of your collateral falls below a certain threshold in lending protocols, it can be sold off.", icon: <Image src="https://placehold.co/48x48.png" alt="Liquidation" width={48} height={48} className="rounded-lg" data-ai-hint="auction hammer"/> }
            ].map(risk => (
              <div key={risk.title} className="glass-card p-6">
                <div className="flex items-center mb-3">
                  {risk.icon}
                  <h3 className="text-xl font-semibold ml-4 text-foreground">{risk.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{risk.description}</p>
              </div>
            ))}
          </div>
           <p className="mt-8 text-sm text-muted-foreground">
              Learn more about OKX DEX on their official <Link href="https://www.okx.com/web3/dex" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">documentation</Link>.
            </p>
        </div>
      </section>
    </div>
  );
}
