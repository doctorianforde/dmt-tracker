'use client';

import { useMemo } from 'react';

const DEFAULT_DEADLINE = new Date('2026-06-30T23:59:59');

const MOTIVATIONAL_MESSAGES = [
  { threshold: 100, msg: "You're well ahead — keep building that momentum! 🚀", emoji: '🌟' },
  { threshold: 90, msg: "Great start! Consistency is your superpower. 💪", emoji: '💪' },
  { threshold: 60, msg: "You're making solid progress — stay the course! 📈", emoji: '📈' },
  { threshold: 30, msg: "More than halfway there — you've got this! 🎯", emoji: '🎯' },
  { threshold: 0, msg: "The finish line is in sight — give it your all! 🏁", emoji: '🏁' },
];

interface Props {
  customDeadline?: string;   // ISO date string e.g. "2026-06-30"
  completionPercent?: number; // 0–100 for motivational message
}

export default function DeadlineCountdown({ customDeadline, completionPercent = 0 }: Props) {
  const { days, urgency, deadline } = useMemo(() => {
    const deadline = customDeadline ? new Date(customDeadline + 'T23:59:59') : DEFAULT_DEADLINE;
    const diff = deadline.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 14) return { days, urgency: 'critical' as const, deadline };
    if (days <= 60) return { days, urgency: 'warning' as const, deadline };
    return { days, urgency: 'ok' as const, deadline };
  }, [customDeadline]);

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

  const motivational = MOTIVATIONAL_MESSAGES.find(m => completionPercent >= m.threshold)
    ?? MOTIVATIONAL_MESSAGES[MOTIVATIONAL_MESSAGES.length - 1];

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

      {/* Motivational message */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">{motivational.emoji}</span>
        <p className="text-sm text-emerald-800 font-medium">{motivational.msg}</p>
      </div>
    </div>
  );
}
