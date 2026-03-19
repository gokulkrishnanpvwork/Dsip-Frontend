/**
 * API Wrapper
 *
 * Simplified wrapper around axios inspired by fetchController pattern
 * Handles common API request/response patterns with callbacks
 */

import axios, { AxiosError, CancelTokenSource } from 'axios';
import axiosInstance from './instance';
import type {
  ApiResponse,
  ApiErrorResponse,
  ApiCallback,
  ApiRequestOptions,
} from './types';
import type { TimedAxiosRequestConfig } from './instance';

// Get base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Threshold for slow API warnings (milliseconds)
const LATENCY_THRESHOLD = 5000;

/**
 * Callback to handle authentication failures
 * Can be set by the app to trigger logout flow
 */
let onAuthenticationFailure: (() => void) | null = null;

export function setAuthenticationFailureHandler(callback: () => void) {
  onAuthenticationFailure = callback;
}

/**
 * Build request headers based on options
 */
function getHeaders(options: ApiRequestOptions): Record<string, string> {
  let contentType = 'application/x-www-form-urlencoded';

  if (options.isJSON) {
    contentType = 'application/json';
  } else if (options.isFormData) {
    contentType = 'multipart/form-data';
  }

  return {
    'Content-Type': contentType,
    ...options.headers,
  };
}

/**
 * Process response and normalize the structure
 */
function processResponse<T>(
  response: any,
  url: string,
  options: ApiRequestOptions
): ApiResponse<T> | ApiErrorResponse {
  const config = response.config as TimedAxiosRequestConfig;
  const duration = config.timeDuration || 0;

  // Log slow API calls
  if (duration > LATENCY_THRESHOLD && !options.disableLogs) {
    console.warn(`[API Latency] ${url} took ${duration}ms`);
  }

  // Optional response logging
  if (options.logResponse) {
    console.log('[API Response]', url, response);
  }

  const resData = response.data;

  // Handle string responses
  if (typeof resData === 'string') {
    const isSuccess = resData.toLowerCase().includes('success');
    if (isSuccess) {
      // Cast string to T - caller should expect string type when API returns strings
      return {
        status: 'success',
        data: resData.replace(/success/i, '').trim() as unknown as T,
      } as ApiResponse<T>;
    } else {
      // Return as error response which accepts any data type
      return {
        status: 'error',
        data: resData,
        message: resData,
      } as ApiErrorResponse;
    }
  }

  // Handle object/array responses
  if (resData && typeof resData === 'object') {
    const normalizedStatus = resData.status?.toString().toLowerCase();

    switch (normalizedStatus) {
      case 'success':
        return {
          status: 'success',
          data: resData,
        };

      case 'failure':
      case 'error':
        return {
          status: 'error',
          data: resData,
          message: resData.message || 'Request failed',
        };

      case 'authentication_failure':
        return {
          status: 'authentication_failure',
          data: resData,
          message: resData.message || 'Authentication failed',
        };

      default:
        // No explicit status, assume success if we got a 2xx response
        return {
          status: 'success',
          data: resData,
        };
    }
  }

  // Fallback for unexpected response types
  return {
    status: 'success',
    data: resData,
  };
}

/**
 * Process error and create normalized error response
 */
function processError(
  error: AxiosError,
  url: string,
  options: ApiRequestOptions
): ApiErrorResponse {
  const config = error.config as TimedAxiosRequestConfig | undefined;
  const duration = config?.timeDuration || 0;

  // Handle cancelled requests
  if (axios.isCancel(error)) {
    console.log('[API Cancelled]', url, error.message);
    return {
      status: 'error',
      data: 'request_cancelled',
      message: 'Request was cancelled',
    };
  }

  // Handle authentication failures
  if (
    error.response?.status === 401 ||
    (error.response?.data as any)?.status === 'authentication_failure'
  ) {
    if (!options.disableLogs) {
      console.warn('[API Auth Failed]', url);
    }

    if (!options.skipLogoutAlert && onAuthenticationFailure) {
      onAuthenticationFailure();
    }

    return {
      status: 'error',
      data: error.response?.data || error,
      message: 'Authentication failed',
    };
  }

  // Handle timeout errors
  if (
    error.code === 'ETIMEDOUT' ||
    (error.code === 'ECONNABORTED' && error.message.includes('timeout'))
  ) {
    if (!options.disableLogs) {
      console.error('[API Timeout]', url, `${duration}ms`);
    }
    return {
      status: 'failed',
      data: 'timeout_exceeded',
      message: 'Request timeout exceeded',
    };
  }

  // Handle network errors
  if (error.message === 'Network Error') {
    if (!options.disableLogs) {
      console.error('[API Network Error]', url);
    }
    return {
      status: 'failed',
      data: 'network_error',
      message: 'Network connection failed',
    };
  }

  // Generic error logging
  if (!options.disableLogs) {
    console.error('[API Error]', url, error);
  }

  return {
    status: 'error',
    data: error.response?.data || error.message,
    message: error.message || 'Request failed',
  };
}

/**
 * Main API wrapper function
 *
 * @param url - API endpoint URL (relative or absolute)
 * @param data - Request payload
 * @param options - Request options (method, headers, etc.)
 * @param callback - Callback function to handle response
 * @param getCancelSource - Optional function to receive cancel token source
 *
 * @example
 * ```ts
 * apiRequest(
 *   '/api/users',
 *   { name: 'John' },
 *   { method: 'POST', isJSON: true },
 *   (response) => {
 *     if (response.status === 'success') {
 *       console.log('User created:', response.data);
 *     } else {
 *       console.error('Failed:', response.message);
 *     }
 *   }
 * );
 * ```
 */
export function apiRequest<T = any>(
  url: string,
  data?: any,
  options: ApiRequestOptions = {},
  callback?: ApiCallback<T>,
  getCancelSource?: (source: CancelTokenSource) => void
): void {
  // Create cancel token source for request cancellation
  const { CancelToken } = axios;
  const cancelSource = CancelToken.source();

  // Provide cancel source to caller if requested
  if (getCancelSource) {
    getCancelSource(cancelSource);
  }

  // Build full URL (handle both relative and absolute URLs)
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Determine request method
  const method = options.method || 'POST';
  const isGet = method.toLowerCase() === 'get';

  // Configure request data/params based on method and options
  let requestData: any;
  let requestParams: any;

  if (options.isJSON || options.isFormData) {
    requestData = data;
  } else if (isGet) {
    requestParams = data;
  } else {
    // Convert to URLSearchParams for form-urlencoded
    requestData = new URLSearchParams(data).toString();
  }

  // Build axios request config
  const requestConfig = {
    method,
    url: fullUrl,
    data: requestData,
    params: requestParams,
    headers: getHeaders(options),
    timeout: options.timeout,
    cancelToken: cancelSource.token,
  };

  // Log request if needed
  if (!options.disableLogs) {
    console.log('[API Request]', method, fullUrl, options.requestId || '');
  }

  // Execute request
  axiosInstance(requestConfig)
    .then((response) => {
      const processedResponse = processResponse<T>(response, fullUrl, options);
      callback?.(processedResponse);
    })
    .catch((error: AxiosError) => {
      const processedError = processError(error, fullUrl, options);
      callback?.(processedError);
    });
}

/**
 * Promise-based API wrapper (alternative to callback style)
 *
 * @example
 * ```ts
 * try {
 *   const response = await apiRequestPromise('/api/users', { name: 'John' }, { method: 'POST', isJSON: true });
 *   if (response.status === 'success') {
 *     console.log('User created:', response.data);
 *   }
 * } catch (error) {
 *   console.error('Request failed:', error);
 * }
 * ```
 */
export function apiRequestPromise<T = any>(
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T> | ApiErrorResponse> {
  return new Promise((resolve) => {
    apiRequest<T>(url, data, options, (response) => {
      resolve(response);
    });
  });
}

// Export the axios instance for advanced use cases
export { axiosInstance };
