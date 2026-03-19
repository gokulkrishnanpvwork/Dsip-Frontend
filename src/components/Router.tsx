import { setOnUnauthorized } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkAuth, clearAuth } from "@/store/slices/authSlice";
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import UnauthorizedAccess from "./UnauthorizedAccess";
import { AppShell, LandingGuard } from "@/App";
import { HomePage } from "./HomePage";
import { AddStockPage } from "./AddStockPage";
import { TrackerPage } from "./TrackerPage";
import NotFound from "./NotFound";
import Documentation from "./Documentation";
import ProtectedRoute from "./ProtectedRoute";
import SimulationPage from './Simulationpage';
import Simulation from './Simulation';
import MultipleSimulationPage from "./Multiplesimulation";
import Demo1 from "./Demo1";
import Demo2 from "./Demo2"
import { Import } from "lucide-react"
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    setOnUnauthorized(() => {
      dispatch(clearAuth());
    });
  }, [dispatch]);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/unauthorized" element={<UnauthorizedAccess />} />
      <Route path="/" element={<LandingGuard />} />
      <Route element={<AppShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-tracker" element={<AddStockPage />} />
        <Route path="/tracker/:id" element={<TrackerPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
              {/* Protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/simulationRun" element={<SimulationPage />} />
      <Route path="/simulation" element={<Simulation />} />
      <Route path="/Demo1" element={<Demo1 />} />
      <Route path="/Demo2" element={<Demo2/>} />
       <Route path="/simulation/multi" element={<MultipleSimulationPage/>} />

    </Route>
    </Routes>
  );
};
