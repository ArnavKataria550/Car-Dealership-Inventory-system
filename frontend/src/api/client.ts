/** One problem with one field, as reported by the API's validation errors. */
export interface FieldError {
  field: string;
  message: string;
}

/** Any failed API call. `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | undefined;

export interface RequestOptions {
  /** Appended as a query string; empty and undefined values are skipped. */
  query?: Record<string, QueryValue>;
}

export interface ApiClientOptions {
  /** Current access token, or null when logged out. */
  getToken: () => string | null;
  /** Called when the server rejects a token we sent (expired or invalid session). */
  onUnauthorized: (message: string) => void;
  baseUrl?: string;
}

export type ApiClient = ReturnType<typeof createApiClient>;

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

/**
 * Thin wrapper around fetch for the Drivewright API: adds the bearer token,
 * sends and parses JSON, and turns every failure into an ApiError. It knows
 * nothing about where the token is stored; that is injected by the caller.
 */
export function createApiClient({ getToken, onUnauthorized, baseUrl = '/api' }: ApiClientOptions) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    { query }: RequestOptions = {},
  ): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR', NETWORK_ERROR);
    }

    if (response.ok) {
      return (response.status === 204 ? undefined : await response.json()) as T;
    }

    const error = await toApiError(response);
    // Only a token we sent can have expired; a 401 at login just means wrong credentials.
    if (error.status === 401 && token) {
      onUnauthorized(error.message);
    }
    throw error;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
    delete: <T = void>(path: string) => request<T>('DELETE', path),
  };
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  // Resolved against the page origin so relative API paths work in the browser and in tests.
  const url = new URL(`${baseUrl}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const { error } = (await response.json()) as {
      error?: { code?: string; message?: string; details?: FieldError[] };
    };
    if (error?.code && error.message) {
      return new ApiError(response.status, error.code, error.message, error.details ?? []);
    }
  } catch {
    // Not JSON (e.g. a proxy's HTML error page): fall through to the generic error.
  }
  return new ApiError(response.status, 'UNKNOWN_ERROR', GENERIC_ERROR);
}
