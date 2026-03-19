import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  showCelebration: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UIState = {
  showCelebration: false,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showCelebrationModal: (state) => {
      state.showCelebration = true;
    },

    hideCelebrationModal: (state) => {
      state.showCelebration = false;
    },

    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const {
  showCelebrationModal,
  hideCelebrationModal,
  toggleSidebar,
  setSidebarCollapsed,
} = uiSlice.actions;

export default uiSlice.reducer;
