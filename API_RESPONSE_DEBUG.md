# API Response Debug Guide

## Problem
The Dashboard shows blank screen even though API returns data.

## Root Cause
The API response structure doesn't match our TypeScript types.

### API Actually Returns:
```json
{
  "dsip_total_capital_invested_so_far": 500,
  "dsip_total_market_value": 8.1,
  "dsip_total_net_profit_percentage": -98.38,
  "dsip_trackers": [
    {
      "id": 3,
      "symbol": "FUBO",
      "name": "FuboTV Inc",
      "total_capital_invested_so_far": 500
    },
    {
      "id": 2,
      "symbol": "NFLX",
      "name": "Netflix Inc",
      "total_capital_invested_so_far": 0
    },
    {
      "id": 1,
      "symbol": "AAPL",
      "name": "Apple Inc",
      "total_capital_invested_so_far": 0
    }
  ],
  "net_profit_percentage": -98.38,
  "total_capital_invested_so_far": 500,
  "total_market_value": 8.1
}
```

### We Expected:
```typescript
{
  trackers: [{
    trackerId: number,
    stockSymbol: string,
    stockName: string,
    currentPrice: number,
    totalCapitalPlanned: number,
    totalCapitalInvestedSoFar: number,
    sharesHeldSoFar: number,
    status: number,
    activePartitionIndex: number,
    createdAt: string
  }],
  summary: {
    totalTrackers: number,
    activeTrackers: number,
    totalCapitalPlanned: number,
    totalCapitalInvested: number,
    totalCurrentValue: number
  }
}
```

## Solution Applied
Added transformation layer in `src/lib/api.fetcher.ts` to map API response to our expected format.

## To Debug Further

1. **Open browser console** (F12)
2. **Refresh the page**
3. **Look for these logs:**
   - `[API] Raw response:` - Shows actual API data
   - `[API] Transformed response:` - Shows transformed data
   - `[Dashboard] State:` - Shows Dashboard state

4. **Check if you see:**
   - `trackersCount: 3` (should match number of trackers)
   - `isLoadingTrackers: false`
   - `trackersError: null`
   - `portfolioSummary: {...}` (should have data)

5. **If still blank, check:**
   - Are there any React errors in console?
   - Are the tracker objects properly formatted?
   - Is the Dashboard actually rendering?

## Quick Fix if Still Not Working

If the transformation doesn't work, we need to see the EXACT API response. Please:

1. Open Developer Tools
2. Go to Network tab
3. Refresh page
4. Click on `dsip-trackers` request
5. Copy the entire Response JSON
6. Share it so we can map fields correctly

## Temporary Workaround

If you need the Dashboard working immediately, you can temporarily disable API integration:

In `Dashboard.tsx`, change line 45:
```typescript
// From:
const useApiData = trackers.length > 0;

// To:
const useApiData = false; // Temporary: use hardcoded data
```

This will make it use your existing hardcoded stocks data until we fix the API mapping.
