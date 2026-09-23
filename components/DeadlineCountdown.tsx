'use client';

import { useEffect, useState } from 'react';
import { daysUntil, deadlineUrgency, describeDaysLeft, formatDeadline } from '@/lib/deadlines';
import { URGENCY_STYLES } from '@/components/DeadlineCalendar';

interface Props {
  deadline?: string; // YYYY-MM-DD, set by the student's Lecturer or Supervisor
  setByName?: string;
  completionPercent?: number;
}

const URGENCY_NOTE = {
  overdue: 'Your deadline has passed — talk to your supervisor.',
  critical: 'Final stretch. Prioritise what’s left.',
  warning: 'Keep up the pace to finish on time.',
  ok: 'Plenty of runway — steady progress wins.',
} as const;

export default function DeadlineCountdown({ deadline, setByName, completionPercent = 0 }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  if (!deadline) {
    return (
      <div>
        <p className="eyebrow text-muted">Deadline</p>
        <p className="display text-4xl text-ink mt-2">Not set yet</p>
        <p className="text-sm text-muted mt-2 max-w-xs">
          Your supervisor or lecturer will set your submission deadline. It’ll appear here and on the calendar.
        </p>
      </div>
    );
  }

  const days = daysUntil(deadline, now);
  const urgency = deadlineUrgency(days);
  const style = URGENCY_STYLES[urgency];

  return (
    <div>
      <p className="eyebrow text-muted">Deadline</p>
      <div className="flex items-end gap-3 mt-2">
        <p className={`display text-7xl leading-[0.85] tabular-nums ${style.text}`}>{Math.max(days, 0)}</p>
        <p className="text-sm font-semibold text-ink pb-1">{days === 1 ? 'day' : 'days'}<br />left</p>
      </div>
      <p className="text-sm font-semibold text-ink mt-4">{formatDeadline(deadline)}</p>
      <p className="text-xs text-muted mt-0.5">{setByName ? `Set by ${setByName}` : 'Set by your supervisor'}</p>
      <span className={`chip mt-3 ${style.pill}`}>{describeDaysLeft(days)}</span>
      <p className="text-sm text-muted mt-3">{URGENCY_NOTE[urgency]}</p>
      {urgency !== 'ok' && urgency !== 'overdue' && completionPercent < 100 && (
        <p className="text-xs text-muted mt-1">{100 - completionPercent}% of your sections still to go.</p>
      )}
    </div>
  );
}
