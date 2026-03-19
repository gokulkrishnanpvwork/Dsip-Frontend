import React from 'react';
import { clsx } from 'clsx';
import {
  FileText, CheckCircle2, XCircle, Layers
} from 'lucide-react';
import {
  GeneratePriceDataResponse,
  ExecuteWorkflowResponse,
  BatchSimulateResult,
} from './types';
import CsvPreviewTable from './CsvPreviewTable';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return n?.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—';
}
function fmtCcy(n: number) {
  if (!n) return '₹0';
  if (Math.abs(n) >= 1_00_000) return `₹${fmt(n / 1_00_000, 2)}L`;
  if (Math.abs(n) >= 1_000)    return `₹${fmt(n / 1_000, 1)}K`;
  return `₹${fmt(n)}`;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-border bg-card p-4', className)}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold tracking-widest uppercase text-primary">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function KV({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{label}</span>
      <span className={clsx('text-sm font-mono font-semibold text-foreground', valueClass)}>{value}</span>
    </div>
  );
}

function StatusBadge({ success }: { success: boolean }) {
  return success
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"><CheckCircle2 className="w-3 h-3" />Success</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 border border-red-500/20 text-red-500"><XCircle className="w-3 h-3" />Failed</span>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors font-mono"
    >{copied ? '✓ Copied' : 'Copy path'}</button>
  );
}

// ── Generate Price Data Result ────────────────────────────────────────────────

export function GenerateResult({ res }: { res: GeneratePriceDataResponse }) {
  if (!res.success) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-red-500 text-sm">Generation Failed</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground">{res.error}</p>
      </Card>
    );
  }

  const pricePos = (res.price_summary?.price_change_pct ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusBadge success={res.success} />
            <span className="font-black text-lg text-foreground">{res.symbol}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{res.record_count} trading days</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <KV label="Date Range"
            value={`${res.date_range?.start} → ${res.date_range?.end}`} />
          <KV label="Trading Days" value={res.date_range?.trading_days} />
        </div>
      </Card>

      {/* Price summary */}
      <Card>
        <SectionLabel>Price Summary</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KV label="Start Price"  value={`₹${fmt(res.price_summary?.start_price)}`} />
          <KV label="End Price"    value={`₹${fmt(res.price_summary?.end_price)}`} />
          <KV label="High"         value={`₹${fmt(res.price_summary?.high_price)}`} />
          <KV label="Low"          value={`₹${fmt(res.price_summary?.low_price)}`} />
          <KV label="Change"
            value={`${pricePos ? '+' : ''}${fmt(res.price_summary?.price_change_pct)}%`}
            valueClass={pricePos ? 'text-emerald-500' : 'text-red-500'}
          />
        </div>
      </Card>

      {/* File path */}
      <Card>
        <SectionLabel>Generated File</SectionLabel>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-xs font-mono break-all text-foreground">{res.file_name}</span>
          </div>
          <CopyButton value={res.file_path} />
        </div>
        <p className="text-[10px] text-muted-foreground font-mono break-all">{res.file_path}</p>
      </Card>

      {/* CSV Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary">CSV Preview</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <CsvPreviewTable filePath={res.file_path} fileName={res.file_name} />
      </div>
    </div>
  );
}

// ── Execute Workflow Result ───────────────────────────────────────────────────

export function WorkflowResult({ res }: { res: ExecuteWorkflowResponse }) {
  if (!res.success) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-red-500 text-sm">Workflow Failed</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground">{res.error}</p>
      </Card>
    );
  }

  const s = res.summary;
  const retPos = (s?.overall_return_pct ?? 0) >= 0;
  const pnl = (s?.final_portfolio_value ?? 0) - (s?.total_capital_invested ?? 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Header KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Return */}
        <Card className={clsx(
          'col-span-2 sm:col-span-1',
          retPos ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
        )}>
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Overall Return</span>
          <div className={clsx('text-3xl font-black font-mono mt-1', retPos ? 'text-emerald-500' : 'text-red-500')}>
            {retPos ? '+' : ''}{fmt(s?.overall_return_pct)}%
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            P&L {pnl >= 0 ? '+' : ''}{fmtCcy(pnl)}
          </div>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Portfolio Value</span>
          <div className="text-2xl font-black font-mono text-primary mt-1">{fmtCcy(s?.final_portfolio_value)}</div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">Invested {fmtCcy(s?.total_capital_invested)}</div>
        </Card>

        <Card>
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Tracker</span>
          <div className="text-2xl font-black font-mono text-foreground mt-1">#{res.tracker_id}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{res.stock_symbol}</div>
        </Card>
      </div>

      {/* Summary stats */}
      <Card>
        <SectionLabel>Execution Summary</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KV label="Days Processed"    value={s?.days_processed}     />
          <KV label="Partitions"        value={s?.partitions_created} />
          <KV label="Shares Acquired"   value={fmt(s?.total_shares_acquired, 4)} />
          <KV label="Capital Invested"  value={fmtCcy(s?.total_capital_invested)} />
        </div>
      </Card>

      {/* Execution log */}
      {res.execution_log && (
        <Card>
          <SectionLabel>Execution Log CSV</SectionLabel>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-xs font-mono text-foreground">{res.execution_log.file_name}</span>
            </div>
            <CopyButton value={res.execution_log.file_path} />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono break-all">{res.execution_log.file_path}</p>
        </Card>
      )}
    </div>
  );
}

// ── Batch Simulate Result ─────────────────────────────────────────────────────

export function BatchResult({ res }: { res: BatchSimulateResult }) {
  const successRate = res.totalStocks > 0
    ? Math.round((res.successCount / res.totalStocks) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Total Stocks</span>
          <div className="text-3xl font-black font-mono text-foreground mt-1">{res.totalStocks}</div>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Succeeded</span>
          <div className="text-3xl font-black font-mono text-emerald-500 mt-1">{res.successCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{successRate}% success rate</div>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Failed</span>
          <div className="text-3xl font-black font-mono text-red-500 mt-1">{res.failureCount}</div>
        </Card>
      </div>

      {/* Per-stock table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Stock Results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/40">
                {['Symbol','Status','Tracker','Days','Partitions','Invested','Portfolio','Return'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {res.results.map((r, i) => {
                const retPos = (r.overallReturnPct ?? 0) >= 0;
                return (
                  <tr key={r.symbol + i}
                    className={clsx(
                      'transition-colors',
                      i % 2 === 0 ? 'bg-card hover:bg-muted/20' : 'bg-muted/10 hover:bg-muted/30'
                    )}>
                    <td className="px-3 py-2.5 text-sm font-bold text-foreground">{r.symbol}</td>
                    <td className="px-3 py-2.5"><StatusBadge success={r.success} /></td>
                    <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
                      {r.trackerId ? `#${r.trackerId}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-foreground">{r.daysSimulated || '—'}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-foreground">{r.partitionsCreated || '—'}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-foreground">{r.totalCapitalInvested ? fmtCcy(r.totalCapitalInvested) : '—'}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-foreground">{r.finalPortfolioValue ? fmtCcy(r.finalPortfolioValue) : '—'}</td>
                    <td className={clsx('px-3 py-2.5 text-xs font-mono font-bold', retPos ? 'text-emerald-500' : 'text-red-500')}>
                      {r.overallReturnPct != null
                        ? `${retPos ? '+' : ''}${fmt(r.overallReturnPct)}%`
                        : r.error
                          ? <span className="text-red-400 font-normal text-[11px]">{r.error}</span>
                          : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
