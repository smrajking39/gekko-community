/**
 * Client-side fetch wrapper. Talks to our own Next.js Route Handlers (same origin,
 * no CORS). Returns the unwrapped `data` from our response envelope.
 */
import type { ApiEnvelope } from '@/types/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: unknown,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { params, body, headers, ...rest } = opts;

  let url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    }
    const qsStr = qs.toString();
    if (qsStr) url += (url.includes('?') ? '&' : '?') + qsStr;
  }

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  let json: ApiEnvelope<T> | undefined;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON
  }

  if (!res.ok || !json || !json.success) {
    const err = json && !json.success ? json.error : undefined;
    throw new ApiError(
      err?.code ?? 'HTTP_ERROR',
      res.status,
      err?.message ?? `Request failed with ${res.status}`,
      err?.details,
      err?.requestId,
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
