'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { getUnassignedStudents, updateMyStudents, type UnassignedStudent } from '@/lib/api-client';
import { errorMessage } from '@/lib/case-state';

// Supervisor: add students who have no supervisor yet.

export default function AddStudentsPanel({ onAdded }: { onAdded: (student: UnassignedStudent) => void }) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<UnassignedStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingUid, setAddingUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setError(null);
    setStudents(null);
    getUnassignedStudents()
      .then(setStudents)
      .catch((err: unknown) => setError(errorMessage(err)));
  };

  const add = async (student: UnassignedStudent) => {
    setAddingUid(student.uid);
    setError(null);
    try {
      await updateMyStudents(student.uid, 'add');
      setStudents((prev) => prev?.filter((s) => s.uid !== student.uid) ?? null);
      onAdded(student);
    } catch (err: unknown) {
      setError(`Couldn’t add ${student.name}: ${errorMessage(err)}`);
    } finally {
      setAddingUid(null);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          load();
        }}
        className="btn-primary"
      >
        + Add students
      </button>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = students?.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || (s.caseNumber ?? '').toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q)
  );

  return (
    <div className="card p-5 sm:p-6 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-bold text-ink">Students without a supervisor</p>
          <p className="text-sm text-muted mt-0.5">Add a student to your list. You can remove them again until they submit their case.</p>
        </div>
        <button onClick={() => setOpen(false)} className="btn-ghost !px-3 !py-1.5 text-xs">Close</button>
      </div>
      {error && <p className="text-sm text-danger mb-3" role="alert">{error}</p>}
      {students === null && !error ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : students && students.length === 0 ? (
        <p className="text-sm text-muted">Every student already has a supervisor.</p>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or case number…"
            className="input !py-2.5 mb-3 max-w-sm"
            aria-label="Search students"
          />
          <ul className="divide-y divide-line border-y border-line max-h-80 overflow-y-auto">
            {shown?.map((s) => (
              <li key={s.uid} className="flex items-center gap-3 py-3">
                <Avatar name={s.name} photoURL={s.photoURL} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-xs text-muted truncate">
                    {[s.caseNumber, s.email].filter(Boolean).join(' · ') || 'No case yet'}
                  </p>
                </div>
                <button onClick={() => add(s)} disabled={addingUid !== null} className="btn-secondary !px-3 !py-1.5 text-xs">
                  {addingUid === s.uid ? 'Adding…' : 'Add'}
                </button>
              </li>
            ))}
            {shown?.length === 0 && <li className="py-3 text-sm text-muted">No students match your search.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
