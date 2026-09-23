import { describe, it, expect } from 'vitest';
import { daysUntil, deadlineUrgency, effectiveDeadline, parseISODate, toISODate } from '@/lib/deadlines';

describe('deadline helpers', () => {
  const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

  it('parses and formats local calendar dates', () => {
    const date = parseISODate('2027-03-05');
    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(5);
    expect(toISODate(date!)).toBe('2027-03-05');
    expect(parseISODate('not a date')).toBeNull();
  });

  it('counts whole days left, with 0 meaning due today', () => {
    expect(daysUntil('2027-03-05', noon(2027, 3, 5))).toBe(0);
    expect(daysUntil('2027-03-06', noon(2027, 3, 5))).toBe(1);
    expect(daysUntil('2027-03-04', noon(2027, 3, 5))).toBe(-1);
  });

  it('classifies urgency', () => {
    expect(deadlineUrgency(-1)).toBe('overdue');
    expect(deadlineUrgency(0)).toBe('critical');
    expect(deadlineUrgency(30)).toBe('warning');
    expect(deadlineUrgency(90)).toBe('ok');
  });

  it('prefers the staff-set profile deadline over a legacy case deadline', () => {
    expect(effectiveDeadline({ deadline: '2027-01-01' }, { customDeadline: '2026-01-01' })).toBe('2027-01-01');
    expect(effectiveDeadline({}, { customDeadline: '2026-01-01' })).toBe('2026-01-01');
    expect(effectiveDeadline(null, null)).toBeUndefined();
  });
});
