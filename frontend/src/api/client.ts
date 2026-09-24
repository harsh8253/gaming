import type {
  AccountBalance,
  ApiErrorBody,
  Journal,
  JournalLine,
  LedgerSide,
  LoginResponse,
  PublicUser,
  Role,
} from '../types/api';

const TOKEN_KEY = 'wagerdesk.token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const auth = token === undefined ? getStoredToken() : token;
  if (auth) {
    headers.set('Authorization', `Bearer ${auth}`);
  }

  const response = await fetch(path, { ...options, headers });
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? body?.error ?? `Request failed (${response.status})`);
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const api = {
  login(username: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, null);
  },

  me(token?: string) {
    return request<PublicUser>('/auth/me', {}, token);
  },

  listUsers() {
    return request<PublicUser[]>('/users');
  },

  createUser(input: { username: string; password: string; role: Role }) {
    return request<PublicUser>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  listEntries(accountUserId?: string) {
    const query = accountUserId
      ? `?accountUserId=${encodeURIComponent(accountUserId)}`
      : '';
    return request<JournalLine[]>(`/ledger/entries${query}`);
  },

  getBalance(userId: string) {
    return request<AccountBalance>(`/ledger/balances/${encodeURIComponent(userId)}`);
  },

  postJournal(
    input: {
      description?: string;
      lines: { accountUserId: string; side: LedgerSide; amount: number }[];
    },
    idempotencyKey: string,
  ) {
    return request<Journal>('/ledger/journals', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    });
  },

  reverseJournal(id: string, idempotencyKey: string) {
    return request<Journal>(`/ledger/journals/${encodeURIComponent(id)}/reverse`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  },
};
