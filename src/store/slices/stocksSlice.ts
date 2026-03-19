import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Stock } from '../../types';

interface StocksState {
  stocks: Stock[];
  selectedStockId: string | null;
  tempStrategyConfig: Partial<Stock> | undefined;
  showDsipOnly: boolean;
}

const initialState: StocksState = {
  stocks: [],
  selectedStockId: null,
  tempStrategyConfig: undefined,
  showDsipOnly: false,
};

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    // Add a new stock
    addStock: (state, action: PayloadAction<Stock>) => {
      state.stocks.push(action.payload);
      state.selectedStockId = action.payload.id;
      state.tempStrategyConfig = undefined;
    },

    // Update an existing stock
    updateStock: (state, action: PayloadAction<Stock>) => {
      const index = state.stocks.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.stocks[index] = action.payload;
      }
    },

    // Delete a stock
    deleteStock: (state, action: PayloadAction<string>) => {
      state.stocks = state.stocks.filter(s => s.id !== action.payload);
      if (state.selectedStockId === action.payload) {
        state.selectedStockId = null;
      }
    },

    // Set selected stock
    setSelectedStock: (state, action: PayloadAction<string | null>) => {
      state.selectedStockId = action.payload;
    },

    // Set temporary strategy config for copying
    setTempStrategyConfig: (state, action: PayloadAction<Partial<Stock> | undefined>) => {
      state.tempStrategyConfig = action.payload;
    },

    // Toggle DSIP only view
    setShowDsipOnly: (state, action: PayloadAction<boolean>) => {
      state.showDsipOnly = action.payload;
    },

    // Set stocks from API data (replaces loadStocks)
    setStocks: (state, action: PayloadAction<Stock[]>) => {
      state.stocks = action.payload;
    },

    // Clear all stocks
    clearStocks: (state) => {
      state.stocks = [];
      state.selectedStockId = null;
      state.tempStrategyConfig = undefined;
    },
  },
});

export const {
  addStock,
  updateStock,
  deleteStock,
  setSelectedStock,
  setTempStrategyConfig,
  setShowDsipOnly,
  setStocks,
  clearStocks,
} = stocksSlice.actions;

export default stocksSlice.reducer;
