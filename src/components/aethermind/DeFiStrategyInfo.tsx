"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getStrategyExplanation } from "@/lib/actions";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

interface DeFiStrategyInfoProps {
  strategy: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
  };
}

export function DeFiStrategyInfo({ strategy }: DeFiStrategyInfoProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  const fetchExplanation = async () => {
    if (explanation) return; // Already fetched
    startLoading(async () => {
      const result = await getStrategyExplanation({ strategy: strategy.name });
      setExplanation(result);
    });
  };

  return (
    <Card className="glass-card text-center p-6 hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-1">
      <CardHeader className="items-center pb-3">
        <div className="p-3 rounded-full bg-primary/20 mb-4 inline-block">
          {strategy.icon}
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">{strategy.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{strategy.description}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={fetchExplanation} className="hover:bg-accent/50 hover:border-primary/50">
              <Info className="mr-2 h-4 w-4" /> Learn More with AI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg glass-card">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">{strategy.name} - AI Explanation</DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Powered by AetherMind AI
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 text-sm leading-relaxed">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3 text-muted-foreground">AI is generating explanation...</p>
                </div>
              )}
              {explanation ? (
                <p className="whitespace-pre-line">{explanation}</p>
              ) : (
                !isLoading && <p>No explanation available yet. Click "Learn More" again or try later.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
