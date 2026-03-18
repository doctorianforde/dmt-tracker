'use client';

import { useMemo } from 'react';

const DEADLINE = new Date('2026-06-30T23:59:59');

export default function DeadlineCountdown() {
  const { days, urgency } = useMemo(() => {
    const diff = DEADLINE.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 30) return { days, urgency: 'critical' as const };
    if (days <= 90) return { days, urgency: 'warning' as const };
    return { days, urgency: 'ok' as const };
  }, []);

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

  return (
    <div className={`border rounded-xl px-5 py-4 flex items-center gap-4 ${styles[urgency]}`}>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotStyles[urgency]}`} />
      <div className="flex-1">
        <p className="font-semibold text-sm">Submission Deadline — June 2026</p>
        <p className="text-xs opacity-70 mt-0.5">
          {days > 0 ? `${days} days remaining` : 'Deadline has passed'}
        </p>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-2xl font-bold leading-none">{days > 0 ? days : 0}</p>
        <p className="text-xs opacity-60 mt-0.5">days left</p>
      </div>
    </div>
  );
}
