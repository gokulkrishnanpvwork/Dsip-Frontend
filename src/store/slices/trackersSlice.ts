/**
 * Trackers Redux Slice
 *
 * Manages state for DSIP trackers including:
 * - Portfolio of all trackers
 * - Individual tracker details
 * - Partition details
 * - Stock prices
 * - Loading and error states
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  TrackersState,
  CreateTrackerRequest,
  UpdateTrackerRequest,
  ExecuteTradeRequest,
  GetStockPriceRequest,
} from '../../types/tracker.types';
import * as trackerApi from '../../lib/api.fetcher';

// ============================================================================
// Initial State
// ============================================================================

const initialState: TrackersState = {
  // Portfolio data
  trackers: [],
  portfolioSummary: null,

  // Selected tracker details
  selectedTracker: null,
  selectedTrackerId: null,

  // Partition details
  selectedPartition: null,

  // Loading states
  isLoadingTrackers: false,
  isLoadingTrackerDetails: false,
  isLoadingPartition: false,
  isCreatingTracker: false,
  isUpdatingTracker: false,
  isExecutingTrade: false,
  isDeletingTracker: false,

  // Error states
  error: null,
  trackerDetailsError: null,
  partitionError: null,

  // Success messages
  successMessage: null,

  // Stock prices cache
  stockPrices: {},
  isLoadingStockPrice: false,
  stockPriceError: null,
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Fetches all trackers for the user's portfolio
 */
export const fetchAllTrackers = createAsyncThunk(
  'trackers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await trackerApi.getAllTrackers();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trackers');
    }
  }
);

/**
 * Fetches detailed information for a specific tracker
 */
export const fetchTrackerDetails = createAsyncThunk(
  'trackers/fetchDetails',
  async (trackerId: number, { rejectWithValue }) => {
    try {
      const response = await trackerApi.getTrackerDetails(trackerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tracker details');
    }
  }
);

/**
 * Creates a new tracker
 */
export const createTracker = createAsyncThunk(
  'trackers/create',
  async (data: CreateTrackerRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await trackerApi.createTracker(data);
      // Refresh the portfolio after creating
      dispatch(fetchAllTrackers());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create tracker');
    }
  }
);

/**
 * Updates an existing tracker
 */
export const updateTracker = createAsyncThunk(
  'trackers/update',
  async (
    { trackerId, data }: { trackerId: number; data: UpdateTrackerRequest },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await trackerApi.updateTracker(trackerId, data);
      // Refresh the portfolio after updating
      dispatch(fetchAllTrackers());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update tracker');
    }
  }
);

/**
 * Executes a trade for a tracker
 */
export const executeTrade = createAsyncThunk(
  'trackers/executeTrade',
  async (
    { trackerId, data }: { trackerId: number; data: ExecuteTradeRequest },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await trackerApi.executeTrade(trackerId, data);
      // Refresh tracker details after execution
      dispatch(fetchTrackerDetails(trackerId));
      dispatch(fetchAllTrackers());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to execute trade');
    }
  }
);

/**
 * Fetches partition details
 */
export const fetchPartitionDetails = createAsyncThunk(
  'trackers/fetchPartition',
  async (
    { trackerId, partitionIndex }: { trackerId: number; partitionIndex: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await trackerApi.getPartitionDetails(trackerId, partitionIndex);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch partition details');
    }
  }
);

/**
 * Deletes a tracker
 */
export const deleteTracker = createAsyncThunk(
  'trackers/delete',
  async (trackerId: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await trackerApi.deleteTracker(trackerId);
      // Refresh the portfolio after deleting
      dispatch(fetchAllTrackers());
      return { trackerId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete tracker');
    }
  }
);

/**
 * Fetches stock closing price
 */
export const fetchStockPrice = createAsyncThunk(
  'trackers/fetchStockPrice',
  async (params: GetStockPriceRequest, { rejectWithValue }) => {
    try {
      const response = await trackerApi.getStockClosingPrice(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch stock price');
    }
  }
);

// ============================================================================
// Slice Definition
// ============================================================================

const trackersSlice = createSlice({
  name: 'trackers',
  initialState,
  reducers: {
    // Set selected tracker ID
    setSelectedTracker: (state, action: PayloadAction<number | null>) => {
      state.selectedTrackerId = action.payload;
    },

    // Clear selected tracker details
    clearSelectedTracker: (state) => {
      state.selectedTracker = null;
      state.selectedTrackerId = null;
      state.trackerDetailsError = null;
    },

    // Clear selected partition
    clearSelectedPartition: (state) => {
      state.selectedPartition = null;
      state.partitionError = null;
    },

    // Clear error messages
    clearError: (state) => {
      state.error = null;
      state.trackerDetailsError = null;
      state.partitionError = null;
      state.stockPriceError = null;
    },

    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Set success message manually
    setSuccessMessage: (state, action: PayloadAction<string>) => {
      state.successMessage = action.payload;
    },

    // Clear stock price for a symbol
    clearStockPrice: (state, action: PayloadAction<string>) => {
      delete state.stockPrices[action.payload];
    },

    // Reset entire state
    resetTrackersState: () => initialState,
  },
  extraReducers: (builder) => {
    // ========================================================================
    // Fetch All Trackers
    // ========================================================================
    builder.addCase(fetchAllTrackers.pending, (state) => {
      state.isLoadingTrackers = true;
      state.error = null;
    });
    builder.addCase(fetchAllTrackers.fulfilled, (state, action) => {
      state.isLoadingTrackers = false;
      state.trackers = action.payload.trackers;
      state.portfolioSummary = action.payload.summary;
      state.error = null;
    });
    builder.addCase(fetchAllTrackers.rejected, (state, action) => {
      state.isLoadingTrackers = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Fetch Tracker Details
    // ========================================================================
    builder.addCase(fetchTrackerDetails.pending, (state) => {
      state.isLoadingTrackerDetails = true;
      state.trackerDetailsError = null;
    });
    builder.addCase(fetchTrackerDetails.fulfilled, (state, action) => {
      state.isLoadingTrackerDetails = false;
      state.selectedTracker = action.payload;
      state.selectedTrackerId = action.payload.tracker.trackerId;
      state.trackerDetailsError = null;
    });
    builder.addCase(fetchTrackerDetails.rejected, (state, action) => {
      state.isLoadingTrackerDetails = false;
      state.trackerDetailsError = action.payload as string;
    });

    // ========================================================================
    // Create Tracker
    // ========================================================================
    builder.addCase(createTracker.pending, (state) => {
      state.isCreatingTracker = true;
      state.error = null;
    });
    builder.addCase(createTracker.fulfilled, (state, _) => {
      state.isCreatingTracker = false;
      state.successMessage = 'Tracker created successfully';
      state.error = null;
    });
    builder.addCase(createTracker.rejected, (state, action) => {
      state.isCreatingTracker = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Update Tracker
    // ========================================================================
    builder.addCase(updateTracker.pending, (state) => {
      state.isUpdatingTracker = true;
      state.error = null;
    });
    builder.addCase(updateTracker.fulfilled, (state, action) => {
      state.isUpdatingTracker = false;
      state.selectedTracker = action.payload;
      state.successMessage = 'Tracker updated successfully';
      state.error = null;
    });
    builder.addCase(updateTracker.rejected, (state, action) => {
      state.isUpdatingTracker = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Execute Trade
    // ========================================================================
    builder.addCase(executeTrade.pending, (state) => {
      state.isExecutingTrade = true;
      state.error = null;
    });
    builder.addCase(executeTrade.fulfilled, (state, action) => {
      state.isExecutingTrade = false;
      state.successMessage = action.payload.message || 'Trade executed successfully';
      state.error = null;
    });
    builder.addCase(executeTrade.rejected, (state, action) => {
      state.isExecutingTrade = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Fetch Partition Details
    // ========================================================================
    builder.addCase(fetchPartitionDetails.pending, (state) => {
      state.isLoadingPartition = true;
      state.partitionError = null;
    });
    builder.addCase(fetchPartitionDetails.fulfilled, (state, action) => {
      state.isLoadingPartition = false;
      state.selectedPartition = action.payload;
      state.partitionError = null;
    });
    builder.addCase(fetchPartitionDetails.rejected, (state, action) => {
      state.isLoadingPartition = false;
      state.partitionError = action.payload as string;
    });

    // ========================================================================
    // Delete Tracker
    // ========================================================================
    builder.addCase(deleteTracker.pending, (state) => {
      state.isDeletingTracker = true;
      state.error = null;
    });
    builder.addCase(deleteTracker.fulfilled, (state, action) => {
      state.isDeletingTracker = false;
      state.successMessage = 'Tracker deleted successfully';
      // Clear selected tracker if it was deleted
      if (state.selectedTrackerId === action.payload.trackerId) {
        state.selectedTracker = null;
        state.selectedTrackerId = null;
      }
      state.error = null;
    });
    builder.addCase(deleteTracker.rejected, (state, action) => {
      state.isDeletingTracker = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Fetch Stock Price
    // ========================================================================
    builder.addCase(fetchStockPrice.pending, (state) => {
      state.isLoadingStockPrice = true;
      state.stockPriceError = null;
    });
    builder.addCase(fetchStockPrice.fulfilled, (state, action) => {
      state.isLoadingStockPrice = false;
      // Cache the stock price by symbol
      state.stockPrices[action.payload.symbol] = action.payload;
      state.stockPriceError = null;
    });
    builder.addCase(fetchStockPrice.rejected, (state, action) => {
      state.isLoadingStockPrice = false;
      state.stockPriceError = action.payload as string;
    });
  },
});

// ============================================================================
// Exports
// ============================================================================

export const {
  setSelectedTracker,
  clearSelectedTracker,
  clearSelectedPartition,
  clearError,
  clearSuccessMessage,
  setSuccessMessage,
  clearStockPrice,
  resetTrackersState,
} = trackersSlice.actions;

export default trackersSlice.reducer;
