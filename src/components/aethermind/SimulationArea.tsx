
"use client";

import { useState, useTransition, useEffect } from 'react';
import type { DeFiStrategy, DeFiStrategyType, SimulationParams, SimulationResult, RecentSimulation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, AlertCircle, Info, Zap } from 'lucide-react';
import { getStrategyExplanation, getPersonalizedSuggestions, getMockOkxMarketConditions } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const strategies: DeFiStrategy[] = [
  {
    id: 'yield-farming',
    name: 'Yield Farming',
    description: 'Earn rewards by staking or lending crypto assets.',
    longDescription: "Yield farming involves lending or staking cryptocurrency tokens in exchange for rewards in the form of additional cryptocurrency. This can be done through decentralized lending protocols or liquidity pools. Users lock up their funds, providing liquidity to the platform, and in return, they earn interest or a share of the platform's revenue. Risks include impermanent loss, smart contract vulnerabilities, and market volatility.",
    parameters: [
      { id: 'asset', label: 'Asset to Farm (e.g., ETH, USDC)', type: 'select', options: [{value: 'ETH', label: 'ETH'}, {value: 'USDC', label: 'USDC'}, {value: 'OKT-USDT LP', label: 'OKT-USDT LP'}], placeholder: 'Select Asset', defaultValue: 'ETH' },
      { id: 'amount', label: 'Amount to Stake', type: 'number', placeholder: 'e.g., 1000', defaultValue: 1000 },
      { id: 'duration', label: 'Farming Duration (days)', type: 'number', placeholder: 'e.g., 30', defaultValue: 30 },
    ],
    risks: ['Impermanent Loss', 'Smart Contract Bugs', 'Market Volatility', 'Liquidation Risk (if leveraged)'],
    okxContext: "Explore various yield farming opportunities on OKX DEX, including liquidity provision for listed pairs and staking programs."
  },
  {
    id: 'flash-loan',
    name: 'Flash Loan Arbitrage',
    description: 'Execute arbitrage by borrowing and repaying assets in one transaction.',
    longDescription: "Flash loans are uncollateralized loans that must be borrowed and repaid within a single blockchain transaction. They are often used for arbitrage, collateral swaps, or self-liquidation. For arbitrage, a user might borrow a large sum, buy an asset on one exchange where it's undervalued, sell it on another where it's overvalued, and repay the loan, all in one atomic transaction. Risks include failed transactions (losing gas fees), smart contract bugs, and front-running.",
    parameters: [
      { id: 'borrowAsset', label: 'Asset to Borrow', type: 'select', options: [{value: 'USDC', label: 'USDC'}, {value: 'DAI', label: 'DAI'}, {value: 'ETH', label: 'ETH'}], placeholder: 'e.g., USDC', defaultValue: 'USDC' },
      { id: 'borrowAmount', label: 'Amount to Borrow', type: 'number', placeholder: 'e.g., 100000', defaultValue: 100000 },
      { id: 'targetPair', label: 'Arbitrage Pair (e.g., ETH/USDC)', type: 'select', options: [{value: 'ETH/USDC', label: 'ETH/USDC'}, {value: 'BTC/USDT', label: 'BTC/USDT'}], placeholder: 'e.g., ETH/USDC', defaultValue: 'ETH/USDC' },
    ],
    risks: ['Transaction Failure (Gas Loss)', 'Front-Running', 'Smart Contract Bugs', 'Price Slippage'],
    okxContext: "Utilize OKX DEX's deep liquidity and fast execution for identifying and executing flash loan arbitrage opportunities across listed assets."
  },
];

interface SimulationAreaProps {
  userTokenHoldingsString: string;
  onSimulationComplete: (simulationResult: SimulationResult, inputParams: SimulationParams) => void;
}

export function SimulationArea({ userTokenHoldingsString, onSimulationComplete }: SimulationAreaProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<DeFiStrategyType | null>(null);
  const [params, setParams] = useState<SimulationParams>({});
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, startSimulationTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [displayTime, setDisplayTime] = useState<string | null>(null);

  useEffect(() => {
    setDisplayTime(new Date().toLocaleTimeString());
  }, [simulationResult]);

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const handleStrategyChange = (value: string) => {
    const strategyId = value as DeFiStrategyType;
    setSelectedStrategyId(strategyId);
    const strategy = strategies.find(s => s.id === strategyId);
    const defaultParams: SimulationParams = {};
    strategy?.parameters.forEach(p => {
      if (p.defaultValue !== undefined) defaultParams[p.id] = p.defaultValue;
    });
    setParams(defaultParams);
    setSimulationResult(null); 
  };

  const handleParamChange = (paramId: string, value: string | number) => {
    setParams(prev => ({ ...prev, [paramId]: value }));
  };

  const runSimulation = async () => {
    if (!selectedStrategy) return;
    const currentParams = {...params}; // Capture current params for this simulation run

    startSimulationTransition(async () => {
      const marketConditions = await getMockOkxMarketConditions();
      
      const suggestionsInput: Parameters<typeof getPersonalizedSuggestions>[0] = {
        userTokenHoldings: userTokenHoldingsString,
        okxDexMarketConditions: marketConditions,
      };
      // We get suggestions, but they are general. The main explanation is for the *selected* strategy.
      const aiSuggestionsForPortfolio = await getPersonalizedSuggestions(suggestionsInput);

      const explanationInput: Parameters<typeof getStrategyExplanation>[0] = {
        strategy: `${selectedStrategy.name} with parameters: ${JSON.stringify(currentParams)}. Context: ${selectedStrategy.okxContext}. Current market conditions on OKX DEX: ${marketConditions}. User holdings: ${userTokenHoldingsString}`,
      };
      const aiExplanation = await getStrategyExplanation(explanationInput);

      let result: SimulationResult = {
        strategyName: selectedStrategy.name,
        risksInvolved: selectedStrategy.risks,
        aiExplanation: aiExplanation?.explanation || "Could not retrieve detailed explanation.",
        aiSuggestions: aiSuggestionsForPortfolio?.suggestedStrategies || "No general portfolio suggestions generated.",
        aiRationale: aiSuggestionsForPortfolio?.rationale || "General rationale not available.",
        gasFeeEstimation: "0.01 - 0.05 ETH (estimate based on typical network conditions)"
      };

      if (selectedStrategy.id === 'yield-farming') {
        result.estimatedAPY = `${(Math.random() * 15 + 5).toFixed(2)}% (AI Projected)`;
        result.potentialProfit = `~$${(Number(currentParams.amount || 0) * 0.01 * (Math.random() * 1 + 0.5)).toFixed(2)} (Projected for ${currentParams.duration} days based on mock rates)`;
      } else if (selectedStrategy.id === 'flash-loan') {
        result.potentialProfit = `~$${(Number(currentParams.borrowAmount || 0) * 0.0005 * (Math.random() * 1 + 0.1)).toFixed(2)} (Potential per arbitrage event, highly variable)`;
        result.potentialLoss = "Gas fees if transaction fails or is front-run by bots.";
      }
      
      setSimulationResult(result);
      onSimulationComplete(result, currentParams);
    });
  };

  const getAISuggestions = () => {
    startSuggestionTransition(async () => {
      setSimulationResult(null); 
      const marketConditions = await getMockOkxMarketConditions();
      const suggestionsInput: Parameters<typeof getPersonalizedSuggestions>[0] = {
        userTokenHoldings: userTokenHoldingsString,
        okxDexMarketConditions: marketConditions,
      };
      const aiSuggestions = await getPersonalizedSuggestions(suggestionsInput);
      
      let resultData: SimulationResult;
      if (aiSuggestions) {
        resultData = {
          strategyName: "Personalized Portfolio Suggestions",
          risksInvolved: ["Market Volatility", "Smart Contract Risks", "Always DYOR", "AI suggestions are not financial advice"],
          aiSuggestions: aiSuggestions.suggestedStrategies,
          aiRationale: aiSuggestions.rationale,
          aiExplanation: "These suggestions are generated by AI based on your provided portfolio information and simulated current market conditions on OKX DEX. Review each suggestion carefully and conduct your own research."
        };
      } else {
         resultData = {
          strategyName: "Personalized Portfolio Suggestions",
          risksInvolved: ["Error in generation"],
          aiSuggestions: "Could not generate suggestions at this time. Please try again later.",
          aiRationale: "Unable to generate rationale due to an error.",
          aiExplanation: "There was an issue contacting the AI for suggestions. Please check your connection or try again."
        };
      }
      setSimulationResult(resultData);
      onSimulationComplete(resultData, { type: "generalAISuggestion" }); // Empty params for general suggestion
    });
  };

  return (
    <section id="simulation-area">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
                <Wand2 className="mr-3 h-7 w-7 text-primary" />
                AI-Powered DeFi Simulator
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Explore DeFi strategies with AI insights. OKX DEX data is currently simulated.
                {displayTime && <span className="block text-xs mt-1">Last activity: {displayTime}</span>}
              </CardDescription>
            </div>
             <Button onClick={getAISuggestions} disabled={isSuggesting || isSimulating} className="mt-4 md:mt-0 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity">
              {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Get AI Strategy Suggestions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div>
              <Label htmlFor="strategy-select" className="text-lg font-semibold mb-2 block text-foreground">Select DeFi Strategy to Simulate</Label>
              <Select onValueChange={handleStrategyChange} value={selectedStrategyId || ""}>
                <SelectTrigger id="strategy-select" className="w-full h-12 text-base">
                  <SelectValue placeholder="Choose a strategy..." />
                </SelectTrigger>
                <SelectContent className="glass-card bg-popover text-popover-foreground">
                  {strategies.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-base py-2 focus:bg-accent">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStrategy && (
                <Alert variant="default" className="mt-4 bg-accent/20 border-accent/30">
                  <Info className="h-5 w-5 text-accent-foreground" />
                  <AlertTitle className="font-semibold text-accent-foreground">{selectedStrategy.name}</AlertTitle>
                  <AlertDescription className="text-muted-foreground text-sm">
                    {selectedStrategy.description}
                    <Accordion type="single" collapsible className="w-full mt-2">
                      <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger className="text-sm py-1 hover:no-underline text-primary hover:text-primary/80">Learn More</AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pt-1 prose-sm dark:prose-invert max-w-full">
                          <p className="mb-1">{selectedStrategy.longDescription}</p>
                          <strong>OKX Context:</strong> {selectedStrategy.okxContext}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {selectedStrategy && (
              <form onSubmit={(e) => { e.preventDefault(); runSimulation(); }} className="space-y-4 p-6 bg-background/50 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Strategy Parameters</h3>
                {selectedStrategy.parameters.map(param => (
                  <div key={param.id} className="space-y-1">
                    <Label htmlFor={param.id} className="font-medium text-foreground">{param.label}</Label>
                    {param.type === 'number' && (
                      <Input
                        id={param.id}
                        type="number"
                        value={params[param.id] as number || ''}
                        placeholder={param.placeholder}
                        onChange={e => handleParamChange(param.id, parseFloat(e.target.value))}
                        required
                        className="h-11"
                      />
                    )}
                    {param.type === 'select' && param.options && (
                       <Select
                        onValueChange={value => handleParamChange(param.id, value)}
                        defaultValue={param.defaultValue as string || undefined}
                        value={params[param.id] as string || undefined}
                      >
                        <SelectTrigger id={param.id} className="w-full h-11">
                          <SelectValue placeholder={param.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="glass-card bg-popover text-popover-foreground">
                          {param.options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-accent">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
                <Button type="submit" disabled={isSimulating || !selectedStrategy || isSuggesting} className="w-full h-12 text-base">
                  {isSimulating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                  Run AI Simulation
                </Button>
              </form>
            )}
          </div>

          {(isSimulating || isSuggesting) && !simulationResult && (
            <div className="text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">AI is thinking... Please wait.</p>
            </div>
          )}

          {simulationResult && (
            <Card className="mt-8 glass-card !bg-card/80 shadow-2xl">
              <CardHeader className="bg-primary/10">
                <CardTitle className="text-2xl font-bold text-foreground">
                  AI Simulation Outcome: <span className="text-primary">{simulationResult.strategyName}</span>
                </CardTitle>
                 {displayTime && <CardDescription className="text-xs text-muted-foreground">Generated at: {displayTime}</CardDescription>}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {simulationResult.aiSuggestions && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">AI Suggested Strategies:</h4>
                    <div className="ai-response-text p-3 bg-background/30 rounded-md max-h-60 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: simulationResult.aiSuggestions.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/(\d+\.\s*\*)/g, '<li><strong>').replace(/\*\*(.*?):/g, '$1:</strong>').replace(/<br \/>\s*<li>/g, '<li>').replace(/(<\/li>|<br \/>)\s*<br \/>\s*<li>/g, '$1<li>').replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul><ul>/g, '') }}></div>
                  </div>
                )}
                 {simulationResult.aiRationale && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Rationale:</h4>
                     <div className="ai-response-text p-3 bg-background/30 rounded-md max-h-40 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: simulationResult.aiRationale.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                  </div>
                )}
                {simulationResult.aiExplanation && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">AI Detailed Explanation:</h4>
                    <div className="ai-response-text p-3 bg-background/30 rounded-md max-h-80 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: simulationResult.aiExplanation.replace(/\n\n/g, '<br /><br />').replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/### (.*?)(<br \/>|$)/g, '<h3>$1</h3>').replace(/\* (.*?)(<br \/>|$)/g, '<li>$1</li>').replace(/(<\/li>|<br \/>)\s*<br \/>\s*(<li>|<h3>)/g, '$1$2').replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!<li>)/g, '</li></ul>').replace(/<ul>(.*?)<\/ul>/gs, (match) => match.replace(/<br \/>/g, '')) }}></div>
                  </div>
                )}
                {simulationResult.estimatedAPY && (
                  <p className="text-foreground"><strong>Estimated APY:</strong> <span className="text-green-400 font-semibold">{simulationResult.estimatedAPY}</span></p>
                )}
                {simulationResult.potentialProfit && (
                  <p className="text-foreground"><strong>Potential Profit:</strong> <span className="text-green-400 font-semibold">{simulationResult.potentialProfit}</span></p>
                )}
                {simulationResult.potentialLoss && (
                  <p className="text-foreground"><strong>Potential Loss:</strong> <span className="text-red-400 font-semibold">{simulationResult.potentialLoss}</span></p>
                )}
                 {simulationResult.gasFeeEstimation && (
                  <p className="text-muted-foreground"><strong>Gas Fee Estimation:</strong> {simulationResult.gasFeeEstimation}</p>
                )}
                <div>
                  <h4 className="text-lg font-semibold mb-1 text-foreground">Key Risks:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {simulationResult.risksInvolved.map(risk => <li key={risk}>{risk}</li>)}
                  </ul>
                </div>
                <Alert variant="destructive" className="mt-6 bg-destructive/20 border-destructive/50 text-destructive-foreground">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertTitle className="text-destructive">Disclaimer</AlertTitle>
                  <AlertDescription className="text-destructive/80 text-xs">
                    This simulation is powered by AI and based on mock data for demonstration purposes. It is not financial advice. Always do your own research (DYOR) before making any investment decisions. DeFi involves significant risks. Real-time OKX DEX data integration is pending.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
