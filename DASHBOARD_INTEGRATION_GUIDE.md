# Dashboard API Integration Guide

This guide explains the changes made to integrate the tracker APIs into your Dashboard component.

## ✅ What's Been Done

### 1. **Dashboard.tsx Updates**

The Dashboard component now:
- ✅ Fetches trackers from the API using `fetchAllTrackers()`
- ✅ Displays loading spinner while fetching data
- ✅ Shows error message if API call fails
- ✅ Uses API data when available, falls back to hardcoded data
- ✅ Renders tracker cards with real data from backend
- ✅ Calculates portfolio metrics from API response

### 2. **Key Changes**

#### Added Redux Integration
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllTrackers } from '../store/slices/trackersSlice';

const dispatch = useAppDispatch();
const {
   trackers,
   portfolioSummary,
   isLoadingTrackers,
   error: trackersError,
} = useAppSelector((state) => state.trackers);
```

#### Fetch Data on Mount
```typescript
useEffect(() => {
   dispatch(fetchAllTrackers());
}, [dispatch]);
```

#### Conditional Rendering
- Shows loading spinner when `isLoadingTrackers` is true
- Shows error card when `trackersError` exists
- Uses API data (`trackers`) when available
- Falls back to hardcoded `stocks` prop when API data is empty

---

## 🔄 Next Steps: Integrating getTrackerDetails

When a user clicks the **Execute** button on a tracker card, you should:

1. Fetch detailed tracker information using `fetchTrackerDetails(trackerId)`
2. Navigate to the Stock Details page
3. Display the detailed information

### Option A: Update App.tsx to Fetch Details on Selection

Modify the `handleSelectStock` function in [App.tsx](src/App.tsx) to fetch tracker details:

```typescript
// In App.tsx, around line 104
const handleSelectStock = (id: string) => {
  dispatch(setSelectedStock(id));

  // Fetch tracker details when selecting a stock
  const trackerId = parseInt(id);
  if (!isNaN(trackerId)) {
    dispatch(fetchTrackerDetails(trackerId));
  }

  dispatch(navigateToStockDetails());
};
```

**Add this import at the top:**
```typescript
import { fetchTrackerDetails } from './store/slices/trackersSlice';
```

### Option B: Fetch in StockDetails Component

Alternatively, fetch the details in the [StockDetails.tsx](src/components/StockDetails.tsx) component itself:

```typescript
// In StockDetails.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTrackerDetails } from '../store/slices/trackersSlice';

function StockDetails({ stock, ... }) {
  const dispatch = useAppDispatch();
  const { selectedTracker, isLoadingTrackerDetails } = useAppSelector(
    (state) => state.trackers
  );

  // Fetch details when component mounts or stock.id changes
  useEffect(() => {
    const trackerId = parseInt(stock.id);
    if (!isNaN(trackerId)) {
      dispatch(fetchTrackerDetails(trackerId));
    }
  }, [dispatch, stock.id]);

  // Use selectedTracker data instead of stock prop
  if (isLoadingTrackerDetails) {
    return <LoadingSpinner />;
  }

  if (selectedTracker) {
    const { tracker, partitions, recentExecutions } = selectedTracker;
    // Render using real API data
  }
}
```

---

## 📊 API Data Structure

### Portfolio Summary (from getAllTrackers)
```typescript
{
  trackers: [
    {
      trackerId: 1,
      stockSymbol: "AAPL",
      stockName: "Apple Inc.",
      currentPrice: 175.50,
      totalCapitalPlanned: 100000,
      totalCapitalInvestedSoFar: 25000,
      sharesHeldSoFar: 142.5,
      status: 1, // 1 = ACTIVE
      activePartitionIndex: 3,
      createdAt: "2026-01-15T10:00:00Z"
    }
  ],
  summary: {
    totalTrackers: 1,
    activeTrackers: 1,
    totalCapitalPlanned: 100000,
    totalCapitalInvested: 25000,
    totalCurrentValue: 25006.25
  }
}
```

### Tracker Details (from getTrackerDetails)
```typescript
{
  tracker: {
    trackerId: 1,
    stockSymbol: "AAPL",
    stockName: "Apple Inc.",
    currentPrice: 175.50,
    convictionPeriodYears: 5,
    totalCapitalPlanned: 100000,
    partitionDays: 30,
    deploymentStyle: 1, // 1 = AGGRESSIVE
    baseConvictionScore: 75,
    status: 1,
    activePartitionIndex: 3,
    totalCapitalInvestedSoFar: 25000,
    sharesHeldSoFar: 142.5,
    isFractionalSharesAllowed: true,
    createdAt: "2026-01-15T10:00:00Z"
  },
  partitions: [
    {
      partitionId: 1,
      partitionIndex: 1,
      expectedPartitionDays: 30,
      partitionCapitalAllocated: 10000,
      capitalInvestedSoFar: 10000,
      noOfSharesBought: 57.5,
      successfulGrowthCount: 5,
      status: 2, // 2 = COMPLETED
      partitionEndDate: "2026-02-15",
      createdAt: "2026-01-15T10:00:00Z"
    }
  ],
  recentExecutions: [
    {
      executionId: 1,
      trackerId: 1,
      partitionId: 1,
      lockInPercentage: 50,
      convictionOverride: 80,
      executedAmount: 5000,
      executionPrice: 173.50,
      createdAt: "2026-01-20T14:30:00Z"
    }
  ]
}
```

---

## 🎯 Mapping Old Data to New API Data

### Dashboard Cards

| Old Field (Stock) | New Field (Tracker) | Notes |
|-------------------|---------------------|-------|
| `stock.id` | `tracker.trackerId` | Convert to string |
| `stock.symbol` | `tracker.stockSymbol` | Direct mapping |
| `stock.name` | `tracker.stockName` | Available in API |
| `stock.currentPrice` | `tracker.currentPrice` | Available in API |
| `stock.totalBudget` | `tracker.totalCapitalPlanned` | Direct mapping |
| `stock.deployedAmount` | `tracker.totalCapitalInvestedSoFar` | Direct mapping |
| `stock.isPaused` | `tracker.status !== 1` | 1 = ACTIVE |
| `stock.quantityOwned` | `tracker.sharesHeldSoFar` | Direct mapping |

### Calculate P&L
```typescript
// Old way (using stock prop)
const totalInvested = (stock.quantityOwned * stock.averagePriceOwned) + stock.deployedAmount;
const currentValue = totalQuantity * stock.currentPrice;
const pnlPct = ((currentValue - totalInvested) / totalInvested) * 100;

// New way (using tracker from API)
const totalInvested = tracker.totalCapitalInvestedSoFar;
const currentValue = tracker.sharesHeldSoFar * tracker.currentPrice;
const pnlPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
```

---

## 🔧 Testing

### 1. Test Dashboard with API
```bash
# Start your backend server on port 8080
# Then start the frontend
npm run dev
```

### 2. Check Browser Console
Open DevTools and look for:
- `[API Request] GET http://localhost:8080/api/dsip-trackers`
- Redux state updates in Redux DevTools

### 3. Test Error Handling
- Stop the backend server
- Refresh the page
- Should show error message in the Dashboard

### 4. Test Loading State
- Add a delay in the API
- Should show loading spinner

---

## 🚀 Summary

### What Works Now:
✅ Dashboard fetches trackers from API
✅ Portfolio summary calculated from API
✅ Tracker cards display real data
✅ Loading and error states
✅ Graceful fallback to hardcoded data

### Next Step:
🔲 Integrate `fetchTrackerDetails(trackerId)` when clicking Execute button
🔲 Update StockDetails component to use tracker details from Redux
🔲 Replace hardcoded transaction history with `recentExecutions`
🔲 Replace hardcoded partitions with API partitions

### Files to Update Next:
1. [App.tsx](src/App.tsx) - Add `fetchTrackerDetails` call
2. [StockDetails.tsx](src/components/StockDetails.tsx) - Use `selectedTracker` from Redux
3. [AddStock.tsx](src/components/AddStock.tsx) - Use `createTracker` API

---

## 📝 Quick Reference

### Available Redux Actions
```typescript
import {
  fetchAllTrackers,       // Get all trackers
  fetchTrackerDetails,    // Get specific tracker details
  createTracker,          // Create new tracker
  updateTracker,          // Update tracker settings
  executeTrade,           // Execute a trade
  deleteTracker,          // Delete a tracker
  fetchPartitionDetails,  // Get partition details
  fetchStockPrice,        // Get stock price
} from './store/slices/trackersSlice';
```

### Access Redux State
```typescript
const {
  trackers,                  // TrackerSummary[]
  portfolioSummary,          // PortfolioSummary
  selectedTracker,           // GetTrackerDetailsResponse
  isLoadingTrackers,         // boolean
  isLoadingTrackerDetails,   // boolean
  error,                     // string | null
} = useAppSelector((state) => state.trackers);
```

For complete API documentation, see [TRACKER_API_USAGE.md](TRACKER_API_USAGE.md).
