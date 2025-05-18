
"use client";

import { useState, useEffect } from 'react';
import { useWallet, formatBalanceForAI } from '@/hooks/useWallet';
import { WalletOverview } from './WalletOverview';
import { SimulationArea } from './SimulationArea';
import { DeFiStrategyInfo } from './DeFiStrategyInfo';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Scale, Bug, ShieldX, ListCollapse, Info, Wallet } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { RecentSimulation, SimulationParams, SimulationResult, RiskProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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

const riskInfo = [
  { title: "Impermanent Loss", description: "Risk in liquidity providing where the value of your staked assets can decrease compared to simply holding them.", icon: <Scale size={48} className="text-primary" />},
  { title: "Smart Contract Risk", description: "Bugs or vulnerabilities in a protocol's code can lead to loss of funds.", icon: <Bug size={48} className="text-primary" /> },
  { title: "Liquidation Risk", description: "If the value of your collateral falls below a certain threshold in lending protocols, it can be sold off.", icon: <ShieldX size={48} className="text-primary" /> }
];

export function AetherMindClientPage() {
  const { isConnected, account, balance, networkName, connectWallet, loading: walletLoading, error: walletError, refreshBalance } = useWallet();
  const [recentSimulations, setRecentSimulations] = useState<RecentSimulation[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedSimulations = localStorage.getItem('aethermind_recent_simulations');
      if (storedSimulations) {
        const parsedSimulations = JSON.parse(storedSimulations);
        if (Array.isArray(parsedSimulations)) {
          const validSimulations = parsedSimulations
            .filter(sim => typeof sim === 'object' && sim !== null && sim.id && sim.timestamp)
            .map(sim => ({
              ...sim,
              timestamp: new Date(sim.timestamp), 
            }));
          setRecentSimulations(validSimulations as RecentSimulation[]);
        } else {
          console.warn("Stored simulations data is not an array, clearing.");
          localStorage.removeItem('aethermind_recent_simulations');
          setRecentSimulations([]);
        }
      }
    } catch (e) {
      console.error("Failed to parse or access recent simulations from localStorage", e);
      // Optionally clear corrupted data
      try {
        localStorage.removeItem('aethermind_recent_simulations');
      } catch (removeError) {
        console.error("Failed to remove corrupted simulations from localStorage", removeError);
      }
      setRecentSimulations([]);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        if (recentSimulations.length > 0) {
          localStorage.setItem('aethermind_recent_simulations', JSON.stringify(recentSimulations));
        } else {
          // If you want to explicitly remove when empty:
          // localStorage.removeItem('aethermind_recent_simulations');
        }
      } catch (e) {
        console.error("Failed to save recent simulations to localStorage", e);
        // Handle potential errors like storage quota exceeded
      }
    }
  }, [recentSimulations, isClient]);


  const handleNewSimulation = (simulationResult: SimulationResult, inputParams: SimulationParams) => {
    const newRecentSimulation: RecentSimulation = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9),
      timestamp: new Date(),
      inputs: inputParams,
      ...simulationResult,
    };
    setRecentSimulations(prev => [newRecentSimulation, ...prev.slice(0, 4)]);
  };

  if (!isClient) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h2 className="text-3xl font-semibold mb-2 text-foreground">Loading AetherMind...</h2>
        <p className="text-muted-foreground max-w-md">
          Preparing your intelligent DeFi navigator.
        </p>
      </div>
    );
  }

  if (walletLoading && !account && !isConnected && isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h2 className="text-3xl font-semibold mb-2 text-foreground">Connecting Wallet...</h2>
        <p className="text-muted-foreground max-w-md">
          Please approve the connection in your Metamask wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {!isConnected ? (
        <section className="text-center py-12 md:py-20 glass-card">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Unlock DeFi with AI-Powered Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              AetherMind helps you simulate DeFi strategies using AI insights. Connect your Metamask wallet to get personalized suggestions based on your native token balance and explore DeFi possibilities. OKX DEX data is currently simulated.
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
                <Wallet className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              )}
              Connect Metamask Wallet
            </Button>
            {walletError && (
              <p className="mt-4 text-sm text-destructive flex items-center justify-center">
                <AlertTriangle className="mr-2 h-4 w-4" /> {walletError}
              </p>
            )}
            {!walletError && (
              <p className="mt-4 text-sm text-muted-foreground">Securely connect to explore possibilities.</p>
            )}
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
      ) : account && (
        <>
          <WalletOverview account={account} balance={balance} networkName={networkName} onRefresh={refreshBalance} isLoading={walletLoading} />
          <SimulationArea
            userTokenHoldingsString={formatBalanceForAI(balance)}
            onSimulationComplete={handleNewSimulation}
          />
          <section id="recent-simulations" className="glass-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Recent Simulations</h2>
            {recentSimulations.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {recentSimulations.map((sim) => (
                  <AccordionItem value={`sim-${sim.id}`} key={sim.id} className="glass-card !bg-card/70 border-border/50 rounded-lg overflow-hidden">
                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-accent/10">
                      <div className="flex justify-between items-center w-full">
                        <div className='text-left'>
                          <h3 className="text-lg font-semibold text-primary">{sim.strategyName}</h3>
                          <p className="text-xs text-muted-foreground">
                            Simulated at: {new Date(sim.timestamp).toLocaleString()}
                            {sim.inputs.riskProfile && <span className="capitalize"> ({sim.inputs.riskProfile})</span>}
                          </p>
                        </div>
                        <Badge variant={sim.potentialProfit && !sim.potentialProfit.includes("highly variable") ? "default" : "secondary"} className="ml-auto mr-2">
                          {sim.potentialProfit ? 'Profit Potential' : (sim.estimatedAPY ? 'APY Potential' : 'Info')}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t border-border/30 bg-background/30">
                      <div className="space-y-3 text-sm">
                        <div>
                          <h4 className="font-semibold text-foreground">Inputs:</h4>
                          <ul className="list-disc list-inside text-muted-foreground pl-2">
                            {Object.entries(sim.inputs).map(([key, value]) => {
                              if (key === 'type' && value === 'generalAISuggestion' && sim.strategyName === "Personalized Portfolio Suggestions") return null;
                              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                <li key={key}><span className="capitalize">{formattedKey}:</span> {String(value)}</li>
                              )
                            })}
                          </ul>
                        </div>
                        {sim.potentialProfit && <p><strong>Potential Profit:</strong> <span className="text-green-400">{sim.potentialProfit}</span></p>}
                        {sim.estimatedAPY && <p><strong>Estimated APY:</strong> <span className="text-green-400">{sim.estimatedAPY}</span></p>}
                        {sim.potentialLoss && <p><strong>Potential Loss:</strong> <span className="text-red-400">{sim.potentialLoss}</span></p>}
                        {sim.gasFeeEstimation && <p className="text-muted-foreground"><strong>Gas Fee Est:</strong> {sim.gasFeeEstimation}</p>}

                        {sim.aiSuggestions && (
                          <div>
                            <h4 className="font-semibold text-foreground mt-2">AI Suggestions:</h4>
                            <div className="ai-response-text p-2 bg-background/50 rounded-md max-h-40 overflow-y-auto text-xs" dangerouslySetInnerHTML={{ __html: sim.aiSuggestions || '' }}></div>
                          </div>
                        )}
                        {sim.aiRationale && (
                          <div>
                            <h4 className="font-semibold text-foreground mt-2">AI Rationale:</h4>
                            <div className="ai-response-text p-2 bg-background/50 rounded-md max-h-40 overflow-y-auto text-xs" dangerouslySetInnerHTML={{ __html: sim.aiRationale || '' }}></div>
                          </div>
                        )}
                         {sim.aiExplanation && sim.strategyName !== "Personalized Portfolio Suggestions" && (
                          <div>
                            <h4 className="font-semibold text-foreground mt-2">AI Explanation for {sim.strategyName}:</h4>
                            <div className="ai-response-text p-2 bg-background/50 rounded-md max-h-60 overflow-y-auto text-xs" dangerouslySetInnerHTML={{ __html: sim.aiExplanation || '' }}></div>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-foreground mt-2">Key Risks:</h4>
                          <ul className="list-disc list-inside text-muted-foreground pl-2 text-xs">
                            {sim.risksInvolved.map(risk => <li key={risk}>{risk}</li>)}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="border border-dashed border-border p-8 rounded-lg text-center bg-background/50">
                <ListCollapse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your recent simulation history will appear here.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a new simulation or get AI suggestions to see them listed.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      <section id="learn-more" className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-foreground">Understanding DeFi Risks</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Decentralized Finance offers exciting opportunities but also comes with inherent risks. AetherMind aims to provide clarity, but always do your own research (DYOR) before investing. Simulation data is for illustrative purposes.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {riskInfo.map(risk => (
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

    