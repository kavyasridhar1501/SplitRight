import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getInitials, cn } from './utils';

describe('formatCurrency', () => {
  it('formats a number as USD', () => {
    expect(formatCurrency(50)).toBe('$50.00');
  });

  it('formats a numeric string', () => {
    expect(formatCurrency('12.5')).toBe('$12.50');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(9.999)).toBe('$10.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('returns "Today" for the current date', () => {
    expect(formatDate(new Date().toISOString())).toBe('Today');
  });

  it('returns "Yesterday" for one day ago', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatDate(yesterday.toISOString())).toBe('Yesterday');
  });

  it('returns "N days ago" for dates within a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatDate(threeDaysAgo.toISOString())).toBe('3 days ago');
  });

  it('returns a short month/day format for older dates', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const result = formatDate(tenDaysAgo.toISOString());
    expect(result).not.toMatch(/days ago/);
    expect(result).not.toBe('Today');
  });
});

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
  });

  it('uppercases the result', () => {
    expect(getInitials('ada lovelace')).toBe('AL');
  });

  it('handles a single name', () => {
    expect(getInitials('Ada')).toBe('A');
  });

  it('caps at two characters for long names', () => {
    expect(getInitials('Ada Byron Lovelace')).toBe('AB');
  });
});

describe('cn', () => {
  it('joins truthy class names with a space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(undefined, null, false)).toBe('');
  });
});
