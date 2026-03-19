# Redux State Management Guide

This application now uses **Redux Toolkit** for centralized state management, replacing the previous Context API implementation.

## 📁 Project Structure

```
src/
├── store/
│   ├── index.ts              # Redux store configuration
│   ├── hooks.ts              # Typed Redux hooks
│   └── slices/
│       ├── authSlice.ts      # Authentication state
│       ├── stocksSlice.ts    # Stocks/portfolio state
│       └── uiSlice.ts        # UI state (views, modals)
├── utils/
│   └── auth.ts               # Auth utility functions
└── ...
```

## 🏗️ Store Architecture

### 1. Auth Slice (`authSlice.ts`)
Manages authentication state and user information.

**State:**
```typescript
{
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  error: string | null
}
```

**Actions:**
- `checkAuth()` - Async thunk to validate authentication
- `logout()` - Async thunk to sign out user
- `clearAuth()` - Clear auth state (used by API interceptor)
- `setAuthSuccess()` - Handle auth success from popup
- `setAuthError(message)` - Handle auth errors

**Usage Example:**
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuth, logout } from '../store/slices/authSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };
};
```

### 2. Stocks Slice (`stocksSlice.ts`)
Manages portfolio stocks and related state.

**State:**
```typescript
{
  stocks: Stock[]
  selectedStockId: string | null
  tempStrategyConfig: Partial<Stock> | undefined
  showDsipOnly: boolean
}
```

**Actions:**
- `addStock(stock)` - Add new stock
- `updateStock(stock)` - Update existing stock
- `deleteStock(id)` - Remove stock
- `setSelectedStock(id)` - Select a stock
- `setTempStrategyConfig(config)` - Store temporary config for copying
- `setShowDsipOnly(show)` - Toggle DSIP-only view
- `loadStocks()` - Reload from localStorage
- `clearStocks()` - Clear all stocks

**Persistence:**
Automatically syncs with localStorage on every change.

**Usage Example:**
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addStock, updateStock } from '../store/slices/stocksSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { stocks, selectedStockId } = useAppSelector(state => state.stocks);

  const handleAddStock = (newStock: Stock) => {
    dispatch(addStock(newStock));
  };
};
```

### 3. UI Slice (`uiSlice.ts`)
Manages UI state like current view and modals.

**State:**
```typescript
{
  view: AppView
  showCelebration: boolean
  sidebarCollapsed: boolean
}
```

**Actions:**
- `setView(view)` - Set any view
- `navigateToDashboard()` - Go to dashboard
- `navigateToAddStock()` - Go to add stock view
- `navigateToStockDetails()` - Go to stock details
- `navigateToLanding()` - Go to landing page
- `showCelebrationModal()` - Show celebration
- `hideCelebrationModal()` - Hide celebration
- `toggleSidebar()` - Toggle sidebar state
- `setSidebarCollapsed(collapsed)` - Set sidebar state

**Usage Example:**
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { navigateToDashboard, showCelebrationModal } from '../store/slices/uiSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { view, showCelebration } = useAppSelector(state => state.ui);

  const handleNavigate = () => {
    dispatch(navigateToDashboard());
  };
};
```

## 🔧 Setup & Configuration

### Store Configuration
The store is configured in `src/store/index.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import stocksReducer from './slices/stocksSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stocks: stocksReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
```

### Provider Setup
The Redux Provider wraps the entire app in `src/App.tsx`:

```typescript
import { Provider } from 'react-redux';
import { store } from './store';

const App = () => (
  <Provider store={store}>
    {/* App content */}
  </Provider>
);
```

## 🪝 Custom Hooks

We use typed hooks for better TypeScript support:

```typescript
// src/store/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Always use `useAppDispatch` and `useAppSelector` instead of the default Redux hooks!**

## 🔄 Async Operations

Redux Toolkit uses `createAsyncThunk` for async operations:

```typescript
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api<AuthStatusResponse>('/api/auth/status');
      return data;
    } catch (error) {
      return rejectWithValue('Authentication failed');
    }
  }
);
```

Usage:
```typescript
dispatch(checkAuth())
  .unwrap()
  .then((result) => {
    console.log('Auth check succeeded:', result);
  })
  .catch((error) => {
    console.error('Auth check failed:', error);
  });
```

## 🎯 Best Practices

### 1. Component Organization
```typescript
const MyComponent = () => {
  // 1. Hooks first
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  // 2. Event handlers
  const handleClick = () => {
    dispatch(someAction());
  };

  // 3. Effects
  useEffect(() => {
    // ...
  }, []);

  // 4. Render
  return <div>...</div>;
};
```

### 2. Selector Performance
For complex selectors, consider using `reselect` or memoization:

```typescript
import { createSelector } from '@reduxjs/toolkit';

const selectStocks = (state: RootState) => state.stocks.stocks;

const selectTotalValue = createSelector(
  [selectStocks],
  (stocks) => stocks.reduce((sum, stock) => sum + stock.currentPrice, 0)
);
```

### 3. Action Naming
Follow the pattern: `slice/actionName`
- Auth: `auth/checkAuth`, `auth/logout`
- Stocks: `stocks/addStock`, `stocks/updateStock`
- UI: `ui/setView`, `ui/navigateToDashboard`

### 4. State Normalization
For large datasets, consider normalizing data:

```typescript
// Instead of:
stocks: Stock[]

// Consider:
stocks: {
  byId: { [id: string]: Stock }
  allIds: string[]
}
```

## 🐛 Redux DevTools

Redux DevTools is enabled in development mode. Install the browser extension:
- [Chrome](https://chrome.google.com/webstore/detail/redux-devtools)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

Features:
- Time-travel debugging
- Action replay
- State inspection
- Performance monitoring

## 🔍 Debugging Tips

### 1. Log State Changes
```typescript
dispatch(someAction());
console.log('New state:', store.getState());
```

### 2. Track Action Dispatch
```typescript
const result = await dispatch(someAsyncAction()).unwrap();
console.log('Action result:', result);
```

### 3. Monitor Specific Slices
```typescript
const stocks = useAppSelector(state => {
  console.log('Stocks state:', state.stocks);
  return state.stocks.stocks;
});
```

## 📦 Migration from Context API

The previous Context API has been completely replaced:

**Before (Context API):**
```typescript
const { isAuthenticated, login, logout } = useAuth();
```

**After (Redux):**
```typescript
const dispatch = useAppDispatch();
const { isAuthenticated } = useAppSelector(state => state.auth);
const handleLogin = () => openLoginPopup();
const handleLogout = () => dispatch(logout());
```

## 🚀 Adding New State

To add new state:

1. **Create a new slice** in `src/store/slices/mySlice.ts`
2. **Define state interface** and initial state
3. **Add reducers** for synchronous actions
4. **Add async thunks** for async operations
5. **Export actions and reducer**
6. **Add to store** in `src/store/index.ts`
7. **Use in components** with typed hooks

Example:
```typescript
// 1. Create slice
const mySlice = createSlice({
  name: 'myFeature',
  initialState: { data: null },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
  },
});

// 2. Add to store
export const store = configureStore({
  reducer: {
    // ... other reducers
    myFeature: myReducer,
  },
});

// 3. Use in components
const data = useAppSelector(state => state.myFeature.data);
```

## 📚 Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Redux Essentials Tutorial](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)

## ✅ Benefits of Redux

1. **Centralized State** - Single source of truth
2. **Predictable Updates** - Actions and reducers make state changes explicit
3. **DevTools** - Powerful debugging capabilities
4. **Middleware Support** - Easy to add logging, analytics, etc.
5. **Type Safety** - Full TypeScript support
6. **Performance** - Optimized re-renders with proper selectors
7. **Testability** - Easy to test reducers and actions in isolation
