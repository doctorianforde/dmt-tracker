'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { DEFAULT_DEADLINE } from '@/lib/config';

const DEFAULT_DEADLINE_DATE = new Date(`${DEFAULT_DEADLINE}T23:59:59`);

interface Props {
  customDeadline?: string;   // ISO date string e.g. "2026-06-30"
  completionPercent?: number; // 0–100 (for tracking progress)
}

function getDaysUntilDeadline(customDeadline: string | undefined, now: number) {
  const deadline = customDeadline ? new Date(customDeadline + 'T23:59:59') : DEFAULT_DEADLINE_DATE;
  const diff = deadline.getTime() - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  let urgency: 'critical' | 'warning' | 'ok' = 'ok';
  if (days <= 14) urgency = 'critical';
  else if (days <= 60) urgency = 'warning';
  return { days, urgency, deadline };
}

export default function DeadlineCountdown({ customDeadline, completionPercent = 0 }: Props) {
  const { activeQuote } = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000 * 60 * 60); // update every hour
    return () => clearInterval(interval);
  }, []);

  const { days, urgency, deadline } = getDaysUntilDeadline(customDeadline, now);

  const styles = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    ok: 'bg-sky-50 border-sky-200 text-sky-900',
  };

  const dotStyles = {
    critical: 'bg-red-400',
    warning: 'bg-amber-400',
    ok: 'bg-sky-400',
  };

  const deadlineLabel = deadline.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const urgencyNote = urgency === 'critical'
    ? '⚠️ Deadline approaching fast!'
    : urgency === 'warning'
    ? '📅 Keep up the pace to meet your deadline'
    : null;

  return (
    <div className="space-y-2">
      <div className={`border rounded-xl px-5 py-4 flex items-center gap-4 ${styles[urgency]}`}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotStyles[urgency]}`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">Submission Deadline — {deadlineLabel}</p>
          <p className="text-xs opacity-70 mt-0.5">
            {days > 0 ? `${days} days remaining` : 'Deadline has passed'}
          </p>
          {urgencyNote && (
            <p className="text-xs font-medium mt-1 opacity-90">{urgencyNote}</p>
          )}
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-bold leading-none">{days > 0 ? days : 0}</p>
          <p className="text-xs opacity-60 mt-0.5">days left</p>
        </div>
      </div>

      {/* Random Motivational Quote */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-emerald-800 font-medium italic leading-relaxed">{activeQuote}</p>
      </div>
    </div>
  );
}
