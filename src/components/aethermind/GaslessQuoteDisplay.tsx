
"use client";

import type { FetchGaslessQuoteResult } from '@/services/zeroxService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GaslessQuoteDisplayProps {
  result: FetchGaslessQuoteResult | null;
}

export function GaslessQuoteDisplay({ result }: GaslessQuoteDisplayProps) {
  if (!result) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg h-full flex items-center justify-center">
        <p>No quote fetched yet. Enter details and fetch a quote to see results here.</p>
      </div>
    );
  }

  if (result.error) {
    return (
      <Alert variant="destructive" className="bg-destructive/20 border-destructive/50">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertTitle>Error Fetching Quote</AlertTitle>
        <AlertDescription className="text-xs">{result.error}</AlertDescription>
        {result.errorDetails && (
            <div className="mt-2 text-xs">
                <p><strong>Reason:</strong> {result.errorDetails.reason}</p>
                {result.errorDetails.validationErrors && (
                    <ul className="list-disc pl-4 mt-1">
                        {result.errorDetails.validationErrors.map((ve, i) => (
                            <li key={i}><strong>{ve.field}:</strong> {ve.reason}</li>
                        ))}
                    </ul>
                )}
            </div>
        )}
      </Alert>
    );
  }

  if (!result.quote) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Quote Available</AlertTitle>
        <AlertDescription>The API did not return a valid quote for the given parameters.</AlertDescription>
      </Alert>
    );
  }

  const { quote } = result;

  return (
    <Card className="glass-card !bg-card/50 shadow-inner h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            0x Gasless Quote Received
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <ScrollArea className="h-[210px] pr-2">
            <div className="space-y-2">
                <div>
                    <p className="text-muted-foreground">Sell</p>
                    <p className="font-mono break-all text-primary">{quote.sellAmount}</p>
                    <p className="font-mono break-all">{quote.sellTokenAddress}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Buy</p>
                    <p className="font-mono break-all text-primary">{quote.buyAmount}</p>
                    <p className="font-mono break-all">{quote.buyTokenAddress}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-mono break-all">{quote.price}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Guaranteed Price</p>
                    <p className="font-mono break-all">{quote.guaranteedPrice}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Sources</p>
                    <p>{quote.sources.map(s => `${s.name} (${(parseFloat(s.proportion) * 100).toFixed(1)}%)`).join(', ')}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Est. Gas</p>
                    <p className="font-mono break-all">{quote.estimatedGas}</p>
                </div>
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
