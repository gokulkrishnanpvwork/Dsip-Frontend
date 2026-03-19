# DSIP Tracker API Usage Guide

This guide shows you how to use the new tracker API functions and Redux store in your React components.

## Table of Contents

1. [File Structure](#file-structure)
2. [Quick Start](#quick-start)
3. [Using Redux Hooks](#using-redux-hooks)
4. [API Functions](#api-functions)
5. [Component Examples](#component-examples)
6. [Best Practices](#best-practices)

---

## File Structure

```
src/
├── types/
│   └── tracker.types.ts          # TypeScript types for all tracker data
├── lib/
│   └── api.fetcher.ts            # All 8 API functions
└── store/
    ├── index.ts                  # Redux store configuration
    ├── hooks.ts                  # Typed Redux hooks
    └── slices/
        └── trackersSlice.ts      # Tracker state management
```

---

## Quick Start

### 1. Import the necessary hooks and actions

```tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchAllTrackers,
  fetchTrackerDetails,
  createTracker,
  updateTracker,
  executeTrade,
  deleteTracker,
} from '../store/slices/trackersSlice';
```

### 2. Access tracker state in your component

```tsx
function MyComponent() {
  const dispatch = useAppDispatch();

  // Get data from Redux store
  const {
    trackers,
    portfolioSummary,
    isLoadingTrackers,
    selectedTracker,
    error,
  } = useAppSelector((state) => state.trackers);

  // Fetch trackers on mount
  useEffect(() => {
    dispatch(fetchAllTrackers());
  }, [dispatch]);

  return (
    <div>
      {isLoadingTrackers ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {trackers.map((tracker) => (
            <li key={tracker.trackerId}>{tracker.stockSymbol}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Using Redux Hooks

### Available State

```typescript
const trackersState = useAppSelector((state) => state.trackers);

// Portfolio data
trackersState.trackers                    // TrackerSummary[]
trackersState.portfolioSummary            // PortfolioSummary | null

// Selected tracker details
trackersState.selectedTracker             // GetTrackerDetailsResponse | null
trackersState.selectedTrackerId           // number | null

// Partition details
trackersState.selectedPartition           // Partition | null

// Loading states
trackersState.isLoadingTrackers           // boolean
trackersState.isLoadingTrackerDetails     // boolean
trackersState.isLoadingPartition          // boolean
trackersState.isCreatingTracker           // boolean
trackersState.isUpdatingTracker           // boolean
trackersState.isExecutingTrade            // boolean
trackersState.isDeletingTracker           // boolean

// Error states
trackersState.error                       // string | null
trackersState.trackerDetailsError         // string | null
trackersState.partitionError              // string | null

// Success messages
trackersState.successMessage              // string | null

// Stock prices cache
trackersState.stockPrices                 // Record<string, StockPrice>
trackersState.isLoadingStockPrice         // boolean
trackersState.stockPriceError             // string | null
```

### Available Actions

```typescript
import {
  // Async thunks (API calls)
  fetchAllTrackers,
  fetchTrackerDetails,
  createTracker,
  updateTracker,
  executeTrade,
  fetchPartitionDetails,
  deleteTracker,
  fetchStockPrice,

  // Sync actions
  setSelectedTracker,
  clearSelectedTracker,
  clearSelectedPartition,
  clearError,
  clearSuccessMessage,
  setSuccessMessage,
  clearStockPrice,
  resetTrackersState,
} from '../store/slices/trackersSlice';
```

---

## API Functions

All 8 API functions are available in `src/lib/api.fetcher.ts`:

### 1. Create Tracker

```typescript
import { createTracker } from '../store/slices/trackersSlice';
import { DeploymentStyle } from '../types/tracker.types';

// In component
const handleCreateTracker = async () => {
  const result = await dispatch(
    createTracker({
      stock_symbol: 'AAPL',
      conviction_period_years: 5,
      total_capital_planned: 100000,
      partition_days: 30,
      deployment_style: DeploymentStyle.AGGRESSIVE,
      base_conviction_score: 75,
      initial_invested_amount: 5000,
      initial_shares_held: 25,
      is_fractional_shares_allowed: true,
    })
  );

  if (createTracker.fulfilled.match(result)) {
    console.log('Tracker created:', result.payload);
  }
};
```

### 2. Get All Trackers (Portfolio)

```typescript
import { fetchAllTrackers } from '../store/slices/trackersSlice';

// In component
useEffect(() => {
  dispatch(fetchAllTrackers());
}, [dispatch]);

// Access data
const { trackers, portfolioSummary } = useAppSelector((state) => state.trackers);
```

### 3. Get Tracker Details

```typescript
import { fetchTrackerDetails } from '../store/slices/trackersSlice';

const handleViewDetails = (trackerId: number) => {
  dispatch(fetchTrackerDetails(trackerId));
};

// Access data
const { selectedTracker } = useAppSelector((state) => state.trackers);

if (selectedTracker) {
  console.log('Tracker:', selectedTracker.tracker);
  console.log('Partitions:', selectedTracker.partitions);
  console.log('Recent executions:', selectedTracker.recentExecutions);
}
```

### 4. Update Tracker

```typescript
import { updateTracker } from '../store/slices/trackersSlice';
import { TrackerStatus } from '../types/tracker.types';

const handleUpdateTracker = async () => {
  await dispatch(
    updateTracker({
      trackerId: 1,
      data: {
        base_conviction_score: 80,
        status: TrackerStatus.PAUSED,
      },
    })
  );
};
```

### 5. Execute Trade

```typescript
import { executeTrade } from '../store/slices/trackersSlice';

const handleExecuteTrade = async () => {
  const result = await dispatch(
    executeTrade({
      trackerId: 1,
      data: {
        lock_in_percentage: 50,
        conviction_override: 85,
        executed_amount: 5000,
        execution_price: 176.25,
      },
    })
  );

  if (executeTrade.fulfilled.match(result)) {
    console.log('Trade executed:', result.payload.message);
    console.log('Shares bought:', result.payload.sharesBought);
  }
};
```

### 6. Get Partition Details

```typescript
import { fetchPartitionDetails } from '../store/slices/trackersSlice';

const handleViewPartition = (trackerId: number, partitionIndex: number) => {
  dispatch(fetchPartitionDetails({ trackerId, partitionIndex }));
};

// Access data
const { selectedPartition } = useAppSelector((state) => state.trackers);
```

### 7. Delete Tracker

```typescript
import { deleteTracker } from '../store/slices/trackersSlice';

const handleDeleteTracker = async (trackerId: number) => {
  const confirmed = window.confirm('Are you sure you want to delete this tracker?');

  if (confirmed) {
    await dispatch(deleteTracker(trackerId));
  }
};
```

### 8. Get Stock Closing Price

```typescript
import { fetchStockPrice } from '../store/slices/trackersSlice';
import { Exchange } from '../types/tracker.types';

const handleFetchPrice = () => {
  dispatch(
    fetchStockPrice({
      symbol: 'AAPL',
      exchange: Exchange.US,
    })
  );
};

// Access cached prices
const { stockPrices } = useAppSelector((state) => state.trackers);
const applePrice = stockPrices['AAPL'];

if (applePrice) {
  console.log(`${applePrice.stockName}: $${applePrice.closePrice}`);
  console.log(`Source: ${applePrice.source}`); // 'cache' or 'api'
}
```

---

## Component Examples

### Example 1: Portfolio Dashboard

```tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllTrackers } from '../store/slices/trackersSlice';

function PortfolioDashboard() {
  const dispatch = useAppDispatch();
  const { trackers, portfolioSummary, isLoadingTrackers, error } =
    useAppSelector((state) => state.trackers);

  useEffect(() => {
    dispatch(fetchAllTrackers());
  }, [dispatch]);

  if (isLoadingTrackers) {
    return <div>Loading portfolio...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>My Portfolio</h1>

      {portfolioSummary && (
        <div className="summary">
          <p>Total Trackers: {portfolioSummary.totalTrackers}</p>
          <p>Active Trackers: {portfolioSummary.activeTrackers}</p>
          <p>Total Capital Planned: ${portfolioSummary.totalCapitalPlanned.toLocaleString()}</p>
          <p>Total Invested: ${portfolioSummary.totalCapitalInvested.toLocaleString()}</p>
          <p>Current Value: ${portfolioSummary.totalCurrentValue.toLocaleString()}</p>
        </div>
      )}

      <div className="trackers-list">
        {trackers.map((tracker) => (
          <div key={tracker.trackerId} className="tracker-card">
            <h3>{tracker.stockSymbol} - {tracker.stockName}</h3>
            <p>Current Price: ${tracker.currentPrice}</p>
            <p>Shares Held: {tracker.sharesHeldSoFar}</p>
            <p>Invested: ${tracker.totalCapitalInvestedSoFar} / ${tracker.totalCapitalPlanned}</p>
            <p>Status: {tracker.status === 1 ? 'Active' : 'Inactive'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PortfolioDashboard;
```

### Example 2: Tracker Details Page

```tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTrackerDetails } from '../store/slices/trackersSlice';

function TrackerDetailsPage() {
  const { trackerId } = useParams<{ trackerId: string }>();
  const dispatch = useAppDispatch();

  const {
    selectedTracker,
    isLoadingTrackerDetails,
    trackerDetailsError
  } = useAppSelector((state) => state.trackers);

  useEffect(() => {
    if (trackerId) {
      dispatch(fetchTrackerDetails(parseInt(trackerId)));
    }
  }, [dispatch, trackerId]);

  if (isLoadingTrackerDetails) {
    return <div>Loading tracker details...</div>;
  }

  if (trackerDetailsError) {
    return <div>Error: {trackerDetailsError}</div>;
  }

  if (!selectedTracker) {
    return <div>No tracker selected</div>;
  }

  const { tracker, partitions, recentExecutions } = selectedTracker;

  return (
    <div>
      <h1>{tracker.stockSymbol} - {tracker.stockName}</h1>

      <section>
        <h2>Tracker Info</h2>
        <p>Current Price: ${tracker.currentPrice}</p>
        <p>Shares Held: {tracker.sharesHeldSoFar}</p>
        <p>Capital Invested: ${tracker.totalCapitalInvestedSoFar}</p>
        <p>Conviction Score: {tracker.base_conviction_score}</p>
        <p>Active Partition: {tracker.active_partition_index}</p>
      </section>

      <section>
        <h2>Partitions ({partitions.length})</h2>
        {partitions.map((partition) => (
          <div key={partition.partitionId} className="partition-card">
            <h3>Partition {partition.partitionIndex}</h3>
            <p>Status: {partition.status === 1 ? 'Active' : 'Completed'}</p>
            <p>Allocated: ${partition.partitionCapitalAllocated}</p>
            <p>Invested: ${partition.capitalInvestedSoFar}</p>
            <p>Shares: {partition.noOfSharesBought}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Recent Executions</h2>
        {recentExecutions.map((execution) => (
          <div key={execution.executionId} className="execution-card">
            <p>Date: {new Date(execution.createdAt).toLocaleDateString()}</p>
            <p>Amount: ${execution.executedAmount}</p>
            <p>Price: ${execution.executionPrice}</p>
            <p>Conviction: {execution.convictionOverride}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default TrackerDetailsPage;
```

### Example 3: Create Tracker Form

```tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createTracker } from '../store/slices/trackersSlice';
import { DeploymentStyle } from '../types/tracker.types';

function CreateTrackerForm() {
  const dispatch = useAppDispatch();
  const { isCreatingTracker, error, successMessage } =
    useAppSelector((state) => state.trackers);

  const [formData, setFormData] = useState({
    stock_symbol: '',
    conviction_period_years: 5,
    total_capital_planned: 10000,
    partition_days: 30,
    deployment_style: DeploymentStyle.AGGRESSIVE,
    base_conviction_score: 75,
    is_fractional_shares_allowed: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await dispatch(createTracker(formData));

    if (createTracker.fulfilled.match(result)) {
      // Reset form
      setFormData({
        stock_symbol: '',
        conviction_period_years: 5,
        total_capital_planned: 10000,
        partition_days: 30,
        deployment_style: DeploymentStyle.AGGRESSIVE,
        base_conviction_score: 75,
        is_fractional_shares_allowed: true,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Tracker</h2>

      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <div>
        <label>Stock Symbol</label>
        <input
          type="text"
          value={formData.stock_symbol}
          onChange={(e) => setFormData({ ...formData, stock_symbol: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Conviction Period (Years)</label>
        <input
          type="number"
          value={formData.conviction_period_years}
          onChange={(e) => setFormData({ ...formData, conviction_period_years: parseInt(e.target.value) })}
          min="1"
          required
        />
      </div>

      <div>
        <label>Total Capital Planned</label>
        <input
          type="number"
          value={formData.total_capital_planned}
          onChange={(e) => setFormData({ ...formData, total_capital_planned: parseFloat(e.target.value) })}
          min="1"
          required
        />
      </div>

      <div>
        <label>Partition Days</label>
        <input
          type="number"
          value={formData.partition_days}
          onChange={(e) => setFormData({ ...formData, partition_days: parseInt(e.target.value) })}
          min="1"
          required
        />
      </div>

      <div>
        <label>Deployment Style</label>
        <select
          value={formData.deployment_style}
          onChange={(e) => setFormData({ ...formData, deployment_style: parseInt(e.target.value) })}
        >
          <option value={DeploymentStyle.UNIFORM}>Uniform</option>
          <option value={DeploymentStyle.AGGRESSIVE}>Aggressive</option>
          <option value={DeploymentStyle.CONSERVATIVE}>Conservative</option>
        </select>
      </div>

      <div>
        <label>Base Conviction Score</label>
        <input
          type="number"
          value={formData.base_conviction_score}
          onChange={(e) => setFormData({ ...formData, base_conviction_score: parseInt(e.target.value) })}
          min="0"
          max="100"
          required
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.is_fractional_shares_allowed}
            onChange={(e) => setFormData({ ...formData, is_fractional_shares_allowed: e.target.checked })}
          />
          Allow Fractional Shares
        </label>
      </div>

      <button type="submit" disabled={isCreatingTracker}>
        {isCreatingTracker ? 'Creating...' : 'Create Tracker'}
      </button>
    </form>
  );
}

export default CreateTrackerForm;
```

### Example 4: Execute Trade Dialog

```tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { executeTrade } from '../store/slices/trackersSlice';

interface ExecuteTradeDialogProps {
  trackerId: number;
  onClose: () => void;
}

function ExecuteTradeDialog({ trackerId, onClose }: ExecuteTradeDialogProps) {
  const dispatch = useAppDispatch();
  const { isExecutingTrade, error } = useAppSelector((state) => state.trackers);

  const [tradeData, setTradeData] = useState({
    lock_in_percentage: 50,
    conviction_override: 75,
    executed_amount: 1000,
    execution_price: 100,
  });

  const handleExecute = async () => {
    const result = await dispatch(
      executeTrade({
        trackerId,
        data: tradeData,
      })
    );

    if (executeTrade.fulfilled.match(result)) {
      alert(`Trade executed! Bought ${result.payload.sharesBought} shares`);
      onClose();
    }
  };

  return (
    <div className="dialog">
      <h2>Execute Trade</h2>

      {error && <div className="error">{error}</div>}

      <div>
        <label>Lock-in Percentage (0-100)</label>
        <input
          type="number"
          value={tradeData.lock_in_percentage}
          onChange={(e) => setTradeData({ ...tradeData, lock_in_percentage: parseInt(e.target.value) })}
          min="0"
          max="100"
        />
      </div>

      <div>
        <label>Conviction Override (0-100)</label>
        <input
          type="number"
          value={tradeData.conviction_override}
          onChange={(e) => setTradeData({ ...tradeData, conviction_override: parseInt(e.target.value) })}
          min="0"
          max="100"
        />
      </div>

      <div>
        <label>Amount to Invest</label>
        <input
          type="number"
          value={tradeData.executed_amount}
          onChange={(e) => setTradeData({ ...tradeData, executed_amount: parseFloat(e.target.value) })}
          min="1"
        />
      </div>

      <div>
        <label>Execution Price</label>
        <input
          type="number"
          value={tradeData.execution_price}
          onChange={(e) => setTradeData({ ...tradeData, execution_price: parseFloat(e.target.value) })}
          min="0.01"
          step="0.01"
        />
      </div>

      <div className="actions">
        <button onClick={handleExecute} disabled={isExecutingTrade}>
          {isExecutingTrade ? 'Executing...' : 'Execute Trade'}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default ExecuteTradeDialog;
```

---

## Best Practices

### 1. Use Typed Hooks

Always use the typed hooks from `store/hooks.ts`:

```typescript
// ✅ Good
import { useAppDispatch, useAppSelector } from '../store/hooks';

// ❌ Bad
import { useDispatch, useSelector } from 'react-redux';
```

### 2. Handle Loading and Error States

```tsx
const { data, isLoading, error } = useAppSelector((state) => state.trackers);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

### 3. Clear Errors After Displaying

```tsx
useEffect(() => {
  if (error) {
    // Show error toast/notification
    toast.error(error);

    // Clear error after showing
    dispatch(clearError());
  }
}, [error, dispatch]);
```

### 4. Use Success Messages

```tsx
useEffect(() => {
  if (successMessage) {
    toast.success(successMessage);
    dispatch(clearSuccessMessage());
  }
}, [successMessage, dispatch]);
```

### 5. Leverage the Stock Price Cache

```tsx
// Check cache first
const cachedPrice = stockPrices[symbol];

if (cachedPrice) {
  // Use cached price
  console.log(`Price: $${cachedPrice.closePrice}`);
} else {
  // Fetch if not cached
  dispatch(fetchStockPrice({ symbol, exchange: Exchange.US }));
}
```

### 6. Use Result Type Checking

```tsx
const result = await dispatch(createTracker(data));

if (createTracker.fulfilled.match(result)) {
  // Success - result.payload is typed correctly
  console.log('Created:', result.payload);
} else if (createTracker.rejected.match(result)) {
  // Error - result.payload contains error message
  console.error('Failed:', result.payload);
}
```

### 7. Cleanup on Unmount

```tsx
useEffect(() => {
  return () => {
    // Clear selected tracker when leaving page
    dispatch(clearSelectedTracker());
  };
}, [dispatch]);
```

---

## Summary

You now have:

1. ✅ **8 API functions** in `src/lib/api.fetcher.ts`
2. ✅ **TypeScript types** in `src/types/tracker.types.ts`
3. ✅ **Redux slice** in `src/store/slices/trackersSlice.ts`
4. ✅ **Integrated into store** in `src/store/index.ts`

Simply import the hooks and actions, dispatch them in your components, and use the data from Redux state. No more hardcoded values!
