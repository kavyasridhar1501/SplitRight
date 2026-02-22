const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json = await res.json();
  return json;
}

// Auth
export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

// Groups
export const groups = {
  list: () => request('/groups'),
  create: (data: { name: string }) =>
    request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  join: (data: { invite_code: string }) =>
    request('/groups/join', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => request(`/groups/${id}`),
  leave: (id: string) => request(`/groups/${id}/leave`, { method: 'DELETE' }),
};

// Expenses
export const expenses = {
  list: (groupId: string) => request(`/groups/${groupId}/expenses`),
  get: (groupId: string, expenseId: string) =>
    request(`/groups/${groupId}/expenses/${expenseId}`),
  create: (groupId: string, data: object) =>
    request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (groupId: string, expenseId: string) =>
    request(`/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' }),
};

// Balances
export const balances = {
  get: (groupId: string) => request(`/groups/${groupId}/balances`),
};

// Settlements
export const settlements = {
  list: (groupId: string) => request(`/groups/${groupId}/settlements`),
  create: (groupId: string, data: object) =>
    request(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default { auth, groups, expenses, balances, settlements };
