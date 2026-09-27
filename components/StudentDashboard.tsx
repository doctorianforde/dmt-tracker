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
import SiteFooter from '@/components/SiteFooter';
import ProfileSection from '@/components/student/ProfileSection';
import ReviewFeedback from '@/components/student/ReviewFeedback';
import AccountabilityCard from '@/components/student/AccountabilityCard';
import ApprovalPipeline, { STAGE_INFO } from '@/components/student/ApprovalPipeline';
import {
  getCaseRecord,
  saveCaseRecord,
  submitCaseForReview,
  resubmitCase,
  updateUserProfile,
  getStaffDirectory,
  setSupervisorChoice,
} from '@/lib/firestore';
import type { CaseRecord, CaseSections, UserRole, StaffDirectoryEntry } from '@/types';
import { daysUntil, effectiveDeadline } from '@/lib/deadlines';
import { DEFAULT_SECTIONS, SECTION_KEYS, errorMessage, formSnapshot, reviewFeedback } from '@/lib/case-state';

// Defined once at module scope — see the same note in SupervisorDashboard.tsx.
const STUDENT_ROLES: UserRole[] = ['student'];

export default function StudentDashboard() {
  return (
    <AuthGuard allowedRoles={STUDENT_ROLES}>
      <Dashboard />
    </AuthGuard>
  );
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

  const [staff, setStaff] = useState<StaffDirectoryEntry[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [savingSupervisor, setSavingSupervisor] = useState(false);

  const uid = user?.uid;
  const profileCaseNumber = userProfile?.caseNumber;
  const profileStartYear = userProfile?.startYear;
  const profileClassYear = userProfile?.classYear;
  const isProfileSetup = !!profileCaseNumber;

  useEffect(() => {
    getStaffDirectory()
      .then(setStaff)
      .catch((err: unknown) => setStaffError('Couldn’t load the staff list: ' + errorMessage(err)));
  }, []);

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
        setLoadError('Failed to load your case: ' + errorMessage(err));
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
        // supervisorUid/Name are stamped at case creation from the student's
        // profile; later changes go through setSupervisorChoice, which keeps
        // the case in sync (and firestore.rules only allows it while the
        // case is a draft).
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
      showMessage('Couldn’t save: ' + errorMessage(err), false);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (await persist()) showMessage('Progress saved', true);
  };

  const handleSupervisorChange = async (directoryId: string) => {
    if (!user) return;
    const entry = staff.find((s) => s.id === directoryId) ?? null;
    setSavingSupervisor(true);
    try {
      await setSupervisorChoice(user.uid, entry, profileCaseNumber);
      setCaseRecord((prev) =>
        prev ? { ...prev, supervisorUid: entry?.uid, supervisorName: entry?.uid ? entry.name : undefined } : prev
      );
      await refreshProfile();
      showMessage(entry ? `Supervisor set to ${entry.name}` : 'Supervisor cleared', true);
    } catch (err: unknown) {
      showMessage('Couldn’t update your supervisor: ' + errorMessage(err), false);
    } finally {
      setSavingSupervisor(false);
    }
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
      showMessage('Submission failed: ' + errorMessage(err), false);
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
      showMessage('Couldn’t resubmit: ' + errorMessage(err), false);
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
  const feedback = reviewFeedback(caseRecord);
  const approvalStage = feedback.stage;
  const stageInfo = STAGE_INFO[approvalStage];

  const supervisorName = userProfile?.supervisorDirectoryName ?? userProfile?.assignedSupervisorName;
  const hasSupervisor = !!(userProfile?.supervisorDirectoryId || userProfile?.assignedSupervisorUid);
  const supervisorSignedUp = !!userProfile?.assignedSupervisorUid;
  const busy = submitting || saving;

  const deadline = effectiveDeadline(userProfile, caseRecord);
  const daysLeft = deadline ? daysUntil(deadline) : Infinity;

  const profileSection = (index: number) => (
    <ProfileSection
      index={index}
      userProfile={userProfile}
      caseNumber={caseNumber}
      onCaseNumberChange={setCaseNumber}
      startYear={startYear}
      onStartYearChange={setStartYear}
      classYear={classYear}
      onClassYearChange={setClassYear}
      staff={staff}
      staffError={staffError}
      savingSupervisor={savingSupervisor}
      supervisorLocked={approvalStage !== 'pending'}
      onSupervisorChange={handleSupervisorChange}
    />
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

        <ReviewFeedback feedback={feedback} busy={busy} submitting={submitting} onResubmit={handleResubmit} />

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

          <AccountabilityCard
            daysLeft={daysLeft}
            extensionReason={extensionReason}
            onExtensionReasonChange={setExtensionReason}
          />
        </section>

        {/* Review pipeline */}
        <section>
          <SectionHeader index={++n} eyebrow="Review" title="Approval pipeline" />
          <ApprovalPipeline
            stage={approvalStage}
            supervisorName={supervisorName}
            canSubmit={isProfileSetup && approvalStage === 'pending'}
            hasSupervisor={hasSupervisor}
            supervisorSignedUp={supervisorSignedUp}
            busy={busy}
            submitting={submitting}
            onSubmit={handleSubmitForReview}
          />
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

      <SiteFooter />

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
