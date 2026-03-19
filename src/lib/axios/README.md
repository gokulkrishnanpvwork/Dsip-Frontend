# Axios API Wrapper

A simplified axios wrapper for React applications, inspired by the fetchController pattern. Provides a clean API for handling requests with callbacks or promises.

## Features

- ✅ Request/Response interceptors with timing tracking
- ✅ Automatic authentication failure handling
- ✅ Support for JSON, form-data, and URL-encoded requests
- ✅ Request cancellation support
- ✅ Latency monitoring and logging
- ✅ TypeScript support
- ✅ Both callback and promise-based APIs

## Installation

```bash
npm install axios
```

## Basic Usage

### Callback-based API

```typescript
import { apiRequest } from '@/lib/axios';

// Simple POST request with JSON
apiRequest(
  '/api/users',
  { name: 'John Doe', email: 'john@example.com' },
  { method: 'POST', isJSON: true },
  (response) => {
    if (response.status === 'success') {
      console.log('User created:', response.data);
    } else {
      console.error('Error:', response.message);
    }
  }
);

// GET request
apiRequest(
  '/api/users/123',
  null,
  { method: 'GET' },
  (response) => {
    if (response.status === 'success') {
      console.log('User:', response.data);
    }
  }
);
```

### Promise-based API

```typescript
import { apiRequestPromise } from '@/lib/axios';

async function fetchUser(id: string) {
  const response = await apiRequestPromise(
    `/api/users/${id}`,
    null,
    { method: 'GET' }
  );

  if (response.status === 'success') {
    return response.data;
  } else {
    throw new Error(response.message);
  }
}
```

## Options

### ApiRequestOptions

```typescript
interface ApiRequestOptions {
  // Send data as JSON (default: false, uses form-urlencoded)
  isJSON?: boolean;

  // Send data as multipart/form-data
  isFormData?: boolean;

  // Custom headers
  headers?: Record<string, string>;

  // Request timeout in milliseconds (default: 10000)
  timeout?: number;

  // HTTP method (default: 'POST')
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  // Log response to console
  logResponse?: boolean;

  // Skip logout alert on authentication failure
  skipLogoutAlert?: boolean;

  // Disable logging for this request
  disableLogs?: boolean;

  // Custom request identifier for tracking
  requestId?: string;
}
```

## Advanced Usage

### Request Cancellation

```typescript
import { apiRequest } from '@/lib/axios';
import type { CancelTokenSource } from 'axios';

let cancelSource: CancelTokenSource;

apiRequest(
  '/api/long-running-task',
  { data: 'value' },
  { method: 'POST' },
  (response) => {
    console.log('Response:', response);
  },
  (source) => {
    cancelSource = source;
  }
);

// Cancel the request
cancelSource.cancel('User cancelled the request');
```

### Authentication Failure Handler

```typescript
import { setAuthenticationFailureHandler } from '@/lib/axios';

// Set up global auth failure handler (typically in your app root)
setAuthenticationFailureHandler(() => {
  console.log('Authentication failed, redirecting to login...');
  // Clear auth state
  // Redirect to login
  window.location.href = '/login';
});
```

### Custom Headers

```typescript
apiRequest(
  '/api/protected-resource',
  { data: 'value' },
  {
    method: 'POST',
    isJSON: true,
    headers: {
      'X-Custom-Header': 'value',
      'Authorization': 'Bearer token123'
    }
  },
  (response) => {
    console.log('Response:', response);
  }
);
```

### FormData Upload

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'My file');

apiRequest(
  '/api/upload',
  formData,
  {
    method: 'POST',
    isFormData: true,
    timeout: 30000 // 30 seconds for file upload
  },
  (response) => {
    if (response.status === 'success') {
      console.log('File uploaded:', response.data);
    }
  }
);
```

## React Hooks Example

### Custom Hook with the Wrapper

```typescript
import { useState, useEffect } from 'react';
import { apiRequestPromise } from '@/lib/axios';
import type { ApiResponse } from '@/lib/axios';

export function useUser(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await apiRequestPromise(
          `/api/users/${userId}`,
          null,
          { method: 'GET' }
        );

        if (response.status === 'success') {
          setUser(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch user');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}
```

## Response Structure

All responses follow a consistent structure:

```typescript
// Success response
{
  status: 'success',
  data: any // Your response data
}

// Error response
{
  status: 'error' | 'failed' | 'authentication_failure',
  data: any,
  message?: string
}
```

## Environment Variables

Configure the API base URL in your `.env` file:

```env
VITE_API_BASE_URL=https://api.example.com
```

If not set, defaults to `http://localhost:8080`.

## Direct Axios Instance Access

For advanced use cases, you can access the configured axios instance directly:

```typescript
import { axiosInstance } from '@/lib/axios';

// Use axios directly
const response = await axiosInstance.get('/api/users');
```

## Error Handling

The wrapper automatically handles common error scenarios:

- **Authentication failures (401)**: Triggers the auth failure handler
- **Timeout errors**: Returns `timeout_exceeded` status
- **Network errors**: Returns `network_error` status
- **Cancelled requests**: Returns `request_cancelled` status

## Logging

- Request/response logging can be controlled with `disableLogs` and `logResponse` options
- Slow API calls (>5 seconds) are automatically logged as warnings
- All timing data is tracked via interceptors

## Migration from Fetch

If you're migrating from the existing fetch-based `api.ts`:

```typescript
// Old (fetch-based)
const data = await api<User>('/api/users/123');

// New (axios-based, promise style)
const response = await apiRequestPromise<User>(
  '/api/users/123',
  null,
  { method: 'GET' }
);
if (response.status === 'success') {
  const data = response.data;
}

// Or create a wrapper function to maintain the same interface
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiRequestPromise<T>(
    path,
    options?.body ? JSON.parse(options.body as string) : null,
    {
      method: (options?.method as any) || 'GET',
      isJSON: true,
      headers: options?.headers as Record<string, string>
    }
  );

  if (response.status === 'success') {
    return response.data;
  } else {
    throw new Error(response.message || 'Request failed');
  }
}
```
