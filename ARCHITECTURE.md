# Redux Architecture Diagram

## 🏛️ Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Redux Provider                         │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │              Redux Store                          │   │  │
│  │  │                                                    │   │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │   │  │
│  │  │  │  Auth Slice  │  │Stocks Slice  │  │UI Slice│ │   │  │
│  │  │  │              │  │              │  │        │ │   │  │
│  │  │  │ • isLoading  │  │ • stocks[]   │  │ • view │ │   │  │
│  │  │  │ • isAuth     │  │ • selectedId │  │ • modal│ │   │  │
│  │  │  │ • user       │  │ • dsipOnly   │  │ • sidebar││   │  │
│  │  │  │ • error      │  │ • tempConfig │  │        │ │   │  │
│  │  │  └──────────────┘  └──────────────┘  └────────┘ │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Component Tree                         │  │
│  │                                                            │  │
│  │  App.tsx                                                  │  │
│  │    ├─ MainApp                                             │  │
│  │    │   ├─ MainLayout                                      │  │
│  │    │   │   ├─ LeftSidebar                                 │  │
│  │    │   │   ├─ Dashboard / AddStock / StockDetails        │  │
│  │    │   │   └─ RightSidebar (Stock Details view)          │  │
│  │    │   └─ Celebration Dialog                             │  │
│  │    └─ LandingPage                                         │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │
       │ 1. User Action
       ↓
┌──────────────────┐
│ dispatch(action) │
└──────┬───────────┘
       │
       │ 2. Dispatch
       ↓
┌──────────────┐      ┌─────────────────┐
│   Reducer    │◄─────┤  Async Thunk    │ (if async)
└──────┬───────┘      └─────────────────┘
       │                      ↑
       │ 3. Update State      │ API Call
       ↓                      │
┌──────────────┐      ┌─────────────────┐
│  Redux Store │      │   Backend API   │
└──────┬───────┘      └─────────────────┘
       │
       │ 4. State Changed
       ↓
┌──────────────────┐
│  useAppSelector  │
└──────┬───────────┘
       │
       │ 5. Re-render
       ↓
┌──────────────┐
│  Component   │
└──────────────┘
```

## 🔄 Auth Flow

```
┌─────────────────┐
│  Landing Page   │
└────────┬────────┘
         │
         │ Click "Continue with Google"
         ↓
┌─────────────────┐
│ openLoginPopup()│
└────────┬────────┘
         │
         │ Opens popup
         ↓
┌─────────────────┐
│  Auth Callback  │
└────────┬────────┘
         │
         │ Success/Error
         ↓
┌──────────────────────┐
│ postMessage to parent│
└────────┬─────────────┘
         │
         │ Message received
         ↓
┌──────────────────────────┐
│ dispatch(setAuthSuccess) │
│ dispatch(checkAuth())    │
└────────┬─────────────────┘
         │
         │ Auth validated
         ↓
┌──────────────────────────┐
│ isAuthenticated = true   │
│ navigate to Dashboard    │
└──────────────────────────┘
```

## 📦 Stock Management Flow

```
┌──────────────┐
│  Dashboard   │
└──────┬───────┘
       │
       │ Click "Add Stock"
       ↓
┌─────────────────────────┐
│ dispatch(navigateToAdd) │
└──────┬──────────────────┘
       │
       │ View changes
       ↓
┌──────────────┐
│  Add Stock   │
└──────┬───────┘
       │
       │ Fill form & submit
       ↓
┌──────────────────────┐
│ dispatch(addStock)   │
└──────┬───────────────┘
       │
       │ Stock added to state
       │ Saved to localStorage
       ↓
┌─────────────────────────────┐
│ dispatch(navigateToDetails) │
└──────┬──────────────────────┘
       │
       │ View changes
       ↓
┌──────────────────┐
│  Stock Details   │
└──────────────────┘
```

## 🎯 Component-State Connection

```
┌─────────────────────────────────────────────────────────┐
│                      Components                          │
└────┬───────────────────┬───────────────────┬────────────┘
     │                   │                   │
     │ useAppSelector    │ useAppSelector    │ useAppSelector
     ↓                   ↓                   ↓
┌────────────┐     ┌──────────────┐    ┌─────────┐
│ Auth Slice │     │ Stocks Slice │    │UI Slice │
└────┬───────┘     └──────┬───────┘    └────┬────┘
     │                    │                  │
     │ useAppDispatch     │ useAppDispatch   │ useAppDispatch
     ↓                    ↓                  ↓
┌─────────────────────────────────────────────────────────┐
│                      Actions                             │
│                                                           │
│  • checkAuth()         • addStock()        • setView()   │
│  • logout()            • updateStock()     • navigate*() │
│  • clearAuth()         • deleteStock()     • showModal() │
└─────────────────────────────────────────────────────────┘
```

## 🗂️ File Structure

```
src/
├── store/
│   ├── index.ts                    # Store configuration
│   ├── hooks.ts                    # Typed hooks
│   └── slices/
│       ├── authSlice.ts           # Auth state + actions
│       ├── stocksSlice.ts         # Stocks state + actions
│       └── uiSlice.ts             # UI state + actions
│
├── components/
│   ├── App.tsx                    # Provider wrapper
│   ├── MainLayout.tsx             # Uses auth + stocks
│   ├── LandingPage.tsx            # Uses auth
│   ├── Dashboard.tsx              # Uses stocks
│   ├── AddStock.tsx               # Uses stocks
│   ├── StockDetails.tsx           # Uses stocks
│   ├── AuthCallback.tsx           # Uses auth
│   └── ...
│
├── utils/
│   └── auth.ts                    # Auth utilities
│
├── lib/
│   └── api.ts                     # API client
│
└── types.ts                       # Type definitions
```

## 🔌 Redux Middleware Pipeline

```
Component Dispatch
      ↓
┌────────────────┐
│  Redux Thunk   │ (handles async actions)
└────────┬───────┘
         ↓
┌────────────────┐
│    Reducers    │ (update state)
└────────┬───────┘
         ↓
┌────────────────┐
│  Redux Store   │ (new state)
└────────┬───────┘
         ↓
┌────────────────┐
│  Subscribers   │ (React components re-render)
└────────────────┘
```

## 🎨 State Update Pattern

```
Old State                Action               New State
─────────                ──────               ─────────
{                   dispatch(addStock)         {
  stocks: [A, B]    →  with stock C    →        stocks: [A, B, C]
}                                              }

{                   dispatch(logout)           {
  user: {...}       →                  →        user: null,
  isAuth: true                                  isAuth: false
}                                              }

{                   dispatch(setView)          {
  view: 'LANDING'   →  'DASHBOARD'    →        view: 'DASHBOARD'
}                                              }
```

## 🔐 Security & API Integration

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │
       │ dispatch(checkAuth())
       ↓
┌─────────────────┐
│  Auth Thunk     │
└──────┬──────────┘
       │
       │ api.get('/auth/status')
       ↓
┌─────────────────┐
│   API Client    │
└──────┬──────────┘
       │
       │ includes: 'credentials'
       ↓
┌─────────────────┐      ┌──────────────────┐
│  Backend API    │      │  401 Response    │
└──────┬──────────┘      └────────┬─────────┘
       │                          │
       │ Success                  │ Unauthorized
       ↓                          ↓
┌─────────────────┐      ┌──────────────────┐
│ Return user data│      │ onUnauthorized() │
└──────┬──────────┘      └────────┬─────────┘
       │                          │
       │                          │ dispatch(clearAuth())
       ↓                          ↓
┌─────────────────────────────────────────────┐
│           Redux Store Updated               │
└─────────────────────────────────────────────┘
```

## 🎭 View Transitions

```
Landing Page
     │
     │ Auth Success
     ↓
Dashboard ←──────────────────────┐
     │                           │
     │ Click "Add Stock"         │
     ↓                           │
Add Stock                        │
     │                           │
     │ Submit                    │
     ↓                           │
Stock Details ───────────────────┘
     │          Click Back
     │
     └──→ Dashboard
```

## 📈 Performance Optimizations

```
┌─────────────────────────────────────────────┐
│         Component Re-render Logic            │
├─────────────────────────────────────────────┤
│                                              │
│  useAppSelector((state) => state.auth.user) │
│         ↓                                    │
│  Only re-renders when user changes          │
│  (not when isLoading or error changes)      │
│                                              │
│  useAppSelector((state) => state.stocks)    │
│         ↓                                    │
│  Re-renders on ANY stocks slice change      │
│  (less optimal)                              │
│                                              │
└─────────────────────────────────────────────┘

Best Practice: Select minimal state needed
✅ state => state.auth.user
❌ state => state.auth
```

## 🧪 Testing Architecture

```
┌──────────────────┐
│  Component Test  │
└────────┬─────────┘
         │
         │ Wrap with <Provider>
         ↓
┌──────────────────┐
│   Mock Store     │
└────────┬─────────┘
         │
         │ Predefined state
         ↓
┌──────────────────┐
│  Test Component  │
│  Interactions    │
└──────────────────┘

┌──────────────────┐
│  Reducer Test    │
└────────┬─────────┘
         │
         │ Call reducer(state, action)
         ↓
┌──────────────────┐
│  Assert new      │
│  state is correct│
└──────────────────┘

┌──────────────────┐
│  Thunk Test      │
└────────┬─────────┘
         │
         │ Mock API calls
         ↓
┌──────────────────┐
│  Dispatch thunk  │
│  Assert actions  │
└──────────────────┘
```
