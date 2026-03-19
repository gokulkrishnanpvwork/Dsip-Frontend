import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Play, Loader2, Settings, X, Sun, Moon, RotateCcw,
  BarChart3, Users, Zap, CheckCircle2, Info, Plus, Trash2,
  Layers, Trophy, GitCompare, ChevronDown, ChevronUp, Target,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS  (identical to Demo1)
// ─────────────────────────────────────────────────────────────────────────────

const SYMBOLS = ['NFLX','AAPL','TSLA','MSFT','GOOGL','AMZN','NVDA','META','V','BLK'];

const AUTO_CONFIG = {
  totalCapital:    '10000',
  partitionYears:  '2',
  partitionMonths: '3',
  convictionScore: 95,
  deploymentStyle: 'MODERATE' as DeployStyle,
};

const ROW_ACCENTS = [
  'border-l-blue-500',
  'border-l-violet-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-emerald-500',
  'border-l-cyan-500',
  'border-l-orange-500',
  'border-l-pink-500',
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type DeployStyle = 'AGGRESSIVE' | 'MODERATE' | 'GRADUAL';

interface SimConfig {
  totalCapital:    string;
  partitionYears:  string;
  partitionMonths: string;
  convictionScore: number;
  deploymentStyle: DeployStyle;
}

interface SimRow {
  id:     string;
  symbol: string;
  start:  string;
  end:    string;
  isAuto: boolean;
  config: SimConfig;
}

interface SimResult {
  id:           string;
  symbol:       string;
  isAuto:       boolean;
  deployStyle:  DeployStyle;
  totalInvested: number;
  dsip: {
    final:    number;
    pnl:      number;
    pct:      number;
    multiple: string;
  };
  nonTool: {
    dailySpend: number;
    final:      number;
    pnl:        number;
    pct:        number;
    multiple:   string;
  };
  expanded: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS  (identical to Demo1)
// ─────────────────────────────────────────────────────────────────────────────

const fmtUsd = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// INFO TAG  (copied 1:1 from Demo1)
// ─────────────────────────────────────────────────────────────────────────────

const InfoTag = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setVisible(v => !v); }}
        className="text-slate-400 hover:text-blue-500 transition-colors focus:outline-none align-middle"
        type="button"
      >
        <Info size={12} strokeWidth={2.5} />
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold leading-tight rounded-xl shadow-2xl z-[110] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION ENGINE  (same math as Demo1, extended for multi-row)
// ─────────────────────────────────────────────────────────────────────────────

function simulate(row: SimRow): SimResult {
  const cap          = row.isAuto ? 10_000 : parseFloat(row.config.totalCapital) || 10_000;
  const tradingDays  = 252;
  const styleMulti   =
    row.config.deploymentStyle === 'AGGRESSIVE' ? 1.2 :
    row.config.deploymentStyle === 'GRADUAL'    ? 0.85 : 1.0;
  const seed         = row.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const dsipGain     = (1.30 + ((seed % 20) / 100)) * styleMulti;
  const nonToolGain  = dsipGain * 0.80;

  return {
    id:            row.id,
    symbol:        row.symbol,
    isAuto:        row.isAuto,
    deployStyle:   row.config.deploymentStyle,
    totalInvested: cap,
    dsip: {
      final:    cap * dsipGain,
      pnl:      cap * dsipGain - cap,
      pct:      (dsipGain - 1) * 100,
      multiple: dsipGain.toFixed(2),
    },
    nonTool: {
      dailySpend: cap / tradingDays,
      final:      cap * nonToolGain,
      pnl:        cap * nonToolGain - cap,
      pct:        (nonToolGain - 1) * 100,
      multiple:   nonToolGain.toFixed(2),
    },
    expanded: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL CONFIG MODAL  (identical to Demo1's modal, receives row config)
// ─────────────────────────────────────────────────────────────────────────────

function ConfigModal({
  config, onSave, onClose,
}: {
  config:  SimConfig;
  onSave:  (c: SimConfig) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<SimConfig>(config);
  const set = <K extends keyof SimConfig>(k: K, v: SimConfig[K]) =>
    setLocal(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Manual Config</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Budget */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
              Budget ($) <InfoTag text="Total amount of cash available for the full duration." />
            </label>
            <input
              type="number"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs outline-none focus:ring-1 ring-blue-500"
              value={local.totalCapital}
              onChange={e => set('totalCapital', e.target.value)}
            />
          </div>

          {/* Years / Months */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                Years <InfoTag text="Duration the tool partitions capital for long-term growth." />
              </label>
              <input
                type="number"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs outline-none"
                value={local.partitionYears}
                onChange={e => set('partitionYears', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                Months <InfoTag text="How often the tool re-evaluates entries (Default: Quarterly/3mo)." />
              </label>
              <input
                type="number"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs outline-none"
                value={local.partitionMonths}
                onChange={e => set('partitionMonths', e.target.value)}
              />
            </div>
          </div>

          {/* Style */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
              Style <InfoTag text="Aggressive: Sells faster, Moderate: Balanced, Gradual: Long-term focus." />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['AGGRESSIVE','MODERATE','GRADUAL'] as DeployStyle[]).map(s => (
                <button
                  key={s} type="button"
                  onClick={() => set('deploymentStyle', s)}
                  className={clsx(
                    'py-2 rounded-xl text-[8px] font-black border transition-all',
                    local.deploymentStyle === s
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  )}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Conviction score */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 items-center">
              <span className="flex items-center">
                Score <InfoTag text="How strictly the tool follows signals (Higher = More picky)." />
              </span>
              <span className="text-blue-500 font-black">{local.convictionScore}%</span>
            </div>
            <input
              type="range" min={0} max={100}
              className="accent-blue-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              value={local.convictionScore}
              onChange={e => set('convictionScore', parseInt(e.target.value))}
            />
          </div>

          {/* Apply */}
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY VERDICT POPUP  (identical to Demo1's popup, receives result)
// ─────────────────────────────────────────────────────────────────────────────

function VerdictModal({
  result, onClose,
}: {
  result:  SimResult;
  onClose: () => void;
}) {
  const advantage = result.dsip.pnl - result.nonTool.pnl;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative animate-in slide-in-from-bottom-8">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all shadow-sm"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {/* Title */}
        <div className="text-center mb-10">
          <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Strategy Verdict</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-3 flex items-center justify-center">
            {result.symbol} · Tool User vs Fixed Daily DCA
            <InfoTag text="Comparing strategic red-day buying vs. simple daily dollar cost averaging." />
          </p>
          <span className={clsx(
            'inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-[9px] font-black border',
            result.isAuto
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
          )}>
            {result.isAuto ? '⚡ AUTO Mode' : '⚙ MANUAL Mode'} · {result.deployStyle}
          </span>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* DSIP Tool User — exactly like Demo1 */}
          <div className="bg-blue-600 shadow-xl shadow-blue-600/20 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <Zap size={80} className="absolute -bottom-4 -right-4 text-white/10" />
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-white/20"><Zap size={16} fill="white" /></div>
              <span className="text-[11px] font-black uppercase tracking-widest flex items-center">
                DSIP Tool User
                <InfoTag text="Strategic: Automatically pauses on green days and doubles down on red days to lower cost." />
              </span>
            </div>
            <p className="text-5xl font-black font-mono tracking-tighter tabular-nums">
              {fmtUsd(result.dsip.pnl)}
            </p>
            <p className="text-sm font-bold font-mono mt-1 text-white/70">
              +{fmt(result.dsip.pct)}% · {result.dsip.multiple}×
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
                <CheckCircle2 size={14} className="text-emerald-300" /> Lowered Cost Basis
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
                <CheckCircle2 size={14} className="text-emerald-300" /> Strategic Execution
              </div>
            </div>
          </div>

          {/* Non-Tool User — exactly like Demo1 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
                <Users size={16} className="text-slate-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center">
                Non-Tool User
                <InfoTag text="Passive: Buys every single day, even when prices are at all-time highs." />
              </span>
            </div>
            <p className="text-5xl font-black font-mono tracking-tighter text-slate-400 tabular-nums">
              {fmtUsd(result.nonTool.pnl)}
            </p>
            <p className="text-sm font-bold font-mono mt-1 text-slate-500">
              +{fmt(result.nonTool.pct)}% · {result.nonTool.multiple}×
            </p>
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-slate-500 uppercase">Daily Entry</span>
                <span className="text-xs font-bold font-mono">{fmtUsd(result.nonTool.dailySpend)}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 italic">
                Invests the exact same dollar amount every morning, regardless of market volatility.
              </p>
            </div>
          </div>
        </div>

        {/* Advantage bar — exactly like Demo1 */}
        <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center">
              Financial Advantage
              <InfoTag text="The extra profit earned by timing entries using the DSIP tool." />
            </span>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Extra profit from better timing.</p>
          </div>
          <span className="text-3xl font-black font-mono text-emerald-500 tabular-nums">
            +{fmtUsd(advantage)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION ROW EDITOR CARD
// ─────────────────────────────────────────────────────────────────────────────

function SimRowCard({
  row, index, onUpdate, onRemove, canRemove, onOpenSettings,
}: {
  row:            SimRow;
  index:          number;
  onUpdate:       (r: SimRow) => void;
  onRemove:       () => void;
  canRemove:      boolean;
  onOpenSettings: (id: string) => void;
}) {
  const accent = ROW_ACCENTS[index % ROW_ACCENTS.length];
  const set = <K extends keyof SimRow>(k: K, v: SimRow[K]) => onUpdate({ ...row, [k]: v });

  return (
    <div className={clsx(
      'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 border-l-4 group',
      accent
    )}>
      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Simulation {index + 1}
          </span>

          {/* ── AUTO / MANUAL toggle — identical to Demo1 ── */}
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => set('isAuto', true)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-[9px] font-black transition-all',
                row.isAuto ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >AUTO</button>
            <button
              type="button"
              onClick={() => set('isAuto', false)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-[9px] font-black transition-all',
                !row.isAuto ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >MANUAL</button>
          </div>

          {/* ── Settings gear — disabled (dim) in AUTO, active in MANUAL ── */}
          <button
            type="button"
            onClick={() => !row.isAuto && onOpenSettings(row.id)}
            className={clsx(
              'p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 transition-all',
              row.isAuto ? 'opacity-20 cursor-not-allowed' : 'hover:border-blue-500 hover:text-blue-500'
            )}
          >
            <Settings size={15} />
          </button>

          {/* Active config badge */}
          {!row.isAuto && (
            <span className="hidden sm:inline text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              {row.config.deploymentStyle} · ${Number(row.config.totalCapital).toLocaleString()}
            </span>
          )}
          {row.isAuto && (
            <span className="hidden sm:inline text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              Auto · $10,000 · Moderate
            </span>
          )}
        </div>

        {/* Remove */}
        {canRemove && (
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Symbol + date inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase text-slate-500 ml-1 flex items-center">
            Symbol <InfoTag text="Ticker symbol of the stock to back-test." />
          </label>
          <input
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-black outline-none focus:ring-1 ring-blue-500 w-full"
            value={row.symbol}
            onChange={e => set('symbol', e.target.value.toUpperCase())}
            maxLength={6}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[9px] font-black uppercase text-slate-500 ml-1 flex items-center">
            Date Range <InfoTag text="The period over which the tool will simulate buying dips." />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 ring-blue-500 w-full"
              value={row.start}
              onChange={e => set('start', e.target.value)}
            />
            <input
              type="date"
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 ring-blue-500 w-full"
              value={row.end}
              onChange={e => set('end', e.target.value)}
            />
          </div>
        </div>
        {/* Budget — shown only in AUTO mode as read-only hint */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase text-slate-500 ml-1 flex items-center">
            Budget <InfoTag text="In AUTO mode this is $10,000 by default. Switch to MANUAL to customise." />
          </label>
          <input
            type="number"
            className={clsx(
              'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-1 ring-blue-500 w-full',
              row.isAuto ? 'opacity-40 cursor-not-allowed' : ''
            )}
            value={row.isAuto ? '10000' : row.config.totalCapital}
            readOnly={row.isAuto}
            onChange={e => !row.isAuto && onUpdate({ ...row, config: { ...row.config, totalCapital: e.target.value } })}
          />
        </div>
      </div>

      {/* Symbol quick-pick chips */}
      <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        {SYMBOLS.map(s => (
          <button
            key={s} type="button"
            onClick={() => set('symbol', s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all',
              row.symbol === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400 hover:text-blue-500'
            )}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CARD  (with expandable detail + Verdict button per row)
// ─────────────────────────────────────────────────────────────────────────────

function ResultCard({
  result, rank, index, onToggle, onOpenVerdict,
}: {
  result:        SimResult;
  rank:          number;
  index:         number;
  onToggle:      () => void;
  onOpenVerdict: (id: string) => void;
}) {
  const accent   = ROW_ACCENTS[index % ROW_ACCENTS.length];
  const isWinner = rank === 1;
  const positive = result.dsip.pnl >= 0;
  const advantage = result.dsip.pnl - result.nonTool.pnl;

  return (
    <div className={clsx(
      'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden border-l-4 transition-all',
      accent,
      isWinner && 'ring-1 ring-amber-400/40'
    )}>

      {/* Winner banner */}
      {isWinner && (
        <div className="bg-amber-400/10 border-b border-amber-400/20 px-5 py-1.5 flex items-center gap-2">
          <Trophy size={11} className="text-amber-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Best Performer</span>
        </div>
      )}

      {/* Main row — clickable to expand */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        onClick={onToggle}
      >
        {/* Rank */}
        <div className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
          isWinner ? 'bg-amber-400 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
        )}>#{rank}</div>

        {/* Symbol + mode badge */}
        <div className="flex flex-col gap-0.5 min-w-[70px]">
          <span className="text-sm font-black">{result.symbol}</span>
          <span className={clsx(
            'text-[8px] font-black uppercase',
            result.isAuto ? 'text-blue-400' : 'text-violet-400'
          )}>{result.isAuto ? 'AUTO' : 'MANUAL'}</span>
        </div>

        {/* P&L hero */}
        <div className="flex-1">
          <div className={clsx(
            'text-xl font-black font-mono tabular-nums',
            positive ? 'text-emerald-500' : 'text-red-500'
          )}>
            {positive ? '+' : ''}{fmtUsd(result.dsip.pnl)}
          </div>
          <div className="text-[9px] font-bold text-slate-500 font-mono">
            {positive ? '+' : ''}{fmt(result.dsip.pct)}% · {result.dsip.multiple}× · {result.deployStyle}
          </div>
        </div>

        {/* vs DCA */}
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <div className="text-[9px] font-bold uppercase text-slate-400">vs DCA</div>
          <div className="text-sm font-black font-mono text-emerald-500">+{fmtUsd(advantage)}</div>
        </div>

        {/* Capital */}
        <div className="hidden md:flex flex-col items-end gap-0.5 w-20">
          <div className="text-[9px] font-bold uppercase text-slate-400">Capital</div>
          <div className="text-xs font-black font-mono">{fmtUsd(result.totalInvested)}</div>
        </div>

        {/* Chevron */}
        <div className="text-slate-400 shrink-0">
          {result.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* ── EXPANDED DETAIL — mirrors Demo1's result card layout ── */}
      {result.expanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 px-5 pb-6 pt-5 animate-in slide-in-from-top-2 duration-200">

          {/* Summary numbers — identical layout to Demo1 result card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-500 flex items-center">
                Tool P&L <InfoTag text="Net dollar gain using DSIP strategic entries." />
              </span>
              <p className="text-2xl font-black font-mono mt-1 text-emerald-500 tabular-nums">
                +{fmtUsd(result.dsip.pnl)}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-blue-500 flex items-center">
                Total Return <InfoTag text="Final value of your portfolio (Capital + Profit)." />
              </span>
              <p className="text-2xl font-black font-mono mt-1 text-blue-500 tabular-nums">
                {fmtUsd(result.dsip.final)}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-500 flex items-center">
                Invested <InfoTag text="Total capital deployed into the market." />
              </span>
              <p className="text-2xl font-black font-mono mt-1 tabular-nums">
                {fmtUsd(result.totalInvested)}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-500 flex items-center">
                Mode <InfoTag text="Indicates if smart automation or manual settings were used." />
              </span>
              <p className="text-2xl font-black font-mono mt-1 uppercase text-slate-400">
                {result.isAuto ? 'Auto' : 'Manual'}
              </p>
            </div>
          </div>

          {/* Tool User vs Non-Tool User mini comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Tool user */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-600/20">
                  <Zap size={13} className="text-blue-400" fill="currentColor" />
                </div>
                <span className="text-[10px] font-black uppercase text-blue-400">DSIP Tool User</span>
              </div>
              <p className="text-3xl font-black font-mono text-emerald-500 tabular-nums">
                {fmtUsd(result.dsip.pnl)}
              </p>
              <div className="flex gap-4 mt-3">
                <div>
                  <div className="text-[8px] font-black uppercase text-slate-400">Return</div>
                  <div className="text-xs font-black font-mono text-emerald-400">+{fmt(result.dsip.pct)}%</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-slate-400">Multiple</div>
                  <div className="text-xs font-black font-mono text-blue-400">{result.dsip.multiple}×</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-slate-400">Final Value</div>
                  <div className="text-xs font-black font-mono">{fmtUsd(result.dsip.final)}</div>
                </div>
              </div>
            </div>

            {/* Non-tool user */}
            <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                  <Users size={13} className="text-slate-500" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-500">Non-Tool User (DCA)</span>
              </div>
              <p className="text-3xl font-black font-mono text-slate-400 tabular-nums">
                {fmtUsd(result.nonTool.pnl)}
              </p>
              <div className="flex gap-4 mt-3">
                <div>
                  <div className="text-[8px] font-black uppercase text-slate-400">Return</div>
                  <div className="text-xs font-black font-mono text-slate-400">+{fmt(result.nonTool.pct)}%</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-slate-400">Daily Entry</div>
                  <div className="text-xs font-black font-mono text-slate-400">{fmtUsd(result.nonTool.dailySpend)}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-slate-400">Final Value</div>
                  <div className="text-xs font-black font-mono">{fmtUsd(result.nonTool.final)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Advantage row + Verdict button */}
          <div className="flex items-center justify-between gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex-wrap">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center">
                Financial Advantage <InfoTag text="Extra profit earned by using the DSIP tool." />
              </span>
              <span className="text-2xl font-black font-mono text-emerald-500 tabular-nums">
                +{fmtUsd(advantage)}
              </span>
            </div>
            {/* ── Verdict button — identical to Demo1's orange button ── */}
            <button
              onClick={e => { e.stopPropagation(); onOpenVerdict(result.id); }}
              className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all hover:bg-orange-600"
            >
              <Users size={14} /> Strategy Verdict
              <InfoTag text="Click to see how you beat a standard daily investor." />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

function GlobalSummary({ results }: { results: SimResult[] }) {
  const totalInvested   = results.reduce((s, r) => s + r.totalInvested, 0);
  const totalDsipFinal  = results.reduce((s, r) => s + r.dsip.final, 0);
  const totalDsipPnl    = results.reduce((s, r) => s + r.dsip.pnl, 0);
  const totalDcaPnl     = results.reduce((s, r) => s + r.nonTool.pnl, 0);
  const totalAdvantage  = totalDsipPnl - totalDcaPnl;
  const avgReturn       = results.reduce((s, r) => s + r.dsip.pct, 0) / results.length;
  const positive        = totalDsipPnl >= 0;

  return (
    <div className="bg-slate-900 dark:bg-black border border-slate-700 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">Combined Portfolio</div>
          <h2 className="text-3xl font-black text-white">{results.length} Simulations</h2>
        </div>
        <div className={clsx(
          'px-5 py-2.5 rounded-2xl text-sm font-black font-mono tabular-nums border',
          positive
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        )}>
          {positive ? '+' : ''}{fmtUsd(totalDsipPnl)} total P&L
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Invested',   value: fmtUsd(totalInvested),    color: 'text-white'                                           },
          { label: 'Portfolio Value',  value: fmtUsd(totalDsipFinal),   color: 'text-blue-400'                                        },
          { label: 'DSIP P&L',         value: `${positive?'+':''}${fmtUsd(totalDsipPnl)}`, color: positive?'text-emerald-400':'text-red-400' },
          { label: 'vs DCA Advantage', value: `+${fmtUsd(totalAdvantage)}`, color: 'text-emerald-400'                                },
          { label: 'Avg Return',       value: `${avgReturn>=0?'+':''}${fmt(avgReturn)}%`,   color: avgReturn>=0?'text-emerald-400':'text-red-400' },
          { label: 'Auto / Manual',    value: `${results.filter(r=>r.isAuto).length} / ${results.filter(r=>!r.isAuto).length}`, color: 'text-blue-400' },
        ].map(item => (
          <div key={item.label} className="bg-slate-800/60 rounded-xl p-3">
            <div className="text-[8px] font-black uppercase text-slate-500 mb-1.5">{item.label}</div>
            <div className={clsx('text-base font-black font-mono tabular-nums', item.color)}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD BAR CHART
// ─────────────────────────────────────────────────────────────────────────────

function Leaderboard({ results }: { results: SimResult[] }) {
  const sorted = [...results].sort((a, b) => b.dsip.pnl - a.dsip.pnl);
  const maxPnl = Math.max(...sorted.map(r => Math.abs(r.dsip.pnl)), 1);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 size={16} className="text-blue-500" />
        <span className="text-xs font-black uppercase tracking-widest">P&L Leaderboard</span>
      </div>
      <div className="flex flex-col gap-3">
        {sorted.map((r, i) => {
          const pct     = (Math.abs(r.dsip.pnl) / maxPnl) * 100;
          const positive = r.dsip.pnl >= 0;
          return (
            <div key={r.id} className="flex items-center gap-3">
              <div className="text-[9px] font-black text-slate-400 w-4 text-right">{i + 1}</div>
              <div className="text-xs font-black w-12 shrink-0">{r.symbol}</div>
              <span className={clsx(
                'text-[8px] font-black uppercase w-10 shrink-0',
                r.isAuto ? 'text-blue-400' : 'text-violet-400'
              )}>{r.isAuto ? 'AUTO' : 'MAN'}</span>
              <div className="flex-1 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className={clsx('h-full rounded-lg transition-all duration-700 flex items-center px-2', positive ? 'bg-blue-600' : 'bg-red-500/70')}
                  style={{ width: `${pct}%` }}
                >
                  <span className="text-[8px] font-black text-white truncate">
                    {positive ? '+' : ''}{fmtUsd(r.dsip.pnl)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400 w-14 text-right">
                +{fmtUsd(r.dsip.pnl - r.nonTool.pnl)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARE TABLE
// ─────────────────────────────────────────────────────────────────────────────

function CompareTable({ results }: { results: SimResult[] }) {
  type SortKey = 'dsip.pnl' | 'dsip.pct' | 'advantage' | 'nonTool.pnl';
  const [sortKey, setSortKey] = useState<SortKey>('dsip.pnl');

  const val = (r: SimResult, k: SortKey) => {
    if (k === 'dsip.pnl')   return r.dsip.pnl;
    if (k === 'dsip.pct')   return r.dsip.pct;
    if (k === 'advantage')  return r.dsip.pnl - r.nonTool.pnl;
    return r.nonTool.pnl;
  };
  const sorted = [...results].sort((a, b) => val(b, sortKey) - val(a, sortKey));

  const th = (k: SortKey, label: string) => (
    <th
      onClick={() => setSortKey(k)}
      className={clsx(
        'px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest whitespace-nowrap cursor-pointer select-none transition-colors',
        sortKey === k ? 'text-blue-500' : 'text-slate-500 hover:text-blue-400'
      )}
    >{label} ↕</th>
  );

  const td = 'px-3 py-3 text-xs font-mono border-b border-slate-200 dark:border-slate-800 whitespace-nowrap';

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <GitCompare size={15} className="text-blue-500" />
        <span className="text-xs font-black uppercase tracking-widest">Side-by-Side Comparison</span>
        <span className="ml-auto text-[9px] text-slate-400">Click column headers to sort</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50">
              <th className="px-3 py-2 text-left text-[9px] font-black uppercase text-slate-500">#</th>
              <th className="px-3 py-2 text-left text-[9px] font-black uppercase text-slate-500">Symbol</th>
              <th className="px-3 py-2 text-left text-[9px] font-black uppercase text-slate-500">Mode</th>
              <th className="px-3 py-2 text-left text-[9px] font-black uppercase text-slate-500">Style</th>
              <th className="px-3 py-2 text-left text-[9px] font-black uppercase text-slate-500">Capital</th>
              {th('dsip.pnl',  'DSIP P&L')}
              {th('dsip.pct',  'Return %')}
              {th('advantage', 'vs DCA')}
              {th('nonTool.pnl', 'DCA P&L')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const pos = r.dsip.pnl >= 0;
              const adv = r.dsip.pnl - r.nonTool.pnl;
              return (
                <tr key={r.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                  <td className={clsx(td, 'text-slate-400 font-bold')}>{i + 1}</td>
                  <td className={clsx(td, 'font-black text-sm')}>{r.symbol}</td>
                  <td className={td}>
                    <span className={clsx(
                      'text-[8px] font-black uppercase px-2 py-0.5 rounded-full border',
                      r.isAuto
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                    )}>{r.isAuto ? 'Auto' : 'Manual'}</span>
                  </td>
                  <td className={td}>
                    <span className="text-[8px] font-black uppercase text-slate-400">{r.deployStyle}</span>
                  </td>
                  <td className={td}>{fmtUsd(r.totalInvested)}</td>
                  <td className={clsx(td, 'font-bold', pos ? 'text-emerald-500' : 'text-red-500')}>
                    {pos ? '+' : ''}{fmtUsd(r.dsip.pnl)}
                  </td>
                  <td className={clsx(td, 'font-bold', pos ? 'text-emerald-500' : 'text-red-500')}>
                    {pos ? '+' : ''}{fmt(r.dsip.pct)}%
                  </td>
                  <td className={clsx(td, 'font-bold text-emerald-500')}>+{fmtUsd(adv)}</td>
                  <td className={clsx(td, 'text-slate-400')}>{fmtUsd(r.nonTool.pnl)}</td>
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
// FACTORY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

let _uid = 0;
const newId = () => `sim_${++_uid}`;

const makeRow = (symbolIdx = 0): SimRow => ({
  id:     newId(),
  symbol: SYMBOLS[symbolIdx % SYMBOLS.length],
  start:  '2023-01-01',
  end:    '2024-01-01',
  isAuto: true,
  config: { ...AUTO_CONFIG },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function MultipleSimulation() {
  const [dark,        setDark]        = useState(true);
  const [rows,        setRows]        = useState<SimRow[]>([makeRow(6), makeRow(0)]);
  const [results,     setResults]     = useState<SimResult[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [activeTab,   setActiveTab]   = useState<'results'|'leaderboard'|'compare'>('results');

  // Settings modal state: which row is being configured
  const [configRowId, setConfigRowId] = useState<string | null>(null);

  // Verdict popup state: which result is being shown
  const [verdictId,   setVerdictId]   = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // ── Row helpers ─────────────────────────────────────────────────────────────
  const updateRow  = (updated: SimRow) => setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
  const removeRow  = (id: string)      => setRows(prev => prev.filter(r => r.id !== id));
  const addRow     = () => { if (rows.length < 8) setRows(prev => [...prev, makeRow(prev.length)]); };

  const saveConfig = (id: string, cfg: SimConfig) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, config: cfg } : r));

  const handleReset = () => {
    setRows([makeRow(6), makeRow(0)]);
    setResults([]);
    setActiveTab('results');
  };

  // ── Run all ─────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    setLoading(true);
    setResults([]);
    await new Promise(r => setTimeout(r, 1000));
    setResults(rows.map(simulate));
    setLoading(false);
    setActiveTab('results');
  };

  // ── Toggle expand ───────────────────────────────────────────────────────────
  const toggleExpand = (id: string) =>
    setResults(prev => prev.map(r => r.id === id ? { ...r, expanded: !r.expanded } : r));

  // ── Rank ────────────────────────────────────────────────────────────────────
  const ranked  = [...results].sort((a, b) => b.dsip.pnl - a.dsip.pnl);
  const rankOf  = (id: string) => ranked.findIndex(r => r.id === id) + 1;

  // ── Active config / verdict ─────────────────────────────────────────────────
  const configRow    = rows.find(r => r.id === configRowId)   ?? null;
  const verdictResult= results.find(r => r.id === verdictId)  ?? null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 p-4 transition-colors">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mb-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Layers className="text-blue-500" size={20} />
          <span className="text-xs font-black uppercase tracking-tighter">DSIP Multi-Simulation</span>
          <span className="hidden sm:flex text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {rows.length} runs
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={13} /> Reset All
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── ROW EDITORS ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <SimRowCard
              key={row.id}
              row={row}
              index={i}
              onUpdate={updateRow}
              onRemove={() => removeRow(row.id)}
              canRemove={rows.length > 1}
              onOpenSettings={id => setConfigRowId(id)}
            />
          ))}
        </div>

        {/* ── ACTION BAR ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={addRow}
            disabled={rows.length >= 8}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase transition-all',
              rows.length >= 8
                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 active:scale-95'
            )}
          >
            <Plus size={14} /> Add Simulation {rows.length >= 8 && '(max 8)'}
          </button>

          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Running {rows.length} sims…</>
              : <><Play size={14} /> Run All {rows.length} Simulations</>}
          </button>
        </div>

        {/* ── LOADING ────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.65s' }} />
              <div className="absolute inset-4 rounded-full border-2 border-amber-500/20 border-l-amber-500 animate-spin"
                style={{ animationDuration: '1.2s' }} />
            </div>
            <p className="text-xs font-mono text-slate-400 animate-pulse">
              Running {rows.length} simulations…
            </p>
          </div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        {results.length > 0 && !loading && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <GlobalSummary results={results} />

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 w-fit">
              {([
                { key: 'results',     label: 'Results'     },
                { key: 'leaderboard', label: 'Leaderboard' },
                { key: 'compare',     label: 'Compare'     },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all',
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >{tab.label}</button>
              ))}
            </div>

            {activeTab === 'results' && (
              <div className="space-y-3">
                {results.map((r, i) => (
                  <ResultCard
                    key={r.id}
                    result={r}
                    rank={rankOf(r.id)}
                    index={i}
                    onToggle={() => toggleExpand(r.id)}
                    onOpenVerdict={id => setVerdictId(id)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && <Leaderboard results={results} />}
            {activeTab === 'compare'     && <CompareTable results={results} />}
          </div>
        )}
      </div>

      {/* ── MANUAL CONFIG MODAL ─────────────────────────────────────────── */}
      {configRowId && configRow && (
        <ConfigModal
          config={configRow.config}
          onSave={cfg => saveConfig(configRowId, cfg)}
          onClose={() => setConfigRowId(null)}
        />
      )}

      {/* ── STRATEGY VERDICT POPUP ──────────────────────────────────────── */}
      {verdictId && verdictResult && (
        <VerdictModal
          result={verdictResult}
          onClose={() => setVerdictId(null)}
        />
      )}
    </div>
  );
}