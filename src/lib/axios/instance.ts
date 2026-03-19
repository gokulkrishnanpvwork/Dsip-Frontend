/**
 * Axios Instance Configuration
 *
 * Creates a configured axios instance with request/response interceptors
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Extend Axios request config to include timing properties
interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
  requestStartTime?: number;
  requestEndTime?: number;
  timeDuration?: number;
}

interface TimedAxiosError extends AxiosError {
  config: TimedAxiosRequestConfig;
}

// Create axios instance with default configuration
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds default timeout
  withCredentials: true, // Include cookies in requests
});

/**
 * Request Interceptor
 * Tracks request start time for latency monitoring
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): TimedAxiosRequestConfig => {
    const timedConfig = config as TimedAxiosRequestConfig;
    timedConfig.requestStartTime = new Date().getTime();
    return timedConfig;
  },
  (error: AxiosError) => {
    const timedError = error as TimedAxiosError;
    if (timedError.config) {
      timedError.config.timeDuration = 0;
    }
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Calculates request duration and handles common error scenarios
 */
axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config as TimedAxiosRequestConfig;
    if (config.requestStartTime) {
      config.requestEndTime = new Date().getTime();
      config.timeDuration = config.requestEndTime - config.requestStartTime;
    }
    return response;
  },
  (error: AxiosError) => {
    const timedError = error as TimedAxiosError;
    if (timedError.config?.requestStartTime) {
      timedError.config.requestEndTime = new Date().getTime();
      timedError.config.timeDuration =
        timedError.config.requestEndTime - timedError.config.requestStartTime;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export type { TimedAxiosRequestConfig, TimedAxiosError };
