import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth, groups, expenses, balances, settlements } from './api';

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('auth', () => {
  it('posts credentials to /auth/register', async () => {
    mockFetchOnce({ success: true, data: { user: { id: '1' } } });
    const res = await auth.register({ name: 'A', email: 'a@b.com', password: 'password123' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name: 'A', email: 'a@b.com', password: 'password123' }),
      })
    );
    expect(res.success).toBe(true);
  });

  it('sends a GET for /auth/me without a body', async () => {
    mockFetchOnce({ success: true, data: { user: { id: '1' } } });
    await auth.me();
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain('/auth/me');
    expect(call[1].body).toBeUndefined();
  });

  it('propagates an error response', async () => {
    mockFetchOnce({ success: false, error: 'Invalid email or password' }, false);
    const res = await auth.login({ email: 'a@b.com', password: 'wrong' });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Invalid email or password');
  });
});

describe('groups', () => {
  it('creates a group', async () => {
    mockFetchOnce({ success: true, data: { group: { id: 'g1' } } });
    await groups.create({ name: 'Apt 4B' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Apt 4B' }) })
    );
  });

  it('joins a group by invite code', async () => {
    mockFetchOnce({ success: true, data: { group: { id: 'g1' } } });
    await groups.join({ invite_code: 'ABC12345' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/groups/join'), expect.any(Object));
  });

  it('leaves a group with DELETE', async () => {
    mockFetchOnce({ success: true, data: {} });
    await groups.leave('g1');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/g1/leave'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('expenses', () => {
  it('creates an expense scoped to a group', async () => {
    mockFetchOnce({ success: true, data: { expense: {} } });
    await expenses.create('g1', { title: 'Rent', amount: 100, paid_by: 'u1', split_type: 'equal' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/g1/expenses'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetches a single expense', async () => {
    mockFetchOnce({ success: true, data: { expense: {} } });
    await expenses.get('g1', 'e1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/groups/g1/expenses/e1'), expect.any(Object));
  });
});

describe('balances', () => {
  it('fetches balances for a group', async () => {
    mockFetchOnce({ success: true, data: { balances: [], settlements: [] } });
    await balances.get('g1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/groups/g1/balances'), expect.any(Object));
  });
});

describe('settlements', () => {
  it('records a settlement', async () => {
    mockFetchOnce({ success: true, data: { settlement: {} } });
    await settlements.create('g1', { from_user_id: 'u1', to_user_id: 'u2', amount: 10 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/g1/settlements'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
