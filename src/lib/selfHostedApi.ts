export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = status === 401 ? 'auth/invalid-credential' : `api/${status}`;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Empty responses are valid for some endpoints.
  }
  if (!response.ok) {
    throw new ApiError(payload?.error || `Request failed (${response.status})`, response.status);
  }
  return payload as T;
}

export async function dataRequest<T = unknown>(
  action: string,
  args: Record<string, unknown> = {},
  options: Pick<RequestInit, 'signal'> = {},
): Promise<T> {
  const response = await apiRequest<{ result: T }>('/api/data', {
    ...options,
    method: 'POST',
    body: JSON.stringify({ action, args }),
  });
  return response.result;
}
