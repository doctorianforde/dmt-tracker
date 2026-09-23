'use client';

import { useMemo, useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import {
  daysUntil,
  deadlineUrgency,
  describeDaysLeft,
  formatDeadline,
  parseISODate,
  toISODate,
  type DeadlineUrgency,
} from '@/lib/deadlines';

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  sublabel?: string;
  photoURL?: string;
}

interface Props {
  events: CalendarEvent[];
  // Month to open on (YYYY-MM-DD); defaults to the current month.
  initialDate?: string;
  emptyMessage?: string;
  // How many upcoming deadlines to list when no day is selected.
  upcomingLimit?: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const URGENCY_STYLES: Record<DeadlineUrgency, { pill: string; dot: string; text: string }> = {
  overdue: { pill: 'bg-danger text-white', dot: 'bg-danger', text: 'text-danger' },
  critical: { pill: 'bg-danger/15 text-danger', dot: 'bg-danger', text: 'text-danger' },
  warning: { pill: 'bg-warn/15 text-warn', dot: 'bg-warn', text: 'text-warn' },
  ok: { pill: 'bg-ok/15 text-ok', dot: 'bg-ok', text: 'text-ok' },
};

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function DeadlineCalendar({ events, initialDate, emptyMessage, upcomingLimit = 5 }: Props) {
  const today = toISODate(new Date());
  const [month, setMonth] = useState(() => monthStart(parseISODate(initialDate ?? '') ?? new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!parseISODate(e.date)) continue;
      map.set(e.date, [...(map.get(e.date) ?? []), e]);
    }
    return map;
  }, [events]);

  // 6 rows × 7 days starting from the Sunday on/before the 1st.
  const cells = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === month.getMonth() };
    });
  }, [month]);

  const shiftMonth = (delta: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    setSelected(null);
  };

  const listed = selected
    ? byDate.get(selected) ?? []
    : [...events]
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, upcomingLimit);
  const overdueCount = events.filter((e) => e.date < today).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="display text-xl text-ink">
            {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftMonth(-1)} className="btn-ghost !px-2.5 !py-1.5" aria-label="Previous month">
              ‹
            </button>
            <button
              onClick={() => {
                setMonth(monthStart(new Date()));
                setSelected(today);
              }}
              className="btn-ghost !px-3 !py-1.5 text-xs"
            >
              Today
            </button>
            <button onClick={() => shiftMonth(1)} className="btn-ghost !px-2.5 !py-1.5" aria-label="Next month">
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="eyebrow text-muted py-1">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
          {cells.map(({ iso, day, inMonth }) => {
            const dayEvents = byDate.get(iso) ?? [];
            const isToday = iso === today;
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                onClick={() => setSelected(isSelected ? null : iso)}
                aria-label={`${formatDeadline(iso)}${dayEvents.length ? `, ${dayEvents.length} deadline${dayEvents.length > 1 ? 's' : ''}` : ''}`}
                aria-pressed={isSelected}
                className={`relative min-h-[3.25rem] sm:min-h-[4.5rem] rounded-lg p-1 sm:p-1.5 text-left transition border
                  ${isSelected ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-ink/5'}
                  ${inMonth ? '' : 'opacity-35'}`}
              >
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold
                    ${isToday ? 'bg-ink text-surface' : 'text-ink'}`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <>
                    {/* Compact dots on phones, name pills on wider screens. */}
                    <span className="flex gap-0.5 mt-0.5 sm:hidden">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${URGENCY_STYLES[deadlineUrgency(daysUntil(e.date))].dot}`} />
                      ))}
                    </span>
                    <span className="hidden sm:flex flex-col gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className={`truncate rounded px-1 py-px text-[10px] font-semibold leading-tight ${URGENCY_STYLES[deadlineUrgency(daysUntil(e.date))].pill}`}
                        >
                          {e.label}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted font-medium">+{dayEvents.length - 2} more</span>
                      )}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:border-l lg:border-line lg:pl-6">
        <p className="eyebrow text-muted mb-3">
          {selected ? formatDeadline(selected) : 'Coming up'}
        </p>
        {listed.length === 0 ? (
          <p className="text-sm text-muted">
            {selected ? 'No deadlines on this day.' : emptyMessage ?? 'No upcoming deadlines.'}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {listed.map((e) => {
              const days = daysUntil(e.date);
              const style = URGENCY_STYLES[deadlineUrgency(days)];
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={e.label} photoURL={e.photoURL} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{e.label}</p>
                    <p className="text-xs text-muted truncate">
                      {e.sublabel ? `${e.sublabel} · ` : ''}
                      {formatDeadline(e.date, 'short')}
                    </p>
                  </div>
                  <span className={`chip ${style.pill} whitespace-nowrap`}>{describeDaysLeft(days)}</span>
                </li>
              );
            })}
          </ul>
        )}
        {!selected && overdueCount > 0 && (
          <p className="text-xs text-danger font-semibold mt-4">
            {overdueCount} deadline{overdueCount > 1 ? 's have' : ' has'} already passed
          </p>
        )}
      </div>
    </div>
  );
}
