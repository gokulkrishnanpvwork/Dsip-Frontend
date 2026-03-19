const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // response wasn't JSON, use statusText
    }

    if (response.status === 401 || response.status === 403) {
      // Redirect to unauthorized page for 401/403 errors
      window.location.href = '/auth/unauthorized';
      onUnauthorized?.();
    }

    throw new ApiError(response.status, message);
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, public statusText: string) {
    super(`${status} ${statusText}`);
  }
}

export { API_BASE_URL };
