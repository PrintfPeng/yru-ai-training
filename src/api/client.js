import axios from 'axios';

/**
 * Shared axios instance.
 *   - baseURL comes from VITE_API_BASE_URL (defaults to http://localhost:3000/api)
 *   - withCredentials: true so the httpOnly JWT cookie flows on every request
 *   - Response interceptor unwraps { ok, data } into just `data`,
 *     and turns { ok:false, error } into an ApiError with the backend's
 *     `code` field so callers can `if (err.code === 'OVER_CAPACITY')` etc.
 */
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Thrown from every failed API call so UI can switch on `err.code`. */
export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

client.interceptors.response.use(
  (res) => {
    // Backend returns { ok: true, data: ... } — expose only `data` to callers.
    const body = res.data;
    if (body && typeof body === 'object' && 'ok' in body) {
      if (body.ok) return body.data;
      throw new ApiError(
        body.error?.code || 'UNKNOWN',
        body.error?.message || 'Request failed',
        res.status,
        body.error?.details
      );
    }
    return body;
  },
  (err) => {
    // Network / timeout / non-JSON error
    if (!err.response) {
      throw new ApiError('NETWORK_ERROR', err.message || 'Network error', 0);
    }
    const body = err.response.data;
    throw new ApiError(
      body?.error?.code || 'HTTP_' + err.response.status,
      body?.error?.message || err.message,
      err.response.status,
      body?.error?.details
    );
  }
);
