import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PartitionResult, EndReason } from './types';

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const REASON_CONFIG: Record<EndReason, { label: string; className: string }> = {
  SUCCESS:                 { label: '✓ Success',     className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  KILL_SWITCH_STAGNATION:  { label: '✕ Stagnation',  className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  KILL_SWITCH_POOR_GROWTH: { label: '✕ Poor Growth', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  KILL_SWITCH_ZOMBIE:      { label: '✕ Zombie',      className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  NEUTRAL_PARTITION:       { label: '○ Neutral',     className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
};

function Badge({ reason }: { reason: EndReason }) {
  const cfg = REASON_CONFIG[reason] ?? { label: reason, className: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap', cfg.className)}>
      {cfg.label}
    </span>
  );
}

function MiniProgress({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-[11px] font-mono text-muted-foreground w-9 text-right">{fmt(value, 0)}%</span>
    </div>
  );
}

type SortKey = 'partitionIndex' | 'cumulativeReturnPct' | 'capitalInvested' | 'daysActive' | 'sharesAccumulated';

interface ColDef { key: SortKey; label: string }
const COLS: ColDef[] = [
  { key: 'partitionIndex',      label: '#'       },
  { key: 'capitalInvested',     label: 'Invested'},
  { key: 'sharesAccumulated',   label: 'Shares'  },
  { key: 'daysActive',          label: 'Days'    },
  { key: 'cumulativeReturnPct', label: 'Return'  },
];

export default function PartitionTable({ partitions }: { partitions: PartitionResult[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('partitionIndex');
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const sorted = [...partitions].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return sortAsc ? va - vb : vb - va;
  });

  const handleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(p => !p);
    else { setSortKey(k); setSortAsc(true); }
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortAsc
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  }

  const thCls = 'px-3 py-2.5 text-left text-[10px] font-bold tracking-widest uppercase text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors';
  const tdCls = 'px-3 py-2.5 text-sm font-mono text-foreground';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-primary">Partition Results</h3>
        <span className="text-[11px] text-muted-foreground">{partitions.length} partitions</span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted/40">
              <tr>
                <th className={thCls} style={{ width: 40 }} />
                <th className={clsx(thCls, 'w-28')}>Outcome</th>
                {COLS.map(c => (
                  <th key={c.key} className={thCls} onClick={() => handleSort(c.key)}>
                    <div className="flex items-center gap-1">{c.label}<SortIcon col={c.key} /></div>
                  </th>
                ))}
                <th className={clsx(thCls, 'min-w-[140px]')}>Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(p => {
                const isExp = expanded === p.partitionIndex;
                const retPos = p.cumulativeReturnPct >= 0;

                return (
                  <React.Fragment key={p.partitionIndex}>
                    <tr
                      className="bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isExp ? null : p.partitionIndex)}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {isExp
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-3 py-2.5"><Badge reason={p.endReason} /></td>
                      <td className={clsx(tdCls, 'font-bold text-primary')}>P{p.partitionIndex}</td>
                      <td className={tdCls}>₹{fmt(p.capitalInvested, 0)}</td>
                      <td className={tdCls}>{fmt(p.sharesAccumulated, 4)}</td>
                      <td className={tdCls}>{p.daysActive}d</td>
                      <td className={clsx(tdCls, 'font-bold', retPos ? 'text-emerald-500' : 'text-red-500')}>
                        {retPos ? '+' : ''}{fmt(p.cumulativeReturnPct)}%
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <MiniProgress value={p.capitalProgressPct} color="bg-primary" />
                          <MiniProgress value={p.timeProgressPct}    color="bg-purple-500" />
                        </div>
                      </td>
                    </tr>

                    {isExp && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                            {[
                              ['Allocated',          `₹${fmt(p.capitalAllocated, 0)}`],
                              ['Invested',           `₹${fmt(p.capitalInvested, 0)}`],
                              ['Avg Price',          `₹${fmt(p.avgPrice)}`],
                              ['Capital Progress',   `${fmt(p.capitalProgressPct)}%`],
                              ['Time Progress',      `${fmt(p.timeProgressPct)}%`],
                              ['Partition Progress', `${fmt(p.partitionProgressPct)}%`],
                              ['Growth Days',        String(p.successfulGrowthDays)],
                              ['Days Active',        String(p.daysActive)],
                            ].map(([k, v]) => (
                              <div key={k} className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{k}</span>
                                <span className="font-mono font-semibold text-foreground">{v}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
