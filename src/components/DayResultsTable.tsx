import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { DayResult } from './types';

const PAGE_SIZE = 50;

function fmt(n: number | undefined, dec = 2) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function PctCell({ v, invert = false }: { v: number; invert?: boolean }) {
  const pos = invert ? v <= 0 : v >= 0;
  return (
    <span className={clsx('font-semibold', pos ? 'text-emerald-500' : 'text-red-500')}>
      {v >= 0 ? '+' : ''}{fmt(v)}%
    </span>
  );
}

type ColGroup = 'price' | 'signals' | 'investment' | 'totals';

const COL_GROUPS: { id: ColGroup; label: string }[] = [
  { id: 'price',      label: 'Prices'     },
  { id: 'signals',    label: 'Signals'    },
  { id: 'investment', label: 'Investment' },
  { id: 'totals',     label: 'Totals'     },
];

const FILTERS = [
  { id: 'all',           label: 'All'           },
  { id: 'growth',        label: '↑ Growth'      },
  { id: 'dip',           label: '⚠ Dips'        },
  { id: 'partition-end', label: '🏁 Part. End'  },
] as const;

type FilterId = typeof FILTERS[number]['id'];

export default function DayResultsTable({ days }: { days: DayResult[] }) {
  const [page,     setPage]     = useState(0);
  const [colGroup, setColGroup] = useState<ColGroup>('price');
  const [filter,   setFilter]   = useState<FilterId>('all');
  const [search,   setSearch]   = useState('');

  const filtered = useMemo(() => {
    let d = days;
    if (filter === 'growth')        d = d.filter(r => r.isGrowthDay);
    if (filter === 'dip')           d = d.filter(r => r.isAbnormalDip);
    if (filter === 'partition-end') d = d.filter(r => !!r.partitionEndReason);
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r =>
        String(r.dayNumber).includes(q) ||
        String(r.partitionIndex).includes(q) ||
        r.date?.includes(q) ||
        r.partitionEndReason?.toLowerCase().includes(q)
      );
    }
    return d;
  }, [days, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goTo = (p: number) => setPage(Math.max(0, Math.min(totalPages - 1, p)));

  const thCls = 'px-2.5 py-2 text-left text-[10px] font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap bg-muted/40 border-b border-border';
  const tdCls = 'px-2.5 py-2 text-xs font-mono whitespace-nowrap text-foreground';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-primary">Day-by-Day Log</h3>
        <span className="text-[11px] text-muted-foreground font-mono">{filtered.length} / {days.length} rows</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Filter pills */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.id} type="button"
              onClick={() => { setFilter(f.id); setPage(0); }}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                filter === f.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >{f.label}</button>
          ))}
        </div>

        {/* Col group */}
        <div className="flex gap-1 ml-auto flex-wrap">
          {COL_GROUPS.map(g => (
            <button key={g.id} type="button"
              onClick={() => setColGroup(g.id)}
              className={clsx(
                'px-2.5 py-1 rounded text-[11px] font-semibold border transition-all',
                colGroup === g.id
                  ? 'bg-card border-border text-foreground'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:bg-muted/40'
              )}
            >{g.label}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search day, partition, date…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className={clsx(
            'w-full pl-8 pr-3 py-2 rounded-md text-sm',
            'border border-border bg-input text-foreground',
            'focus:outline-none focus:ring-1 focus:ring-ring',
            'placeholder:text-muted-foreground'
          )}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Fixed cols */}
                <th className={thCls}>Day</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Part.</th>
                <th className={thCls}>G?</th>

                {colGroup === 'price' && <>
                  <th className={thCls}>Open</th>
                  <th className={thCls}>High</th>
                  <th className={thCls}>Low</th>
                  <th className={thCls}>Close</th>
                  <th className={thCls}>Exec</th>
                  <th className={thCls}>Chg%</th>
                  <th className={thCls}>LockIn%</th>
                </>}

                {colGroup === 'signals' && <>
                  <th className={thCls}>AvgHold</th>
                  <th className={thCls}>AvgDev%</th>
                  <th className={thCls}>AvgSig</th>
                  <th className={thCls}>LISig</th>
                  <th className={thCls}>RawOpp</th>
                  <th className={thCls}>ConvAmp</th>
                  <th className={thCls}>Dip?</th>
                  <th className={thCls}>OppMult</th>
                  <th className={thCls}>ContMult</th>
                  <th className={thCls}>FinalMult</th>
                </>}

                {colGroup === 'investment' && <>
                  <th className={thCls}>NeutCap</th>
                  <th className={thCls}>Recmd</th>
                  <th className={thCls}>Executed</th>
                  <th className={thCls}>Shares↑</th>
                  <th className={thCls}>Part Cap</th>
                  <th className={thCls}>Part Shr</th>
                  <th className={thCls}>Remaining</th>
                </>}

                {colGroup === 'totals' && <>
                  <th className={thCls}>Tot. Capital</th>
                  <th className={thCls}>Tot. Shares</th>
                  <th className={thCls}>Portfolio</th>
                  <th className={thCls}>Return%</th>
                  <th className={thCls}>Time%</th>
                  <th className={thCls}>Cap%</th>
                  <th className={thCls}>Part End</th>
                </>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageData.map((r, i) => {
                const isEnd = !!r.partitionEndReason;
                return (
                  <tr key={r.dayNumber}
                    className={clsx(
                      'transition-colors',
                      isEnd ? 'bg-primary/5 hover:bg-primary/10' : i % 2 === 0 ? 'bg-card hover:bg-muted/20' : 'bg-muted/10 hover:bg-muted/30'
                    )}
                  >
                    {/* Fixed */}
                    <td className={clsx(tdCls, 'font-bold text-primary')}>#{r.dayNumber}</td>
                    <td className={clsx(tdCls, 'text-muted-foreground')}>{r.date || '—'}</td>
                    <td className={clsx(tdCls, 'text-purple-400')}>P{r.partitionIndex}</td>
                    <td className={tdCls}>
                      {r.isGrowthDay
                        ? <span className="text-emerald-500 font-bold">↑</span>
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>

                    {colGroup === 'price' && <>
                      <td className={tdCls}>₹{fmt(r.openPrice)}</td>
                      <td className={tdCls}>₹{fmt(r.highPrice)}</td>
                      <td className={tdCls}>₹{fmt(r.lowPrice)}</td>
                      <td className={clsx(tdCls, 'font-semibold')}>₹{fmt(r.closePrice)}</td>
                      <td className={tdCls}>₹{fmt(r.executionPrice)}</td>
                      <td className={tdCls}><PctCell v={r.priceChangePct} /></td>
                      <td className={tdCls}><PctCell v={r.lockInPct} /></td>
                    </>}

                    {colGroup === 'signals' && <>
                      <td className={tdCls}>₹{fmt(r.avgHoldingPrice)}</td>
                      <td className={tdCls}><PctCell v={r.avgDeviationPct} invert /></td>
                      <td className={tdCls}>{fmt(r.avgSignal, 3)}</td>
                      <td className={tdCls}>{fmt(r.lockInSignal, 3)}</td>
                      <td className={tdCls}>{fmt(r.rawOpportunitySignal, 3)}</td>
                      <td className={tdCls}>{fmt(r.convictionAmplifier, 3)}</td>
                      <td className={tdCls}>
                        {r.isAbnormalDip
                          ? <span className="text-yellow-500 font-semibold text-[11px]">⚠ DIP</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className={clsx(tdCls, 'text-primary')}>{fmt(r.opportunityMultiplier, 3)}</td>
                      <td className={tdCls}>{fmt(r.contingencyMultiplier, 3)}</td>
                      <td className={clsx(tdCls, 'text-primary font-bold')}>{fmt(r.finalMultiplier, 3)}</td>
                    </>}

                    {colGroup === 'investment' && <>
                      <td className={tdCls}>₹{fmt(r.neutralCapital, 0)}</td>
                      <td className={tdCls}>₹{fmt(r.recommendedAmount, 0)}</td>
                      <td className={clsx(tdCls, r.executedAmount > 0 ? 'text-emerald-500' : 'text-muted-foreground/40')}>
                        ₹{fmt(r.executedAmount, 0)}
                      </td>
                      <td className={tdCls}>{fmt(r.sharesAcquired, 4)}</td>
                      <td className={tdCls}>₹{fmt(r.partitionCapitalInvested, 0)}</td>
                      <td className={tdCls}>{fmt(r.partitionSharesBought, 4)}</td>
                      <td className={tdCls}>₹{fmt(r.partitionRemainingCapital, 0)}</td>
                    </>}

                    {colGroup === 'totals' && <>
                      <td className={tdCls}>₹{fmt(r.totalCapitalInvested, 0)}</td>
                      <td className={tdCls}>{fmt(r.totalSharesHeld, 4)}</td>
                      <td className={clsx(tdCls, 'font-semibold')}>₹{fmt(r.portfolioValue, 0)}</td>
                      <td className={tdCls}><PctCell v={r.cumulativeReturnPct} /></td>
                      <td className={tdCls}>{fmt(r.timeProgressPct, 0)}%</td>
                      <td className={tdCls}>{fmt(r.capitalProgressPct, 0)}%</td>
                      <td className={tdCls}>
                        {r.partitionEndReason
                          ? <span className="text-yellow-500 text-[11px] font-semibold">{r.partitionEndReason}</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Page {page + 1} / {totalPages} · {filtered.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => goTo(0)} disabled={page === 0}
              className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => goTo(page - 1)} disabled={page === 0}
              className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return (
                <button key={pg} onClick={() => goTo(pg)}
                  className={clsx(
                    'w-7 h-7 rounded border text-xs font-mono font-semibold transition-colors',
                    pg === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/40'
                  )}
                >{pg + 1}</button>
              );
            })}

            <button onClick={() => goTo(page + 1)} disabled={page === totalPages - 1}
              className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => goTo(totalPages - 1)} disabled={page === totalPages - 1}
              className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
