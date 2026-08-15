import { localStore } from './localStore';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('school_calendar_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('school_calendar_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('school_calendar_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is successful
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return data as T;
      }
      // If 200 OK but returned HTML (e.g. SPA fallback index.html for unhandled /api path)
      console.warn(`[API Client] Server returned HTML/non-JSON for ${endpoint}. Falling back to local data store.`);
      const fallbackResult = await localStore.handleMockRequest(endpoint, options);
      return fallbackResult as T;
    }

    // 405 Method Not Allowed (static server / preview rejecting POST/PUT/DELETE),
    // 404 Not Found, 502/503/504 Gateway errors
    if (
      response.status === 405 ||
      response.status === 404 ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      console.warn(
        `[API Client] Server returned status ${response.status} for ${endpoint}. Falling back to local store.`
      );
      const fallbackResult = await localStore.handleMockRequest(endpoint, options);
      return fallbackResult as T;
    }

    // For other application-level HTTP errors (400 bad request, 401 unauthenticated, 403 forbidden, etc.)
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // If parsing error JSON failed (e.g. server returned HTML error page)
      console.warn(`[API Client] Error response was not JSON for ${endpoint}. Falling back to local data store.`);
      const fallbackResult = await localStore.handleMockRequest(endpoint, options);
      return fallbackResult as T;
    }

    throw new Error(errorMessage);
  } catch (err: any) {
    // If network error (fetch failed, server offline, 405 Method Not Allowed, or static preview)
    if (
      err &&
      err.message &&
      (err.message.includes('405') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        !err.message.startsWith('HTTP Error'))
    ) {
      console.warn(`[API Client] Request to ${endpoint} failed (${err?.message}). Using offline local store.`);
      const fallbackResult = await localStore.handleMockRequest(endpoint, options);
      return fallbackResult as T;
    }
    throw err;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
