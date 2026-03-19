/**
 * API Response Structure Types
 */

export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'failure' | 'authentication_failure';
  data: T;
  message?: string;
}

export interface ApiRequestOptions {
  /**
   * Send data as JSON instead of form-urlencoded
   */
  isJSON?: boolean;

  /**
   * Send data as multipart/form-data
   */
  isFormData?: boolean;

  /**
   * Custom headers to include in the request
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * HTTP method (GET, POST, PUT, DELETE, etc.)
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  /**
   * Log response to console
   */
  logResponse?: boolean;

  /**
   * Skip logout alert on authentication failure
   */
  skipLogoutAlert?: boolean;

  /**
   * Disable logging for this request
   */
  disableLogs?: boolean;

  /**
   * Custom request identifier for tracking
   */
  requestId?: string;
}

export interface RequestConfig extends ApiRequestOptions {
  url: string;
  data?: any;
  params?: any;
}

export interface ApiErrorResponse {
  status: 'error' | 'failed';
  data: any;
  message?: string;
}

export type ApiCallback<T = any> = (response: ApiResponse<T> | ApiErrorResponse) => void;
