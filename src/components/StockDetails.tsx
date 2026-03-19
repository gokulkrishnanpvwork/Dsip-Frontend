import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { Stock } from '../types';
import { useAppSelector, useAppDispatch } from '../store/hooks';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Performance from './Performance';

interface StockDetailsProps {
  stock: Stock;
  onBack: () => void;
  onUpdate: (stock: Stock) => void;
  onCopyStrategy?: (config: Partial<Stock>) => void;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
            className="inline-flex items-center justify-center ml-1.5 w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer align-middle ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <Icons.Info size={11} className="shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-popover text-popover-foreground border shadow-lg"
          sideOffset={5}
        >
          <p className="text-xs leading-relaxed font-normal normal-case">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StockDetails: React.FC<StockDetailsProps> = ({ stock, onBack, onUpdate, onCopyStrategy }) => {
  // Redux dispatch
  const dispatch = useAppDispatch();


  // Get tracker data from Redux store
  const {
    selectedTracker,
    isLoadingTrackerDetails,
    trackerDetailsError,
  } = useAppSelector((state) => state.trackers);

  // Debug: Log API data
  useEffect(() => {
    console.log('[StockDetails] API Data:', {
      selectedTracker,
      isLoadingTrackerDetails,
      trackerDetailsError,
    });
  }, [selectedTracker, isLoadingTrackerDetails, trackerDetailsError]);

  // ===== SETUP API DATA FIRST (BEFORE USING IN CALCULATIONS) =====
  // Use API data if available, otherwise fall back to stock prop
  const useApiData = selectedTracker !== null;
  const trackerData = useApiData ? selectedTracker?.tracker : null;

  // Log which data source we're using
  console.log('[StockDetails] Using data:', useApiData ? 'API' : 'Hardcoded', { trackerData, stock });

  // Helper function to get display values (API data takes precedence)
  const getDisplayValue = (apiValue: any, stockValue: any) => {
    return useApiData && trackerData ? apiValue : stockValue;
  };

  // Display values for UI
  const displayConvictionYears = getDisplayValue(trackerData?.conviction_period_years, stock.convictionYears);
  const displayTotalBudget = getDisplayValue(trackerData?.total_capital_planned, stock.totalBudget);
  const displayConvictionLevel = getDisplayValue(trackerData?.base_conviction_score, stock.convictionLevel);
  const displayPartitionMonths = getDisplayValue(trackerData?.partition_months, stock.partitionMonths);
  const displayDeployedAmount = getDisplayValue(trackerData?.dsip_total_capital_invested_so_far, stock.deployedAmount);
  const displaySharesHeld = getDisplayValue(trackerData?.shares_held_so_far, stock.quantityOwned);
  const displayCurrentPrice = getDisplayValue(trackerData?.currentPrice, stock.currentPrice);
  const displayInitialInvestedAmount = getDisplayValue(trackerData?.initial_invested_amount, null);
  const displayInitialSharesHeld = getDisplayValue(trackerData?.initial_shares_held, null);


  // Get deployment style as text
  const getDeploymentStyleText = () => {
    if (!useApiData || !trackerData) return stock.loadFactor;
    // API mapping: 1=GRADUAL, 2=MODERATE, 3=AGGRESSIVE
    const styleMap: Record<number, string> = {
      1: 'Gradual Build',
      2: 'Balanced Build',
      3: 'Aggressive Early Build',
    };
    return styleMap[trackerData.deployment_style] || 'Balanced Build';
  };
  const displayLoadFactor = getDeploymentStyleText();
  // ===== END API DATA SETUP =====

  // Execution State: 'IDLE' -> 'CALCULATED' -> 'CONFIRMING'
  const [executionState, setExecutionState] = useState<'IDLE' | 'CALCULATED' | 'CONFIRMING'>('IDLE');


  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editConfig, setEditConfig] = useState({
    totalBudget: stock.totalBudget,
    convictionYears: stock.convictionYears,
    loadFactor: stock.loadFactor,
    partitionMonths: stock.partitionMonths,
    convictionLevel: stock.convictionLevel,
  });
  const [showWarning, setShowWarning] = useState(false);
  const [showDailyLimitWarning, setShowDailyLimitWarning] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showVictoryPopup, setShowVictoryPopup] = useState(false);
  const [showKillSwitchPopup, setShowKillSwitchPopup] = useState(false);
  const [executionResponse, setExecutionResponse] = useState<any>(null); // Store API response for popups
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Daily Context Inputs
  const [lockInPct, setLockInPct] = useState<string>('');
  // Initialize with base_conviction_score from tracker data, default to 50 if not available
  const [convictionOverride, setConvictionOverride] = useState<number[]>([displayConvictionLevel || 50]);

  // Sync convictionOverride with API data when it loads
  useEffect(() => {
    if (displayConvictionLevel) {
      setConvictionOverride([displayConvictionLevel]);
    }
  }, [displayConvictionLevel]);

  // Calculated Recommendation from API
  type RecommendationResponse = {
    tracker_id: number;
    recommended_amount: number;
    breakdown: {
      neutral_capital: number;
      opportunity_multiplier: number;
      contingency_multiplier: number;
      final_multiplier: number;
    };
    signals: {
      avg_holding_price: number;
      avg_deviation_pct: number;
      avg_signal: number;
      lock_in_pct: number;
      lock_in_signal: number;
      raw_opportunity_signal: number;
      conviction_amplifier: number;
      is_abnormal_dip: boolean;
    };
    partition_status: {
      partition_index: number;
      partition_progress_pct: number;
      return_progress_pct: number;
      growth_persistence_pct: number;
      time_progress_pct: number;
      capital_progress_pct: number;
      capital_deployed: number;
      capital_remaining: number;
      cumulative_return_pct: number;
    };
  };
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Final Confirmation Inputs
  const [executedAmount, setExecutedAmount] = useState<string>('');
  const [executionPrice, setExecutionPrice] = useState<string>('');



  // Partition State & Data Helper
  const [selectedPartition, setSelectedPartition] = useState<number | null>(null);
  const [partitionDetails, setPartitionDetails] = useState<any>(null);
  const [isLoadingPartition, setIsLoadingPartition] = useState(false);

  // Partition Selector Popover State
  const [showPartitionSelector, setShowPartitionSelector] = useState(false);
  const [selectorPartitions, setSelectorPartitions] = useState<number[]>([]);
  const [selectorAnchor, setSelectorAnchor] = useState<HTMLElement | null>(null);

  // Open partition selector for grouped pills
  const handlePartitionGroupClick = (startIndex: number, endIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const partitions = [];
    for (let i = startIndex; i <= endIndex; i++) {
      partitions.push(i);
    }
    setSelectorPartitions(partitions);
    setSelectorAnchor(event.currentTarget);
    setShowPartitionSelector(true);
  };

  // Fetch partition details when a partition is selected
  const handlePartitionClick = async (index: number) => {
    // Close selector if open
    setShowPartitionSelector(false);

    setSelectedPartition(index);

    // If we have API data, fetch partition details
    if (useApiData && trackerData?.trackerId) {
      setIsLoadingPartition(true);
      try {
        const { getPartitionDetails } = await import('../lib/api.fetcher');
        const details = await getPartitionDetails(trackerData.trackerId, index);
        setPartitionDetails(details);
        console.log('[Partition Details]', details);
      } catch (error) {
        console.error('[Partition Details Error]', error);
        // Fall back to mock data
        setPartitionDetails(getPartitionData(index));
      } finally {
        setIsLoadingPartition(false);
      }
    } else {
      // Use mock data
      setPartitionDetails(getPartitionData(index));
    }
  };

  const getPartitionData = (index: number) => {
    // Mock Data Generation based on index
    if (index >= (stock.currentCycle || 2)) return null; // Future partitions have no data

    // Deterministic pseudo-random for consistent demo feel
    const seed = index * 123;
    const amount = Math.floor(2000 + (seed % 3000));
    const variation = (seed % 20) - 10;
    const price = stock.currentAverage * (1 + (variation / 100));

    return {
      partitionIndex: index + 1,
      amountInvested: amount,
      avgPrice: price,
      status: 'COMPLETED'
    };
  };

  // Derived Stats - Use API data if available
  const totalInvested = useApiData && trackerData
    ? trackerData.total_capital_invested_so_far
    : (stock.quantityOwned * stock.averagePriceOwned) + stock.deployedAmount;

  const sipQuantity = useApiData && selectedTracker
    ? selectedTracker.recentExecutions.reduce((acc, curr) => acc + (curr.executedAmount / (curr.executionPrice || 1)), 0)
    : stock.history.reduce((acc, curr) => acc + (curr.amount / curr.price), 0);

  const totalShares = displaySharesHeld + sipQuantity;

  const currentMarketValue = totalShares * displayCurrentPrice;

  const currentReturnPercent = totalInvested > 0
    ? ((currentMarketValue - totalInvested) / totalInvested * 100)
    : 0;

  // Progress - Use API data if available
  const currentCycle = useApiData && trackerData
    ? trackerData.active_partition_index || 1
    : stock.currentCycle || 10;

  const totalCycles = useApiData && trackerData
    ? trackerData.total_cycles
    : stock.totalCycles || 20;

  const daysInvested = useApiData && selectedTracker
    ? selectedTracker.recentExecutions.length
    : stock.daysInvested || 14;

  const cycleLength = displayPartitionMonths;


  const performCalculation = async () => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Get tracker ID from Redux state
      const trackerId = trackerData?.trackerId;
      if (!trackerId) {
        throw new Error('No tracker selected. Please select a tracker first.');
      }

      const lockIn = Number(lockInPct);
      if (isNaN(lockIn) || lockInPct === '') {
        throw new Error('Please enter a valid lock-in percentage');
      }

      // Import and call the API
      const { getRecommendation } = await import('../lib/api.fetcher');
      const result = await getRecommendation(trackerId, lockIn);

      setRecommendation(result);
      setExecutionState('CALCULATED');

      // Pre-fill confirmation inputs for UX convenience
      // Actual Invested Amount is auto-filled from recommendation
      setExecutedAmount(result.recommended_amount.toString());
      // Execution Price will be blank for user to fill
      setExecutionPrice('');
    } catch (error: any) {
      setCalculationError(error.message || 'Failed to calculate recommendation');
      setExecutionState('IDLE');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculate = () => {
    // Let the API handle all validation and warnings
    // The API will return appropriate response codes that control which popup to show
    performCalculation();
  };



  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      // Validate inputs
      const trackerId = trackerData?.trackerId;
      const partitionIndex = trackerData?.active_partition_index;

      if (!trackerId || !partitionIndex) {
        throw new Error('Missing tracker or partition information');
      }

      const amount = Number(executedAmount);
      const price = Number(executionPrice);
      const lockInPercentage = Number(lockInPct);
      const conviction = convictionOverride[0];

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid invested amount');
      }

      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid execution price');
      }

      if (isNaN(lockInPercentage)) {
        throw new Error('Please enter a valid lock-in percentage');
      }

      // Call the execute trade API
      const { executeTrade } = await import('../lib/api.fetcher');
      const result = await executeTrade(trackerId, {
        lock_in_percentage: lockInPercentage,
        conviction_override: conviction,
        executed_amount: amount,
        execution_price: price,
      });

      console.log('[Execute Trade Response]', result);

      // Reset form state
      setExecutionState('IDLE');
      setLockInPct('');
      setConvictionOverride([displayConvictionLevel || 50]);
      setRecommendation(null);
      setExecutedAmount('');
      setExecutionPrice('');

      // Refresh tracker details to get updated data
      const { fetchTrackerDetails } = await import('../store/slices/trackersSlice');
      dispatch(fetchTrackerDetails(trackerId));

      // Store the API response for use in popups
      setExecutionResponse(result);

      // Handle the response scenarios based on code
      if (result.code === 'SUCCESS') {
        // SUCCESS: Show victory popup with API data
        setShowVictoryPopup(true);
      } else if (result.code === 'ONGOING') {
        // ONGOING: Show success popup with API data
        setShowSuccessPopup(true);
      } else if (result.code === 'KILL_SWITCH_STAGNATION' || result.code === 'KILL_SWITCH_POOR_GROWTH' || result.code === 'NEUTRAL_PARTITION') {
        // KILL_SWITCH_* or NEUTRAL_PARTITION: Show alert with response details, then call endPartitionAction
        if (result.title && result.message) {
          const shouldEndPartition = window.confirm(
            `${result.title}\n\n${result.message}\n\nCapital Deployed: $${result.deployed_amount?.toLocaleString() || 'N/A'}\nNet Return: ${result.profit_pct?.toFixed(2) || 'N/A'}%\n\nClick OK to acknowledge and end this partition.`
          );

          if (shouldEndPartition) {
            // Call end-action API to finalize the partition
            const { endPartitionAction } = await import('../lib/api.fetcher');
            await endPartitionAction(trackerId, partitionIndex);

            // Refresh tracker details again to show new partition state
            dispatch(fetchTrackerDetails(trackerId));

            console.log('[Partition Ended]');

            // Show appropriate popup based on code
            if (result.code === 'KILL_SWITCH_STAGNATION' || result.code === 'KILL_SWITCH_POOR_GROWTH') {
              setShowKillSwitchPopup(true);
            } else if (result.code === 'NEUTRAL_PARTITION') {
              setShowSuccessPopup(true);
            }
          }
        }
      } else {
        // Fallback: Show success popup for any unknown response
        setShowSuccessPopup(true);
      }

      // Refresh tracker details to get updated data
      // This will be handled by Redux if you have the action set up
      // For now, we'll rely on the parent component to refresh
    } catch (error: any) {
      console.log('[Confirm Error]', error);
      setConfirmError(error.message || 'Failed to confirm execution');
    } finally {
      setIsConfirming(false);
    }
  };



  // Show loading state while fetching tracker details
  if (isLoadingTrackerDetails) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading tracker details...</p>
        </div>
      </div>
    );
  }

  // Show error state if API call failed
  if (trackerDetailsError) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 text-destructive">
              <Icons.AlertCircle size={24} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to load tracker details</p>
                <p className="text-sm text-muted-foreground mt-1">{trackerDetailsError}</p>
                <Button onClick={onBack} variant="outline" className="mt-4" size="sm">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-full bg-background overflow-y-auto xl:overflow-hidden">
      <ScrollArea className="flex-none xl:flex-1 h-auto xl:h-full">
        <div className="px-4 py-5 md:p-6 space-y-6 pb-12 xl:pb-32">

          {/* 1. Daily Execution Zone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/30">
                <Icons.Zap size={16} />
              </div>
              <h2 className="text-lg font-bold">Today's Execution</h2>
            </div>

            {executionState === 'IDLE' && (
              <Card className="border-l-4 border-l-primary shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Market Context</CardTitle>
                  <CardDescription className="text-xs">Enter today's price conditions to generate your smart order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4">

                  {/* Main Controls - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
                    {/* Current Price Change */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-1.5">
                        Current Price Change (%)
                        <span className="text-muted-foreground font-normal text-xs">[Lock in %]</span>
                        <InfoTooltip text="Enter the current percentage change in stock price. This helps calculate the optimal buy price for today's execution." />
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          // inputMode="decimal"
                          placeholder="-2.4"
                          className="h-11 md:h-8 text-base md:text-sm font-semibold pl-3 md:pl-2.5 pr-8"
                          value={lockInPct}
                          onChange={e => {
                            const val = e.target.value;
                            // Allow empty, a lone minus sign, or a trailing decimal while typing
                            if (val === '' || val === '-' || val === '.' || val === '-.') {
                              setLockInPct(val);
                              return;
                            }
                            const num = parseFloat(val);
                            if (!isNaN(num) && num >= -90 && num <= 90) {
                              setLockInPct(val);
                            }
                          }}
                          autoFocus
                        />
                        <div className="absolute right-3 md:right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">%</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Tip: If red, lock early. If green, you may wait closer to close.
                      </p>
                    </div>

                    {/* Conviction Adjustment */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          Daily Conviction
                          <InfoTooltip text="Not Recommended! Adjust your conviction level if today's market news or events significantly impact your investment thesis." />
                        </Label>
                        <Badge className={
                          convictionOverride[0] < 45 ? "bg-red-500 hover:bg-red-600 h-6 md:h-5 px-2 md:px-1.5 text-xs md:text-[10px]" :
                            convictionOverride[0] > 55 ? "bg-emerald-500 hover:bg-emerald-600 h-6 md:h-5 px-2 md:px-1.5 text-xs md:text-[10px]" :
                              "bg-yellow-500 hover:bg-yellow-600 h-6 md:h-5 px-2 md:px-1.5 text-xs md:text-[10px]"
                        }>
                          {convictionOverride[0]}% Confidence
                        </Badge>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={convictionOverride}
                        onValueChange={setConvictionOverride}
                        className="py-1 md:py-0.5 pt-3 md:pt-2 cursor-pointer"
                      />
                    </div>
                  </div>



                  {/* Actions Footer */}
                  <div className="mt-6 -mx-4 -mb-4 p-4 bg-muted/40 border-t flex flex-col md:flex-row gap-3 md:gap-2 rounded-b-xl">
                    <Button
                      size="sm"
                      className="py-2 flex-1 h-16 md:h-9 text-base md:text-sm font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                      onClick={handleCalculate}
                      disabled={!lockInPct || isCalculating}
                    >
                      {isCalculating ? (
                        <>
                          <Icons.Refresh className="mr-2 w-5 h-5 md:w-4 md:h-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Icons.TrendUp className="mr-2 w-5 h-5 md:w-4 md:h-4" />
                          Calculate Amount
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 md:h-9 w-full md:w-auto px-4 text-sm md:text-xs border-dashed text-muted-foreground hover:text-foreground hover:bg-background"
                    >
                      Skip for Today
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {calculationError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <div className="flex items-start gap-2">
                  <Icons.AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{calculationError}</span>
                </div>
              </div>
            )}

            {executionState === 'CALCULATED' && recommendation && (
              <Card className="border-l-4 border-l-emerald-500 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="bg-emerald-500/5 pb-3">
                  <CardTitle className="text-lg text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Icons.Check className="w-4 h-4" /> Recommendation Generated
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5 p-5">

                  <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Recommended Amount</p>
                      <div className="text-4xl font-black text-foreground tracking-tight">
                        ${recommendation.recommended_amount.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 leading-tight">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">Ref Price: ${recommendation.signals.avg_holding_price.toFixed(2)}</span>
                        <span>~ {(recommendation.recommended_amount / recommendation.signals.avg_holding_price).toFixed(2)} shares</span>
                      </p>
                    </div>

                    <div className="border rounded-lg p-3.5 bg-muted/30 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground text-xs">New Projected Avg</span>
                        <span className="font-bold">${((totalInvested + recommendation.recommended_amount) / (totalShares + (recommendation.recommended_amount / recommendation.signals.avg_holding_price))).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Remaining in Cycle</span>
                        <span className="font-bold">${recommendation.partition_status.capital_remaining.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground text-xs">Cycle Days Left</span>
                        <span className="font-bold">{trackerData ? Math.ceil((100 - recommendation.partition_status.time_progress_pct) * trackerData.partition_days / 100) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col md:flex-row gap-3">
                    <Button
                      size="default"
                      className="flex-1 h-11 md:h-10 bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 shadow-md font-semibold"
                      onClick={() => setExecutionState('CONFIRMING')}
                    >
                      <Icons.Check className="mr-2 w-4 h-4" /> Place Order & Confirm
                    </Button>
                    <Button variant="outline" size="default" className="h-11 md:h-10 w-full md:w-auto px-4" onClick={() => setExecutionState('IDLE')}>
                      Recalculate
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {executionState === 'CONFIRMING' && recommendation && (
              <Card className="border-2 border-primary shadow-2xl animate-in slide-in-from-right-4 duration-300">
                <CardHeader className="border-b bg-muted/20 pb-3">
                  <CardTitle className="text-lg">Final Confirmation</CardTitle>
                  <CardDescription className="text-xs">Enter the actual executed values from your broker.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5 p-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Actual Invested Amount ($)</Label>
                      <Input
                        type="number"
                        className="h-11 md:h-10 text-lg font-semibold bg-background"
                        value={executedAmount}
                        onChange={e => setExecutedAmount(e.target.value)}
                        disabled={isConfirming}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Execution Price ($)</Label>
                      <Input
                        type="number"
                        step="0.05"
                        className="h-11 md:h-10 text-lg font-semibold bg-background"
                        value={executionPrice}
                        onChange={e => setExecutionPrice(e.target.value)}
                        disabled={isConfirming}
                      />
                    </div>
                  </div>

                  {/* Error Display */}
                  {confirmError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                      <div className="flex items-start gap-2">
                        <Icons.AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span>{confirmError}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <Button
                      size="default"
                      className="flex-1 h-11 font-semibold shadow-lg"
                      onClick={handleConfirm}
                      disabled={isConfirming || !executedAmount || !executionPrice}
                    >
                      {isConfirming ? (
                        <>
                          <Icons.Refresh className="mr-2 w-4 h-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <Icons.Check className="mr-2 w-4 h-4" /> Confirm & Record
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      className="h-11 w-full md:w-auto px-4"
                      onClick={() => setExecutionState('CALCULATED')}
                      disabled={isConfirming}
                    >
                      Cancel
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}

          </div>

          {/* 2. Tracker Summary & Progress (Read-Only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Summary Card */}
            <Card className="bg-muted/20 border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Icons.Settings size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        Engine Configuration
                        <InfoTooltip text="Your investment strategy parameters. These define how your capital is deployed over time." />
                      </CardTitle>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5" onClick={() => {
                      // Initialize edit form with current display values (API or hardcoded)
                      // Map displayLoadFactor to correct uppercase format for dropdown
                      // API mapping: 1=GRADUAL, 2=MODERATE, 3=AGGRESSIVE
                      const loadFactorMap: Record<string, string> = {
                        'Gradual Build': 'GRADUAL',
                        'Balanced Build': 'MODERATE',
                        'Aggressive Early Build': 'AGGRESSIVE',
                      };

                      setEditConfig({
                        totalBudget: displayTotalBudget,
                        convictionYears: displayConvictionYears,
                        loadFactor: (loadFactorMap[displayLoadFactor] || displayLoadFactor) as any,
                        partitionMonths: displayPartitionMonths,
                        convictionLevel: displayConvictionLevel,
                      });
                      setValidationErrors({});
                      setIsEditing(true);
                    }}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-y-3.5 text-sm">
                  {!isEditing ? (
                    // READ ONLY VIEW
                    <>
                      <div className="flex justify-between md:block border-b md:border-0 pb-2 md:pb-0 border-dashed border-muted">
                        <p className="text-xs text-muted-foreground">Conviction Period</p>
                        <p className="font-semibold">{displayConvictionYears} Years</p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 pb-2 md:pb-0 border-dashed border-muted">
                        <p className="text-xs text-muted-foreground">Total Budget</p>
                        <p className="font-semibold">${displayTotalBudget.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 pb-2 md:pb-0 border-dashed border-muted">
                        <p className="text-xs text-muted-foreground">Overall Conviction</p>
                        <p className="font-semibold">{displayConvictionLevel}%</p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 pb-2 md:pb-0 border-dashed border-muted">
                        <p className="text-xs text-muted-foreground">Load Factor</p>
                        <p className="font-semibold capitalize">{displayLoadFactor}</p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 pb-2 md:pb-0 border-dashed border-muted">
                        <p className="text-xs text-muted-foreground">Investment Cycle Length</p>
                        <p className="font-semibold">{displayPartitionMonths} Months</p>
                      </div>
                      {displayInitialInvestedAmount !== null && displayInitialInvestedAmount !== undefined && Number(displayInitialInvestedAmount) !== 0 && (
                        <div className="flex justify-between md:block border-b md:border-0 pb-2 md:pb-0 border-dashed border-muted">
                          <p className="text-xs text-muted-foreground">Initial Invested Amount</p>
                          <p className="font-semibold">${Number(displayInitialInvestedAmount).toLocaleString()}</p>
                        </div>
                      )}
                      {displayInitialSharesHeld !== null && displayInitialSharesHeld !== undefined && Number(displayInitialSharesHeld) !== 0 && (
                        <div className="flex justify-between md:block pt-1 md:pt-0">
                          <p className="text-xs text-muted-foreground">Initial Shares Held</p>
                          <p className="font-semibold">{Number(displayInitialSharesHeld).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // EDIT VIEW
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Conviction Period (Years)</Label>
                        <Input
                          type="number"
                          className="h-10 md:h-8"
                          value={editConfig.convictionYears || ''}
                          onChange={e => setEditConfig({ ...editConfig, convictionYears: e.target.value === '' ? 0 : Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Total Budget ($)</Label>
                        <Input
                          type="number"
                          className="h-10 md:h-8"
                          value={editConfig.totalBudget || ''}
                          onChange={e => setEditConfig({ ...editConfig, totalBudget: e.target.value === '' ? 0 : Number(e.target.value) })}
                          placeholder="Enter total budget"
                        />
                      </div>
                      <div className="space-y-3 md:col-span-2 pt-2 md:pt-0">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          Conviction Adjustment
                          <InfoTooltip text="Your overall conviction strength (X-Factor). Higher values execute more aggressively." />
                        </Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1 py-1"
                            value={[editConfig.convictionLevel || 50]}
                            onValueChange={(val) => setEditConfig({ ...editConfig, convictionLevel: val[0] })}
                          />
                          <span className="w-12 text-center text-sm font-bold bg-muted p-1 rounded">
                            {editConfig.convictionLevel}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-semibold flex justify-between">
                          Load Factor
                          <span className="text-[10px] text-amber-600 font-normal">*Not recommended to change</span>
                        </Label>
                        <Select
                          value={editConfig.loadFactor}
                          onValueChange={(val: any) => setEditConfig({ ...editConfig, loadFactor: val })}
                        >
                          <SelectTrigger className="h-10 md:h-8">
                            <SelectValue placeholder="Select load factor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GRADUAL">Gradual Build</SelectItem>
                            <SelectItem value="MODERATE">Balanced Build</SelectItem>
                            <SelectItem value="AGGRESSIVE">Aggressive Early Build</SelectItem>
                          </SelectContent>
                        </Select>
                        {editConfig.loadFactor !== (({ 'Gradual Build': 'GRADUAL', 'Balanced Build': 'MODERATE', 'Aggressive Early Build': 'AGGRESSIVE' } as Record<string, string>)[displayLoadFactor] || displayLoadFactor) && (
                          <div className="flex items-start gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-2">
                            <Icons.AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            <p className="text-[11px] leading-tight">These changes will affect only in the next investment cycle.</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-semibold">Investment Cycle Length (Months)</Label>
                        <Input
                          type="number"
                          className="h-10 md:h-8"
                          value={editConfig.partitionMonths || ''}
                          onChange={e => setEditConfig({ ...editConfig, partitionMonths: e.target.value === '' ? 0 : Number(e.target.value) })}
                        />
                        {editConfig.partitionMonths !== (trackerData?.partition_months ?? stock.partitionMonths) && (
                          <div className="flex items-start gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-2">
                            <Icons.AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            <p className="text-[11px] leading-tight">These changes will affect only in the next investment cycle.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-3 pt-2">
                    {/* Validation Errors/Info */}
                    {Object.keys(validationErrors).length > 0 && (
                      <div className={`p-3 rounded-lg border ${validationErrors['Info']
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                        : 'bg-destructive/10 border-destructive/20'
                        }`}>
                        <div className={`flex items-start gap-2 ${validationErrors['Info']
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-destructive'
                          }`}>
                          <Icons.AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <div className="space-y-1 text-xs">
                            {Object.entries(validationErrors).map(([field, error]) => (
                              <p key={field}>{field === 'Info' ? error : <><strong>{field}:</strong> {error}</>}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isSaving}
                        onClick={async () => {
                          // Frontend Validation (matching backend rules)
                          const errors: Record<string, string> = {};

                          // Get current values for comparison
                          const currentTotalBudget = displayTotalBudget;
                          const currentConvictionYears = displayConvictionYears;
                          const currentPartitionMonths = displayPartitionMonths;

                          // Rule 1: total_capital_planned can only INCREASE
                          if (editConfig.totalBudget < currentTotalBudget) {
                            errors['Total Budget'] = `Can only increase (current: $${currentTotalBudget.toLocaleString()})`;
                          }

                          // Rule 2: conviction_period_years can only INCREASE
                          if (editConfig.convictionYears < currentConvictionYears) {
                            errors['Conviction Period'] = `Can only increase (current: ${currentConvictionYears} years)`;
                          }

                          // Rule 3: partition_months can be increased or decreased (no restriction)

                          // Rule 4: base_conviction_score must be 0-100
                          if (editConfig.convictionLevel < 0 || editConfig.convictionLevel > 100) {
                            errors['Overall Conviction'] = 'Must be between 0-100%';
                          }

                          // If there are validation errors, show them and stop
                          if (Object.keys(errors).length > 0) {
                            setValidationErrors(errors);
                            return;
                          }

                          // Clear validation errors if all pass
                          setValidationErrors({});

                          // Check if any values have actually changed
                          const currentLoadFactor = useApiData && trackerData ?
                            (['GRADUAL', 'MODERATE', 'AGGRESSIVE'][trackerData.deployment_style - 1] || 'MODERATE') :
                            stock.loadFactor;

                          const hasChanges =
                            editConfig.totalBudget !== currentTotalBudget ||
                            editConfig.convictionYears !== currentConvictionYears ||
                            editConfig.partitionMonths !== currentPartitionMonths ||
                            editConfig.loadFactor !== currentLoadFactor ||
                            editConfig.convictionLevel !== displayConvictionLevel;

                          // If no changes, show info message and exit
                          if (!hasChanges) {
                            setValidationErrors({
                              'Info': 'No changes detected. Please update at least one value to save.'
                            });
                            return;
                          }

                          // Legacy validation for warning modal
                          const isSafe =
                            editConfig.totalBudget >= stock.totalBudget &&
                            editConfig.convictionYears >= stock.convictionYears &&
                            editConfig.loadFactor === stock.loadFactor &&
                            editConfig.convictionLevel === stock.convictionLevel;

                          if (isSafe || useApiData) {
                            // If using API data, call the update API
                            if (useApiData && trackerData?.trackerId) {
                              setIsSaving(true);
                              try {
                                const { updateTracker } = await import('../lib/api.fetcher');


                                await updateTracker(trackerData.trackerId, {
                                  total_capital_planned: editConfig.totalBudget,
                                  conviction_period_years: editConfig.convictionYears,
                                  partition_months: editConfig.partitionMonths,
                                  deployment_style: editConfig.loadFactor,
                                  base_conviction_score: editConfig.convictionLevel,
                                });

                                // Refresh tracker data
                                const { fetchTrackerDetails } = await import('../store/slices/trackersSlice');
                                dispatch(fetchTrackerDetails(trackerData.trackerId));

                                console.log('[StockDetails] Tracker updated successfully');
                              } catch (error) {
                                console.error('[StockDetails] Failed to update tracker:', error);
                                alert('Failed to update tracker. Please try again.');
                                return;
                              } finally {
                                setIsSaving(false);
                              }
                            }

                            onUpdate({ ...stock, ...editConfig });
                            setIsEditing(false);
                          } else {
                            setShowWarning(true);
                          }
                        }}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditConfig({
                          totalBudget: stock.totalBudget,
                          convictionYears: stock.convictionYears,
                          loadFactor: stock.loadFactor,
                          partitionMonths: stock.partitionMonths,
                          convictionLevel: stock.convictionLevel
                        });
                        setValidationErrors({});
                        setIsEditing(false);
                      }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warning Modal */}
            <Dialog open={showWarning} onOpenChange={setShowWarning}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-amber-600">
                    <Icons.AlertTriangle className="w-5 h-5" />
                    Stock Engine Modification Warning
                  </DialogTitle>
                  <DialogDescription className="pt-2">
                    This change is not recommended for an existing stock engine. Reducing budget, conviction, or changing structural parameters can disrupt the mathematical execution.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => {
                    // Discard
                    setEditConfig({
                      totalBudget: stock.totalBudget,
                      convictionYears: stock.convictionYears,
                      loadFactor: stock.loadFactor,
                      partitionMonths: stock.partitionMonths,
                      convictionLevel: stock.convictionLevel
                    });
                    setShowWarning(false);
                    setIsEditing(false);
                  }}>
                    Discard Changes
                  </Button>
                  <Button onClick={() => {
                    // Redirect
                    if (onCopyStrategy) {
                      onCopyStrategy({
                        symbol: stock.symbol,
                        name: stock.name,
                        ...editConfig
                      });
                    }
                  }}>
                    Activate Stock Engine
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Daily Limit Warning Modal */}
            <Dialog open={showDailyLimitWarning} onOpenChange={setShowDailyLimitWarning}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-amber-600">
                    <Icons.AlertTriangle className="w-5 h-5" />
                    Not Recommended for This Strategy
                  </DialogTitle>
                  <DialogDescription className="pt-2">
                    DSIP is designed for one disciplined execution per day.
                    Multiple executions within the same day may accelerate capital deployment.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setShowDailyLimitWarning(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    setShowDailyLimitWarning(false);
                    performCalculation();
                  }}>
                    Execute Anyway
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Success Popup */}
            <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
              <DialogContent className="sm:max-w-md text-center border-0 bg-background/95 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

                <div className="flex flex-col items-center justify-center space-y-5 px-6 py-10 relative">
                  {/* Animated Icon Container */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-in zoom-in-50 duration-500 delay-150">
                      <Icons.Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border border-emerald-500/10 animate-pulse" />
                  </div>

                  <div className="space-y-2 max-w-xs mx-auto animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                      {executionResponse?.title || 'Order Executed!'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
                      {executionResponse?.message || 'Great discipline! Your investment has been successfully recorded for today.'}
                    </DialogDescription>
                    {executionResponse?.deployed_amount !== undefined && executionResponse?.profit_pct !== undefined && (
                      <div className="text-xs text-center text-muted-foreground space-y-1 pt-2 border-t border-emerald-500/10 mt-3 pt-3">
                        <p>Capital Deployed: <span className="font-semibold">${executionResponse.deployed_amount.toLocaleString()}</span></p>
                        <p>Net Return: <span className={`font-semibold ${executionResponse.profit_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{executionResponse.profit_pct.toFixed(2)}%</span></p>
                      </div>
                    )}
                    <DialogDescription className="hidden">
                    </DialogDescription>
                  </div>

                  <div className="pt-2 w-full animate-in slide-in-from-bottom-5 fade-in duration-700 delay-300">
                    <Button
                      onClick={() => setShowSuccessPopup(false)}
                      className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold tracking-wide"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Progress & Position Card */}
            <Card className="border-primary/10 shadow-sm bg-background overflow-hidden">
              <CardHeader className="pb-3 px-4">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icons.Activity size={14} className="text-primary" />
                    </div>
                    <CardTitle className="text-sm font-semibold truncate">Live Investment Cycle</CardTitle>
                  </div>
                  <div className="shrink-0">
                    <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
                      {currentCycle}/{totalCycles}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pb-4 px-4 overflow-hidden">

                {/* Key Metrics Grid - stacked rows so values never overflow */}
                {(() => {
                  const investedVal = (useApiData && selectedTracker?.tracker?.live_investment_cycle?.total_capital_invested_so_far
                    ? selectedTracker.tracker.live_investment_cycle.total_capital_invested_so_far
                    : (totalShares * stock.currentPrice)
                  );
                  const plVal = (useApiData && selectedTracker?.tracker?.live_investment_cycle?.net_profit_percentage !== undefined
                    ? selectedTracker.tracker.live_investment_cycle.net_profit_percentage
                    : currentReturnPercent
                  );
                  const cycleVal = (useApiData && selectedTracker?.tracker?.live_investment_cycle?.partition_progress
                    ? selectedTracker.tracker.live_investment_cycle.partition_progress
                    : ((daysInvested % cycleLength) / cycleLength * 100)
                  );
                  const isPlPositive = plVal >= 0;

                  // Format invested amount: abbreviate if large to keep it compact
                  const formatInvested = (v: number) => {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
                    if (v >= 10_000) return `$${(v / 1_000).toFixed(1)}K`;
                    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                  };

                  return (
                    <div className="grid grid-cols-3 gap-2">
                      {/* Invested Amount */}
                      <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-600/10 border border-blue-500/10 shadow-sm overflow-hidden text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Icons.TrendingUp size={10} className="text-blue-500 shrink-0" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold leading-none">Invested Amount</span>
                        </div>
                        <div className="text-sm font-black tracking-tight text-foreground leading-none break-all">
                          {formatInvested(investedVal)}
                        </div>
                      </div>

                      {/* Total P&L */}
                      <div className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border shadow-sm overflow-hidden text-center ${isPlPositive
                        ? 'bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 border-emerald-500/10'
                        : 'bg-gradient-to-br from-red-500/5 to-red-600/10 border-red-500/10'
                      }`}>
                        <div className="flex items-center justify-center gap-1">
                          <Icons.DollarSign size={10} className={`shrink-0 ${isPlPositive ? 'text-emerald-500' : 'text-red-500'}`} />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold leading-none">Total P&amp;L</span>
                        </div>
                        <div className={`text-sm font-black tracking-tight leading-none ${isPlPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {isPlPositive ? '+' : ''}{plVal.toFixed(1)}%
                        </div>
                      </div>

                      {/* Cycle Progress */}
                      <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-600/10 border border-purple-500/10 shadow-sm overflow-hidden text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Icons.PieChart size={10} className="text-purple-500 shrink-0" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold leading-none">Cycle Progress</span>
                        </div>
                        <div className="text-sm font-black tracking-tight text-foreground leading-none">
                          {cycleVal.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Segmented Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Icons.Target size={14} className="text-cyan-500" />
                      Deployment Progress
                    </h3>
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {((displayDeployedAmount / displayTotalBudget) * 100).toFixed(1)}% Complete
                    </span>
                  </div>

                  {/* Diamond Shape Partition Progress */}
                  {(() => {
                    const progressPercentage = useApiData && selectedTracker?.tracker?.live_investment_cycle?.partition_progress
                      ? selectedTracker.tracker.live_investment_cycle.partition_progress
                      : 0;

                    // Smart windowing: show up to 10 diamonds with grouped ranges
                    const maxDiamonds = 10;
                    const diamonds: React.ReactNode[] = [];

                    const buildDiamond = (
                      partitionIndex: number,
                      isCompleted: boolean,
                      isActive: boolean,
                      isUpcoming: boolean,
                      label?: string
                    ) => (
                      <TooltipProvider key={label ?? partitionIndex} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => { if (!isUpcoming) handlePartitionClick(partitionIndex); }}
                              disabled={isUpcoming}
                              className="relative flex flex-col items-center justify-center group"
                              style={{ minWidth: 0 }}
                            >
                              {/* Diamond SVG */}
                              <span
                                className="relative block transition-transform duration-300"
                                style={{
                                  width: isActive ? 36 : 28,
                                  height: isActive ? 36 : 28,
                                  transform: isActive ? 'scale(1.15)' : undefined,
                                }}
                              >
                                <svg
                                  viewBox="0 0 40 40"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-full h-full"
                                  style={{ display: 'block' }}
                                >
                                  <defs>
                                    {isActive && (
                                      <>
                                        <linearGradient id={`fill-active-${partitionIndex}`} x1="0%" y1="100%" x2="0%" y2="0%">
                                          <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                                          <stop offset={`${progressPercentage}%`} stopColor="#22d3ee" stopOpacity="1" />
                                          <stop offset={`${progressPercentage}%`} stopColor="#1e293b" stopOpacity="1" />
                                          <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
                                        </linearGradient>
                                        <filter id={`glow-active-${partitionIndex}`} x="-50%" y="-50%" width="200%" height="200%">
                                          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                          <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                          </feMerge>
                                        </filter>
                                      </>
                                    )}
                                    {isCompleted && (
                                      <linearGradient id={`fill-done-${partitionIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                      </linearGradient>
                                    )}
                                  </defs>

                                  {/* Diamond polygon: top, right, bottom, left */}
                                  <polygon
                                    points="20,2 38,20 20,38 2,20"
                                    fill={
                                      isCompleted
                                        ? `url(#fill-done-${partitionIndex})`
                                        : isActive
                                          ? `url(#fill-active-${partitionIndex})`
                                          : '#1e293b'
                                    }
                                    stroke={
                                      isActive
                                        ? '#22d3ee'
                                        : isCompleted
                                          ? '#0e7490'
                                          : '#334155'
                                    }
                                    strokeWidth={isActive ? 2 : 1.2}
                                    filter={isActive ? `url(#glow-active-${partitionIndex})` : undefined}
                                    opacity={isUpcoming ? 0.4 : 1}
                                  />

                                  {/* Shine overlay on completed */}
                                  {isCompleted && (
                                    <polygon
                                      points="20,2 38,20 20,38 2,20"
                                      fill="url(#shine)"
                                      opacity="0.15"
                                    />
                                  )}

                                  {/* Check mark for completed */}
                                  {isCompleted && !label && (
                                    <polyline
                                      points="13,20 18,26 28,14"
                                      fill="none"
                                      stroke="white"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      opacity="0.9"
                                    />
                                  )}

                                  {/* Label for grouped range */}
                                  {label && (
                                    <text
                                      x="20"
                                      y="24"
                                      textAnchor="middle"
                                      fontSize="9"
                                      fontWeight="bold"
                                      fill={isUpcoming ? '#64748b' : 'white'}
                                      fontFamily="monospace"
                                    >
                                      {label}
                                    </text>
                                  )}

                                  {/* Partition number on active */}
                                  {isActive && !label && (
                                    <text
                                      x="20"
                                      y="24"
                                      textAnchor="middle"
                                      fontSize="10"
                                      fontWeight="bold"
                                      fill="white"
                                      fontFamily="monospace"
                                    >
                                      {progressPercentage.toFixed(0)}%
                                    </text>
                                  )}

                                  {/* Dot for upcoming */}
                                  {isUpcoming && !label && (
                                    <circle cx="20" cy="20" r="2.5" fill="#475569" />
                                  )}
                                </svg>

                                {/* Pulse ring on active */}
                                {isActive && (
                                  <span
                                    className="absolute inset-0 rounded-sm animate-ping"
                                    style={{
                                      background: 'transparent',
                                      boxShadow: '0 0 0 3px rgba(34,211,238,0.25)',
                                      animationDuration: '1.5s',
                                    }}
                                  />
                                )}
                              </span>

                              {/* Partition number label below diamond */}
                              <span
                                className={`mt-1 text-[8px] font-mono font-semibold leading-none ${
                                  isActive
                                    ? 'text-cyan-400'
                                    : isCompleted
                                      ? 'text-cyan-600'
                                      : 'text-slate-600'
                                }`}
                              >
                                {label ?? partitionIndex}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-semibold bg-slate-900 text-white border-slate-700 px-3 py-1.5">
                            <div className="text-center">
                              <div className="font-bold">
                                {label ? `Partitions ${label}` : `Partition ${partitionIndex}`}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {isCompleted
                                  ? label ? 'Completed · Click to view last' : 'Completed'
                                  : isActive
                                    ? `Active · ${progressPercentage.toFixed(1)}% done`
                                    : 'Upcoming'}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );

                    if (totalCycles <= maxDiamonds) {
                      // Show all individually
                      for (let i = 1; i <= totalCycles; i++) {
                        diamonds.push(buildDiamond(i, i < currentCycle, i === currentCycle, i > currentCycle));
                      }
                    } else {
                      // Smart windowing
                      const prevCount = 3;
                      const upcomingCount = 2;
                      let startIndex = Math.max(1, currentCycle - prevCount);
                      let endIndex = currentCycle + upcomingCount;

                      if (currentCycle <= prevCount) {
                        startIndex = 1;
                        endIndex = Math.min(maxDiamonds - 1, totalCycles);
                      }
                      if (currentCycle + upcomingCount >= totalCycles) {
                        endIndex = totalCycles;
                        startIndex = Math.max(1, totalCycles - maxDiamonds + 1);
                      }

                      // Grouped start range
                      if (startIndex > 1) {
                        const ge = startIndex - 1;
                        diamonds.push(buildDiamond(ge, true, false, false, `1-${ge}`));
                      }

                      // Individual window
                      for (let i = startIndex; i <= Math.min(endIndex, totalCycles); i++) {
                        diamonds.push(buildDiamond(i, i < currentCycle, i === currentCycle, i > currentCycle));
                      }

                      // Grouped end range
                      if (endIndex < totalCycles) {
                        const gs = endIndex + 1;
                        diamonds.push(buildDiamond(gs, false, false, true, `${gs}-${totalCycles}`));
                      }
                    }

                    return (
                      <div className="relative w-full">
                        {/* Connector line behind diamonds */}
                        <div
                          className="absolute left-0 right-0"
                          style={{ top: '50%', transform: 'translateY(-68%)', height: '2px', zIndex: 0 }}
                        >
                          {/* Completed portion */}
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, ((currentCycle - 1) / (totalCycles - 1)) * 100)}%` }}
                          />
                          {/* Remaining portion */}
                          <div className="absolute inset-y-0 right-0 bg-slate-800/60 rounded-full"
                            style={{ left: `${Math.min(100, ((currentCycle - 1) / (totalCycles - 1)) * 100)}%` }}
                          />
                        </div>

                        {/* Diamonds row */}
                        <div className="relative z-10 flex items-end justify-between w-full px-1 pb-1">
                          {diamonds}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-1">
                    <span>START</span>
                    <span className="font-semibold">{currentCycle}/{totalCycles}</span>
                    <span>END</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
    
          <div>
            {/* Partition Selector Dropdown */}
            {showPartitionSelector && selectorAnchor && (
              <div
                className="fixed inset-0 z-50"
                onClick={() => setShowPartitionSelector(false)}
              >
                <div
                  className="absolute bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-4 animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    top: `${selectorAnchor.getBoundingClientRect().top - 120}px`,
                    left: `${selectorAnchor.getBoundingClientRect().left}px`,
                    minWidth: '280px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xs font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <Icons.Target size={14} />
                    Select Partition
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {selectorPartitions.map((partitionNum) => (
                      <button
                        key={partitionNum}
                        onClick={() => handlePartitionClick(partitionNum)}
                        className="h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:via-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-white font-bold text-sm relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                        <span className="relative z-10">{partitionNum}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Partition Details Modal - Glass Design */}
            <Dialog open={selectedPartition !== null} onOpenChange={(open) => !open && setSelectedPartition(null)}>
              <DialogContent hideCloseButton className="max-w-xs p-0 overflow-hidden border-0 shadow-xl rounded-2xl bg-[#0f172a]">
                {isLoadingPartition ? (
                  <div className="py-14 flex flex-col items-center gap-3 bg-[#0f172a] rounded-2xl">
                    <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
                    <p className="text-[10px] text-slate-600 tracking-widest uppercase">Loading</p>
                  </div>
                ) : selectedPartition !== null && (() => {
                  const s = partitionDetails?.status;
                  const isComplete = s === 2 || s === 'COMPLETED' || s === 'completed' || selectedPartition < currentCycle;
                  const isActive   = !isComplete && (s === 1 || s === 'ACTIVE' || s === 'active' || selectedPartition === currentCycle);

                  // Clean professional color tokens
                  const c = isComplete ? {
                    accent  : '#22c55e',
                    text    : '#86efac',
                    muted   : '#166534',
                    bg      : 'rgba(22,101,52,0.15)',
                    border  : 'rgba(34,197,94,0.20)',
                    dot     : '#22c55e',
                  } : isActive ? {
                    accent  : '#3b82f6',
                    text    : '#93c5fd',
                    muted   : '#1e3a5f',
                    bg      : 'rgba(59,130,246,0.12)',
                    border  : 'rgba(59,130,246,0.20)',
                    dot     : '#3b82f6',
                  } : {
                    accent  : '#64748b',
                    text    : '#94a3b8',
                    muted   : '#1e293b',
                    bg      : 'rgba(100,116,139,0.10)',
                    border  : 'rgba(100,116,139,0.18)',
                    dot     : '#64748b',
                  };

                  const statusLabel  = isComplete ? 'Complete' : isActive ? 'Active' : 'Pending';
                  const expectedDays = partitionDetails?.expected_days || displayPartitionMonths;
                  const profit       = partitionDetails?.net_profit_percentage || 0;
                  const isProfit     = profit >= 0;

                  return (
                    <div className="flex flex-col rounded-2xl overflow-hidden" style={{
                      background: '#0f172a',
                      border: `1px solid rgba(255,255,255,0.08)`,
                    }}>

                      {/* Top color strip */}
                      <div style={{ height: 3, background: c.accent, opacity: 0.85 }} />

                      {/* ── HEADER ──────────────────────────────── */}
                      <div className="px-5 pt-5 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] font-medium tracking-widest uppercase text-slate-500 mb-2">Investment Cycle</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-black text-white" style={{ fontSize: 48, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                {partitionDetails?.partition_index || selectedPartition}
                              </span>
                              <span className="text-slate-600 font-medium text-sm">/ {totalCycles}</span>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : ''}`} style={{ background: c.dot }} />
                            <span className="text-[10px] font-semibold" style={{ color: c.text }}>{statusLabel}</span>
                          </div>
                        </div>

                        {/* Days */}
                        <div className="flex items-center gap-1.5 mt-3">
                          <Icons.Clock size={11} className="text-slate-600" />
                          <span className="text-[11px] text-slate-500">{expectedDays} day cycle</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-5 h-px bg-slate-800" />

                      {/* ── METRICS ─────────────────────────────── */}
                      {partitionDetails ? (
                        <>
                          <div className="grid grid-cols-2 divide-x divide-slate-800">
                            {/* Capital */}
                            <div className="px-5 py-4">
                              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Capital</p>
                              <p className="text-xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
                                ${(partitionDetails?.capital_deployed || 0).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-0.5">of ${(partitionDetails?.capital_allocated || 0).toLocaleString()}</p>
                            </div>

                            {/* Return */}
                            <div className="px-5 py-4">
                              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Return</p>
                              <p className="text-xl font-black" style={{ letterSpacing: '-0.02em', color: isProfit ? '#4ade80' : '#f87171' }}>
                                {isProfit ? '+' : ''}{profit.toFixed(2)}%
                              </p>
                              <p className="text-[10px] text-slate-600 mt-0.5">net P&L</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="mx-5 h-px bg-slate-800" />

                          {/* Detail rows */}
                          <div className="px-5 py-2 divide-y divide-slate-800/70">
                            <div className="flex justify-between items-center py-2.5">
                              <span className="text-[11px] text-slate-500">Units Acquired</span>
                              <span className="text-[12px] font-semibold text-slate-200 font-mono">
                                {(partitionDetails?.shares_bought || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2.5">
                              <span className="text-[11px] text-slate-500">Expected Days</span>
                              <span className="text-[12px] font-semibold font-mono" style={{ color: c.text }}>{expectedDays}d</span>
                            </div>
                            {partitionDetails?.start_date && (
                              <div className="flex justify-between items-center py-2.5">
                                <span className="text-[11px] text-slate-500">Start</span>
                                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                                  {new Date(partitionDetails.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                            {partitionDetails?.end_date && (
                              <div className="flex justify-between items-center py-2.5">
                                <span className="text-[11px] text-slate-500">End</span>
                                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                                  {new Date(partitionDetails.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-10 flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Icons.Clock size={20} className="text-slate-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-300">Awaiting Execution</p>
                            <p className="text-[11px] text-slate-600 mt-1 max-w-[180px] leading-relaxed">Scheduled for a future date.</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800">
                            <Icons.Clock size={10} className="text-slate-500" />
                            <span className="text-[10px] text-slate-400">{expectedDays}d cycle</span>
                          </div>
                        </div>
                      )}

                      {/* ── FOOTER ──────────────────────────────── */}
                      <div className="px-5 py-4 border-t border-slate-800">
                        <button
                          onClick={() => setSelectedPartition(null)}
                          className="w-full h-9 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all active:scale-[0.98]"
                        >
                          Close
                        </button>
                      </div>

                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>

            {/* Victory Popup - Completing a Cycle */}
            <Dialog open={showVictoryPopup} onOpenChange={setShowVictoryPopup}>
              <DialogContent className="sm:max-w-md text-center border-0 bg-background/95 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden">
                {/* Golden/Amber Gradient for Victory */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none" />


                <div className="flex flex-col items-center justify-center space-y-5 px-6 py-10 relative">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-in zoom-in-50 duration-700">
                      <Icons.Target className="w-12 h-12 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border border-amber-500/20 animate-spin-slow duration-[10s]" />
                    <div className="absolute -inset-4 rounded-full border border-amber-500/10 animate-pulse duration-[3s]" />
                  </div>

                  <div className="space-y-2 max-w-sm mx-auto animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200">
                    <DialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase">
                      {executionResponse?.title || 'Partition Completed!'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
                      {executionResponse?.message || 'Outstanding discipline! You have successfully completed a full investment cycle.'}
                    </DialogDescription>
                    {executionResponse?.deployed_amount !== undefined && executionResponse?.profit_pct !== undefined && (
                      <div className="text-xs text-center text-muted-foreground space-y-1 pt-2 border-t border-amber-500/10 mt-3 pt-3">
                        <p>Capital Deployed: <span className="font-semibold">${executionResponse.deployed_amount.toLocaleString()}</span></p>
                        <p>Net Return: <span className={`font-semibold ${executionResponse.profit_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{executionResponse.profit_pct.toFixed(2)}%</span></p>
                      </div>
                    )}
                    <DialogDescription className="hidden">
                    </DialogDescription>
                  </div>

                  <div className="pt-2 w-full animate-in slide-in-from-bottom-5 fade-in duration-700 delay-300">
                    <Button
                      onClick={() => setShowVictoryPopup(false)}
                      className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold tracking-wide"
                    >
                      Proceed to Next Cycle
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Kill Switch Popup - Negative Return Warning */}
            <Dialog open={showKillSwitchPopup} onOpenChange={setShowKillSwitchPopup}>
              <DialogContent className="sm:max-w-md text-center border-l-4 border-l-red-500">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-center gap-2 text-red-600 text-xl">
                    <Icons.AlertTriangle className="w-6 h-6" />
                    Stop Execution Warning
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {executionResponse?.message || 'We noticed your portfolio is currently down. Since you are more than halfway through the cycle, it is recommended to halt further investment to protect capital.'}
                  </p>
                  {executionResponse?.deployed_amount !== undefined && executionResponse?.profit_pct !== undefined && (
                    <div className="text-xs text-center text-muted-foreground space-y-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 mb-3">
                      <p>Capital Deployed: <span className="font-semibold">${executionResponse.deployed_amount.toLocaleString()}</span></p>
                      <p>Net Return: <span className="font-semibold text-red-600">{executionResponse.profit_pct.toFixed(2)}%</span></p>
                    </div>
                  )}
                  <p className="hidden">
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      "Good traders know when to throttle down."
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto flex-1 shadow-md"
                    onClick={() => setShowKillSwitchPopup(false)}
                  >
                    <Icons.Zap className="w-4 h-4 mr-2" /> Kill Switch (Stop)
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setShowKillSwitchPopup(false);
                      // Allow implementation if user insists (optional based on strictness)
                      performCalculation();
                    }}
                  >
                    Ignore & Execute
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>



          </div>


        </div>
      </ScrollArea>

      {/* Investment Performance Section - Desktop Sidebar (right side) */}
      <aside className="flex flex-col w-full xl:w-[320px] shrink-0 h-auto xl:h-full border-t xl:border-t-0 xl:border-l bg-background">
        <ScrollArea className="flex-none xl:flex-1 h-auto xl:h-full">
          <div className="p-6 space-y-6 xl:pb-6 pb-32">
            <Performance />
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
};

export default StockDetails;