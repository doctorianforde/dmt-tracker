import { describe, it, expect } from 'vitest';
import { START_YEAR_MIN, START_YEAR_MAX, CLASS_YEARS, ACCOUNTABILITY_WINDOW_DAYS } from '@/lib/config';

describe('app config', () => {
  it('has reasonable year bounds', () => {
    expect(START_YEAR_MIN).toBeLessThan(START_YEAR_MAX);
    expect(CLASS_YEARS.length).toBeGreaterThan(0);
  });

  it('has a positive accountability window', () => {
    expect(ACCOUNTABILITY_WINDOW_DAYS).toBeGreaterThan(0);
  });
});
