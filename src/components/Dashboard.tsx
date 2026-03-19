import React, { useEffect, useState } from 'react';
import { Stock } from '../types';
import { Icons } from '../constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllTrackers } from '../store/slices/trackersSlice';
import { setShowDsipOnly } from '../store/slices/stocksSlice';
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import InfoTooltip from './InfoTooltip';

interface DashboardProps {
  stocks: Stock[];
  onAddStock: () => void;
  onSelectStock: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stocks, onAddStock, onSelectStock }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackerToDelete, setTrackerToDelete] = useState<{ id: number; symbol: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get tracker data from Redux store
  const {
    trackers,
    portfolioSummary,
    isLoadingTrackers,
    error: trackersError,
  } = useAppSelector((state) => state.trackers);

  // DSIP Only toggle from Redux
  const showDsipOnly = useAppSelector((state) => state.stocks.showDsipOnly);

  // Debug: Log state changes
  useEffect(() => {
    console.log('[Dashboard] State:', {
      trackersCount: trackers.length,
      isLoadingTrackers,
      trackersError,
      portfolioSummary,
    });
  }, [trackers, isLoadingTrackers, trackersError, portfolioSummary]);

  // Handle delete tracker
  const handleDeleteClick = (trackerId: number, symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setTrackerToDelete({ id: trackerId, symbol });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!trackerToDelete) return;

    setIsDeleting(true);
    try {
      const { deleteTracker } = await import('../lib/api.fetcher');
      await deleteTracker(trackerToDelete.id);

      // Refresh trackers list
      dispatch(fetchAllTrackers());

      // Close dialog
      setDeleteDialogOpen(false);
      setTrackerToDelete(null);

      console.log('[Dashboard] Tracker deleted successfully:', trackerToDelete.symbol);
    } catch (error) {
      console.error('[Dashboard] Failed to delete tracker:', error);
      alert(`Failed to delete tracker ${trackerToDelete.symbol}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate portfolio metrics from API data if available, otherwise use hardcoded stocks
  const useApiData = trackers.length > 0;

  let totalInvestedValue = 0;
  let currentMarketValue = 0;
  let activeCount = 0;
  let totalCount = 0;

  if (useApiData && portfolioSummary) {
    totalInvestedValue = showDsipOnly
      ? portfolioSummary.dsipTotalCapitalInvested
      : portfolioSummary.totalCapitalInvested;
    currentMarketValue = showDsipOnly
      ? portfolioSummary.dsipTotalCurrentValue
      : portfolioSummary.totalCurrentValue;
    activeCount = portfolioSummary.activeTrackers;
    totalCount = portfolioSummary.totalTrackers;
  } else {
    // Fallback to hardcoded stocks data
    stocks.forEach(stock => {
      const sipQuantity = stock.history.reduce((acc, curr) => acc + (curr.amount / curr.price), 0);
      const totalQuantity = stock.quantityOwned + sipQuantity;
      const stockInvestment = (stock.quantityOwned * stock.averagePriceOwned) + stock.deployedAmount;

      totalInvestedValue += stockInvestment;
      currentMarketValue += (totalQuantity * stock.currentPrice);
    });
    activeCount = stocks.filter(s => !s.isPaused).length;
    totalCount = stocks.length;
  }

  const totalProfitLossPct = totalInvestedValue > 0
    ? ((currentMarketValue - totalInvestedValue) / totalInvestedValue) * 100
    : 0;

  const isPortfolioProfit = totalProfitLossPct >= 0;

  console.log('[Dashboard] Rendering with:', {
    useApiData,
    trackersLength: trackers.length,
    isLoadingTrackers,
    trackersError,
    stocksLength: stocks.length,
  });

  return (
    <>
      <div className="h-full p-4 md:p-6 space-y-6">

        {/* Main Content */}
        <div className="space-y-6">

          {/* Actions are removed as per request. 
            If we need to access them, we might need a dedicated page or a different entry point. 
            For now, completely removing the section. 
        */}

          {/* Portfolio Stats & Grid - Now Full Width/Centered */}
          <div className="space-y-8">

            {/* <Card className="bg-primary text-primary-foreground p-6 overflow-hidden relative border-none shadow-2xl max-w-3xl mx-auto">

              <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider mb-1 flex items-center gap-2">
                      Total Market Value
                      <InfoTooltip text="Market value as of yesterday's close + today's moves" />
                    </h3>
                    <p className="text-3xl font-bold tracking-tight">${Math.round(currentMarketValue).toLocaleString()}</p>
                  </div>
              </div>

              <div className="relative z-10 mt-6 grid grid-cols-3 gap-4 border-t border-primary-foreground/20 pt-6">
                 <div>
                    <p className="text-xs font-medium opacity-70 uppercase tracking-wider mb-1">Invested</p>
                    <p className="text-xl font-bold">${Math.round(totalInvestedValue).toLocaleString()}</p>
                 </div>
                 <div>
                    <p className="text-xs font-medium opacity-70 uppercase tracking-wider mb-1">Active</p>
                    <p className="text-xl font-bold">{stocks.filter(s => !s.isPaused).length}</p>
                 </div>
              </div>
           </Card> */}

            <Card className="relative overflow-hidden border shadow-xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black dark:border-gray-800">
              {/* Decorative Elements */}
              {/* <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Icons.Activity size={100} />
                  </div> */}
              <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 p-6 md:p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        {showDsipOnly ? 'DSIP Market Value' : 'Total Market Value'}
                        <InfoTooltip text="Market value as of yesterday's close + today's moves" />
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="dsip-toggle-dashboard" className="text-[10px] uppercase font-bold text-muted-foreground">DSIP Only</Label>
                        <Switch
                          id="dsip-toggle-dashboard"
                          checked={showDsipOnly}
                          onCheckedChange={(show) => dispatch(setShowDsipOnly(show))}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    <p className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                      ${currentMarketValue}
                    </p>
                  </div>
                  <div className="bg-background/50 border shadow-sm px-4 py-2 rounded-xl backdrop-blur-md">
                    <div className={isPortfolioProfit ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-muted-foreground mb-0.5">Net Yield</span>
                      <span className="text-xl font-black flex items-center gap-1">
                        {isPortfolioProfit ? <Icons.TrendUp size={16} /> : <Icons.TrendDown size={16} />}
                        {totalProfitLossPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] Font-bold text-muted-foreground uppercase tracking-widest">
                      {showDsipOnly ? 'DSIP Invested' : 'Invested Capital'}
                    </p>
                    <p className="text-2xl font-bold text-foreground">${totalInvestedValue}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] Font-bold text-muted-foreground uppercase tracking-widest">Active Engines</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">{activeCount}</span>
                      <span className="text-xs text-muted-foreground font-medium self-end mb-1">/ {totalCount} Total</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div>
            
              {/* Stock Cards Grid */}
              <h2 className="text-lg font-semibold tracking-tight mb-4">Stock Engine Performance</h2>
              {!isLoadingTrackers && !trackersError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 
                  {/* Render API trackers */}
                  {useApiData && trackers.map((tracker, index) => {
                    console.log(`[Dashboard] Rendering tracker ${index}:`, tracker.stockSymbol);
                      
                    const totalInvested = showDsipOnly
                      ? tracker.dsipTotalCaptialInvestedSoFar
                      : tracker.totalCapitalInvestedSoFar;
                    const currentValue = tracker.sharesHeldSoFar * tracker.currentPrice;
                    const pnlPct = showDsipOnly
                      ? (tracker.dsip_net_profit_percentage ?? 0)
                      : (tracker.net_profit_percentage !== undefined
                        ? tracker.net_profit_percentage
                        : (totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0));
                    const isStockProfit = pnlPct >= 0;
                    const isPaused = tracker.status !== 1; // 1 = ACTIVE

                    // Prevent division by zero for deployment percentage
                    const deploymentPct = tracker.totalCapitalPlanned > 0
                      ? ((tracker.dsipTotalCaptialInvestedSoFar / tracker.totalCapitalPlanned) * 100)
                      : 0;
                          
                    return (
                      <Card
                        key={tracker.trackerId}
                        className="cursor-pointer hover:bg-accent/50 transition-colors group relative"
                        onClick={() => onSelectStock(tracker.trackerId.toString())}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                                {tracker.stockSymbol.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="font-bold leading-none">{tracker.stockSymbol}</h4>
                                <span className={isStockProfit ? "text-emerald-600 dark:text-emerald-400 text-xs font-bold" : "text-red-600 dark:text-red-400 text-xs font-bold"}>
                                  {isStockProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPaused && <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm">Paused</span>}

                              {/* 3-Dot Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-accent"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Icons.MoreVertical size={16} />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectStock(tracker.trackerId.toString());
                                    }}
                                  >
                                    <Icons.Settings className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={(e) => handleDeleteClick(tracker.trackerId, tracker.stockSymbol, e)}
                                  >
                                    <Icons.Trash className="mr-2 h-4 w-4" />
                                    <span>Delete Tracker</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-end text-xs">
                              <span className="text-muted-foreground font-medium uppercase tracking-wider">Deployment</span>
                              <span className="font-bold text-primary">
                                {deploymentPct.toFixed(1)}%
                              </span>
                    
                            </div>
                            <div className="h-4 w-full bg-secondary/50 rounded-full overflow-hidden relative shadow-inner border border-black/5">
                              <div
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${Math.min(deploymentPct, 100)}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground/40 mix-blend-difference">
                                ${tracker.dsipTotalCaptialInvestedSoFar.toLocaleString()} / ${tracker.totalCapitalPlanned.toLocaleString()}
                              </div>
                            </div>

                            <Button
                              className="w-full mt-4 h-8 text-xs font-bold uppercase tracking-wider"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                onSelectStock(tracker.trackerId.toString());
                              }}
                            >
                              <Icons.Zap className="w-3 h-3 mr-2" /> Execute
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                 

                  {!useApiData && stocks.map(stock => {
                    const sipQuantity = stock.history.reduce((acc, curr) => acc + (curr.amount / curr.price), 0);
                    const totalQuantity = stock.quantityOwned + sipQuantity;
                    const totalInvested = (stock.quantityOwned * stock.averagePriceOwned) + stock.deployedAmount;
                    const currentAvg = totalQuantity > 0 ? totalInvested / totalQuantity : stock.currentPrice;
                    const pnlPct = currentAvg > 0 ? ((stock.currentPrice - currentAvg) / currentAvg) * 100 : 0;
                    const isStockProfit = pnlPct >= 0;

                    return (
                      <Card
                        key={stock.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors group"
                        onClick={() => onSelectStock(stock.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                                {stock.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="font-bold leading-none">{stock.symbol}</h4>
                                <span className={isStockProfit ? "text-emerald-600 dark:text-emerald-400 text-xs font-bold" : "text-red-600 dark:text-red-400 text-xs font-bold"}>
                                  {isStockProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            {stock.isPaused && <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm">Paused</span>}
                          </div>
                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-end text-xs">
                              <span className="text-muted-foreground font-medium uppercase tracking-wider">Deployment</span>
                              <span className="font-bold text-primary">
                                {((stock.deployedAmount / stock.totalBudget) * 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="h-4 w-full bg-secondary/50 rounded-full overflow-hidden relative shadow-inner border border-black/5">
                              <div
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${Math.min((stock.deployedAmount / stock.totalBudget) * 100, 100)}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground/40 mix-blend-difference">
                                ${stock.deployedAmount.toLocaleString()} / ${stock.totalBudget.toLocaleString()}
                              </div>
                            </div>

                            <Button
                              className="w-full mt-4 h-8 text-xs font-bold uppercase tracking-wider"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                onSelectStock(stock.id);
                              }}
                            >
                              <Icons.Zap className="w-3 h-3 mr-2" /> Execute
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Icons.AlertTriangle className="w-5 h-5" />
              Delete Tracker
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the tracker for <strong>{trackerToDelete?.symbol}</strong>?
              <br /><br />
              This action cannot be undone. All execution history and configuration will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTrackerToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Tracker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
