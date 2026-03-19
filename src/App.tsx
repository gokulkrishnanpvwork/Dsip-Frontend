import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setStocks } from './store/slices/stocksSlice';
import { hideCelebrationModal } from './store/slices/uiSlice';
import { fetchAllTrackers } from './store/slices/trackersSlice';
import { Stock } from './types';

import LandingPage from './components/LandingPage';
import MainLayout from './components/MainLayout';
import { ThemeProvider } from './components/theme-provider';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";
import { AppRoutes } from './components/Router';

// Shows landing page for unauthenticated users, redirects to /dashboard if authenticated
export const LandingGuard: React.FC = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <LandingPage />;
};

// Protected app shell — auth guard, data loading, layout wrapper
export const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { trackers } = useAppSelector(state => state.trackers);
  const { showCelebration } = useAppSelector(state => state.ui);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAllTrackers());
    }
  }, [isAuthenticated, dispatch]);

  // Map trackers from API to Stock format for UI components
  useEffect(() => {
    const mappedStocks: Stock[] = trackers.map(tracker => ({
      id: tracker.trackerId.toString(),
      symbol: tracker.stockSymbol,
      name: tracker.stockName,
      convictionYears: 5,
      partitionMonths: 1,
      loadFactor: 'Aggressive' as any,
      totalBudget: tracker.totalCapitalPlanned,
      deployedAmount: tracker.totalCapitalInvestedSoFar,
      currentAverage: tracker.sharesHeldSoFar > 0 ? tracker.totalCapitalInvestedSoFar / tracker.sharesHeldSoFar : 0,
      currentPrice: tracker.currentPrice,
      isPaused: tracker.status === 3,
      history: [],
      quantityOwned: tracker.sharesHeldSoFar,
      averagePriceOwned: tracker.sharesHeldSoFar > 0 ? tracker.totalCapitalInvestedSoFar / tracker.sharesHeldSoFar : 0,
      convictionLevel: 75,
      priceMovementPct: 0,
      net_profit_percentage: tracker.net_profit_percentage,
      dsip_net_profit_percentage: tracker.dsip_net_profit_percentage,
    }));
    dispatch(setStocks(mappedStocks));
  }, [trackers, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>

      {/* First DSIP Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={(open) => !open && dispatch(hideCelebrationModal())}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center animate-bounce">
              <span className="text-3xl">🎉</span>
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Congratulations!</DialogTitle>
            <DialogDescription className="text-center pt-2 text-lg">
              You've successfully created your first <span className="font-bold text-primary">DSIP Stock Engine</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-muted-foreground text-sm">
            Your journey to disciplined, emotion-free investing starts now.
          </div>
          <DialogFooter className="sm:justify-center">
            <Button size="lg" onClick={() => dispatch(hideCelebrationModal())} className="w-full sm:w-auto min-w-[150px]">
              Let's Go!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans">
            <AppRoutes />
            <Toaster />
          </div>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
