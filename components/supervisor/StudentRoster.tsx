'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import DeadlineCell from '@/components/supervisor/DeadlineCell';
import { effectiveDeadline } from '@/lib/deadlines';
import { stageOf } from '@/lib/case-state';
import type { CaseRecord, StaffDirectoryEntry, UserProfile } from '@/types';

// Student roster: supervisor assignment (Lecturer) and deadlines.

export default function StudentRoster({
  students,
  staff,
  casesByStudent,
  isLecturer,
  onAssign,
  onSetDeadline,
  onRemove,
}: {
  students: UserProfile[];
  staff: StaffDirectoryEntry[];
  casesByStudent: Map<string, CaseRecord>;
  isLecturer: boolean;
  onAssign: (student: UserProfile, directoryId: string) => Promise<boolean>;
  onSetDeadline: (student: UserProfile, deadline: string | null) => Promise<boolean>;
  // Supervisor only: release a student they added (draft cases only).
  onRemove?: (student: UserProfile) => Promise<boolean>;
}) {
  const [savingUid, setSavingUid] = useState<string | null>(null);

  if (students.length === 0) {
    return (
      <div className="card text-center py-14 px-6">
        <p className="display text-2xl text-ink">No students yet</p>
        <p className="text-sm text-muted mt-1">
          {isLecturer ? 'Students appear here once they register.' : 'Add students with the button above, or they’ll appear here when they choose you.'}
        </p>
      </div>
    );
  }

  const th = 'text-left px-4 py-3 eyebrow text-muted';

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface2/50">
              <th className={`${th} pl-5`}>Student</th>
              <th className={th}>Case #</th>
              {isLecturer && <th className={th}>Supervisor</th>}
              <th className={th}>Deadline</th>
              <th className={th}>Extension request</th>
              {onRemove && <th className={th}><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((student) => {
              const rec = casesByStudent.get(student.uid);
              const deadline = effectiveDeadline(student, rec);
              return (
                <tr key={student.uid} className="align-top">
                  <td className="pl-5 pr-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} photoURL={student.photoURL || undefined} size={36} />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{student.name}</p>
                        <p className="text-xs text-muted truncate">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted font-mono whitespace-nowrap">{student.caseNumber ?? '—'}</td>
                  {isLecturer && (
                    <td className="px-4 py-4">
                      <select
                        value={student.supervisorDirectoryId ?? ''}
                        disabled={savingUid === student.uid}
                        onChange={async (e) => {
                          setSavingUid(student.uid);
                          await onAssign(student, e.target.value);
                          setSavingUid(null);
                        }}
                        className="input !py-1.5 !px-2.5 text-xs min-w-[11rem]"
                        aria-label={`Supervisor for ${student.name}`}
                      >
                        <option value="">— Unassigned —</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}{s.uid ? '' : ' (not signed up yet)'}</option>
                        ))}
                        {/* Legacy assignment made before the directory existed. */}
                        {!student.supervisorDirectoryId && student.assignedSupervisorName && (
                          <option value="" disabled>{student.assignedSupervisorName} (legacy)</option>
                        )}
                      </select>
                      {student.supervisorDirectoryId && !student.assignedSupervisorUid && (
                        <p className="text-[11px] text-muted mt-1">Links automatically when they sign up</p>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <DeadlineCell
                      key={deadline ?? 'none'}
                      value={deadline}
                      onSave={(d) => onSetDeadline(student, d)}
                    />
                    {!student.deadline && rec?.customDeadline && (
                      <p className="text-[11px] text-muted mt-1 max-w-[12rem]">Set by the student before deadlines moved to staff — set it here to confirm.</p>
                    )}
                    {student.deadline && student.deadlineSetByName && (
                      <p className="text-[11px] text-muted mt-1">by {student.deadlineSetByName}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 max-w-[16rem]">
                    {rec?.extensionReason ? (
                      <p className="text-xs text-ink/80 line-clamp-3" title={rec.extensionReason}>“{rec.extensionReason}”</p>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  {onRemove && (
                    <td className="px-4 py-4 text-right">
                      {(!rec || stageOf(rec) === 'pending') && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Remove ${student.name} from your students?`)) return;
                            setSavingUid(student.uid);
                            await onRemove(student);
                            setSavingUid(null);
                          }}
                          disabled={savingUid === student.uid}
                          className="text-xs text-muted hover:text-danger whitespace-nowrap"
                        >
                          {savingUid === student.uid ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
