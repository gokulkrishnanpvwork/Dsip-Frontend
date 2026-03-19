import React, { useState } from 'react';
import { useLocation, useMatch } from 'react-router-dom';
import { Icons } from '../constants';
import { Stock } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LeftSidebarProps {
  stocks: Stock[];
  onSelectStock: (id: string) => void;
  onCreateNew: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  stocks,
  onSelectStock,
  onCreateNew
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const trackerMatch = useMatch('/tracker/:id');

  const isAddStock = location.pathname === '/create-tracker';
  const selectedStockId = trackerMatch?.params.id ?? null;

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full h-full flex flex-col bg-background">
      {/* Header / Create CTA */}
      <div className="p-3 border-b">
        <Button
          variant={isAddStock ? "default" : "outline"}
          className="w-full justify-start h-auto py-3 px-4 gap-3"
          onClick={onCreateNew}
        >
          <div className="p-1 rounded-md bg-transparent">
            <Icons.Plus />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold">Activate Stock Engine</p>
            <p className="text-[10px] opacity-70 font-normal">Create DSIP instance</p>
          </div>
        </Button>
      </div>

      {/* Active Instances List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Stock Engines</p>

          {/* Search Input */}
          <div className="px-2">
            <Input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Strategies List with Border */}
          <div className="border border-border rounded-md p-2 space-y-1">

            {filteredStocks.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground font-medium">
                  {searchQuery ? 'No stock engines found' : 'No active stock engines'}
                </p>
              </div>
            ) : (
              filteredStocks.map(stock => {
                const isActive = selectedStockId === stock.id;
                const profitLossPct = stock.net_profit_percentage !== undefined
                  ? stock.net_profit_percentage
                  : (stock.currentAverage > 0
                    ? ((stock.currentPrice - stock.currentAverage) / stock.currentAverage) * 100
                    : 0);
                const isProfit = profitLossPct >= 0;

                return (
                  <button
                    key={stock.id}
                    onClick={() => onSelectStock(stock.id)}
                    className={cn(
                      "w-full p-3 rounded-md text-left border transition-all hover:bg-accent hover:text-accent-foreground group",
                      isActive
                        ? "bg-accent text-accent-foreground border-border"
                        : "bg-transparent border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">
                        {stock.symbol}
                      </span>
                      {stock.isPaused && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Paused" />
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Invested</span>
                        <span className="text-xs font-mono font-medium">${stock.deployedAmount.toLocaleString()}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-sm",
                        isProfit ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        {isProfit ? '+' : ''}{profitLossPct.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default LeftSidebar;
