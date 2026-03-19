import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

// Example stock list
const stocks = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "NFLX", name: "Netflix Inc." },

  { symbol: "AMD", name: "Advanced Micro Devices" },

];

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

const StockSearch = ({ onSelect }: StockSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof stocks>([]);

  useEffect(() => {
    if (query.trim() === "") {
      // Hide suggestions when input is empty
      setResults([]);
      return;
    }

    const filtered = stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  }, [query]);

  return (
    <div className="relative">
      <Input
        placeholder="Type stock symbol..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-white text-black"
      />

      {results.length > 0 && (
        <div className="absolute w-full border rounded-lg bg-white shadow mt-1 z-10 max-h-60 overflow-auto">
          {results.map((stock) => (
            <div
              key={stock.symbol}
              className="p-2 cursor-pointer hover:bg-gray-100 text-black"
              onClick={() => {
                onSelect(stock.symbol);
                setQuery(`${stock.symbol} - ${stock.name}`);
                setResults([]); // hide dropdown after selection
              }}
            >
              <b>{stock.symbol}</b> - {stock.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;