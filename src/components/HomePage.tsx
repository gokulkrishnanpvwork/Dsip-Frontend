import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import { setSelectedStock, setTempStrategyConfig } from "@/store/slices/stocksSlice";
import { fetchTrackerDetails } from "@/store/slices/trackersSlice";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { stocks } = useAppSelector(state => state.stocks);

  return (
    <Dashboard
      stocks={stocks}
      onAddStock={() => {
        dispatch(setTempStrategyConfig(undefined));
        navigate('/create-tracker');
      }}
      onSelectStock={(id) => {
        dispatch(setSelectedStock(id));
        const trackerId = parseInt(id);
        if (!isNaN(trackerId)) {
          dispatch(fetchTrackerDetails(trackerId));
        }
        navigate(`/tracker/${id}`);
      }}
    />
  );
};
