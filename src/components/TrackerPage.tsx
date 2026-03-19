import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedStock, setTempStrategyConfig, updateStock } from "@/store/slices/stocksSlice";
import { fetchTrackerDetails } from "@/store/slices/trackersSlice";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StockDetails from "./StockDetails";

export const TrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { stocks } = useAppSelector(state => state.stocks);

  useEffect(() => {
    if (id) {
      dispatch(setSelectedStock(id));
      const trackerId = parseInt(id);
      if (!isNaN(trackerId)) {
        dispatch(fetchTrackerDetails(trackerId));
      }
    }
  }, [id, dispatch]);

  const selectedStock = stocks.find(s => s.id === id);
  const stockToUse = selectedStock || {
    id: id || '',
    symbol: 'Loading...',
    name: 'Loading...',
    convictionYears: 5,
    partitionMonths: 1,
    loadFactor: 'Aggressive' as any,
    totalBudget: 0,
    deployedAmount: 0,
    currentAverage: 0,
    currentPrice: 0,
    isPaused: false,
    history: [],
    quantityOwned: 0,
    averagePriceOwned: 0,
    convictionLevel: 75,
    priceMovementPct: 0,
  };

  return (
    <StockDetails
      stock={stockToUse}
      onBack={() => navigate('/home')}
      onUpdate={(s) => dispatch(updateStock(s))}
      onCopyStrategy={(config) => {
        dispatch(setTempStrategyConfig(config));
        navigate('/create-tracker');
      }}
    />
  );
};
