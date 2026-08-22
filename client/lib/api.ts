const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export async function api<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;

  let authHeader: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authHeader = { Authorization: `Bearer ${token}` };
    }
  }

  const bodyHeaders: Record<string, string> =
    body !== undefined ? { 'Content-Type': 'application/json' } : {};

  const config: RequestInit = {
    method,
    headers: {
      ...bodyHeaders,
      ...authHeader,
      ...headers,
    },
    credentials: 'include',
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.error || errorData?.message || `HTTP error ${response.status}`) as ApiError;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: 'POST', body, headers }),

  put: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    api<T>(endpoint, { method: 'DELETE', headers }),
};
