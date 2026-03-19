import React, { useState } from 'react';
import { Icons } from '../constants';
import { LoadFactor, Stock } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface StockPriceResponse {
  symbol: string;
  exchange: string;
  date: string;
  closePrice: number;
  source: string;
  company: {
    name: string;
    symbol: string;
    exchange: string;
    industry: string;
    country: string;
  } | null;
}

interface AddStockProps {
  onBack: () => void;
  onAdd: (stock: Stock) => void;
  initialValues?: Partial<Stock>;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-block ml-1 cursor-help opacity-70 hover:opacity-100 transition-opacity align-middle">
          <Icons.Info size={14} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const AddStock: React.FC<AddStockProps> = ({ onBack, onAdd, initialValues }) => {
  // const [step, setStep] = useState<1 | 2>(1); // Removed stepper
  const [alreadyInvested, setAlreadyInvested] = useState<boolean>(false);

  const [symbol, setSymbol] = useState(initialValues?.symbol || '');
  const [budget, setBudget] = useState(initialValues?.totalBudget?.toString() || '');
  const [partition, setPartition] = useState(initialValues?.partitionMonths?.toString() || '');
  const [convictionYears, setConvictionYears] = useState(initialValues?.convictionYears?.toString() || '');
  const [loadFactor, setLoadFactor] = useState<LoadFactor>(initialValues?.loadFactor || LoadFactor.MODERATE);

  const [quantityOwned, setQuantityOwned] = useState('');
  const [averagePriceOwned, setAveragePriceOwned] = useState('');

  // Helper functions to handle numeric input validation
  const handlePositiveIntegerInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Allow empty string or positive integers only
    if (value === '' || /^\d+$/.test(value)) {
      setter(value);
      // Clear validation error for this field when user types
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        // Clear the error based on which setter is being used
        if (setter === setBudget) delete newErrors.budget;
        if (setter === setConvictionYears) delete newErrors.convictionYears;
        if (setter === setPartition) delete newErrors.partition;
        return newErrors;
      });
    }
  };

  const handlePositiveDecimalInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Allow empty string, positive integers, or positive decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
      // Clear validation error for this field when user types
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (setter === setAveragePriceOwned) delete newErrors.averagePriceOwned;
        if (setter === setQuantityOwned) delete newErrors.quantityOwned;
        return newErrors;
      });
    }
  };

  // Calculate inferred average price
  const calculateInferredAvgPrice = () => {
    const amount = Number(averagePriceOwned);
    const shares = Number(quantityOwned);
    if (amount > 0 && shares > 0) {
      return (amount / shares).toFixed(2);
    }
    return '0.00';
  };

  const [convictionLevel, setConvictionLevel] = useState([initialValues?.convictionLevel || 75]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stockData, setStockData] = useState<StockPriceResponse | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate symbol
    if (!symbol || symbol.trim() === '') {
      errors.symbol = 'Stock symbol is required';
    }

    // Validate budget
    if (!budget || budget.trim() === '' || Number(budget) <= 0) {
      errors.budget = 'Total Capital Allocation must be greater than 0';
    }

    // Validate conviction years
    if (!convictionYears || convictionYears.trim() === '' || Number(convictionYears) <= 0) {
      errors.convictionYears = 'Conviction period must be at least 1 year';
    }

    // Validate partition months
    if (!partition || partition.trim() === '' || Number(partition) <= 0) {
      errors.partition = 'Investment cycle length must be at least 1 month';
    }

    // Validate already invested fields if checkbox is checked
    if (alreadyInvested) {
      if (!averagePriceOwned || averagePriceOwned.trim() === '' || Number(averagePriceOwned) <= 0) {
        errors.averagePriceOwned = 'Total amount invested must be greater than 0';
      }
      if (!quantityOwned || quantityOwned.trim() === '' || Number(quantityOwned) <= 0) {
        errors.quantityOwned = 'Total shares held must be greater than 0';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setFetchLoading(true);
    setFetchError(null);

    try {
      const data = await api<StockPriceResponse>(
        `/api/stocks/close?symbol=${encodeURIComponent(symbol.trim())}&exchange=US`
      );
      setStockData(data);
      setShowConfirmModal(true);
    } catch {
      setFetchError(`Could not find stock "${symbol.trim().toUpperCase()}". Please check the symbol and try again.`);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!stockData) return;

    const newStock: Stock = {
      id: Date.now().toString(),
      symbol: stockData.symbol,
      name: stockData.company?.name || stockData.symbol,
      totalBudget: Number(budget),
      partitionMonths: Number(partition),
      convictionYears: Number(convictionYears),
      loadFactor,
      deployedAmount: 0,
      currentAverage: Number(averagePriceOwned),
      currentPrice: stockData.closePrice,
      isPaused: false,
      history: [],
      quantityOwned: alreadyInvested ? Number(quantityOwned) : 0,
      averagePriceOwned: alreadyInvested ? Number(averagePriceOwned) : 0,
      convictionLevel: convictionLevel[0],
      priceMovementPct: 0,
    };
    setShowConfirmModal(false);
    onAdd(newStock);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="p-6 border-b flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 transition-all">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <Icons.ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New Stock Engine</h1>
          <p className="text-xs text-muted-foreground">Configure Dynamic SIP Parameters</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 lg:px-16 xl:px-24 w-full space-y-8 pb-32">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Asset Details
                </h3>
                <div className="grid gap-2">
                  <Label>Stock Symbol</Label>
                  <Input
                    required
                    autoFocus
                    placeholder="NFLX"
                    value={symbol}
                    onChange={e => {
                      setSymbol(e.target.value);
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.symbol;
                        return newErrors;
                      });
                    }}
                    className={cn(
                      "text-lg font-bold uppercase tracking-wider",
                      validationErrors.symbol && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {validationErrors.symbol && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <Icons.AlertCircle size={12} />
                      {validationErrors.symbol}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 border p-4 rounded-lg bg-card/50">
                  <Checkbox
                    id="fresh"
                    checked={!alreadyInvested}
                    onCheckedChange={(checked) => setAlreadyInvested(checked === false)}
                  />
                  <Label htmlFor="fresh" className="font-medium cursor-pointer">
                    This is a fresh investment (I don't own this stock yet)
                  </Label>
                </div>

                {alreadyInvested && (
                  <Card className="bg-secondary/20 border-dashed animate-in slide-in-from-top-2 fade-in duration-300">
                    <CardContent className="pt-6 grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Total amount invested so far</Label>
                        <Input
                          inputMode="decimal"
                          value={averagePriceOwned}
                          onChange={e => handlePositiveDecimalInput(e.target.value, setAveragePriceOwned)}
                          placeholder="$ Total Amount"
                          className={cn(
                            "bg-background",
                            validationErrors.averagePriceOwned && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {validationErrors.averagePriceOwned && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <Icons.AlertCircle size={12} />
                            {validationErrors.averagePriceOwned}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Total shares currently held</Label>
                        <Input
                          inputMode="decimal"
                          value={quantityOwned}
                          onChange={e => handlePositiveDecimalInput(e.target.value, setQuantityOwned)}
                          placeholder="Shares"
                          className={cn(
                            "bg-background",
                            validationErrors.quantityOwned && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {validationErrors.quantityOwned && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <Icons.AlertCircle size={12} />
                            {validationErrors.quantityOwned}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground col-span-2">
                        *Inferred Avg Price: ${calculateInferredAvgPrice()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Stock Engine Parameters
                </h3>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Icons.Wallet size={16} />
                    Total Capital Allocation
                    <InfoTooltip text="How much total capital do you want to deploy over this conviction period?" />
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                    <Input
                      inputMode="numeric"
                      className={cn(
                        "text-lg font-bold pl-8",
                        validationErrors.budget && "border-red-500 focus-visible:ring-red-500"
                      )}
                      value={budget}
                      onChange={e => handlePositiveIntegerInput(e.target.value, setBudget)}
                      placeholder="5000"
                    />
                  </div>
                  {validationErrors.budget && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <Icons.AlertCircle size={12} />
                      {validationErrors.budget}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Icons.Clock size={16} />
                    Conviction Period (Years)
                    <InfoTooltip text="How long do you strongly believe in this stock?" />
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={convictionYears}
                    onChange={e => handlePositiveIntegerInput(e.target.value, setConvictionYears)}
                    placeholder="3"
                    className={cn(
                      validationErrors.convictionYears && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {validationErrors.convictionYears && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <Icons.AlertCircle size={12} />
                      {validationErrors.convictionYears}
                    </p>
                  )}
                </div>



                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    Investment Cycle Length (Months)
                    <InfoTooltip text="How often do you expect this stock to show meaningful growth phases? (Trading Months)" />
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={partition}
                    onChange={e => handlePositiveIntegerInput(e.target.value, setPartition)}
                    placeholder="8"
                    className={cn(
                      validationErrors.partition && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {validationErrors.partition && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <Icons.AlertCircle size={12} />
                      {validationErrors.partition}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="pb-4 border-b bg-muted/20">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Icons.Settings className="w-4 h-4" />
                    Execution Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">

                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      Deployment Style
                      <InfoTooltip text="How aggressively should the system deploy capital in early phases?" />
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: LoadFactor.AGGRESSIVE, label: 'Aggressive Early Build', desc: 'Invest more in early phases to capture early growth' },
                        { id: LoadFactor.MODERATE, label: 'Balanced Build', desc: 'Steady early exposure with flexibility to adapt' },
                        { id: LoadFactor.GRADUAL, label: 'Gradual Build', desc: 'Spread capital slowly and evenly over time' }
                      ].map(option => (
                        <div
                          key={option.id}
                          onClick={() => setLoadFactor(option.id)}
                          className={cn(
                            "cursor-pointer border rounded-lg p-3 transition-all hover:bg-accent",
                            loadFactor === option.id ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", loadFactor === option.id ? "border-primary" : "border-muted-foreground")}>
                              {loadFactor === option.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="font-bold text-sm">{option.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">{option.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold">Conviction strength (X-Factor)</Label>
                      <span className="text-3xl font-black text-primary">{convictionLevel[0]}%</span>
                    </div>
                    <Slider
                      value={convictionLevel}
                      onValueChange={setConvictionLevel}
                      max={100}
                      step={1}
                      className="py-4"
                    />
                  </div>

                </CardContent>
              </Card>

              <div className="pt-4 space-y-3">
                <Button type="submit" size="lg" disabled={fetchLoading} className="w-full text-lg h-14 rounded-xl shadow-xl hover:scale-[1.02] transition-transform">
                  {fetchLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Fetching stock data...
                    </>
                  ) : (
                    <>
                      <Icons.TrendUp className="mr-2" />
                      Create DSIP Tracker
                    </>
                  )}
                </Button>
                {fetchError && (
                  <p className="text-center text-sm text-red-500 font-medium">{fetchError}</p>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  Smart deployment will be active from the next trading day.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Stock Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirm Stock Details</DialogTitle>
          </DialogHeader>

          {stockData && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                  {stockData.symbol.substring(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-bold">{stockData.symbol}</p>
                  <p className="text-sm text-muted-foreground">{stockData.company?.name || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Exchange</p>
                  <p className="font-bold">{stockData.company?.exchange || stockData.exchange}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Industry</p>
                  <p className="font-bold">{stockData.company?.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Country</p>
                  <p className="font-bold">{stockData.company?.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Close Price</p>
                  <p className="font-bold text-lg">${stockData.closePrice?.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                Price as of {stockData.date} &middot;
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              <Icons.Check className="mr-2 w-4 h-4" />
              Confirm &amp; Create Tracker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddStock;
