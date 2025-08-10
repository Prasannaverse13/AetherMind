
"use client";

import { useState, useTransition, useEffect } from 'react';
import type { DeFiStrategy, DeFiStrategyType, SimulationParams, SimulationResult, RiskProfile, ZeroExQuoteInput, LastGaslessQuoteDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, AlertCircle, Info, Zap, Shield, TrendingUp, BarChart, HelpCircle, TestTube2, Search } from 'lucide-react';
import { getStrategyExplanation, getPersonalizedSuggestions, getOkxMarketConditions, get0xGaslessQuote } from '@/lib/actions';
import type { ZeroExQuoteParams, FetchGaslessQuoteResult } from '@/services/zeroxService';
import { GaslessQuoteDisplay } from './GaslessQuoteDisplay';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useWallet } from '@/hooks/useWallet';

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
      { id: 'platform', label: 'Platform / Network', type: 'select', options: [{value: 'okx-dex', label: 'OKX DEX (Various Chains)'}, {value: 'x-layer', label: 'X Layer Protocol'}], defaultValue: 'x-layer'},
    ],
    risks: ['Impermanent Loss', 'Smart Contract Bugs', 'Market Volatility', 'Liquidation Risk (if leveraged)'],
    okxContext: "Explore various yield farming opportunities on OKX DEX, including liquidity provision for listed pairs and staking programs. For lower gas fees, consider protocols on X Layer."
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
    okxContext: "Utilize OKX DEX's deep liquidity and fast execution for identifying and executing flash loan arbitrage opportunities. Executing such strategies on X Layer could significantly reduce gas costs, making smaller arbitrage opportunities more viable."
  },
];

const riskProfileOptions: { value: RiskProfile; label: string; icon: React.ReactNode }[] = [
  { value: 'conservative', label: 'Conservative', icon: <Shield className="mr-2 h-4 w-4" /> },
  { value: 'balanced', label: 'Balanced', icon: <BarChart className="mr-2 h-4 w-4" /> },
  { value: 'aggressive', label: 'Aggressive', icon: <TrendingUp className="mr-2 h-4 w-4" /> },
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
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfile>('balanced');
  
  // State for 0x Gasless Quote Tool
  const { getConnectedWalletAddress } = useWallet();
  const [zeroExInput, setZeroExInput] = useState<ZeroExQuoteInput>({
    chainId: '1',
    sellToken: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72', // WETH on Ethereum
    buyToken: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT on Ethereum
    sellAmount: '1000000000000000000', // 1 WETH
    takerAddress: getConnectedWalletAddress() ?? ''
  });
  const [gaslessQuoteResult, setGaslessQuoteResult] = useState<FetchGaslessQuoteResult | null>(null);
  const [isFetchingQuote, startFetchingQuoteTransition] = useTransition();

  // Effect to update takerAddress when wallet connects/disconnects
  useEffect(() => {
    const connectedAddress = getConnectedWalletAddress();
    if (connectedAddress) {
      setZeroExInput(prev => ({ ...prev, takerAddress: connectedAddress }));
    }
  }, [getConnectedWalletAddress]);

  const handleZeroExInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setZeroExInput(prev => ({...prev, [name]: value}));
  };
  
  const handleFetchGaslessQuote = async () => {
    startFetchingQuoteTransition(async () => {
      const result = await get0xGaslessQuote({
        ...zeroExInput,
        sellAmount: String(zeroExInput.sellAmount),
        chainId: Number(zeroExInput.chainId),
      });
      setGaslessQuoteResult(result);
    });
  };

  const prepareLastGaslessQuoteDetails = (): LastGaslessQuoteDetails | undefined => {
    if (gaslessQuoteResult?.quote) {
      const { quote } = gaslessQuoteResult;
      return {
        sellTokenAddress: quote.sellTokenAddress,
        buyTokenAddress: quote.buyTokenAddress,
        sellAmount: quote.sellAmount,
        buyAmount: quote.buyAmount,
        price: quote.price,
        guaranteedPrice: quote.guaranteedPrice,
        sources: quote.sources,
        gasPrice: quote.gasPrice,
        estimatedGas: quote.estimatedGas,
      };
    }
    return undefined;
  };


  useEffect(() => {
    const now = new Date();
    setDisplayTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [simulationResult]);

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const handleStrategyChange = (value: string) => {
    const strategyId = value as DeFiStrategyType;
    setSelectedStrategyId(strategyId);
    const strategy = strategies.find(s => s.id === strategyId);
    const defaultParams: SimulationParams = { riskProfile: selectedRiskProfile };
    strategy?.parameters.forEach(p => {
      if (p.defaultValue !== undefined) defaultParams[p.id] = p.defaultValue;
    });
    setParams(defaultParams);
    setSimulationResult(null);
  };

  const handleParamChange = (paramId: string, value: string | number) => {
    setParams(prev => ({ ...prev, [paramId]: value }));
  };

  const handleRiskProfileChange = (value: string) => {
    setSelectedRiskProfile(value as RiskProfile);
    setParams(prev => ({ ...prev, riskProfile: value as RiskProfile }));
  };

  const runSimulation = async () => {
    if (!selectedStrategy) return;
    const currentParams: SimulationParams = {...params, riskProfile: selectedRiskProfile, type: selectedStrategy.id};

    startSimulationTransition(async () => {
      const marketConditions = await getOkxMarketConditions();

      const explanationInput: Parameters<typeof getStrategyExplanation>[0] = {
        strategy: `${selectedStrategy.name} with parameters: ${JSON.stringify(currentParams)}. Context: ${selectedStrategy.okxContext}. Current market conditions on OKX DEX: ${marketConditions}. User holdings: ${userTokenHoldingsString}. User risk profile: ${selectedRiskProfile}`,
      };
      const aiExplanationResult = await getStrategyExplanation(explanationInput);

      const suggestionsInput: Parameters<typeof getPersonalizedSuggestions>[0] = {
        userTokenHoldings: userTokenHoldingsString,
        okxDexMarketConditions: marketConditions,
        riskProfile: selectedRiskProfile,
      };
      const aiSuggestionsForPortfolio = await getPersonalizedSuggestions(suggestionsInput);


      let result: SimulationResult = {
        strategyName: selectedStrategy.name,
        risksInvolved: selectedStrategy.risks,
        aiExplanation: aiExplanationResult?.explanation || "<p>Could not retrieve detailed explanation for this strategy.</p>",
        aiSuggestions: aiSuggestionsForPortfolio?.suggestedStrategies || "<p>No general portfolio suggestions generated at this time.</p>",
        aiRationale: aiSuggestionsForPortfolio?.rationale || "<p>General rationale not available.</p>",
        gasFeeEstimation: "0.01 - 0.05 ETH (estimate based on typical network conditions)",
        lastGaslessQuoteDetails: prepareLastGaslessQuoteDetails(),
      };

      // Mock calculations for simulation results based on strategy
      if (selectedStrategy.id === 'yield-farming') {
        const baseApy = currentParams.platform === 'x-layer' ? 8 : 5; // Higher base APY for X Layer
        result.estimatedAPY = `${(Math.random() * 15 + baseApy).toFixed(2)}% (AI Projected)`; // Mock APY
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
      setSimulationResult(null); // Clear previous specific simulation results
      const marketConditions = await getOkxMarketConditions();
      const suggestionsInput: Parameters<typeof getPersonalizedSuggestions>[0] = {
        userTokenHoldings: userTokenHoldingsString,
        okxDexMarketConditions: marketConditions,
        riskProfile: selectedRiskProfile,
      };
      const aiSuggestions = await getPersonalizedSuggestions(suggestionsInput);

      let resultData: SimulationResult;
      const currentParams: SimulationParams = { type: "generalAISuggestion", riskProfile: selectedRiskProfile };

      if (aiSuggestions) {
        resultData = {
          strategyName: "Personalized Portfolio Suggestions",
          risksInvolved: ["Market Volatility", "Smart Contract Risks", "Always DYOR", "AI suggestions are not financial advice"],
          aiSuggestions: aiSuggestions.suggestedStrategies || "<p>No suggestions available.</p>",
          aiRationale: aiSuggestions.rationale || "<p>Rationale not available.</p>",
          aiExplanation: `<p>These suggestions are generated by AI based on your provided portfolio information, simulated current market conditions on OKX DEX, and your selected risk profile: <strong>${selectedRiskProfile}</strong>. Review each suggestion carefully and conduct your own research.</p>`,
          lastGaslessQuoteDetails: prepareLastGaslessQuoteDetails(),
        };
      } else {
         resultData = {
          strategyName: "Personalized Portfolio Suggestions",
          risksInvolved: ["Error in generation"],
          aiSuggestions: "<p>Could not generate suggestions at this time. Please try again later.</p>",
          aiRationale: "<p>Unable to generate rationale due to an error.</p>",
          aiExplanation: "<p>There was an issue contacting the AI for suggestions. Please check your connection or try again.</p>",
          lastGaslessQuoteDetails: prepareLastGaslessQuoteDetails(),
        };
      }
      setSimulationResult(resultData);
      onSimulationComplete(resultData, currentParams);
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
                Explore DeFi strategies with AI insights on OKX DEX and X Layer. Data is a mix of real and simulated sources.
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
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 space-y-4">
              <div>
                <Label htmlFor="risk-profile-select" className="text-lg font-semibold mb-2 block text-foreground">Select Your Risk Profile</Label>
                <Select onValueChange={handleRiskProfileChange} defaultValue={selectedRiskProfile}>
                  <SelectTrigger id="risk-profile-select" className="w-full h-12 text-base">
                    <SelectValue placeholder="Choose risk profile..." />
                  </SelectTrigger>
                  <SelectContent className="glass-card bg-popover text-popover-foreground">
                    {riskProfileOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-base py-2 focus:bg-accent">
                        <div className="flex items-center">
                           {option.icon} {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-1">Affects personalized AI suggestions.</p>
              </div>
              <div>
                <Label htmlFor="strategy-select" className="text-lg font-semibold mb-2 block text-foreground">DeFi Strategy to Simulate</Label>
                <Select onValueChange={handleStrategyChange} value={selectedStrategyId || ""}>
                  <SelectTrigger id="strategy-select" className="w-full h-12 text-base" disabled={isSuggesting || isSimulating}>
                    <SelectValue placeholder="Choose a specific strategy..." />
                  </SelectTrigger>
                  <SelectContent className="glass-card bg-popover text-popover-foreground">
                    {strategies.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-base py-2 focus:bg-accent">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedStrategy && (
                <form onSubmit={(e) => { e.preventDefault(); runSimulation(); }} className="space-y-4 p-6 bg-background/50 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{selectedStrategy.name} Parameters</h3>
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
                          disabled={isSuggesting || isSimulating}
                        />
                      )}
                      {param.type === 'select' && param.options && (
                        <Select
                          onValueChange={value => handleParamChange(param.id, value)}
                          defaultValue={param.defaultValue as string || undefined}
                          value={params[param.id] as string || undefined}
                          disabled={isSuggesting || isSimulating}
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
                    Run AI Simulation for {selectedStrategy.name}
                  </Button>
                </form>
              )}
              {!selectedStrategy && !isSuggesting && !isSimulating && (
                <div className="p-6 bg-background/30 rounded-lg shadow-inner text-center text-muted-foreground min-h-[200px] flex flex-col justify-center items-center">
                  <Info className="h-8 w-8 mb-3" />
                  <p>Select a risk profile and either get general AI suggestions or choose a specific strategy above to simulate its parameters.</p>
                </div>
              )}
            </div>
          </div>
           {selectedStrategy && (
                <Alert variant="default" className="mt-4 bg-accent/20 border-accent/30">
                  <Info className="h-5 w-5 text-accent-foreground" />
                  <AlertTitle className="font-semibold text-accent-foreground">{selectedStrategy.name}</AlertTitle>
                  <AlertDescription className="text-muted-foreground text-sm">
                    {selectedStrategy.description}
                    <Accordion type="single" collapsible className="w-full mt-2">
                      <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger className="text-sm py-1 hover:no-underline text-primary hover:text-primary/80">Learn More Details</AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pt-1 prose-sm dark:prose-invert max-w-full">
                          {selectedStrategy.longDescription && <p className="mb-1">{selectedStrategy.longDescription}</p>}
                          {selectedStrategy.okxContext && <><strong>OKX/X Layer Context:</strong> {selectedStrategy.okxContext}</>}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AlertDescription>
                </Alert>
              )}

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="gasless-quote-tool" className="glass-card !bg-card/70 border-border/50 rounded-lg overflow-hidden">
                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-accent/10">
                        <div className="flex items-center text-lg font-semibold text-primary">
                            <TestTube2 className="mr-3 h-5 w-5" /> 0x Gasless Swap Quote Tool
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t border-border/30 bg-background/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="text-md font-semibold text-foreground">Request Quote</h4>
                                <div className="space-y-2">
                                    <div>
                                        <Label htmlFor="sellToken">Sell Token Address</Label>
                                        <Input id="sellToken" name="sellToken" value={zeroExInput.sellToken} onChange={handleZeroExInputChange} placeholder="e.g., 0xC183..."/>
                                    </div>
                                    <div>
                                        <Label htmlFor="buyToken">Buy Token Address</Label>
                                        <Input id="buyToken" name="buyToken" value={zeroExInput.buyToken} onChange={handleZeroExInputChange} placeholder="e.g., 0xdac1..."/>
                                    </div>
                                    <div>
                                        <Label htmlFor="sellAmount">Sell Amount (in wei)</Label>
                                        <Input id="sellAmount" name="sellAmount" value={zeroExInput.sellAmount} onChange={handleZeroExInputChange} placeholder="e.g., 1000000000000000000"/>
                                    </div>
                                     <div>
                                        <Label htmlFor="takerAddress">Taker Address (Optional)</Label>
                                        <Input id="takerAddress" name="takerAddress" value={zeroExInput.takerAddress} onChange={handleZeroExInputChange} placeholder="Your wallet address" disabled/>
                                    </div>
                                </div>
                                <Button onClick={handleFetchGaslessQuote} disabled={isFetchingQuote} className="w-full">
                                    {isFetchingQuote ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                    Fetch 0x Gasless Quote
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-md font-semibold text-foreground">Quote Result</h4>
                                {isFetchingQuote ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                    </div>
                                ) : (
                                    <GaslessQuoteDisplay result={gaslessQuoteResult} />
                                )}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

          {(isSimulating || isSuggesting) && !simulationResult && (
            <div className="text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">AI is thinking... Please wait.</p>
              <p className="text-sm text-muted-foreground">Generating insights for your {selectedRiskProfile} profile.</p>
            </div>
          )}

          {simulationResult && (
            <Card className="mt-8 glass-card !bg-card/80 shadow-2xl">
              <CardHeader className="bg-primary/10">
                <CardTitle className="text-2xl font-bold text-foreground">
                  AI Simulation Outcome: <span className="text-primary">{simulationResult.strategyName}</span>
                </CardTitle>
                 {displayTime && <CardDescription className="text-xs text-muted-foreground">Generated at: {displayTime} for {selectedRiskProfile} profile</CardDescription>}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {simulationResult.aiSuggestions && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">AI Suggested Strategies:</h4>
                    <div className="ai-response-text p-3 bg-background/30 rounded-md max-h-60 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: simulationResult.aiSuggestions || '' }}></div>
                  </div>
                )}
                 {simulationResult.aiRationale && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Rationale:</h4>
                     <div className="ai-response-text p-3 bg-background/30 rounded-md max-h-40 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: simulationResult.aiRationale || '' }}></div>
                  </div>
                )}
                {simulationResult.aiExplanation && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">AI Detailed Explanation:</h4>
                    <div className="ai-response-text p-3 bg-background/30 rounded-md max-h-80 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: simulationResult.aiExplanation || '' }}></div>
                  </div>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                </div>

                {simulationResult.lastGaslessQuoteDetails && (
                  <div className="space-y-2 pt-4 border-t border-border/30">
                      <h4 className="text-lg font-semibold text-foreground">Last 0x Gasless Quote Fetched</h4>
                      <div className="p-3 bg-background/30 rounded-md text-xs space-y-1 text-muted-foreground">
                        <p><strong>Sell:</strong> {simulationResult.lastGaslessQuoteDetails.sellAmount} of <span className="font-mono">{simulationResult.lastGaslessQuoteDetails.sellTokenAddress}</span></p>
                        <p><strong>Buy:</strong> {simulationResult.lastGaslessQuoteDetails.buyAmount} of <span className="font-mono">{simulationResult.lastGaslessQuoteDetails.buyTokenAddress}</span></p>
                        <p><strong>Price:</strong> {simulationResult.lastGaslessQuoteDetails.price}</p>
                        <p><strong>Guaranteed Price:</strong> {simulationResult.lastGaslessQuoteDetails.guaranteedPrice}</p>
                        <p><strong>Sources:</strong> {simulationResult.lastGaslessQuoteDetails.sources.map(s => `${s.name} (${parseFloat(s.proportion) * 100}%)`).join(', ')}</p>
                      </div>
                      <p className="text-xs italic text-muted-foreground/80">Note: This quote was from the separate 0x tool and is shown for context.</p>
                  </div>
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
                    This simulation is powered by AI and based on a mix of real and mock data for demonstration purposes. It is not financial advice. Always do your own research (DYOR) before making any investment decisions. DeFi involves significant risks.
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
 