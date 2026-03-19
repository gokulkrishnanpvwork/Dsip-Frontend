/**
 * Axios API Wrapper - Main Export
 *
 * Simplified wrapper around axios for React applications
 * Inspired by fetchController pattern with modern TypeScript support
 */

export { apiRequest, apiRequestPromise, axiosInstance, setAuthenticationFailureHandler } from './apiWrapper';
export type { ApiResponse, ApiErrorResponse, ApiCallback, ApiRequestOptions, RequestConfig } from './types';
export { default as axios } from './instance';
