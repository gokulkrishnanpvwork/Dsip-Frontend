import React, { useState, useMemo, useCallback } from 'react';
import { Icons } from '../constants';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import InfoTooltip from './InfoTooltip';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setShowDsipOnly } from '../store/slices/stocksSlice';
import { fetchTrackerDetails } from '../store/slices/trackersSlice';
import { syncTrackerData } from '../lib/api.fetcher';
import { useToast } from '@/hooks/use-toast';
import { Execution } from '../types/tracker.types';

const Performance: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Redux state
  const { stocks, showDsipOnly } = useAppSelector(state => state.stocks);
  const { selectedTracker } = useAppSelector(state => state.trackers);

  // Sync state
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [syncForm, setSyncForm] = useState({ totalInvested: '', totalShares: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Derive data source
  const trackerData = selectedTracker?.tracker || null;
  const selectedStockId = trackerData?.trackerId?.toString() || null;

  // Memoized metrics computation
  const metrics = useMemo(() => {
    if (!selectedStockId || !trackerData) return null;

    let history: Array<Execution> = [];

    const totalInvested = showDsipOnly
      ? (trackerData.dsip_total_capital_invested_so_far || 0)
      : (trackerData.total_capital_invested_so_far || 0);

    history = selectedTracker?.recentExecutions || [];

    const currentValue = showDsipOnly
      ? (trackerData.dsip_total_market_value || 0)
      : (trackerData.total_market_value || 0);

    const totalPL = currentValue - totalInvested;
    const isProfit = totalPL >= 0;

    const percentageChange = showDsipOnly
      ? (trackerData.dsip_net_profit_percentage || 0)
      : (trackerData.net_profit_percentage || 0);

    // Sort history once during computation
    const sortedHistory = [...history]
      .sort((a, b) => {
        const dateA = new Date(String(a.createdAt)).getTime();
        const dateB = new Date(String(b.createdAt)).getTime();
        return dateB - dateA;
      })
      .slice(0, 15);

    return {
      totalInvested,
      currentValue,
      totalPL,
      isProfit,
      percentageChange,
      sortedHistory,
    };
  }, [stocks, selectedStockId, selectedTracker, trackerData, showDsipOnly]);

  // Sync handler — memoized to avoid recreation on each render
  const handleSync = useCallback(async () => {
    const userInvested = Number(syncForm.totalInvested);
    const userShares = Number(syncForm.totalShares);

    if (!userInvested || !userShares) return;

    const trackerId = trackerData?.trackerId;
    if (!trackerId) {
      setSyncError('No tracker selected. Please select a tracker first.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await syncTrackerData({
        tracker_id: trackerId,
        current_total_shares: userShares,
        current_total_invested_amount: userInvested,
        reason: 'Manual sync from broker statement',
      });

      if (result.success) {
        dispatch(fetchTrackerDetails(trackerId));
        setShowSyncPopup(false);
        setSyncForm({ totalInvested: '', totalShares: '' });
        toast({
          title: '✅ Portfolio Synced',
          description: 'Your holdings have been updated successfully.',
        });
      } else {
        setSyncError(result.message || 'Sync failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sync portfolio data';
      setSyncError(message);
    } finally {
      setIsSyncing(false);
    }
  }, [syncForm, trackerData, dispatch, toast]);

  // Early return after all hooks
  if (!metrics) return null;

  const { totalInvested, currentValue, totalPL, isProfit, percentageChange, sortedHistory } = metrics;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight">Investment</h3>
          <p className="text-sm text-muted-foreground">Performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="dsip-toggle-perf" className="text-[10px] uppercase font-bold text-muted-foreground">DSIP Only</Label>
          <Switch
            id="dsip-toggle-perf"
            checked={showDsipOnly}
            onCheckedChange={(show) => dispatch(setShowDsipOnly(show))}
            className="scale-75"
          />
        </div>
      </div>

      {/* Sync Button */}
      {!showDsipOnly && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSyncPopup(true)}
          className="w-full h-8 text-xs bg-background hover:bg-muted border-dashed mb-2"
        >
          <Icons.Refresh className="mr-2 w-3.5 h-3.5" /> Sync Portfolio
        </Button>
      )}

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card border shadow-sm space-y-1">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Price</span>
              <InfoTooltip text="The current live market price of the stock." />
            </div>
            <div className="text-xl font-bold">
              $ {trackerData?.current_market_price != null ? trackerData.current_market_price : '-'}
            </div>
          </div>
          {/* Hide the current average if the DSIP only capital is zero */}
          {!((trackerData?.dsip_total_capital_invested_so_far ?? 0) === 0 && showDsipOnly) && (
            <div className="p-4 rounded-xl bg-card border shadow-sm space-y-1">
              <div className="flex items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Average</span>
                <InfoTooltip text="Your average buy price across all purchases for this stock." />
              </div>
              <div className="text-xl font-bold">
                $ {showDsipOnly
                  ? (trackerData?.dsip_current_avg != null ? trackerData.dsip_current_avg : '-')
                  : (trackerData?.current_avg != null ? trackerData.current_avg : '-')}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-card border shadow-sm space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {showDsipOnly ? "DSIP Invested" : "Total Invested"}
            </span>
          </div>
          <div className="text-2xl font-bold">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div className="p-4 rounded-xl bg-card border shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Value</span>
            <div className="flex items-center gap-1">
              {isProfit ? (
                <Icons.ArrowUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <Icons.ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isProfit ? '+' : ''}{percentageChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="text-2xl font-bold">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div className={cn("p-4 rounded-xl border shadow-sm space-y-1", isProfit ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400")}>
          <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">Total P&L</span>
          <div className="text-3xl font-black tracking-tight">
            {isProfit ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-3 pt-8">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Recent History
        </h4>
        <div className="space-y-2">
          {sortedHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No transactions recorded yet.</p>
          ) : (
            sortedHistory.map((tx, i) => {
              const date = String(tx.createdAt);
              const amount = Number(tx.executedAmount);

              return (
                <div key={`${date}-${amount}-${i}`} className="flex justify-between items-center p-3 border rounded-xl bg-card text-sm shadow-sm transition-colors hover:bg-accent/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">{new Date(date).toLocaleDateString()}</span>
                  </div>
                  <span className="font-mono font-bold">${amount.toLocaleString()}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sync Dialog */}
      <Dialog open={showSyncPopup} onOpenChange={setShowSyncPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.Refresh className="w-5 h-5 text-primary" />
              Sync Portfolio
            </DialogTitle>
            <DialogDescription>
              Manually update your total holdings to match your broker. We'll adjust the base records while keeping your current cycle intact.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Total Invested Amount ($)</Label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                value={syncForm.totalInvested}
                onChange={(e) => setSyncForm({ ...syncForm, totalInvested: e.target.value })}
                className="h-11 font-mono text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Total Shares Quantity</Label>
              <Input
                type="number"
                placeholder="e.g. 50.5"
                value={syncForm.totalShares}
                onChange={(e) => setSyncForm({ ...syncForm, totalShares: e.target.value })}
                className="h-11 font-mono text-lg"
              />
            </div>

            {(syncForm.totalInvested && syncForm.totalShares) && (
              <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1 border border-dashed">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calculated Avg Price:</span>
                  <span className="font-mono font-bold">
                    ${(Number(syncForm.totalInvested) / Number(syncForm.totalShares)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {syncError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <div className="flex items-start gap-2">
                  <Icons.AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">Sync Error</p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{syncError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowSyncPopup(false);
              setSyncError(null);
            }}>Cancel</Button>
            <Button
              onClick={handleSync}
              disabled={!syncForm.totalInvested || !syncForm.totalShares || isSyncing}
            >
              {isSyncing ? (
                <>
                  <Icons.Refresh className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Update Portfolio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Performance;
