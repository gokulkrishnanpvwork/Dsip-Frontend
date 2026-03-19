
import React, { useState } from 'react';
import { Stock } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DailyActionCardProps {
  stock: Stock;
  onExecute: (id: string, amount: number) => void;
}

const DailyActionCard: React.FC<DailyActionCardProps> = ({ stock, onExecute }) => {
  const [insight] = useState<string>("Market conditions favorable for accumulation.");
  const [executing, setExecuting] = useState(false);

  const checkSkipped = () => {
    if (stock.history.length === 0) return false;
    const lastTradeDate = new Date(stock.history[stock.history.length - 1].date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastTradeDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 1.5;
  };

  const isSkipped = checkSkipped();
  const dailyBase = stock.totalBudget / stock.partitionDays;
  const isRedDay = Math.random() > 0.6;
  const multiplier = (isRedDay ? 1.5 : 1.0) * (isSkipped ? 1.2 : 1.0);
  const recommendedAmount = Math.round(dailyBase * multiplier);
  // Removed unused progress variable

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => {
      onExecute(stock.id, recommendedAmount);
      setExecuting(false);
    }, 1500);
  };

  if (stock.isPaused) return null;

  return (
    <Card className="overflow-hidden border-primary/20 shadow-md">
      <CardHeader className="pb-4 relative">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle>{stock.symbol}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Optimal Deployment
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target</p>
            <p className="text-2xl font-bold">${recommendedAmount.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isSkipped && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 text-xs flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-semibold">Sync Adjusted:</span> Previous gap detected.
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-md border text-sm italic text-muted-foreground">
          " {insight} "
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          onClick={handleExecute}
          disabled={executing}
        >
          {executing ? (
            <>Running Strategy...</>
          ) : (
            <>Execute ${recommendedAmount.toLocaleString()}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyActionCard;
