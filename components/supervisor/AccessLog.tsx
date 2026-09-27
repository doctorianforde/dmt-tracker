'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAccessLogs } from '@/lib/firestore';
import { errorMessage } from '@/lib/case-state';
import type { AccessLogEntry, AccessLogAction } from '@/types';

// Access log (Lecturer only).

const ACTION_LABELS: Record<AccessLogAction, string> = {
  login: 'Signed in',
  view_cases: 'Viewed case list',
  approve: 'Approved case',
  reject: 'Rejected case',
  revoke: 'Revoked approval',
  assign_supervisor: 'Assigned supervisor',
  set_deadline: 'Set deadline',
};

export default function AccessLog() {
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(await getAccessLogs());
    } catch (err: unknown) {
      setError('Failed to load access log: ' + errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const th = 'text-left px-4 py-3 eyebrow text-muted';

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-line flex items-center justify-between">
        <p className="text-sm text-muted">Logins, case views, approvals and deadline changes</p>
        <button onClick={load} disabled={loading} className="btn-secondary !px-3 !py-1.5 text-xs">Refresh</button>
      </div>
      {error && <div className="px-5 py-3 bg-danger/10 text-xs text-danger">{error}</div>}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-muted">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted">No activity recorded yet</div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line">
                <th className={`${th} pl-5`}>Time</th>
                <th className={th}>Who</th>
                <th className={th}>Action</th>
                <th className={th}>Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="pl-5 pr-4 py-2.5 text-xs text-muted whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-ink">{log.actorName}</p>
                    <p className="text-xs text-muted capitalize">{log.actorRole}</p>
                  </td>
                  <td className="px-4 py-2.5 text-ink/80">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{log.targetLabel ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
