import type { CaseRecord, UserProfile } from '@/types';

const DAY_MS = 1000 * 60 * 60 * 24;

export type DeadlineUrgency = 'overdue' | 'critical' | 'warning' | 'ok';

// Parses a YYYY-MM-DD string as a local calendar date (not UTC midnight).
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toISODate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Whole days left until the end of the deadline day. 0 means "due today";
// negative means overdue.
export function daysUntil(deadline: string, now = Date.now()): number {
  const date = parseISODate(deadline);
  if (!date) return NaN;
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return Math.ceil((endOfDay.getTime() - now) / DAY_MS) - 1;
}

export function deadlineUrgency(days: number): DeadlineUrgency {
  if (days < 0) return 'overdue';
  if (days <= 14) return 'critical';
  if (days <= 60) return 'warning';
  return 'ok';
}

export function formatDeadline(deadline: string, style: 'long' | 'short' = 'long'): string {
  const date = parseISODate(deadline);
  if (!date) return deadline;
  return date.toLocaleDateString('en-GB', style === 'long'
    ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function describeDaysLeft(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} left`;
}

// The deadline that applies to a student: the staff-set one on their profile,
// falling back to a legacy student-set deadline on their case record.
export function effectiveDeadline(
  profile?: Pick<UserProfile, 'deadline'> | null,
  caseRecord?: Pick<CaseRecord, 'customDeadline'> | null
): string | undefined {
  return profile?.deadline || caseRecord?.customDeadline || undefined;
}
