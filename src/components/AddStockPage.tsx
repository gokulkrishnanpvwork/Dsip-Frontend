import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTracker, fetchAllTrackers } from "@/store/slices/trackersSlice";
import { showCelebrationModal } from "@/store/slices/uiSlice";
import { LoadFactor, Stock } from "@/types";
import { useNavigate } from "react-router-dom";
import AddStock from "./AddStock";
import { CreateTrackerRequest } from "@/types/tracker.types";

export const AddStockPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { stocks, tempStrategyConfig } = useAppSelector(state => state.stocks);

  const handleAddStock = async (newStock: Stock) => {
    const deploymentStyleMap: Record<LoadFactor, string> = {
      [LoadFactor.GRADUAL]: 'GRADUAL',
      [LoadFactor.MODERATE]: 'MODERATE',
      [LoadFactor.AGGRESSIVE]: 'AGGRESSIVE',
    };

    try {
      const requestPayload: CreateTrackerRequest = {
        stock_symbol: newStock.symbol,
        conviction_period_years: newStock.convictionYears,
        total_capital_planned: newStock.totalBudget,
        partition_months: newStock.partitionMonths,
        deployment_style: deploymentStyleMap[newStock.loadFactor],
        base_conviction_score: newStock.convictionLevel,
        initial_invested_amount: newStock.averagePriceOwned,
        initial_shares_held: newStock.quantityOwned,
        is_fractional_shares_allowed: true,
      };

      await dispatch(createTracker(requestPayload)).unwrap();

      if (stocks.length === 0) {
        dispatch(showCelebrationModal());
      }

      dispatch(fetchAllTrackers());
      navigate('/home');
    } catch (error: any) {
      console.error('[App] Failed to create tracker:', error);
      alert(`Failed to create tracker: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <AddStock
      onBack={() => navigate('/home')}
      onAdd={handleAddStock}
      initialValues={tempStrategyConfig}
    />
  );
};
