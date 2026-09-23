'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/contexts/ThemeContext';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import DeadlineCountdown from '@/components/DeadlineCountdown';
import DeadlineCalendar from '@/components/DeadlineCalendar';
import ProgressChecklist from '@/components/ProgressChecklist';
import AvatarUpload from '@/components/ui/AvatarUpload';
import ProgressRing from '@/components/ui/ProgressRing';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  getCaseRecord,
  saveCaseRecord,
  submitCaseForReview,
  resubmitCase,
  updateUserProfile,
} from '@/lib/firestore';
import type { CaseRecord, CaseSections, ApprovalStage, UserRole } from '@/types';
import { START_YEAR_MIN, START_YEAR_MAX, CLASS_YEARS, ACCOUNTABILITY_WINDOW_DAYS } from '@/lib/config';
import { daysUntil, effectiveDeadline } from '@/lib/deadlines';

const SECTION_KEYS: (keyof CaseSections)[] = ['intro', 'caseReport', 'discussion', 'conclusion', 'references'];

const DEFAULT_SECTIONS: CaseSections = {
  intro: false,
  caseReport: false,
  discussion: false,
  conclusion: false,
  references: false,
};

const STAGE_INFO: Record<ApprovalStage, { label: string; step: number }> = {
  pending: { label: 'Draft — not yet submitted', step: 0 },
  supervisor: { label: 'With your supervisor', step: 1 },
  lecturer: { label: 'With the Lecturer', step: 2 },
  approved: { label: 'Approved', step: 3 },
};

const PIPELINE_STEPS: { stage: ApprovalStage; label: string; dot: string }[] = [
  { stage: 'pending', label: 'Draft', dot: 'bg-ink' },
  { stage: 'supervisor', label: 'Supervisor', dot: 'bg-warn' },
  { stage: 'lecturer', label: 'Lecturer', dot: 'bg-gold' },
  { stage: 'approved', label: 'Approved', dot: 'bg-ok' },
];

// Defined once at module scope — see the same note in SupervisorDashboard.tsx.
const STUDENT_ROLES: UserRole[] = ['student'];

export default function StudentDashboard() {
  return (
    <AuthGuard allowedRoles={STUDENT_ROLES}>
      <Dashboard />
    </AuthGuard>
  );
}

// A stable string of the editable form fields, for unsaved-change detection.
function formSnapshot(f: {
  caseNumber: string;
  startYear: number;
  classYear: number;
  sections: CaseSections;
  extensionReason: string;
}) {
  return JSON.stringify([
    f.caseNumber.trim(),
    f.startYear,
    f.classYear,
    SECTION_KEYS.map((k) => Boolean(f.sections[k])),
    f.extensionReason.trim(),
  ]);
}

function Dashboard() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { themeMarkers, activeQuote } = useTheme();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [caseNumber, setCaseNumber] = useState('');
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [classYear, setClassYear] = useState(1);
  const [sections, setSections] = useState<CaseSections>(DEFAULT_SECTIONS);
  const [extensionReason, setExtensionReason] = useState('');
  const [showExtension, setShowExtension] = useState(false);

  const uid = user?.uid;
  const profileCaseNumber = userProfile?.caseNumber;
  const profileStartYear = userProfile?.startYear;
  const profileClassYear = userProfile?.classYear;
  const isProfileSetup = !!profileCaseNumber;

  // Keyed on the fields that define the form (not the whole profile object),
  // so e.g. uploading a photo doesn't reset unsaved edits.
  useEffect(() => {
    async function load() {
      if (!uid) return;
      try {
        if (profileCaseNumber) {
          setCaseNumber(profileCaseNumber);
          setStartYear(profileStartYear ?? new Date().getFullYear());
          setClassYear(profileClassYear ?? 1);
          const rec = await getCaseRecord(profileCaseNumber);
          if (rec) {
            setCaseRecord(rec);
            setSections({ ...DEFAULT_SECTIONS, ...rec.sections });
            setExtensionReason(rec.extensionReason ?? '');
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setLoadError('Failed to load your case: ' + msg);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [uid, profileCaseNumber, profileStartYear, profileClassYear]);

  const showMessage = (text: string, ok: boolean) => {
    setSaveMessage({ text, ok });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const dirty =
    formSnapshot({ caseNumber, startYear, classYear, sections, extensionReason }) !==
    formSnapshot({
      caseNumber: profileCaseNumber ?? '',
      startYear: profileStartYear ?? new Date().getFullYear(),
      classYear: profileClassYear ?? 1,
      sections: caseRecord?.sections ?? DEFAULT_SECTIONS,
      extensionReason: caseRecord?.extensionReason ?? '',
    });

  // Saves the form. Returns false (after showing the error) on failure.
  const persist = async (): Promise<boolean> => {
    if (!user || !userProfile || !caseNumber.trim()) return false;
    setSaving(true);
    try {
      const payload: Partial<CaseRecord> = {
        studentUid: user.uid,
        studentName: userProfile.name,
        caseNumber: caseNumber.trim(),
        startYear,
        classYear,
        sections,
        greenLight: caseRecord?.greenLight ?? false,
        approvalStage: caseRecord?.approvalStage ?? 'pending',
        // supervisorUid/Name are only ever stamped at case creation, from the
        // student's Lecturer-assigned supervisor — never editable afterward
        // (enforced in firestore.rules; the Lecturer's reassignment flow
        // patches an existing case directly instead).
        ...(!caseRecord && userProfile.assignedSupervisorUid
          ? { supervisorUid: userProfile.assignedSupervisorUid, supervisorName: userProfile.assignedSupervisorName }
          : {}),
        ...(extensionReason.trim() ? { extensionReason: extensionReason.trim() } : {}),
      };

      await saveCaseRecord(caseNumber.trim(), payload);
      await updateUserProfile(user.uid, { caseNumber: caseNumber.trim(), startYear, classYear });
      const updated = await getCaseRecord(caseNumber.trim());
      setCaseRecord(updated);
      await refreshProfile();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showMessage('Couldn’t save: ' + msg, false);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (await persist()) showMessage('Progress saved', true);
  };

  const handleSubmitForReview = async () => {
    if (!userProfile?.caseNumber) return;
    if (dirty && !(await persist())) return;
    setSubmitting(true);
    try {
      await submitCaseForReview(userProfile.caseNumber);
      setCaseRecord((prev) => (prev ? { ...prev, approvalStage: 'supervisor' } : prev));
      showMessage('Submitted for review 🎉', true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showMessage('Submission failed: ' + msg, false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!userProfile?.caseNumber) return;
    if (dirty && !(await persist())) return;
    setSubmitting(true);
    try {
      await resubmitCase(userProfile.caseNumber);
      setCaseRecord((prev) => (prev ? { ...prev, resubmittedAt: new Date() } : prev));
      showMessage('Your reviewer has been told it’s ready for another look', true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showMessage('Couldn’t resubmit: ' + msg, false);
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-on-canvas-muted text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-6 max-w-md text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="font-semibold text-danger">{loadError}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const completedCount = SECTION_KEYS.filter((k) => sections[k]).length;
  const completionPercent = Math.round((completedCount / SECTION_KEYS.length) * 100);
  const firstName = userProfile?.name?.replace(/^(dr\.?|prof\.?)\s+/i, '').split(' ')[0] ?? 'there';
  const approvalStage: ApprovalStage = caseRecord?.approvalStage ?? (caseRecord?.greenLight ? 'approved' : 'pending');
  const stageInfo = STAGE_INFO[approvalStage];

  const currentStageApproval =
    approvalStage === 'supervisor' ? caseRecord?.supervisorApproval
    : approvalStage === 'lecturer' ? caseRecord?.lecturerApproval
    : undefined;
  const rejectionReason = !currentStageApproval?.approved ? currentStageApproval?.rejectionReason : undefined;
  const rejectedAt = currentStageApproval?.rejectedAt;
  const resubmitted =
    !!rejectionReason && !!caseRecord?.resubmittedAt &&
    (!rejectedAt || caseRecord.resubmittedAt.getTime() > rejectedAt.getTime());

  const deadline = effectiveDeadline(userProfile, caseRecord);
  const daysLeft = deadline ? daysUntil(deadline) : Infinity;
  const deadlineClose = daysLeft <= ACCOUNTABILITY_WINDOW_DAYS;
  const showAccountability = deadlineClose || showExtension || !!extensionReason;

  const profileSection = (index: number) => (
    <section>
      <SectionHeader
        index={index}
        eyebrow="Profile"
        title={isProfileSetup ? 'Your details' : 'Set up your profile'}
        description={isProfileSetup ? undefined : 'Add your case number to start tracking. It’s locked after the first save.'}
      />
      <div className="card p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="case-number">Case number</label>
          <input
            id="case-number"
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="e.g. DMT-2026-001"
            disabled={isProfileSetup}
            className="input font-mono"
          />
          {isProfileSetup && <p className="text-xs text-muted mt-1.5">Locked after first save</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="start-year">Start year</label>
          <input
            id="start-year"
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            min={START_YEAR_MIN}
            max={START_YEAR_MAX}
            className="input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="class-year">Class year</label>
          <select id="class-year" value={classYear} onChange={(e) => setClassYear(Number(e.target.value))} className="input">
            {CLASS_YEARS.map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <p className="field-label">Supervisor</p>
          <p className="text-sm font-semibold text-ink">{userProfile?.assignedSupervisorName ?? 'Not yet assigned'}</p>
          <p className="text-xs text-muted mt-1">
            {userProfile?.assignedSupervisorName
              ? 'Assigned by your Lecturer. Contact them if this needs to change.'
              : 'Your Lecturer hasn’t assigned you a supervisor yet — check back before submitting for review.'}
          </p>
        </div>
      </div>
    </section>
  );

  let n = 0;

  return (
    <div className="min-h-screen pb-32">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-14">

        {/* Hero */}
        <header className="grid gap-8 lg:grid-cols-[auto_1fr_auto] items-center">
          <AvatarUpload size={112} />
          <div className="min-w-0">
            <p className="eyebrow text-on-canvas-muted">
              {isProfileSetup
                ? `Case ${userProfile?.caseNumber} · Year ${userProfile?.classYear} · Started ${userProfile?.startYear}`
                : 'Welcome to VIS'}
            </p>
            <h1 className="display text-5xl sm:text-6xl leading-[0.95] text-on-canvas on-canvas-text mt-3">
              Hello, {firstName}.
            </h1>
            <p className="text-base text-on-canvas-muted mt-4 max-w-xl italic" suppressHydrationWarning>
              “{activeQuote}”
            </p>
          </div>
          <div className="card p-5 flex items-center gap-5">
            <ProgressRing percent={completionPercent} />
            <div>
              <p className="eyebrow text-muted">Status</p>
              <p className="display text-xl text-ink mt-1 max-w-[10rem] leading-tight">{stageInfo.label}</p>
              {approvalStage === 'approved' && <p className="text-2xl mt-1" aria-hidden>{themeMarkers.approved}</p>}
            </div>
          </div>
        </header>

        {/* Review feedback */}
        {rejectionReason && !resubmitted && (
          <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-danger/40">
            <span className="w-11 h-11 rounded-full bg-danger/15 text-danger flex items-center justify-center text-lg flex-shrink-0" aria-hidden>✕</span>
            <div className="flex-1">
              <p className="font-bold text-ink">Changes requested</p>
              <p className="text-sm text-ink/80 mt-0.5">“{rejectionReason}”</p>
              <p className="text-xs text-muted mt-1.5">Make the changes, then let your reviewer know it’s ready for another look.</p>
            </div>
            <button onClick={handleResubmit} disabled={submitting || saving} className="btn-primary whitespace-nowrap">
              {submitting ? 'Sending…' : 'Mark as ready for re-review'}
            </button>
          </div>
        )}
        {resubmitted && (
          <div className="card p-5 flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-info/15 text-info flex items-center justify-center text-lg flex-shrink-0" aria-hidden>↻</span>
            <div>
              <p className="font-bold text-ink">Resubmitted for re-review</p>
              <p className="text-sm text-muted mt-0.5">Your reviewer can see you’ve addressed their feedback: “{rejectionReason}”</p>
            </div>
          </div>
        )}
        {approvalStage === 'approved' && (
          <div className="card p-5 flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-ok/15 text-ok flex items-center justify-center text-xl flex-shrink-0" aria-hidden>✓</span>
            <div>
              <p className="font-bold text-ink">Case approved 🎉</p>
              <p className="text-sm text-muted mt-0.5">Your Lecturer has given your case report final approval.</p>
            </div>
          </div>
        )}

        {!isProfileSetup && profileSection(++n)}

        {/* Timeline */}
        <section>
          <SectionHeader index={++n} eyebrow="Timeline" title="Your deadline" description="Set by your supervisor or lecturer." />
          <div className="card p-6 sm:p-8 grid gap-8 md:grid-cols-[16rem_1fr]">
            <DeadlineCountdown
              deadline={deadline}
              setByName={userProfile?.deadlineSetByName}
              completionPercent={completionPercent}
            />
            <div className="md:border-l md:border-line md:pl-8">
              <DeadlineCalendar
                events={deadline ? [{ id: 'mine', date: deadline, label: 'Case submission', sublabel: userProfile?.caseNumber, photoURL: userProfile?.photoURL || undefined }] : []}
                initialDate={deadline}
                emptyMessage="No deadline set yet."
                upcomingLimit={1}
              />
            </div>
          </div>

          {showAccountability ? (
            <div className="card p-6 mt-4 border-warn/50">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-warn/15 text-warn flex items-center justify-center flex-shrink-0 font-bold" aria-hidden>!</span>
                <div className="flex-1">
                  <p className="font-bold text-ink">Accountability check</p>
                  <p className="text-sm text-muted mt-0.5">
                    {!deadlineClose
                      ? 'Tell your supervisors early if you think you won’t make your deadline.'
                      : daysLeft < 0
                      ? 'Your deadline has passed. Let your supervisors know what’s happening.'
                      : daysLeft <= 14
                      ? `Your deadline is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Are you on track?`
                      : `Your deadline is approaching (${daysLeft} days). Let us know if you need an extension.`}
                  </p>
                </div>
              </div>
              <label className="field-label mt-5" htmlFor="extension-reason">Extension reason (if you can’t meet the deadline)</label>
              <textarea
                id="extension-reason"
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Explain why you need more time so your supervisors are informed…"
                rows={3}
                className="input resize-none"
              />
              <p className="text-xs text-muted mt-1.5">Saved with your case and visible to your supervisor and Lecturer. Only they can change your deadline.</p>
            </div>
          ) : (
            <button onClick={() => setShowExtension(true)} className="text-sm text-on-canvas-muted hover:underline mt-4">
              Won’t make your deadline? Request an extension →
            </button>
          )}
        </section>

        {/* Review pipeline */}
        <section>
          <SectionHeader index={++n} eyebrow="Review" title="Approval pipeline" />
          <div className="card p-6 sm:p-8">
            <ol className="grid grid-cols-4">
              {PIPELINE_STEPS.map((step, i) => {
                const reached = stageInfo.step >= i;
                const current = stageInfo.step === i;
                return (
                  <li key={step.stage} className="relative flex flex-col items-center text-center">
                    {i > 0 && (
                      <span
                        className={`absolute top-4 right-1/2 w-full h-1 -z-0 rounded-full ${stageInfo.step >= i ? step.dot : 'bg-ink/10'}`}
                        aria-hidden
                      />
                    )}
                    <span
                      className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition
                        ${reached ? `${step.dot} text-white` : 'bg-surface2 text-muted'}
                        ${current ? 'ring-4 ring-accent/25 scale-110' : ''}`}
                    >
                      {reached ? '✓' : i + 1}
                    </span>
                    <span className={`text-xs sm:text-sm mt-2 font-semibold ${current ? 'text-ink' : 'text-muted'}`}>
                      {step.stage === 'supervisor' && userProfile?.assignedSupervisorName
                        ? userProfile.assignedSupervisorName
                        : step.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            {isProfileSetup && approvalStage === 'pending' && (
              <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-bold text-ink">Ready for review?</p>
                  <p className="text-sm text-muted mt-0.5">
                    {userProfile?.assignedSupervisorName
                      ? `Send your case to ${userProfile.assignedSupervisorName} when you’re ready for feedback.`
                      : 'You need a supervisor assigned by your Lecturer before you can submit.'}
                  </p>
                </div>
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting || saving || !userProfile?.assignedSupervisorUid}
                  className="btn-primary whitespace-nowrap"
                >
                  {submitting ? 'Submitting…' : 'Submit for review →'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Case sections */}
        <section>
          <SectionHeader
            index={++n}
            eyebrow="Progress"
            title="Case sections"
            description="Tick off each section of your case report as you finish it."
          />
          <div className="card p-6 sm:p-8">
            <ProgressChecklist sections={sections} onChange={setSections} markers={themeMarkers} />
          </div>
        </section>

        {isProfileSetup && profileSection(++n)}
      </main>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-3 sm:px-6 pb-3 pointer-events-none">
        <div className="card max-w-6xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-4 pointer-events-auto">
          <p className={`text-sm font-medium ${saveMessage ? (saveMessage.ok ? 'text-ok' : 'text-danger') : 'text-muted'}`} role="status">
            {saveMessage
              ? saveMessage.text
              : dirty
              ? '● Unsaved changes'
              : isProfileSetup
              ? 'All changes saved'
              : 'Enter your case number to get started'}
          </p>
          <button onClick={handleSave} disabled={saving || !caseNumber.trim() || !dirty} className="btn-primary">
            {saving ? 'Saving…' : 'Save progress'}
          </button>
        </div>
      </div>
    </div>
  );
}
