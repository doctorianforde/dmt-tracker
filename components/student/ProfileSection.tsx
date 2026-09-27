'use client';

import { useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { START_YEAR_MIN, START_YEAR_MAX, CLASS_YEARS } from '@/lib/config';
import type { StaffDirectoryEntry, UserProfile } from '@/types';

// The student's details: case number (locked after the first save), years,
// supervisor pick (locked once submitted) and password. With newCase, the
// student is entering the number of their next case after an approval.
export default function ProfileSection({
  index,
  userProfile,
  newCase = false,
  onCancelNewCase,
  caseNumber,
  onCaseNumberChange,
  startYear,
  onStartYearChange,
  classYear,
  onClassYearChange,
  staff,
  staffError,
  savingSupervisor,
  supervisorLocked,
  onSupervisorChange,
}: {
  index: number;
  userProfile: UserProfile | null;
  newCase?: boolean;
  onCancelNewCase?: () => void;
  caseNumber: string;
  onCaseNumberChange: (value: string) => void;
  startYear: number;
  onStartYearChange: (value: number) => void;
  classYear: number;
  onClassYearChange: (value: number) => void;
  staff: StaffDirectoryEntry[];
  staffError: string | null;
  savingSupervisor: boolean;
  supervisorLocked: boolean;
  onSupervisorChange: (directoryId: string) => void;
}) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const isProfileSetup = !!userProfile?.caseNumber && !newCase;
  const supervisorName = userProfile?.supervisorDirectoryName ?? userProfile?.assignedSupervisorName;
  const hasSupervisor = !!(userProfile?.supervisorDirectoryId || userProfile?.assignedSupervisorUid);
  const supervisorSignedUp = !!userProfile?.assignedSupervisorUid;

  return (
    <section>
      <SectionHeader
        index={index}
        eyebrow="Profile"
        title={newCase ? 'Start your next case' : isProfileSetup ? 'Your details' : 'Set up your profile'}
        description={
          newCase
            ? 'Enter the number of your next case report. It’s locked after the first save.'
            : isProfileSetup ? undefined : 'Add your case number to start tracking. It’s locked after the first save.'
        }
      />
      <div className="card p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="case-number">Case number</label>
          <input
            id="case-number"
            type="text"
            value={caseNumber}
            onChange={(e) => onCaseNumberChange(e.target.value)}
            placeholder="e.g. DMT-2026-001"
            disabled={isProfileSetup}
            className="input font-mono"
          />
          {isProfileSetup && <p className="text-xs text-muted mt-1.5">Locked after first save</p>}
          {newCase && onCancelNewCase && (
            <button type="button" onClick={onCancelNewCase} className="text-xs text-muted hover:underline mt-1.5">
              Cancel — back to my approved case
            </button>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="start-year">Start year</label>
          <input
            id="start-year"
            type="number"
            value={startYear}
            onChange={(e) => onStartYearChange(Number(e.target.value))}
            min={START_YEAR_MIN}
            max={START_YEAR_MAX}
            className="input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="class-year">Class year</label>
          <select id="class-year" value={classYear} onChange={(e) => onClassYearChange(Number(e.target.value))} className="input">
            {CLASS_YEARS.map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="supervisor">Your supervisor</label>
          <select
            id="supervisor"
            value={userProfile?.supervisorDirectoryId ?? ''}
            onChange={(e) => onSupervisorChange(e.target.value)}
            disabled={supervisorLocked || savingSupervisor}
            className="input"
          >
            <option value="">— Choose your supervisor —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            {/* Assigned before the staff list existed. */}
            {!userProfile?.supervisorDirectoryId && userProfile?.assignedSupervisorName && (
              <option value="" disabled>{userProfile.assignedSupervisorName}</option>
            )}
          </select>
          <p className="text-xs text-muted mt-1.5">
            {staffError
              ? staffError
              : savingSupervisor
              ? 'Saving…'
              : newCase
              ? `Your new case goes to ${supervisorName ?? 'your supervisor'}. Save it first if you want to change supervisor.`
              : supervisorLocked
              ? 'Locked because your case has been submitted. Ask your Lecturer if it needs to change.'
              : hasSupervisor && !supervisorSignedUp
              ? `${supervisorName} hasn’t joined VIS yet. You’ll be linked automatically when they sign up.`
              : hasSupervisor
              ? 'You can change this until you submit your case for review.'
              : 'Pick your supervisor from the list, even if they haven’t joined VIS yet.'}
          </p>
        </div>
        <div className="sm:col-span-2 pt-5 border-t border-line">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="field-label !mb-1">Password</p>
              <p className="text-sm text-muted">Signed in as {userProfile?.email}</p>
            </div>
            {!showPasswordForm && (
              <button type="button" onClick={() => setShowPasswordForm(true)} className="btn-secondary">
                Change password
              </button>
            )}
          </div>
          {showPasswordForm && (
            <div className="mt-5">
              <ChangePasswordForm onDone={() => setShowPasswordForm(false)} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
