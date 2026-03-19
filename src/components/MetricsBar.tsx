import React from 'react';
import { clsx } from 'clsx';
import {
  TrendingUp, TrendingDown, Wallet, BarChart2,
  Layers, Coins, Activity
} from 'lucide-react';
import { SimulationResult } from './types';

function fmtNum(n: number, dec = 2) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtCcy(n: number) {
  if (Math.abs(n) >= 1_00_00_000) return `₹${fmtNum(n / 1_00_00_000, 2)}Cr`;
  if (Math.abs(n) >= 1_00_000)    return `₹${fmtNum(n / 1_00_000, 2)}L`;
  if (Math.abs(n) >= 1_000)       return `₹${fmtNum(n / 1_000, 1)}K`;
  return `₹${fmtNum(n)}`;
}

interface KPICardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'accent';
}

function KPICard({ label, value, sub, icon, variant = 'default' }: KPICardProps) {
  const variantStyles = {
    default:  'border-border bg-card',
    positive: 'border-emerald-500/30 bg-emerald-500/5',
    negative: 'border-red-500/30 bg-red-500/5',
    accent:   'border-primary/40 bg-primary/5',
  };

  const iconStyles = {
    default:  'text-muted-foreground bg-muted',
    positive: 'text-emerald-500 bg-emerald-500/10',
    negative: 'text-red-500 bg-red-500/10',
    accent:   'text-primary bg-primary/10',
  };

  return (
    <div className={clsx(
      'rounded-xl border p-4 flex flex-col gap-3 transition-colors',
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
        <div className={clsx('p-1.5 rounded-md', iconStyles[variant])}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className={clsx(
          'text-2xl font-black font-mono leading-none tabular-nums',
          variant === 'positive' && 'text-emerald-500',
          variant === 'negative' && 'text-red-500',
          variant === 'accent'   && 'text-primary',
          variant === 'default'  && 'text-foreground',
        )}>
          {value}
        </div>
        {sub && (
          <div className="text-xs text-muted-foreground font-mono">{sub}</div>
        )}
      </div>
    </div>
  );
}

interface Props { result: SimulationResult; }

export default function MetricsBar({ result }: Props) {
  const pos = result.overallReturnPct >= 0;
  const pnl = result.finalPortfolioValue - result.totalCapitalInvested;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <KPICard
        label="Overall Return"
        value={`${pos ? '+' : ''}${fmtNum(result.overallReturnPct)}%`}
        sub={`P&L ${pnl >= 0 ? '+' : ''}${fmtCcy(pnl)}`}
        icon={pos
          ? <TrendingUp className="w-3.5 h-3.5" />
          : <TrendingDown className="w-3.5 h-3.5" />}
        variant={pos ? 'positive' : 'negative'}
      />
      <KPICard
        label="Portfolio Value"
        value={fmtCcy(result.finalPortfolioValue)}
        sub={`Invested ${fmtCcy(result.totalCapitalInvested)}`}
        icon={<Wallet className="w-3.5 h-3.5" />}
        variant="accent"
      />
      <KPICard
        label="Final Price"
        value={`₹${fmtNum(result.finalMarketPrice)}`}
        sub={`Avg ₹${fmtNum(result.averagePricePaid)}`}
        icon={<Activity className="w-3.5 h-3.5" />}
      />
      <KPICard
        label="Days Simulated"
        value={result.totalDaysSimulated.toLocaleString()}
        sub={`${result.partitionsCreated} partition${result.partitionsCreated !== 1 ? 's' : ''}`}
        icon={<BarChart2 className="w-3.5 h-3.5" />}
      />
      <KPICard
        label="Shares"
        value={fmtNum(result.totalSharesAccumulated, 3)}
        sub="accumulated"
        icon={<Coins className="w-3.5 h-3.5" />}
      />
      <KPICard
        label="Partitions"
        value={
          <span className="flex items-baseline gap-1 text-lg">
            <span className="text-emerald-500">{result.successfulPartitions}S</span>
            <span className="text-muted-foreground text-base">·</span>
            <span className="text-red-500">{result.killedPartitions}K</span>
            <span className="text-muted-foreground text-base">·</span>
            <span className="text-yellow-500">{result.neutralPartitions}N</span>
          </span>
        }
        sub="Success · Kill · Neutral"
        icon={<Layers className="w-3.5 h-3.5" />}
        variant={
          result.successfulPartitions > result.killedPartitions ? 'positive'
          : result.killedPartitions > result.successfulPartitions ? 'negative'
          : 'default'
        }
      />
    </div>
  );
}
