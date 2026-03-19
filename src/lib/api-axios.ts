/**
 * API Utility with Axios Wrapper
 *
 * Enhanced version of api.ts using the axios wrapper
 * Maintains backward compatibility while adding new features
 */

import { apiRequestPromise, setAuthenticationFailureHandler } from './axios';
import type { ApiRequestOptions } from './axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let onUnauthorized: (() => void) | null = null;

/**
 * Set callback for unauthorized access
 */
export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
  // Also set it on the axios wrapper
  setAuthenticationFailureHandler(callback);
}

/**
 * Fetch API with axios wrapper (maintains fetch-like interface)
 *
 * @param path - API endpoint path
 * @param options - Fetch-like request options
 * @returns Promise with typed response data
 *
 * @example
 * ```ts
 * const user = await api<User>('/api/users/123');
 * ```
 */
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method as ApiRequestOptions['method']) || 'GET';
  const isGet = method === 'GET';

  let requestData: any = null;

  // Parse body if present
  if (options?.body) {
    try {
      requestData = typeof options.body === 'string'
        ? JSON.parse(options.body)
        : options.body;
    } catch {
      requestData = options.body;
    }
  }

  // Extract headers as a typed object for safe access
  const headers = options?.headers as Record<string, string> | undefined;
  
  const response = await apiRequestPromise<T>(
    path,
    requestData,
    {
      method,
      isJSON: !isGet && headers?.['Content-Type'] !== 'application/x-www-form-urlencoded',
      headers,
    }
  );

  if (response.status === 'success') {
    return response.data;
  } else if (response.status === 'authentication_failure') {
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(401, response.message || 'Authentication failed');
  } else {
    const errorMessage = response.message || 'Request failed';
    const statusCode = getStatusCodeFromError(response.data);
    throw new ApiError(statusCode, errorMessage);
  }
}

/**
 * Helper to extract status code from error response
 */
function getStatusCodeFromError(data: any): number {
  if (data === 'timeout_exceeded') return 408;
  if (data === 'network_error') return 503;
  if (data === 'request_cancelled') return 499;
  return 500;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(public status: number, public statusText: string) {
    super(`${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export { API_BASE_URL };
