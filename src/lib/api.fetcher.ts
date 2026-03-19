/**
 * DSIP API Fetcher
 *
 * Centralized API functions for all DSIP tracker operations.
 * Uses the axios wrapper for consistent error handling and request management.
 *
 * All functions return promises and can be used with Redux Toolkit's createAsyncThunk
 * or directly in components.
 */

import { apiRequestPromise } from './axios/apiWrapper';
import type {
  CreateTrackerRequest,
  UpdateTrackerRequest,
  ExecuteTradeRequest,
  GetStockPriceRequest,
  Tracker,
  GetAllTrackersResponse,
  GetTrackerDetailsResponse,
  ExecuteTradeResponse,
  Partition,
  StockPrice,
  DeleteTrackerResponse,
  Execution,
  EndActionResponse,
} from '../types/tracker.types';

// ============================================================================
// 1. Create Tracker
// ============================================================================

/**
 * Creates a new DSIP tracker
 *
 * @param data - Tracker configuration data
 * @returns Created tracker details
 *
 * @example
 * ```ts
 * const tracker = await createTracker({
 *   stock_symbol: 'AAPL',
 *   conviction_period_years: 5,
 *   total_capital_planned: 100000,
 *   partition_days: 30,
 *   deployment_style: DeploymentStyle.AGGRESSIVE,
 *   base_conviction_score: 75,
 *   is_fractional_shares_allowed: true
 * });
 * ```
 */
export async function createTracker(
  data: CreateTrackerRequest
): Promise<Tracker> {
  const response = await apiRequestPromise<Tracker>(
    '/api/dsip-trackers',
    data,
    {
      method: 'POST',
      isJSON: true,
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  // Extract detailed error message from response
  const errorData = response.data as any;
  const detailedMessage = errorData?.message || errorData?.error || response.message || 'Failed to create tracker';

  throw new Error(detailedMessage);
}

// ============================================================================
// 2. Get All Trackers (Portfolio)
// ============================================================================

/**
 * Fetches all trackers for the authenticated user
 *
 * @returns Array of trackers with portfolio summary
 *
 * @example
 * ```ts
 * const { trackers, summary } = await getAllTrackers();
 * console.log(`You have ${trackers.length} trackers`);
 * console.log(`Total capital: $${summary.totalCapitalPlanned}`);
 * ```
 */
export async function getAllTrackers(): Promise<GetAllTrackersResponse> {
  const response = await apiRequestPromise<any>(
    '/api/dsip-trackers',
    undefined,
    {
      method: 'GET',
    }
  );

  if (response.status === 'success') {
    const data = response.data;

    console.log('[API] Raw response:', data);

    // Transform API response to match our expected format
    // API returns: dsip_trackers with snake_case fields
    // We need: trackers with camelCase fields
    const trackers = (data.dsip_trackers || []).map((tracker: any) => {
      // Calculate current price from total invested and shares if available
      const sharesHeld = tracker.dsip_total_capital_invested_so_far && tracker.total_capital_invested_so_far
        ? (tracker.total_capital_invested_so_far / (tracker.dsip_total_capital_invested_so_far || 1))
        : 0;

      return {
        trackerId: tracker.id,
        stockSymbol: tracker.symbol,
        stockName: tracker.name,
        currentPrice: sharesHeld > 0 ? (tracker.total_capital_invested_so_far / sharesHeld) : 0,
        totalCapitalPlanned: tracker.total_capital_planned || 0,
        totalCapitalInvestedSoFar: tracker.total_capital_invested_so_far || 0,
        dsipTotalCaptialInvestedSoFar: tracker.dsip_total_capital_invested_so_far || 0,
        sharesHeldSoFar: sharesHeld,
        status: 1, // Default to ACTIVE
        activePartitionIndex: 1, // Default
        createdAt: tracker.createdAt || new Date().toISOString(),
        net_profit_percentage: tracker.net_profit_percentage || 0,
        dsip_net_profit_percentage: tracker.dsip_net_profit_percentage || 0,
      };
    });

    const transformed: GetAllTrackersResponse = {
      trackers,
      summary: {
        totalTrackers: trackers.length,
        activeTrackers: trackers.length,
        totalCapitalPlanned: data.total_market_value || 0,
        totalCapitalInvested: data.total_capital_invested_so_far || 0,
        totalCurrentValue: data.total_market_value || 0,
        dsipTotalCapitalInvested: data.dsip_total_capital_invested_so_far || 0,
        dsipTotalCurrentValue: data.dsip_total_market_value || 0,
      },
    };

    console.log('[API] Transformed response:', transformed);
    return transformed;
  }

  throw new Error(response.message || 'Failed to fetch trackers');
}

// ============================================================================
// 3. Get Tracker Details
// ============================================================================

/**
 * Fetches detailed information for a specific tracker
 * Includes tracker data, partitions, and recent executions
 *
 * @param trackerId - The ID of the tracker
 * @returns Detailed tracker information
 *
 * @example
 * ```ts
 * const details = await getTrackerDetails(1);
 * console.log(`Stock: ${details.tracker.stockSymbol}`);
 * console.log(`Partitions: ${details.partitions.length}`);
 * console.log(`Recent trades: ${details.recentExecutions.length}`);
 * ```
 */
export async function getTrackerDetails(
  trackerId: number
): Promise<GetTrackerDetailsResponse> {
  const response = await apiRequestPromise<any>(
    `/api/dsip-trackers/${trackerId}`,
    undefined,
    {
      method: 'GET',
    }
  );

  if (response.status === 'success') {
    const data = response.data;

    console.log('[API] Raw tracker details:', data);

    // Transform API response to match our expected format
    // API returns flat object with snake_case fields
    const transformed: GetTrackerDetailsResponse = {
      tracker: {
        trackerId: data.id || trackerId,
        userId: data.user_id || '',
        stock_id: data.stock_id || 0,
        stock_symbol: data.symbol || '',
        conviction_period_years: data.conviction_period_years || 0,
        total_capital_planned: data.total_capital_planned || 0,
        partition_days: data.partition_days || 0,
        partition_months: data.partition_months || 0,
        deployment_style: data.deployment_style || 1,
        base_conviction_score: data.base_conviction_score || 0,
        initial_invested_amount: data.initial_invested_amount || 0,
        initial_shares_held: data.initial_shares_held || 0,
        status: data.status || 1,
        active_partition_index: data.active_partition_index || 1,
        total_capital_invested_so_far: data.total_capital_invested_so_far || 0,
        total_market_value: data.total_market_value || 0,
        net_profit_percentage: data.net_profit_percentage || 0,
        dsip_total_capital_invested_so_far: data.dsip_total_capital_invested_so_far || 0,
        dsip_total_market_value: data.dsip_total_market_value || 0,
        dsip_net_profit_percentage: data.dsip_net_profit_percentage || 0,
        shares_held_so_far: data.shares_held_so_far || 0,
        total_cycles: data.total_cycles || 0,
        is_fractional_shares_allowed: data.is_fractional_shares_allowed || false,
        createdAt: data.created_at || new Date().toISOString(),
        stockName: data.name || 'Unknown',
        currentPrice: data.current_total_value || 0,
        current_avg: data.current_avg,
        dsip_current_avg: data.dsip_current_avg,
        current_market_price: data.current_market_price,
        live_investment_cycle: data.live_investment_cycle ? {
          total_capital_invested_so_far: data.live_investment_cycle.total_capital_invested_so_far || 0,
          partition_progress: data.live_investment_cycle.partition_progress || 0,
          net_profit_percentage: data.live_investment_cycle.net_profit_percentage || 0,
        } : undefined,
      },
      partitions: (data.history || []).map((h: any, index: number) => ({
        partitionId: index + 1,
        trackerId: data.id,
        partitionIndex: index + 1,
        expectedPartitionDays: data.partition_days || 0,
        partitionCapitalAllocated: 0,
        capitalInvestedSoFar: h.executed_amount || 0,
        noOfSharesBought: 0,
        successfulGrowthCount: 0,
        status: 2, // COMPLETED
        partitionEndDate: h.date || null,
        createdAt: h.date || new Date().toISOString(),
      })),
      recentExecutions: (data.history || []).map((h: any, index: number) => ({
        executionId: index + 1,
        trackerId: data.id,
        partitionId: 0,
        lockInPercentage: 0,
        convictionOverride: 0,
        executedAmount: h.executed_amount || 0,
        executionPrice: h.executed_price || 0,
        createdAt: h.date || new Date().toISOString(),
      })),
    };

    console.log('[API] Transformed tracker details:', transformed);
    return transformed;
  }

  throw new Error(response.message || 'Failed to fetch tracker details');
}

// ============================================================================
// 4. Update Tracker
// ============================================================================

/**
 * Updates an existing tracker's configuration
 * Only include fields you want to update
 *
 * @param trackerId - The ID of the tracker to update
 * @param data - Partial tracker data to update
 * @returns Updated tracker details
 *
 * @example
 * ```ts
 * const updated = await updateTracker(1, {
 *   base_conviction_score: 80,
 *   status: TrackerStatus.PAUSED
 * });
 * ```
 */
export async function updateTracker(
  trackerId: number,
  data: UpdateTrackerRequest
): Promise<GetTrackerDetailsResponse> {
  const response = await apiRequestPromise<GetTrackerDetailsResponse>(
    `/api/dsip-trackers/${trackerId}`,
    data,
    {
      method: 'PUT',
      isJSON: true,
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to update tracker');
}

// ============================================================================
// 5. Execute Trade
// ============================================================================

/**
 * Executes a trade (buy) for a specific tracker
 * Records the transaction and updates tracker state
 *
 * @param trackerId - The ID of the tracker
 * @param data - Trade execution details
 * @returns Execution result with updated shares and capital
 *
 * @example
 * ```ts
 * const result = await executeTrade(1, {
 *   lock_in_percentage: 50,
 *   conviction_override: 85,
 *   executed_amount: 5000,
 *   execution_price: 176.25
 * });
 * console.log(`Bought ${result.sharesBought} shares`);
 * ```
 */
export async function executeTrade(
  trackerId: number,
  data: ExecuteTradeRequest
): Promise<ExecuteTradeResponse> {
  const response = await apiRequestPromise<ExecuteTradeResponse>(
    `/api/dsip-trackers/${trackerId}/execute`,
    data,
    {
      method: 'POST',
      isJSON: true,
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.data.message || 'Failed to execute trade');
}

// ============================================================================
// 6. Get Partition Details
// ============================================================================

/**
 * Fetches details for a specific partition within a tracker
 *
 * @param trackerId - The ID of the tracker
 * @param partitionIndex - The partition index (1-based)
 * @returns Partition details
 *
 * @example
 * ```ts
 * const partition = await getPartitionDetails(1, 3);
 * console.log(`Partition ${partition.partitionIndex}`);
 * console.log(`Capital allocated: $${partition.partitionCapitalAllocated}`);
 * console.log(`Status: ${partition.status}`);
 * ```
 */
export async function getPartitionDetails(
  trackerId: number,
  partitionIndex: number
): Promise<Partition> {
  const response = await apiRequestPromise<Partition>(
    `/api/dsip-trackers/${trackerId}/partitions/${partitionIndex}`,
    undefined,
    {
      method: 'GET',
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to fetch partition details');
}

// ============================================================================
// 7. Delete Tracker
// ============================================================================

/**
 * Deletes a tracker and all associated data
 * This action cannot be undone
 *
 * @param trackerId - The ID of the tracker to delete
 * @returns Success message
 *
 * @example
 * ```ts
 * const result = await deleteTracker(1);
 * console.log(result.message); // "Tracker deleted successfully"
 * ```
 */
export async function deleteTracker(
  trackerId: number
): Promise<DeleteTrackerResponse> {
  const response = await apiRequestPromise<DeleteTrackerResponse>(
    `/api/dsip-trackers/${trackerId}`,
    undefined,
    {
      method: 'DELETE',
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to delete tracker');
}

// ============================================================================
// 8. Get Stock Closing Price
// ============================================================================

/**
 * Fetches the closing price for a stock symbol
 * Checks cache first, fetches from external API if needed
 *
 * @param params - Stock symbol and exchange
 * @returns Stock price information
 *
 * @example
 * ```ts
 * const priceInfo = await getStockClosingPrice({
 *   symbol: 'AAPL',
 *   exchange: Exchange.US
 * });
 * console.log(`${priceInfo.stockName}: $${priceInfo.closePrice}`);
 * console.log(`Source: ${priceInfo.source}`); // 'cache' or 'api'
 * ```
 */
export async function getStockClosingPrice(
  params: GetStockPriceRequest
): Promise<StockPrice> {
  const response = await apiRequestPromise<StockPrice>(
    `/api/stocks/close?symbol=${params.symbol}&exchange=${params.exchange}`,
    undefined,
    {
      method: 'GET',
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to fetch stock price');
}

// ============================================================================
// Bonus: Get Tracker Executions
// ============================================================================

/**
 * Fetches recent executions/trades for a tracker
 *
 * @param trackerId - The ID of the tracker
 * @param limit - Maximum number of executions to return (default: 6)
 * @returns Array of recent executions
 *
 * @example
 * ```ts
 * const executions = await getTrackerExecutions(1, 10);
 * console.log(`Last ${executions.length} trades:`);
 * executions.forEach(exec => {
 *   console.log(`${exec.createdAt}: $${exec.executedAmount} @ $${exec.executionPrice}`);
 * });
 * ```
 */
export async function getTrackerExecutions(
  trackerId: number,
  limit: number = 6
): Promise<Execution[]> {
  const response = await apiRequestPromise<Execution[]>(
    `/api/dsip-trackers/${trackerId}/executions?limit=${limit}`,
    undefined,
    {
      method: 'GET',
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to fetch tracker executions');
}

// ============================================================================
// 9. Sync Tracker Data
// ============================================================================

/**
 * Syncs tracker data with external holdings (e.g., from broker)
 * Updates initial holdings to match current total holdings
 *
 * @param data - Sync request data
 * @returns Sync response with updated values
 *
 * @example
 * ```ts
 * const result = await syncTrackerData({
 *   tracker_id: 1,
 *   current_total_shares: 150.5,
 *   current_total_invested_amount: 75000,
 *   reason: 'Manual sync from broker statement'
 * });
 * console.log(`Sync ${result.success ? 'successful' : 'failed'}`);
 * console.log(result.message);
 * ```
 */
export async function syncTrackerData(data: {
  tracker_id: number;
  current_total_shares: number;
  current_total_invested_amount: number;
  reason?: string;
}): Promise<{
  success: boolean;
  message: string;
  dsip_shares?: number;
  dsip_capital_deployed?: number;
  total_shares?: number;
  total_invested_amount?: number;
}> {
  const response = await apiRequestPromise<any>(
    '/api/dsip/sync',
    data,
    {
      method: 'POST',
      isJSON: true,
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  // Extract detailed error message from response data if available
  const errorData = response.data as any;
  const detailedMessage = errorData?.message || response.message || 'Failed to sync tracker data';

  throw new Error(detailedMessage);
}

// ============================================================================
// 10. Get Investment Recommendation
// ============================================================================

/**
 * Get daily investment recommendation with calculation breakdown
 *
 * @param trackerId - The ID of the tracker
 * @param lockInPct - Lock-in percentage (e.g., -5.0 for 5% below previous close)
 * @returns Recommendation with breakdown and signals
 *
 * @example
 * ```ts
 * const recommendation = await getRecommendation(1, -5.0);
 * console.log(`Recommended amount: $${recommendation.recommended_amount}`);
 * console.log(`Opportunity multiplier: ${recommendation.breakdown.opportunity_multiplier}x`);
 * ```
 */
export async function getRecommendation(
  trackerId: number,
  lockInPct: number
): Promise<{
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
}> {
  const response = await apiRequestPromise<any>(
    `/api/dsip-trackers/${trackerId}/recommendation?lock_in_pct=${lockInPct}`,
    undefined,
    {
      method: 'GET',
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get recommendation');
}

// ============================================================================
// 11. End Partition Action
// ============================================================================

/**
 * Manually end a partition action
 * This is called after confirming and recording an execution
 *
 * @param trackerId - The ID of the tracker
 * @param partitionIndex - The partition index to end
 * @returns End action response with status and end reason
 *
 * @example
 * ```ts
 * const result = await endPartitionAction(1, 3);
 * if (result.end_reason === 'SUCCESS') {
 *   console.log('Partition completed successfully!');
 * }
 * ```
 */
export async function endPartitionAction(
  trackerId: number,
  partitionIndex: number
): Promise<EndActionResponse> {
  const response = await apiRequestPromise<EndActionResponse>(
    `/api/dsip-trackers/end-action?trackerId=${trackerId}&partitionIndex=${partitionIndex}`,
    undefined,
    {
      method: 'POST',
    }
  );

  if (response.status === 'success') {
    return response.data;
  }

  throw new Error(response.message || 'Failed to end partition action');
}


