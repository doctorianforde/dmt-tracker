import { describe, it, expect } from 'vitest';
import { DEFAULT_DEADLINE, START_YEAR_MIN, START_YEAR_MAX, CLASS_YEARS } from '@/lib/config';

describe('app config', () => {
  it('has a valid default deadline', () => {
    expect(DEFAULT_DEADLINE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${DEFAULT_DEADLINE}T23:59:59`).getTime()).toBeGreaterThan(Date.now());
  });

  it('has reasonable year bounds', () => {
    expect(START_YEAR_MIN).toBeLessThan(START_YEAR_MAX);
    expect(CLASS_YEARS.length).toBeGreaterThan(0);
  });
});
