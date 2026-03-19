/**
 * Development Configuration
 *
 * Toggle these flags for local development convenience
 */

export const DEV_CONFIG = {
  /**
   * Set to true to bypass authentication and work on UI without backend
   * WARNING: Only use in development! Never commit as true.
   */
  BYPASS_AUTH: false,

  /**
   * Mock user data when BYPASS_AUTH is enabled
   */
  MOCK_USER: {
    id: 'dev-user-123',
    email: 'dev@example.com',
    name: 'Dev User',
    profilePicture: null,
  },

  /**
   * Set to true to bypass stock API calls when creating DSIP trackers
   * Returns mock stock data instead of calling /api/stocks/close
   */
  BYPASS_STOCK_API: false,

  /**
   * Mock stock data when BYPASS_STOCK_API is enabled
   * You can customize this data for different stocks
   */
  MOCK_STOCK_DATA: {
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    date: new Date().toISOString().split('T')[0],
    closePrice: 178.50,
    source: 'Mock Data (Dev Mode)',
    company: {
      name: 'Apple Inc.',
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      industry: 'Technology',
      country: 'United States',
    },
  },
};
