import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import * as Slider from '@radix-ui/react-slider';
import { clsx } from 'clsx';
import {
  Play, Loader2, TrendingUp, TrendingDown,
  Sun, Moon, RotateCcw, PanelLeftClose, PanelLeftOpen,
  DollarSign, BarChart2, Calendar, Hash, Wallet, Upload, Link,
  LayoutDashboard, ChevronLeft, Plus, X, CheckSquare, Square,
  Trophy, ChevronDown, ChevronUp, Layers,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface DayResult {
  dayNumber: number;
  date: string;
  partitionIndex: number;
  openPrice: number;
  closePrice: number;
  prevClose: number;
  lockInPct: number;
  isRedDay: boolean;
  recommendedAmount: number;
  executedAmount: number;
  sharesAcquired: number;
  totalInvested: number;
  totalShares: number;
  portfolioValue: number;
  pnl: number;
  pnlPct: number;
}

interface SimResult {
  symbol: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalInvested: number;
  totalCapitalPlanned: number;
  totalShares: number;
  avgPricePaid: number;
  finalClosePrice: number;
  finalPortfolioValue: number;
  totalPnl: number;
  totalPnlPct: number;
  days: DayResult[];
  trackerId?: number;
  executionLogPath?: string;
}

interface OhlcRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

interface SharedConfig {
  startDate: string;
  endDate: string;
  totalCapital: string;
  convictionScore: number;
  convictionYears: string;
  deploymentStyle: 'AGGRESSIVE' | 'MODERATE' | 'GRADUAL';
  partitionMonths: string;
}

interface StockEntry {
  id: string;
  symbol: string;
  dataSource: 'symbol' | 'upload';
  uploadedFile: File | null;
}

interface SimJob {
  id: string;
  symbol: string;
  status: 'pending' | 'running' | 'done' | 'error';
  step?: string;
  result?: SimResult;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────────────────────

function parseCsv(raw: string): OhlcRow[] {
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV has no data rows');
  const headers = lines[0].split(',').map(h =>
    h.trim().toLowerCase().replace(/[\s"']+/g, '_')
  );
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex(h => h === n || h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const dateIdx     = idx('date', 'time', 'timestamp');
  const openIdx     = idx('open');
  const highIdx     = idx('high');
  const lowIdx      = idx('low');
  const adjCloseIdx = idx('adj_close', 'adjclose');
  const closeIdx    = idx('close');
  const volIdx      = idx('volume', 'vol');
  if (dateIdx < 0)  throw new Error('CSV missing "Date" column');
  if (openIdx  < 0) throw new Error('CSV missing "Open" column');
  if (closeIdx < 0) throw new Error('CSV missing "Close" column');
  const clean = (v?: string) => parseFloat((v ?? '').replace(/[",\s]/g, '')) || 0;
  const rows: OhlcRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols    = lines[i].split(',');
    const dateRaw = cols[dateIdx]?.trim().replace(/"/g, '');
    if (!dateRaw || dateRaw.toLowerCase() === 'null') continue;
    rows.push({
      date:     dateRaw,
      open:     clean(cols[openIdx]),
      high:     highIdx     >= 0 ? clean(cols[highIdx])     : 0,
      low:      lowIdx      >= 0 ? clean(cols[lowIdx])      : 0,
      close:    closeIdx    >= 0 ? clean(cols[closeIdx])    : 0,
      adjClose: adjCloseIdx >= 0 ? clean(cols[adjCloseIdx]) : clean(cols[closeIdx]),
      volume:   volIdx      >= 0 ? clean(cols[volIdx])      : 0,
    });
  }
  if (rows.length === 0) throw new Error('CSV parsed but found 0 valid rows');
  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// DSIP ENGINE
// ─────────────────────────────────────────────────────────────────────────────

interface SimConfig {
  symbol: string;
  totalCapital: number;
  convictionScore: number;
  convictionYears: number;
  deploymentStyle: 'AGGRESSIVE' | 'MODERATE' | 'GRADUAL';
  partitionMonths: number;
}

function runLocalSimulation(rows: OhlcRow[], cfg: SimConfig): SimResult {
  if (rows.length === 0) throw new Error('No price data to simulate');
  const partitionDays   = cfg.partitionMonths * 21;
  const styleMultiplier = cfg.deploymentStyle === 'AGGRESSIVE' ? 1.4 : cfg.deploymentStyle === 'GRADUAL' ? 0.7 : 1.0;
  const maxPartitions   = Math.ceil((cfg.convictionYears * 252) / partitionDays);
  const capitalPerPart  = cfg.totalCapital / maxPartitions;
  const neutralDaily    = capitalPerPart / partitionDays;
  let totalInvested = 0, totalShares = 0;
  let partIdx = 1, partDay = 0, partCap = 0, growthDays = 0;
  const dayResults: DayResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const today     = rows[i];
    const prevClose = i > 0 ? rows[i - 1].close : today.open;
    partDay++;
    const lockInPrice = today.open;
    const lockInPct   = prevClose > 0 ? ((lockInPrice - prevClose) / prevClose) * 100 : 0;
    const isRedDay    = lockInPrice < prevClose;
    const avgHolding  = totalShares > 0 ? totalInvested / totalShares : lockInPrice;
    const avgDev      = avgHolding > 0 ? ((avgHolding - lockInPrice) / avgHolding) * 100 : 0;
    const avgSignal   = Math.max(-1, Math.min(1, avgDev / 10));
    const liSignal    = Math.max(-1, Math.min(1, -lockInPct / 8));
    const rawOpp      = 0.65 * avgSignal + 0.35 * liSignal;
    const convAmp     = 0.6 + (cfg.convictionScore / 100) * 0.6;
    const oppMult     = Math.max(0.2, Math.min(2.5, isRedDay ? (1 + rawOpp) * convAmp : (1 + rawOpp * 0.5) * convAmp));
    const retPct      = avgHolding > 0 ? ((lockInPrice - avgHolding) / avgHolding) * 100 : 0;
    const retProg     = Math.min(1, Math.max(0, retPct / 15));
    const gProg       = Math.min(1, growthDays / (partitionDays * 0.5));
    const contMult    = Math.max(0.7, Math.min(1.1, 1.1 - (0.8 * retProg + 0.2 * gProg) * 0.4));
    const recommended = neutralDaily * oppMult * contMult * styleMultiplier;
    const executed    = Math.min(recommended, Math.max(0, capitalPerPart - partCap), Math.max(0, cfg.totalCapital - totalInvested));
    const shares      = executed > 0 ? executed / lockInPrice : 0;
    totalInvested += executed; totalShares += shares; partCap += executed;
    const portfolioValue = totalShares * today.close;
    const pnl = portfolioValue - totalInvested;
    if (today.close > prevClose && pnl > 0) growthDays++;
    dayResults.push({
      dayNumber: i + 1, date: today.date, partitionIndex: partIdx,
      openPrice: lockInPrice, closePrice: today.close, prevClose, lockInPct, isRedDay,
      recommendedAmount: recommended, executedAmount: executed, sharesAcquired: shares,
      totalInvested, totalShares, portfolioValue,
      pnl, pnlPct: totalInvested > 0 ? (pnl / totalInvested) * 100 : 0,
    });
    if ((partDay >= partitionDays || partCap >= capitalPerPart * 0.97) && totalInvested < cfg.totalCapital) {
      partIdx++; partDay = 0; partCap = 0; growthDays = 0;
    }
  }
  const finalClose     = rows[rows.length - 1].close;
  const finalPortfolio = totalShares * finalClose;
  const totalPnl       = finalPortfolio - totalInvested;
  return {
    symbol: cfg.symbol.toUpperCase(),
    startDate: rows[0].date, endDate: rows[rows.length - 1].date,
    totalDays: rows.length, totalInvested, totalCapitalPlanned: cfg.totalCapital,
    totalShares, avgPricePaid: totalShares > 0 ? totalInvested / totalShares : 0,
    finalClosePrice: finalClose, finalPortfolioValue: finalPortfolio,
    totalPnl, totalPnlPct: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
    days: dayResults,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

async function runBackendSimulation(
  symbol: string,
  cfg: SharedConfig,
  onStep: (msg: string) => void
): Promise<SimResult> {
  const client = axios.create({ withCredentials: true });

  onStep('Step 1/3 — Fetching historical price data from Yahoo Finance…');
  const genRes = await client.post('/api/test/generate-price-data', {
    symbol:                   symbol.toUpperCase(),
    start_date:               cfg.startDate,
    end_date:                 cfg.endDate,
    default_conviction_score: cfg.convictionScore,
  });
  if (!genRes.data.success) throw new Error(genRes.data.error || 'Failed to fetch price data');
  const csvFilePath  = genRes.data.file_path as string;
  const recordCount  = genRes.data.record_count as number;
  const priceSummary = genRes.data.price_summary;
  onStep(`Step 1/3 — Got ${recordCount} trading days for ${symbol} ✓`);

  onStep('Step 2/3 — Creating DSIP tracker…');
  const trackerRes = await client.post('/api/dsip-trackers', {
    stock_symbol:            symbol.toUpperCase(),
    total_capital_planned:   parseFloat(cfg.totalCapital) || 10000,
    conviction_period_years: parseFloat(cfg.convictionYears) || 2,
    deployment_style:        cfg.deploymentStyle,
    base_conviction_score:   cfg.convictionScore,
    partition_months:        parseInt(cfg.partitionMonths) || 3,
    is_fractional_shares_allowed: true,
  });
  const trackerId = trackerRes.data.tracker_id ?? trackerRes.data.trackerId;
  if (!trackerId) throw new Error('Tracker creation failed — no tracker_id returned');
  onStep(`Step 2/3 — Tracker #${trackerId} created ✓`);

  onStep('Step 3/3 — Running DSIP simulation engine…');
  const execRes = await client.post('/api/test/execute-workflow', {
    tracker_id:    trackerId,
    csv_file_path: csvFilePath,
  });
  if (!execRes.data.success) throw new Error(execRes.data.error || 'Workflow execution failed');
  onStep('Step 3/3 — Simulation complete ✓');

  const exec = execRes.data;
  const s    = exec.summary ?? {};
  const totalInvested  = s.total_capital_invested ?? 0;
  const finalPortfolio = s.final_portfolio_value  ?? 0;
  const totalPnl       = finalPortfolio - totalInvested;
  const totalPnlPct    = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const days: DayResult[] = (exec.days ?? []).map((d: any, i: number) => ({
    dayNumber:         i + 1,
    date:              d.date             ?? '',
    partitionIndex:    d.partition_index  ?? 1,
    openPrice:         d.open_price       ?? d.lock_in_price ?? 0,
    closePrice:        d.close_price      ?? 0,
    prevClose:         d.prev_close       ?? 0,
    lockInPct:         d.lock_in_pct      ?? 0,
    isRedDay:          d.is_red_day       ?? false,
    recommendedAmount: d.recommended_amount ?? 0,
    executedAmount:    d.executed_amount  ?? 0,
    sharesAcquired:    d.shares_acquired  ?? 0,
    totalInvested:     d.total_invested   ?? 0,
    totalShares:       d.total_shares     ?? 0,
    portfolioValue:    d.portfolio_value  ?? 0,
    pnl:               d.pnl             ?? 0,
    pnlPct:            d.pnl_pct         ?? 0,
  }));

  return {
    symbol:              symbol.toUpperCase(),
    startDate:           cfg.startDate,
    endDate:             cfg.endDate,
    totalDays:           s.days_processed        ?? recordCount,
    totalInvested,
    totalCapitalPlanned: parseFloat(cfg.totalCapital) || 10000,
    totalShares:         s.total_shares_acquired ?? 0,
    avgPricePaid:        totalInvested > 0 && s.total_shares_acquired > 0
                           ? totalInvested / s.total_shares_acquired : 0,
    finalClosePrice:     priceSummary?.end_price ?? 0,
    finalPortfolioValue: finalPortfolio,
    totalPnl, totalPnlPct,
    days, trackerId,
    executionLogPath: exec.execution_log?.file_path,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtUsd(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `$${fmt(n / 1_000_000, 2)}M`;
  if (a >= 1_000)     return `$${fmt(n / 1_000, 1)}K`;
  return `$${fmt(n)}`;
}
function useTheme() {
  const [dark, setDark] = useState(() => {
    const s = localStorage.getItem('dsip-theme');
    return s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const toggle = () => setDark(d => {
    const next = !d;
    localStorage.setItem('dsip-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
    return next;
  });
  React.useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, []);
  return { dark, toggle };
}

const inputCls = 'w-full px-3 py-2 rounded-md text-sm font-mono border border-border bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground transition-colors';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-left items-start w-full">
      <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{label}</label>
      <div className="w-full">{children}</div>
      {hint && <span className="text-[10px] text-muted-foreground text-left">{hint}</span>}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 w-full">
      <span className="text-[10px] font-bold tracking-widest uppercase text-primary/80 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR DECORATIVE BACKGROUND DOTS
// ─────────────────────────────────────────────────────────────────────────────

function SidebarDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/[0.04] blur-2xl" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK ENTRY ROW (in sidebar)
// ─────────────────────────────────────────────────────────────────────────────

const SYMBOLS = ['NFLX','AAPL','TSLA','MSFT','GOOGL','AMZN','NVDA','META','V','BLK'];

function StockEntryRow({
  entry,
  onChange,
  onRemove,
  canRemove,
}: {
  entry: StockEntry;
  onChange: (e: StockEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const set = <K extends keyof StockEntry>(k: K, v: StockEntry[K]) =>
    onChange({ ...entry, [k]: v });

  return (
    <div className="rounded-lg border border-border bg-card/60 p-3 flex flex-col gap-2.5 relative">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Source toggle */}
      <div className="grid grid-cols-2 gap-1 pr-6">
        {([
          { id: 'symbol', label: 'Symbol', icon: <Link className="w-3 h-3" /> },
          { id: 'upload', label: 'CSV',    icon: <Upload className="w-3 h-3" /> },
        ] as const).map(m => (
          <button key={m.id} type="button" onClick={() => set('dataSource', m.id)}
            className={clsx(
              'flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold border transition-all duration-200',
              entry.dataSource === m.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/40'
            )}
          >{m.icon}{m.label}</button>
        ))}
      </div>

      {entry.dataSource === 'symbol' ? (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={entry.symbol}
            onChange={e => set('symbol', e.target.value.toUpperCase())}
            placeholder="e.g. NFLX"
            className={clsx(inputCls, 'text-xs font-black text-primary tracking-widest py-1.5')}
          />
          <div className="flex flex-wrap gap-1">
            {SYMBOLS.map(s => (
              <button key={s} type="button" onClick={() => set('symbol', s)}
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all duration-150',
                  entry.symbol === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >{s}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className={clsx(
            'flex items-center gap-2 py-2.5 px-3 rounded cursor-pointer border-2 border-dashed transition-all duration-200',
            entry.uploadedFile
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}>
            <Upload className={clsx('w-4 h-4 shrink-0', entry.uploadedFile ? 'text-primary' : 'text-muted-foreground')} />
            <div className="text-left min-w-0">
              {entry.uploadedFile ? (
                <>
                  <p className="text-[10px] font-bold text-primary truncate">{entry.uploadedFile.name}</p>
                  <p className="text-[9px] text-muted-foreground">{(entry.uploadedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <p className="text-[10px] font-semibold text-muted-foreground">Click to upload CSV</p>
              )}
            </div>
            <input type="file" accept=".csv" className="hidden"
              onChange={e => set('uploadedFile', e.target.files?.[0] ?? null)} />
          </label>
          <input
            type="text"
            value={entry.symbol}
            onChange={e => set('symbol', e.target.value.toUpperCase())}
            placeholder="Symbol label (e.g. NFLX)"
            className={clsx(inputCls, 'text-xs py-1.5')}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CONFIG FORM (sidebar)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SharedConfig = {
  startDate:       '2023-03-18',
  endDate:         '2026-03-18',
  totalCapital:    '10000',
  convictionScore: 75,
  convictionYears: '3',
  deploymentStyle: 'MODERATE',
  partitionMonths: '10',
};

function SharedConfigForm({
  config,
  onChange,
}: {
  config: SharedConfig;
  onChange: (c: SharedConfig) => void;
}) {
  const set = <K extends keyof SharedConfig>(k: K, v: SharedConfig[K]) =>
    onChange({ ...config, [k]: v });

  return (
    <div className="flex flex-col gap-4 w-full">
      <Divider label="Date Range" />
      <div className="grid grid-cols-2 gap-2 w-full">
        <Field label="Start Date">
          <input type="date" value={config.startDate}
            onChange={e => set('startDate', e.target.value)} className={clsx(inputCls, 'text-xs')} />
        </Field>
        <Field label="End Date">
          <input type="date" value={config.endDate}
            onChange={e => set('endDate', e.target.value)} className={clsx(inputCls, 'text-xs')} />
        </Field>
      </div>

      <Divider label="Capital" />
      <Field label="Budget per Stock ($)">
        <input type="number" value={config.totalCapital}
          onChange={e => set('totalCapital', e.target.value)}
          placeholder="10000" min="100" step="100" className={clsx(inputCls, 'text-xs')} />
      </Field>

      <Divider label="DSIP Config" />
      <div className="grid grid-cols-2 gap-2 w-full">
        <Field label="Conviction Years">
          <input type="number" value={config.convictionYears}
            onChange={e => set('convictionYears', e.target.value)}
            placeholder="2" min="1" step="1" className={clsx(inputCls, 'text-xs')} />
        </Field>
        <Field label="Part. Months" hint="~63 days at 3">
          <input type="number" value={config.partitionMonths}
            onChange={e => set('partitionMonths', e.target.value)}
            placeholder="3" min="1" className={clsx(inputCls, 'text-xs')} />
        </Field>
      </div>

      <Field label="Deployment Style">
        <div className="grid grid-cols-3 gap-1 w-full">
          {(['AGGRESSIVE','MODERATE','GRADUAL'] as const).map(d => (
            <button key={d} type="button" onClick={() => set('deploymentStyle', d)}
              className={clsx(
                'py-1.5 rounded text-[9px] font-bold border transition-all duration-150',
                config.deploymentStyle === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/40 hover:border-primary/30'
              )}
            >{d[0] + d.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </Field>

      <Field label={`Conviction Score — ${config.convictionScore}`}>
        <div className="px-1 pt-1 pb-2 w-full">
          <Slider.Root value={[config.convictionScore]}
            onValueChange={([v]) => set('convictionScore', v)}
            min={0} max={100} step={1}
            className="relative flex items-center select-none touch-none w-full h-5">
            <Slider.Track className="relative bg-border rounded-full flex-1 h-1.5">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block w-4 h-4 rounded-full border-2 border-primary bg-background shadow-md focus:outline-none focus:ring-2 focus:ring-ring hover:scale-110 transition-transform cursor-grab active:cursor-grabbing" />
          </Slider.Root>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span><span>50</span><span>100</span>
          </div>
        </div>
      </Field>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY TABLE
// ─────────────────────────────────────────────────────────────────────────────

function DailyTable({ days }: { days: DayResult[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? days : days.slice(-20);
  const th = 'px-3 py-2 text-left text-[10px] font-bold tracking-widest uppercase text-muted-foreground bg-muted/40 border-b border-border whitespace-nowrap';
  const td = 'px-3 py-2 text-xs font-mono whitespace-nowrap';
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Daily Execution Log</span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-mono">{days.length} days</span>
          <button onClick={() => setShowAll(v => !v)}
            className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted/40 transition-colors">
            {showAll ? 'Show Last 20' : `Show All ${days.length}`}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>#</th>
              <th className={th}>Date</th>
              <th className={th}>Day</th>
              <th className={th}>Open (Lock)</th>
              <th className={th}>Close</th>
              <th className={th}>LockIn%</th>
              <th className={th}>Invested</th>
              <th className={th}>Shares</th>
              <th className={th}>Portfolio</th>
              <th className={th}>P&L</th>
              <th className={th}>Return%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(d => {
              const pp = d.pnl >= 0;
              return (
                <tr key={d.dayNumber} className={clsx(
                  'transition-colors',
                  d.isRedDay ? 'bg-red-500/[0.03] hover:bg-red-500/[0.07]' : 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07]'
                )}>
                  <td className={clsx(td, 'text-muted-foreground')}>{d.dayNumber}</td>
                  <td className={clsx(td, 'font-semibold text-foreground')}>{d.date}</td>
                  <td className={td}>
                    {d.isRedDay
                      ? <span className="flex items-center gap-1 text-red-500 font-semibold text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/>RED</span>
                      : <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>GREEN</span>}
                  </td>
                  <td className={clsx(td, 'text-primary font-semibold')}>${fmt(d.openPrice)}</td>
                  <td className={td}>${fmt(d.closePrice)}</td>
                  <td className={clsx(td, d.lockInPct >= 0 ? 'text-emerald-500' : 'text-red-500', 'font-semibold')}>
                    {d.lockInPct >= 0 ? '+' : ''}{fmt(d.lockInPct)}%
                  </td>
                  <td className={clsx(td, d.executedAmount > 0 ? 'text-foreground' : 'text-muted-foreground/40')}>
                    {d.executedAmount > 0 ? `$${fmt(d.executedAmount, 0)}` : '—'}
                  </td>
                  <td className={td}>{d.sharesAcquired > 0 ? fmt(d.sharesAcquired, 4) : '—'}</td>
                  <td className={clsx(td, 'font-semibold')}>${fmt(d.portfolioValue, 0)}</td>
                  <td className={clsx(td, 'font-bold', pp ? 'text-emerald-500' : 'text-red-500')}>
                    {pp ? '+' : ''}{fmtUsd(d.pnl)}
                  </td>
                  <td className={clsx(td, 'font-bold', pp ? 'text-emerald-500' : 'text-red-500')}>
                    {pp ? '+' : ''}{fmt(d.pnlPct)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY CARD (per stock result)
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({ result, rank }: { result: SimResult; rank?: number }) {
  const pos         = result.totalPnl >= 0;
  const deployedPct = result.totalCapitalPlanned > 0
    ? (result.totalInvested / result.totalCapitalPlanned) * 100 : 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero P&L */}
      <div className={clsx(
        'rounded-2xl border p-5 relative',
        pos
          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent'
          : 'border-red-500/40 bg-gradient-to-br from-red-500/10 to-transparent'
      )}>
        {/* Rank badge */}
        {rank !== undefined && (
          <div className={clsx(
            'absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border',
            rank === 0
              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500'
              : rank === 1
              ? 'bg-slate-400/20 border-slate-400/40 text-slate-400'
              : 'bg-orange-700/20 border-orange-700/40 text-orange-700'
          )}>
            {rank + 1}
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xl font-black tracking-tight text-foreground">{result.symbol}</span>
          {result.trackerId && (
            <span className="text-xs font-mono text-muted-foreground">#{result.trackerId}</span>
          )}
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
            pos
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          )}>
            {pos ? '▲ PROFIT' : '▼ LOSS'}
          </span>
        </div>

        <div className="flex items-end gap-3 flex-wrap mb-4">
          <div className={clsx('text-5xl font-black font-mono leading-none tabular-nums', pos ? 'text-emerald-500' : 'text-red-500')}>
            {pos ? '+' : ''}{fmt(result.totalPnlPct)}%
          </div>
          <div className="mb-1">
            <div className={clsx('text-xl font-bold font-mono', pos ? 'text-emerald-400' : 'text-red-400')}>
              {pos ? '+' : ''}{fmtUsd(result.totalPnl)}
            </div>
            <div className="text-[10px] text-muted-foreground">net P/L</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
          {[
            { label: 'Invested',    value: fmtUsd(result.totalInvested) },
            { label: 'Final Value', value: fmtUsd(result.finalPortfolioValue) },
            { label: 'Avg Paid',    value: `$${fmt(result.avgPricePaid)}` },
            { label: 'Final Close', value: `$${fmt(result.finalClosePrice)}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-left">
              <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">{label}</div>
              <div className="text-sm font-bold font-mono text-foreground mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {([
          { icon: <Calendar className="w-3 h-3" />,   label: 'Trading Days',     value: result.totalDays.toString(),        sub: `${result.startDate} → ${result.endDate}` },
          { icon: <DollarSign className="w-3 h-3" />, label: 'Capital Deployed', value: fmtUsd(result.totalInvested),       sub: `${fmt(deployedPct, 0)}% of ${fmtUsd(result.totalCapitalPlanned)}` },
          { icon: <Hash className="w-3 h-3" />,       label: 'Shares Held',      value: fmt(result.totalShares, 4),         sub: `avg $${fmt(result.avgPricePaid)} / share` },
          { icon: <BarChart2 className="w-3 h-3" />,  label: 'Portfolio Value',  value: fmtUsd(result.finalPortfolioValue), sub: `at $${fmt(result.finalClosePrice)} close` },
          { icon: <Wallet className="w-3 h-3" />,     label: 'Remaining',        value: fmtUsd(result.totalCapitalPlanned - result.totalInvested), sub: 'undeployed capital' },
          {
            icon: pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />,
            label: 'Net P&L', value: `${pos ? '+' : ''}${fmtUsd(result.totalPnl)}`,
            sub: `${pos ? '+' : ''}${fmt(result.totalPnlPct)}% return`,
            valueColor: pos ? 'text-emerald-500' : 'text-red-500',
          },
        ] as any[]).map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1.5 text-left hover:border-border/80 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">{s.label}</span>
              <span className="text-muted-foreground">{s.icon}</span>
            </div>
            <div className={clsx('font-black font-mono text-lg leading-none', s.valueColor || 'text-foreground')}>{s.value}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

     {/* {result.executionLogPath && (
        <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-muted-foreground truncate">{result.executionLogPath}</span>
          <button
            onClick={() => navigator.clipboard.writeText(result.executionLogPath!)}
            className="shrink-0 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted/40 transition-colors"
          >Copy path</button>
        </div>
      )}   */}

      {/* Collapsible daily log */}
      {result.days.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} Daily Log
          </button>
          {expanded && <DailyTable days={result.days} />}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB STATUS CARD (while running or on error)
// ─────────────────────────────────────────────────────────────────────────────

function JobStatusCard({ job }: { job: SimJob }) {
  return (
    <div className={clsx(
      'rounded-2xl border p-5 flex flex-col gap-3',
      job.status === 'error'
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-border bg-card'
    )}>
      <div className="flex items-center gap-2">
        <span className="text-base font-black tracking-tight text-foreground">{job.symbol || '—'}</span>
        <span className={clsx(
          'px-2 py-0.5 rounded-full text-[10px] font-bold border',
          job.status === 'running'  ? 'bg-primary/10 border-primary/30 text-primary animate-pulse'
          : job.status === 'error'  ? 'bg-red-500/10 border-red-500/30 text-red-500'
          : 'bg-muted/40 border-border text-muted-foreground'
        )}>
          {job.status === 'running' ? 'Running…'
           : job.status === 'error' ? 'Error'
           : 'Pending'}
        </span>
      </div>

      {job.status === 'running' && (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-1.5 rounded-full border-2 border-purple-500/20 border-b-purple-500 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '0.65s' }} />
          </div>
          {job.step && <p className="text-xs text-muted-foreground font-mono">{job.step}</p>}
        </div>
      )}

      {job.status === 'error' && (
        <p className="text-xs text-red-500 font-mono">{job.error}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON BANNER (shown at top when all done)
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonBanner({ jobs }: { jobs: SimJob[] }) {
  const done = jobs.filter(j => j.status === 'done' && j.result);
  if (done.length < 2) return null;

  const sorted = [...done].sort((a, b) => b.result!.totalPnlPct - a.result!.totalPnlPct);
  const best   = sorted[0];
  const worst  = sorted[sorted.length - 1];
  const totalInvested   = done.reduce((s, j) => s + j.result!.totalInvested, 0);
  const totalPortfolio  = done.reduce((s, j) => s + j.result!.finalPortfolioValue, 0);
  const combinedPnl     = totalPortfolio - totalInvested;
  const combinedPnlPct  = totalInvested > 0 ? (combinedPnl / totalInvested) * 100 : 0;
  const pos             = combinedPnl >= 0;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Portfolio Comparison</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-left">
          <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-1">Combined Return</div>
          <div className={clsx('text-3xl font-black font-mono', pos ? 'text-emerald-500' : 'text-red-500')}>
            {pos ? '+' : ''}{fmt(combinedPnlPct)}%
          </div>
          <div className={clsx('text-sm font-bold font-mono', pos ? 'text-emerald-400' : 'text-red-400')}>
            {pos ? '+' : ''}{fmtUsd(combinedPnl)}
          </div>
        </div>

        <div className="text-left">
          <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-1">Total Deployed</div>
          <div className="text-xl font-black font-mono text-foreground">{fmtUsd(totalInvested)}</div>
          <div className="text-[10px] text-muted-foreground font-mono">across {done.length} stocks</div>
        </div>

        <div className="text-left">
          <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-1">🏆 Best Performer</div>
          <div className="text-xl font-black text-emerald-500">{best.symbol}</div>
          <div className="text-[10px] font-mono text-emerald-400">+{fmt(best.result!.totalPnlPct)}%</div>
        </div>

        <div className="text-left">
          <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-1">📉 Worst Performer</div>
          <div className="text-xl font-black text-red-500">{worst.symbol}</div>
          <div className="text-[10px] font-mono text-red-400">{worst.result!.totalPnlPct >= 0 ? '+' : ''}{fmt(worst.result!.totalPnlPct)}%</div>
        </div>
      </div>

      {/* Rank bar */}
      <div className="flex flex-col gap-2">
        <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">Performance Ranking</div>
        <div className="flex flex-col gap-1.5">
          {sorted.map((j, i) => {
            const r = j.result!;
            const max = Math.max(...sorted.map(x => Math.abs(x.result!.totalPnlPct)));
            const barW = max > 0 ? Math.abs(r.totalPnlPct) / max * 100 : 0;
            const p = r.totalPnlPct >= 0;
            return (
              <div key={j.id} className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-muted-foreground w-4">{i + 1}</span>
                <span className="text-[10px] font-black w-12 text-foreground">{r.symbol}</span>
                <div className="flex-1 h-4 rounded bg-muted/30 overflow-hidden">
                  <div
                    className={clsx('h-full rounded transition-all', p ? 'bg-emerald-500/60' : 'bg-red-500/60')}
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <span className={clsx('text-[10px] font-mono font-bold w-14 text-right', p ? 'text-emerald-500' : 'text-red-500')}>
                  {p ? '+' : ''}{fmt(r.totalPnlPct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 8); }

export default function MultipleSimulationPage() {
  const { dark, toggle } = useTheme();
  const [sideOpen, setSideOpen] = useState(true);
  const [config,   setConfig]   = useState<SharedConfig>(DEFAULT_CONFIG);
  const [stocks,   setStocks]   = useState<StockEntry[]>([
    { id: genId(), symbol: 'NFLX', dataSource: 'symbol', uploadedFile: null },
    { id: genId(), symbol: 'AAPL', dataSource: 'symbol', uploadedFile: null },
  ]);
  const [jobs,     setJobs]     = useState<SimJob[]>([]);
  const [anyLoading, setAnyLoading] = useState(false);

  // ── Stock list helpers ──────────────────────────────────────────────────────
  const addStock = () =>
    setStocks(s => [...s, { id: genId(), symbol: '', dataSource: 'symbol', uploadedFile: null }]);

  const removeStock = (id: string) =>
    setStocks(s => s.filter(e => e.id !== id));

  const updateStock = (updated: StockEntry) =>
    setStocks(s => s.map(e => e.id === updated.id ? updated : e));

  // ── Run all simulations ────────────────────────────────────────────────────
  const handleRunAll = useCallback(async () => {
    const valid = stocks.filter(e =>
      e.dataSource === 'upload' ? !!e.uploadedFile : !!e.symbol.trim()
    );
    if (valid.length === 0) return;

    setAnyLoading(true);

    // Init all jobs as pending
    const initJobs: SimJob[] = valid.map(e => ({
      id: e.id,
      symbol: e.symbol || 'STOCK',
      status: 'pending',
    }));
    setJobs(initJobs);

    // Run all in parallel
    await Promise.all(valid.map(async (entry) => {
      // Mark as running
      setJobs(prev => prev.map(j =>
        j.id === entry.id ? { ...j, status: 'running' } : j
      ));

      try {
        let result: SimResult;

        if (entry.dataSource === 'upload') {
          if (!entry.uploadedFile) throw new Error('No CSV file selected');
          const text = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload  = e => resolve(e.target?.result as string);
            r.onerror = () => reject(new Error('Failed to read file'));
            r.readAsText(entry.uploadedFile!);
          });

          setJobs(prev => prev.map(j =>
            j.id === entry.id ? { ...j, step: 'Parsing CSV…' } : j
          ));

          const rows = parseCsv(text);

          setJobs(prev => prev.map(j =>
            j.id === entry.id ? { ...j, step: `Running DSIP on ${rows.length} days…` } : j
          ));
          await new Promise(r => setTimeout(r, 30));

          result = runLocalSimulation(rows, {
            symbol:          entry.symbol || 'STOCK',
            totalCapital:    parseFloat(config.totalCapital)    || 10000,
            convictionScore: config.convictionScore,
            convictionYears: parseFloat(config.convictionYears) || 2,
            deploymentStyle: config.deploymentStyle,
            partitionMonths: parseInt(config.partitionMonths)   || 3,
          });
        } else {
          result = await runBackendSimulation(
            entry.symbol,
            config,
            (msg) => setJobs(prev => prev.map(j =>
              j.id === entry.id ? { ...j, step: msg } : j
            ))
          );
        }

        setJobs(prev => prev.map(j =>
          j.id === entry.id ? { ...j, status: 'done', result, step: undefined } : j
        ));
      } catch (e: any) {
        const errMsg =
          e?.response?.data?.message ||
          (typeof e?.response?.data === 'string' ? e.response.data : null) ||
          e?.message || 'Simulation failed';
        setJobs(prev => prev.map(j =>
          j.id === entry.id ? { ...j, status: 'error', error: errMsg, step: undefined } : j
        ));
      }
    }));

    setAnyLoading(false);
  }, [stocks, config]);

  const handleReset = () => { setJobs([]); };

  const canRun = !anyLoading && stocks.some(e =>
    e.dataSource === 'upload' ? !!e.uploadedFile : !!e.symbol.trim()
  );

  const allDone = jobs.length > 0 && jobs.every(j => j.status === 'done' || j.status === 'error');
  const doneJobs = jobs.filter(j => j.status === 'done' && j.result);
  const sortedDoneJobs = [...doneJobs].sort((a, b) =>
    b.result!.totalPnlPct - a.result!.totalPnlPct
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSideOpen(o => !o)}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-150 active:scale-95">
            {sideOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-border" />

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-black tracking-tight">DSIP</span>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* ── Mode switcher nav ── */}
          <nav className="hidden sm:flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/30">
            {/* Single Stock — link */}
            <a
              href="/simulationRun"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all duration-150 active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Single Stock
            </a>
            {/* Multi Stock — active */}
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10 cursor-default select-none"
            >
              <Layers className="w-3.5 h-3.5" />
              Multi Stock
            </span>
          </nav>

          {/* Mobile: tap Single Stock icon to go back */}
          <a
            href="/simulation"
            className="flex sm:hidden items-center justify-center p-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all active:scale-95"
            title="Single Stock Simulator"
          >
            <TrendingUp className="w-4 h-4" />
          </a>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Back to Dashboard — desktop */}
          <a
            href="/home"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-150 active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </a>
          {/* Back to Dashboard — mobile */}
          <a
            href="/home"
            className="flex sm:hidden items-center justify-center p-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted/40 transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          {allDone && jobs.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-primary/10 border-primary/20 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {doneJobs.length}/{jobs.length} complete
            </span>
          )}
          <button onClick={toggle}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-150 active:scale-95">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={clsx(
          'relative flex-shrink-0 border-r border-border bg-card/50 transition-all duration-300',
          sideOpen ? 'w-[300px]' : 'w-0 overflow-hidden'
        )}>
          {sideOpen && <SidebarDecor />}
          <div
            className="relative z-10 h-full overflow-y-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`.dsip-sidebar-scroll::-webkit-scrollbar { display: none; }`}</style>
            <div className="dsip-sidebar-scroll p-4 min-w-[300px] flex flex-col items-start text-left gap-5">

              {/* Section: Stocks */}
              <div className="w-full">
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-primary/60" />
                    <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                      Stocks to Simulate
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{stocks.length} selected</span>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  {stocks.map(entry => (
                    <StockEntryRow
                      key={entry.id}
                      entry={entry}
                      onChange={updateStock}
                      onRemove={() => removeStock(entry.id)}
                      canRemove={stocks.length > 1}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addStock}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-border text-[11px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Stock
                </button>
              </div>

              {/* Section: Shared Config */}
              <div className="w-full">
                <div className="flex items-center gap-2 w-full mb-3">
                  <div className="w-1 h-4 rounded-full bg-primary/60" />
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                    Shared Config (all stocks)
                  </p>
                </div>
                <SharedConfigForm config={config} onChange={setConfig} />
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground leading-snug w-full">
                <span className="text-primary shrink-0">⏱</span>
                <span>Open price locked in first 10 min · P&amp;L at close · All stocks run in parallel</span>
              </div>

              {/* Run button */}
              <button
                type="button"
                disabled={!canRun}
                onClick={handleReset.bind(null) || (() => {})}
              >
                {/* hidden reset trigger — actual button below */}
              </button>

              <div className="flex gap-2 w-full">
                {jobs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-md border border-border text-xs font-bold text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all active:scale-[0.98]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}

                <button
                  type="button"
                  disabled={!canRun}
                  onClick={handleRunAll}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md',
                    'text-sm font-bold tracking-widest uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring',
                    !canRun
                      ? 'bg-primary/20 text-primary/40 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/30'
                  )}
                >
                  {anyLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
                    : <><Play className="w-4 h-4" /> Run All</>}
                </button>
              </div>

              <div className="h-8 w-full shrink-0" />
            </div>
          </div>

          {sideOpen && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent z-20" />
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {jobs.length === 0 ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-10 text-center select-none">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <TrendingUp className="w-9 h-9 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground mb-2">DSIP Multi-Stock Simulator</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Add multiple stocks in the sidebar, configure shared DSIP parameters, then click <strong>Run All</strong> to simulate them in parallel.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-primary" /> Parallel execution</span>
                <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-primary" /> Side-by-side results</span>
                <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-primary" /> Portfolio comparison</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pt-4 pb-2 shrink-0 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
                  Simulation Results — {jobs.length} stock{jobs.length > 1 ? 's' : ''}
                </span>
                {allDone && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3" /> New Run
                  </button>
                )}
              </div>

              <div className="px-5 pb-8 flex flex-col gap-6">
                {/* Comparison banner (only when 2+ done) */}
                {doneJobs.length >= 2 && (
                  <ComparisonBanner jobs={jobs} />
                )}

                {/* Grid of results */}
                <div className={clsx(
                  'grid gap-5',
                  jobs.length === 1   ? 'grid-cols-1'
                  : jobs.length === 2 ? 'grid-cols-1 xl:grid-cols-2'
                  : 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
                )}>
                  {jobs.map((job, idx) => {
                    const rank = sortedDoneJobs.findIndex(j => j.id === job.id);
                    return (
                      <div key={job.id} className="flex flex-col">
                        {job.status === 'done' && job.result ? (
                          <SummaryCard
                            result={job.result}
                            rank={doneJobs.length >= 2 ? rank : undefined}
                          />
                        ) : (
                          <JobStatusCard job={job} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}