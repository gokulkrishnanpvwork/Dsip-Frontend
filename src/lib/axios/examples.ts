/**
 * Usage Examples for Axios API Wrapper
 *
 * This file contains practical examples of how to use the API wrapper
 * in different scenarios common to React applications
 */

import { apiRequest, apiRequestPromise, setAuthenticationFailureHandler } from './index';
import type { ApiResponse, CancelTokenSource } from 'axios';

// ============================================
// 1. BASIC EXAMPLES
// ============================================

/**
 * Example 1: Simple GET request with callback
 */
export function exampleGet() {
  apiRequest(
    '/api/stocks/AAPL',
    null,
    { method: 'GET' },
    (response) => {
      if (response.status === 'success') {
        console.log('Stock data:', response.data);
      } else {
        console.error('Failed to fetch stock:', response.message);
      }
    }
  );
}

/**
 * Example 2: POST request with JSON data
 */
export function examplePost() {
  apiRequest(
    '/api/stocks',
    {
      symbol: 'AAPL',
      quantity: 100,
      price: 150.25
    },
    {
      method: 'POST',
      isJSON: true
    },
    (response) => {
      if (response.status === 'success') {
        console.log('Stock added:', response.data);
      } else {
        console.error('Failed to add stock:', response.message);
      }
    }
  );
}

/**
 * Example 3: Using Promise-based API
 */
export async function examplePromise() {
  try {
    const response = await apiRequestPromise(
      '/api/stocks',
      null,
      { method: 'GET' }
    );

    if (response.status === 'success') {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
}

// ============================================
// 2. REACT COMPONENT EXAMPLES
// ============================================

/**
 * Example 4: Fetch data in useEffect
 */
/*
import { useEffect, useState } from 'react';

export function StockList() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest(
      '/api/stocks',
      null,
      { method: 'GET' },
      (response) => {
        setLoading(false);
        if (response.status === 'success') {
          setStocks(response.data);
        } else {
          setError(response.message);
        }
      }
    );
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {stocks.map(stock => (
        <li key={stock.id}>{stock.symbol}: ${stock.price}</li>
      ))}
    </ul>
  );
}
*/

/**
 * Example 5: Form submission with async/await
 */
/*
import { useState } from 'react';

export function AddStockForm() {
  const [formData, setFormData] = useState({ symbol: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiRequestPromise(
        '/api/stocks',
        formData,
        { method: 'POST', isJSON: true }
      );

      if (response.status === 'success') {
        alert('Stock added successfully!');
        setFormData({ symbol: '', quantity: '' });
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.symbol}
        onChange={e => setFormData({...formData, symbol: e.target.value})}
        placeholder="Stock Symbol"
      />
      <input
        value={formData.quantity}
        onChange={e => setFormData({...formData, quantity: e.target.value})}
        placeholder="Quantity"
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add Stock'}
      </button>
    </form>
  );
}
*/

// ============================================
// 3. CUSTOM HOOKS
// ============================================

/**
 * Example 6: Custom hook for fetching data
 */
/*
import { useState, useEffect } from 'react';

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiRequestPromise<T>(
          url,
          null,
          { method: 'GET' }
        );

        if (!cancelled) {
          if (response.status === 'success') {
            setData(response.data);
            setError(null);
          } else {
            setError(response.message || 'Failed to fetch data');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('An unexpected error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// Usage:
// const { data: stocks, loading, error } = useFetch<Stock[]>('/api/stocks');
*/

/**
 * Example 7: Custom hook with mutation
 */
/*
import { useState } from 'react';

export function useMutation<TData = any, TVariables = any>(
  url: string,
  options?: { method?: string }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = async (variables: TVariables) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequestPromise<TData>(
        url,
        variables,
        {
          method: options?.method || 'POST',
          isJSON: true
        }
      );

      if (response.status === 'success') {
        setData(response.data);
        return response.data;
      } else {
        const errorMsg = response.message || 'Mutation failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, data };
}

// Usage:
// const { mutate, loading } = useMutation('/api/stocks', { method: 'POST' });
// await mutate({ symbol: 'AAPL', quantity: 100 });
*/

// ============================================
// 4. ADVANCED FEATURES
// ============================================

/**
 * Example 8: Request cancellation
 */
export function exampleCancellation() {
  let cancelSource: CancelTokenSource;

  // Start request
  apiRequest(
    '/api/stocks/search',
    { query: 'AAPL' },
    { method: 'POST' },
    (response) => {
      console.log('Search results:', response);
    },
    (source) => {
      cancelSource = source; // Save cancel source
    }
  );

  // Cancel after 2 seconds
  setTimeout(() => {
    if (cancelSource) {
      cancelSource.cancel('Search timeout');
    }
  }, 2000);
}

/**
 * Example 9: File upload
 */
export function exampleFileUpload(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', 'Portfolio import');

  apiRequest(
    '/api/upload/portfolio',
    formData,
    {
      method: 'POST',
      isFormData: true,
      timeout: 30000 // 30 seconds for upload
    },
    (response) => {
      if (response.status === 'success') {
        console.log('File uploaded:', response.data);
      } else {
        console.error('Upload failed:', response.message);
      }
    }
  );
}

/**
 * Example 10: Custom headers and authentication
 */
export function exampleWithAuth(token: string) {
  apiRequest(
    '/api/protected/stocks',
    null,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Client-Version': '1.0.0'
      }
    },
    (response) => {
      if (response.status === 'success') {
        console.log('Protected data:', response.data);
      }
    }
  );
}

/**
 * Example 11: Debounced search
 */
/*
import { useState, useEffect, useCallback } from 'react';

export function SearchStocks() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      apiRequest(
        '/api/stocks/search',
        { query: searchQuery },
        { method: 'POST', isJSON: true },
        (response) => {
          setLoading(false);
          if (response.status === 'success') {
            setResults(response.data);
          }
        }
      );
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stocks..."
      />
      {loading && <div>Searching...</div>}
      <ul>
        {results.map((stock: any) => (
          <li key={stock.id}>{stock.symbol}: {stock.name}</li>
        ))}
      </ul>
    </div>
  );
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
*/

/**
 * Example 12: Polling for updates
 */
/*
import { useState, useEffect, useRef } from 'react';

export function StockPriceMonitor({ symbol }: { symbol: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchPrice = async () => {
      const response = await apiRequestPromise(
        `/api/stocks/${symbol}/price`,
        null,
        { method: 'GET', disableLogs: true }
      );

      if (response.status === 'success') {
        setPrice(response.data.price);
      }
    };

    fetchPrice(); // Initial fetch
    intervalRef.current = setInterval(fetchPrice, 5000); // Poll every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol]);

  return (
    <div>
      {symbol}: ${price?.toFixed(2) || '---'}
    </div>
  );
}
*/

// ============================================
// 5. SETUP & CONFIGURATION
// ============================================

/**
 * Example 13: App initialization
 * Call this in your root component or main.tsx
 */
export function initializeApp() {
  // Set authentication failure handler
  setAuthenticationFailureHandler(() => {
    console.log('Authentication failed, redirecting to login...');
    // Clear any stored auth tokens
    localStorage.removeItem('auth_token');
    // Redirect to login page
    window.location.href = '/login';
  });
}

// ============================================
// 6. TYPE-SAFE API CLIENT
// ============================================

/**
 * Example 14: Create a typed API client
 */
/*
interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
}

interface CreateStockRequest {
  symbol: string;
  quantity: number;
  price: number;
}

export const stockApi = {
  getAll: async (): Promise<Stock[]> => {
    const response = await apiRequestPromise<Stock[]>(
      '/api/stocks',
      null,
      { method: 'GET' }
    );
    if (response.status === 'success') {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch stocks');
  },

  getById: async (id: string): Promise<Stock> => {
    const response = await apiRequestPromise<Stock>(
      `/api/stocks/${id}`,
      null,
      { method: 'GET' }
    );
    if (response.status === 'success') {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch stock');
  },

  create: async (data: CreateStockRequest): Promise<Stock> => {
    const response = await apiRequestPromise<Stock>(
      '/api/stocks',
      data,
      { method: 'POST', isJSON: true }
    );
    if (response.status === 'success') {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create stock');
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiRequestPromise(
      `/api/stocks/${id}`,
      null,
      { method: 'DELETE' }
    );
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete stock');
    }
  }
};

// Usage:
// const stocks = await stockApi.getAll();
// const stock = await stockApi.getById('123');
// await stockApi.create({ symbol: 'AAPL', quantity: 100, price: 150 });
// await stockApi.delete('123');
*/
