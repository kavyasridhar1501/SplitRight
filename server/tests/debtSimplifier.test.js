const { simplifyDebts } = require('../lib/debtSimplifier');

describe('simplifyDebts', () => {
  it('returns no transactions when everyone is settled', () => {
    const result = simplifyDebts([
      { userId: 'a', netBalance: 0 },
      { userId: 'b', netBalance: 0 },
    ]);
    expect(result).toEqual([]);
  });

  it('settles a simple two-person debt in one transaction', () => {
    const result = simplifyDebts([
      { userId: 'a', netBalance: 50 },
      { userId: 'b', netBalance: -50 },
    ]);
    expect(result).toEqual([{ from: 'b', to: 'a', amount: 50 }]);
  });

  it('minimizes transactions for a three-person cycle', () => {
    // a paid for everyone: b owes 30, c owes 20, a is owed 50
    const result = simplifyDebts([
      { userId: 'a', netBalance: 50 },
      { userId: 'b', netBalance: -30 },
      { userId: 'c', netBalance: -20 },
    ]);
    expect(result).toHaveLength(2);
    const total = result.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBeCloseTo(50, 2);
  });

  it('ignores balances within the 1-cent rounding threshold', () => {
    const result = simplifyDebts([
      { userId: 'a', netBalance: 0.005 },
      { userId: 'b', netBalance: -0.005 },
    ]);
    expect(result).toEqual([]);
  });

  it('produces a settlement plan that nets every balance to zero', () => {
    const balances = [
      { userId: 'a', netBalance: 40 },
      { userId: 'b', netBalance: 25 },
      { userId: 'c', netBalance: -35 },
      { userId: 'd', netBalance: -30 },
    ];
    const result = simplifyDebts(balances.map((b) => ({ ...b })));

    const net = { a: 0, b: 0, c: 0, d: 0 };
    for (const t of result) {
      net[t.from] -= t.amount;
      net[t.to] += t.amount;
    }
    expect(net.a).toBeCloseTo(40, 2);
    expect(net.b).toBeCloseTo(25, 2);
    expect(net.c).toBeCloseTo(-35, 2);
    expect(net.d).toBeCloseTo(-30, 2);
    // Debt simplification should never need more than n-1 transactions
    expect(result.length).toBeLessThanOrEqual(balances.length - 1);
  });

  it('rounds transaction amounts to the nearest cent', () => {
    const result = simplifyDebts([
      { userId: 'a', netBalance: 33.333 },
      { userId: 'b', netBalance: -33.333 },
    ]);
    expect(result[0].amount).toBe(33.33);
  });
});
