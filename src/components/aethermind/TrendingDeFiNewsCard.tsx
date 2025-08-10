
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper, Zap } from "lucide-react";

const mockNewsItems = [
  {
    id: "1",
    title: "New Yield Farming Protocol 'NovaYield' Shows Promising Early APYs",
    snippet: "NovaYield, built on a Layer 2 solution, is attracting attention with its innovative tokenomics and high initial returns for ETH and stablecoin pairs...",
    source: "DeFi Pulse",
    time: "2h ago",
    link: "#", // Placeholder link
  },
  {
    id: "2",
    title: "OKX DEX Announces Integration with Cross-Chain Bridge for Enhanced Liquidity",
    snippet: "The latest update to OKX DEX includes a seamless bridge to multiple chains, aiming to deepen liquidity pools and offer users more arbitrage opportunities...",
    source: "OKX Press",
    time: "5h ago",
    link: "#",
  },
  {
    id: "3",
    title: "Understanding Impermanent Loss: New Tools Emerge for Prediction",
    snippet: "Several analytics platforms are launching advanced calculators and AI models to help DeFi users better estimate and manage impermanent loss in volatile markets...",
    source: "CoinDesk",
    time: "1d ago",
    link: "#",
  },
  {
    id: "4",
    title: "Flash Loan Arbitrage: Risks vs. Rewards in the Current Market",
    snippet: "A deep dive into the viability of flash loan arbitrage strategies on various DEXs, highlighting recent successful exploits and potential pitfalls...",
    source: "The DeFi Report",
    time: "3d ago",
    link: "#",
  },
];

export function TrendingDeFiNewsCard() {
  return (
    <Card className="glass-card !bg-card/60 mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center">
          <Newspaper className="mr-3 h-5 w-5 text-primary" />
          Trending DeFi Strategies & News
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[200px] pr-3">
          <div className="space-y-4">
            {mockNewsItems.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-background/70 rounded-md shadow-sm hover:bg-accent/50 transition-colors group"
              >
                <h4 className="text-sm font-medium text-primary group-hover:underline">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.snippet}
                </p>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground/80">
                  <span>{item.source}</span>
                  <span className="flex items-center">
                     <Zap size={12} className="mr-1 text-primary/70" /> {item.time}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground mt-3 text-center italic">
          News feed is for demonstration purposes. Real-time integration is a future enhancement.
        </p>
      </CardContent>
    </Card>
  );
}
 