import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, API_BASE_URL, setOnUnauthorized } from '../../lib/api';
import { DEV_CONFIG } from '../../config/dev';

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture: string | null;
}

interface AuthStatusResponse {
  authenticated: boolean;
  user?: User;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}

const initialState: AuthState = {
  isLoading: !DEV_CONFIG.BYPASS_AUTH,
  isAuthenticated: DEV_CONFIG.BYPASS_AUTH,
  user: DEV_CONFIG.BYPASS_AUTH ? DEV_CONFIG.MOCK_USER : null,
  error: null,
};

// Async thunk for checking authentication status
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    // Skip auth check in dev mode
    if (DEV_CONFIG.BYPASS_AUTH) {
      return {
        authenticated: true,
        user: DEV_CONFIG.MOCK_USER,
      };
    }

    try {
      const data = await api<AuthStatusResponse>('/api/auth/status');
      return data;
    } catch (error) {
      return rejectWithValue('Authentication failed');
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return null;
    } catch (error) {
      // Best-effort logout, still clear state
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sync action for clearing auth state (used by API interceptor)
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    // Handle auth success from popup
    setAuthSuccess: (state) => {
      // Will trigger checkAuth to fetch user data
      state.error = null;
    },
    // Handle auth error from popup
    setAuthError: (state, action: PayloadAction<string | undefined>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload || 'Authentication failed';
    },
  },
  extraReducers: (builder) => {
    // Check auth
    builder.addCase(checkAuth.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.authenticated && action.payload.user) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
      } else {
        state.isAuthenticated = false;
        state.user = null;
      }
    });
    builder.addCase(checkAuth.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    });
  },
});

export const { clearAuth, setAuthSuccess, setAuthError } = authSlice.actions;
export default authSlice.reducer;
