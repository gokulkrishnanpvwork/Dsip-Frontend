// ── Generate Price Data ───────────────────────────────────────────────────────

export interface GeneratePriceDataRequest {
  symbol: string;
  start_date: string;   // "YYYY-MM-DD"
  end_date: string;     // "YYYY-MM-DD"
  default_conviction_score?: number;
}

export interface GeneratePriceDataResponse {
  success: boolean;
  symbol: string;
  file_path: string;
  file_name: string;
  record_count: number;
  date_range: {
    start: string;
    end: string;
    trading_days: number;
  };
  price_summary: {
    start_price: number;
    end_price: number;
    high_price: number;
    low_price: number;
    price_change_pct: number;
  };
  error?: string;
}

// ── Execute Workflow ──────────────────────────────────────────────────────────

export interface ExecuteWorkflowRequest {
  csv_file_path: string;
  tracker_id: number;
}

export interface ExecuteWorkflowResponse {
  success: boolean;
  error?: string;
  tracker_id: number;
  stock_symbol: string;
  summary: {
    days_processed: number;
    partitions_created: number;
    total_capital_invested: number;
    total_shares_acquired: number;
    final_portfolio_value: number;
    overall_return_pct: number;
  };
  execution_log: {
    file_path: string;
    file_name: string;
  };
}

// ── Batch Simulate ────────────────────────────────────────────────────────────

export interface BatchSimulateRequest {
  csvConfigPath: string;
}

export interface BatchSimulateResult {
  totalStocks: number;
  successCount: number;
  failureCount: number;
  results: StockSimulationSummary[];
}

export interface StockSimulationSummary {
  symbol: string;
  success: boolean;
  error?: string;
  trackerId?: number;
  executionLogCsvPath?: string;
  daysSimulated: number;
  partitionsCreated: number;
  overallReturnPct: number;
  totalCapitalInvested: number;
  finalPortfolioValue: number;
}

// ── Active mode ───────────────────────────────────────────────────────────────

export type AppMode = 'generate' | 'workflow' | 'batch';
