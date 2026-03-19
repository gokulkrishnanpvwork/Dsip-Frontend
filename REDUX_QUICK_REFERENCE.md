# Redux Quick Reference

## 🚀 Quick Start

### Import Hooks
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
```

### Access State
```typescript
const { isAuthenticated, user } = useAppSelector(state => state.auth);
const { stocks, selectedStockId } = useAppSelector(state => state.stocks);
const { view } = useAppSelector(state => state.ui);
```

### Dispatch Actions
```typescript
const dispatch = useAppDispatch();
```

## 🔐 Auth Actions

```typescript
// Check authentication
dispatch(checkAuth());

// Logout user
dispatch(logout());

// Clear auth (used by API interceptor)
dispatch(clearAuth());

// Handle auth from popup
dispatch(setAuthSuccess());
dispatch(setAuthError('error message'));
```

## 📊 Stock Actions

```typescript
// Add stock
dispatch(addStock(newStock));

// Update stock
dispatch(updateStock(updatedStock));

// Delete stock
dispatch(deleteStock(stockId));

// Select stock
dispatch(setSelectedStock(stockId));

// Copy strategy config
dispatch(setTempStrategyConfig(config));

// Toggle DSIP view
dispatch(setShowDsipOnly(true));

// Reload from storage
dispatch(loadStocks());

// Clear all stocks
dispatch(clearStocks());
```

## 🎨 UI Actions

```typescript
// Navigate to views
dispatch(navigateToDashboard());
dispatch(navigateToAddStock());
dispatch(navigateToStockDetails());
dispatch(navigateToLanding());

// Or set directly
dispatch(setView('DASHBOARD'));

// Celebration modal
dispatch(showCelebrationModal());
dispatch(hideCelebrationModal());

// Sidebar
dispatch(toggleSidebar());
dispatch(setSidebarCollapsed(true));
```

## 🔄 Async Operations

```typescript
// With promise handling
dispatch(checkAuth())
  .unwrap()
  .then((result) => console.log('Success', result))
  .catch((error) => console.error('Error', error));

// With async/await
try {
  const result = await dispatch(logout()).unwrap();
  console.log('Logged out successfully');
} catch (error) {
  console.error('Logout failed:', error);
}
```

## 📦 State Shape

```typescript
{
  auth: {
    isLoading: boolean
    isAuthenticated: boolean
    user: User | null
    error: string | null
  },
  stocks: {
    stocks: Stock[]
    selectedStockId: string | null
    tempStrategyConfig: Partial<Stock> | undefined
    showDsipOnly: boolean
  },
  ui: {
    view: 'LANDING' | 'DASHBOARD' | 'ADD_STOCK' | 'STOCK_DETAILS'
    showCelebration: boolean
    sidebarCollapsed: boolean
  }
}
```

## 🎯 Common Patterns

### Component with Auth
```typescript
const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) return <Login />;

  return <div>Welcome {user?.name}!</div>;
};
```

### Component with Stocks
```typescript
const StocksList = () => {
  const dispatch = useAppDispatch();
  const stocks = useAppSelector(state => state.stocks.stocks);

  const handleAdd = (stock: Stock) => {
    dispatch(addStock(stock));
    dispatch(navigateToStockDetails());
  };

  return (
    <div>
      {stocks.map(stock => (
        <StockCard key={stock.id} stock={stock} />
      ))}
    </div>
  );
};
```

### Component with Navigation
```typescript
const Navigation = () => {
  const dispatch = useAppDispatch();
  const view = useAppSelector(state => state.ui.view);

  return (
    <nav>
      <button onClick={() => dispatch(navigateToDashboard())}>
        Dashboard
      </button>
      <button onClick={() => dispatch(navigateToAddStock())}>
        Add Stock
      </button>
    </nav>
  );
};
```

## 🛠️ Debugging

### Log Current State
```typescript
import { store } from '../store';
console.log('Current state:', store.getState());
```

### Watch State Changes
```typescript
const stocks = useAppSelector(state => {
  console.log('Stocks updated:', state.stocks);
  return state.stocks.stocks;
});
```

### Monitor Actions
```typescript
const dispatch = useAppDispatch();
dispatch(addStock(newStock));
console.log('After add:', store.getState().stocks);
```

## ⚡ Performance Tips

### Use Specific Selectors
```typescript
// ❌ Bad - selects entire slice
const auth = useAppSelector(state => state.auth);

// ✅ Good - selects only what you need
const user = useAppSelector(state => state.auth.user);
const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
```

### Memoize Complex Selectors
```typescript
import { createSelector } from '@reduxjs/toolkit';

const selectTotalValue = createSelector(
  [(state) => state.stocks.stocks],
  (stocks) => stocks.reduce((sum, s) => sum + s.currentPrice, 0)
);

const MyComponent = () => {
  const totalValue = useAppSelector(selectTotalValue);
};
```

## 📝 TypeScript Tips

### Type State Selectors
```typescript
const stocks: Stock[] = useAppSelector(state => state.stocks.stocks);
const user: User | null = useAppSelector(state => state.auth.user);
```

### Type Actions
```typescript
import type { PayloadAction } from '@reduxjs/toolkit';

// In slice definition
reducers: {
  setUser: (state, action: PayloadAction<User>) => {
    state.user = action.payload;
  }
}
```

## 🔗 Quick Links

- Full Guide: [REDUX_GUIDE.md](./REDUX_GUIDE.md)
- Migration Info: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- Redux Toolkit Docs: https://redux-toolkit.js.org/
