import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import axios from 'axios';
import {
  Download, RefreshCw, Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestPriceRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number;
  lockInPct: number;
  executedPrice: number;
  convictionScore: number;
  isRedDay: boolean;
}

// ── CSV parser matching TestPriceData.java field order ────────────────────────
// Expected headers (case-insensitive):
// date, open, high, low, close, prev_close, lock_in_pct, executed_price, conviction_score

function parseTestPriceCsv(raw: string): TestPriceRow[] {
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  const idx = (names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex(h => h === n || h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };

  const dateIdx   = idx(['date', 'trading_date']);
  const openIdx   = idx(['open']);
  const highIdx   = idx(['high']);
  const lowIdx    = idx(['low']);
  const closeIdx  = idx(['close']);
  const prevIdx   = idx(['prev_close', 'previous_close']);
  const liIdx     = idx(['lock_in_pct', 'lock_in', 'lockin']);
  const execIdx   = idx(['executed_price', 'exec_price', 'executed']);
  const csIdx     = idx(['conviction_score', 'conviction']);

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const open      = parseFloat(cols[openIdx]  ?? '0') || 0;
    const prevClose = parseFloat(cols[prevIdx]  ?? '0') || 0;
    return {
      date:           cols[dateIdx]  ?? '',
      open,
      high:           parseFloat(cols[highIdx]  ?? '0') || 0,
      low:            parseFloat(cols[lowIdx]   ?? '0') || 0,
      close:          parseFloat(cols[closeIdx] ?? '0') || 0,
      prevClose,
      lockInPct:      parseFloat(cols[liIdx]    ?? '0') || 0,
      executedPrice:  parseFloat(cols[execIdx]  ?? '0') || 0,
      convictionScore:parseInt(cols[csIdx]      ?? '0') || 0,
      isRedDay:       open < prevClose,
    };
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return n?.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—';
}

const PAGE_SIZE = 50;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  filePath: string;   // server-side path — fetched via proxy
  fileName: string;
}

export default function CsvPreviewTable({ filePath, fileName }: Props) {
  const [rows,    setRows]    = useState<TestPriceRow[] | null>(null);
  const [rawCsv,  setRawCsv]  = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(0);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'red' | 'green'>('all');

  const fetchCsv = async () => {
    setLoading(true);
    setError(null);
    try {
      // Hit the backend endpoint that serves the CSV file
      const { data } = await axios.get<string>('/api/test/price-data-file', {
        params: { path: filePath },
        withCredentials: true,
        responseType: 'text',
      });
      setRawCsv(data);
      setRows(parseTestPriceCsv(data));
      setPage(0);
    } catch (e: any) {
      setError(e?.response?.data || e?.message || 'Failed to load CSV');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!rows) return [];
    let d = rows;
    if (filter === 'red')   d = d.filter(r => r.isRedDay);
    if (filter === 'green') d = d.filter(r => !r.isRedDay);
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r => r.date.includes(q));
    }
    return d;
  }, [rows, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const goTo       = (p: number) => setPage(Math.max(0, Math.min(totalPages - 1, p)));

  const downloadCsv = () => {
    if (!rawCsv) return;
    const blob = new Blob([rawCsv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const thCls = 'px-2.5 py-2 text-left text-[10px] font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap bg-muted/40 border-b border-border';
  const tdCls = 'px-2.5 py-2 text-xs font-mono whitespace-nowrap';

  // ── not yet loaded ──
  if (!rows && !loading && !error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Preview the generated CSV rows</p>
        <button
          onClick={fetchCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Download className="w-3.5 h-3.5" /> Load Preview
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading CSV…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-red-500 mb-1">Failed to load CSV preview</p>
          <p className="text-[11px] font-mono text-muted-foreground">{error}</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Note: This requires a <code className="bg-muted px-1 rounded">/api/test/price-data-file?path=…</code> endpoint
            on your backend, or you can download the file directly from the server.
          </p>
        </div>
        <button onClick={fetchCsv}
          className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted/40">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No rows parsed from CSV.
      </div>
    );
  }

  const redCount   = rows.filter(r => r.isRedDay).length;
  const greenCount = rows.length - redCount;

  return (
    <div className="flex flex-col gap-3">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter pills */}
        <div className="flex gap-1">
          {([
            { id: 'all',   label: `All (${rows.length})`   },
            { id: 'red',   label: `🔴 Red (${redCount})`   },
            { id: 'green', label: `🟢 Green (${greenCount})` },
          ] as const).map(f => (
            <button key={f.id} type="button"
              onClick={() => { setFilter(f.id); setPage(0); }}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                filter === f.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:bg-muted/40'
              )}
            >{f.label}</button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by date…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-7 pr-3 py-1.5 rounded-md text-xs border border-border bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-1 ml-auto">
          <button onClick={downloadCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors">
            <Download className="w-3 h-3" /> Download
          </button>
          <button onClick={fetchCsv}
            className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row count */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span>{filtered.length} / {rows.length} rows</span>
        <span>{fileName}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Day</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Open</th>
                <th className={thCls}>High</th>
                <th className={thCls}>Low</th>
                <th className={thCls}>Close</th>
                <th className={thCls}>Prev Close</th>
                <th className={thCls}>LockIn %</th>
                <th className={thCls}>Exec Price</th>
                <th className={thCls}>Conv. Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageData.map((r, i) => {
                const globalIdx = page * PAGE_SIZE + i + 1;
                const liPos = r.lockInPct >= 0;
                return (
                  <tr key={r.date + i}
                    className={clsx(
                      'transition-colors',
                      r.isRedDay
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                    )}
                  >
                    <td className={clsx(tdCls, 'text-muted-foreground')}>{globalIdx}</td>
                    <td className={clsx(tdCls, 'font-semibold text-foreground')}>{r.date}</td>
                    <td className={tdCls}>
                      {r.isRedDay
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />RED
                          </span>
                        : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />GREEN
                          </span>
                      }
                    </td>
                    <td className={tdCls}>₹{fmt(r.open)}</td>
                    <td className={tdCls}>₹{fmt(r.high)}</td>
                    <td className={tdCls}>₹{fmt(r.low)}</td>
                    <td className={clsx(tdCls, 'font-semibold text-foreground')}>₹{fmt(r.close)}</td>
                    <td className={clsx(tdCls, 'text-muted-foreground')}>₹{fmt(r.prevClose)}</td>
                    <td className={clsx(tdCls, 'font-semibold', liPos ? 'text-emerald-500' : 'text-red-500')}>
                      {liPos ? '+' : ''}{fmt(r.lockInPct)}%
                    </td>
                    <td className={clsx(tdCls, 'text-primary font-semibold')}>₹{fmt(r.executedPrice)}</td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center justify-center w-8 h-5 rounded text-[11px] font-bold bg-primary/10 text-primary">
                        {r.convictionScore}
                      </span>
                    </td>
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
            Page {page + 1} / {totalPages}
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
