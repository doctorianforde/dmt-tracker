'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import DeadlineCountdown from '@/components/DeadlineCountdown';
import ProgressChecklist from '@/components/ProgressChecklist';
import {
  getCaseRecord,
  saveCaseRecord,
  updateUserProfile,
} from '@/lib/firestore';
import type { CaseRecord, CaseSections, ApprovalStage, ThemeChoice } from '@/types';
import { THEMES, THEME_ORDER } from '@/lib/themes';

const DEFAULT_SECTIONS: CaseSections = {
  intro: false,
  caseReport: false,
  discussion: false,
  conclusion: false,
  references: false,
};

const STAGE_CONFIG: Record<ApprovalStage, { label: string; color: string; step: number; emoji: string }> = {
  pending: { label: 'Not Yet Submitted', color: 'bg-slate-200', step: 0, emoji: '⏳' },
  supervisor1: { label: 'Supervisor 1 Reviewing', color: 'bg-orange-400', step: 1, emoji: '🟠' },
  supervisor2: { label: 'Supervisor 2 Reviewing', color: 'bg-amber-400', step: 2, emoji: '🟡' },
  drpaul: { label: 'Dr. Paul Reviewing', color: 'bg-yellow-300', step: 3, emoji: '🔆' },
  approved: { label: 'Approved!', color: 'bg-emerald-500', step: 4, emoji: '✅' },
};

const PIPELINE_STEPS: { stage: ApprovalStage; label: string; color: string }[] = [
  { stage: 'supervisor1', label: 'Supervisor 1', color: 'bg-orange-400' },
  { stage: 'supervisor2', label: 'Supervisor 2', color: 'bg-amber-400' },
  { stage: 'drpaul', label: 'Dr. Paul', color: 'bg-yellow-300' },
  { stage: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function StudentDashboard() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const { user, userProfile, refreshProfile } = useAuth();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [caseNumber, setCaseNumber] = useState('');
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [classYear, setClassYear] = useState(1);
  const [customDeadline, setCustomDeadline] = useState('');
  const [sections, setSections] = useState<CaseSections>(DEFAULT_SECTIONS);
  const [documentLink, setDocumentLink] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [showExtension, setShowExtension] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>('light');

  const isProfileSetup = !!userProfile?.caseNumber;
  const themeConfig = THEMES[theme];

  useEffect(() => {
    async function load() {
      if (!user || !userProfile) return;
      if (userProfile.theme) setTheme(userProfile.theme);
      if (userProfile.caseNumber) {
        setCaseNumber(userProfile.caseNumber);
        setStartYear(userProfile.startYear ?? new Date().getFullYear());
        setClassYear(userProfile.classYear ?? 1);
        const rec = await getCaseRecord(userProfile.caseNumber);
        if (rec) {
          setCaseRecord(rec);
          setSections(rec.sections ?? DEFAULT_SECTIONS);
          setDocumentLink(rec.documentLink ?? '');
          setCustomDeadline(rec.customDeadline ?? '');
          setExtensionReason(rec.extensionReason ?? '');
        }
      }
      setDataLoading(false);
    }
    load();
  }, [user, userProfile]);

  const showMessage = (text: string, ok: boolean) => {
    setSaveMessage({ text, ok });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!user || !userProfile || !caseNumber.trim()) return;
    setSaving(true);
    try {
      const payload: Partial<CaseRecord> = {
        studentUid: user.uid,
        studentName: userProfile.name,
        caseNumber: caseNumber.trim(),
        startYear,
        classYear,
        sections,
        submitted: !!documentLink.trim(),
        documentLink: documentLink.trim() || undefined,
        greenLight: caseRecord?.greenLight ?? false,
        approvalStage: caseRecord?.approvalStage ?? 'pending',
        customDeadline: customDeadline || undefined,
        extensionReason: extensionReason.trim() || undefined,
      };

      await saveCaseRecord(caseNumber.trim(), payload);
      await updateUserProfile(user.uid, {
        caseNumber: caseNumber.trim(),
        startYear,
        classYear,
        theme,
      });
      await refreshProfile();
      const updated = await getCaseRecord(caseNumber.trim());
      setCaseRecord(updated);
      showMessage('Progress saved! 🎉', true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showMessage('Error saving: ' + msg, false);
    } finally {
      setSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(sections).filter(Boolean).length;
  const completionPercent = Math.round((completedCount / 5) * 100);
  const firstName = userProfile?.name?.split(' ')[0] ?? 'Student';
  const approvalStage: ApprovalStage = caseRecord?.approvalStage ?? (caseRecord?.greenLight ? 'approved' : 'pending');
  const stageInfo = STAGE_CONFIG[approvalStage];

  // Check if deadline is within 30 days
  const deadlineDate = customDeadline ? new Date(customDeadline + 'T23:59:59') : new Date('2026-06-30T23:59:59');
  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const deadlineUrgent = daysLeft <= 30 && daysLeft > 0;

  // Input style helpers
  const inputClass = `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-shadow
    ${themeConfig.inputBg} ${themeConfig.inputBorder} ${themeConfig.inputFocus} ${themeConfig.inputText}`;

  const labelClass = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${themeConfig.labelColor}`;

  return (
    <div className={`min-h-screen ${themeConfig.pageBg}`}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className={`text-2xl font-bold ${themeConfig.headingColor}`}>
            {isProfileSetup ? `Welcome back, ${firstName} ${stageInfo.emoji}` : 'Set Up Your Profile'}
          </h1>
          <p className={`text-sm mt-1 ${themeConfig.mutedText}`}>
            {isProfileSetup
              ? `Case ${userProfile?.caseNumber} · Year ${userProfile?.classYear} · Started ${userProfile?.startYear}`
              : 'Complete your student profile below to begin tracking your case'}
          </p>
        </div>

        {/* Theme Picker */}
        <div className={`${themeConfig.cardBg} rounded-2xl border ${themeConfig.cardBorder} p-5`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${themeConfig.labelColor}`}>Choose Your Theme</p>
          <div className="flex flex-wrap gap-2">
            {THEME_ORDER.map((t) => {
              const tc = THEMES[t];
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                    ${theme === t
                      ? `border-current ${themeConfig.button.split(' ')[0].replace('bg-', 'text-').replace('-600', '-600')} bg-opacity-10 border-opacity-60`
                      : `border-slate-200 ${themeConfig.bodyText} hover:border-slate-300`
                    }`}
                >
                  <span>{tc.emoji}</span>
                  <span>{tc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DeadlineCountdown customDeadline={customDeadline || undefined} completionPercent={completionPercent} />

        {/* Approval Pipeline */}
        <div className={`${themeConfig.cardBg} rounded-2xl border ${themeConfig.cardBorder} p-6`}>
          <h2 className={`font-bold mb-4 ${themeConfig.headingColor}`}>Submission Progress</h2>
          <div className="flex items-center gap-1">
            {PIPELINE_STEPS.map((step, i) => {
              const isReached = STAGE_CONFIG[approvalStage].step > i;
              const isCurrent = approvalStage === step.stage;
              return (
                <div key={step.stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${isCurrent ? `${step.color} text-white scale-110 shadow-md` : ''}
                        ${isReached ? `${step.color} text-white` : 'bg-slate-200 text-slate-400'}
                      `}
                    >
                      {isReached || isCurrent ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-1 text-center leading-tight max-w-[60px] ${isCurrent ? themeConfig.headingColor : themeConfig.mutedText}`}>
                      {step.label}
                    </p>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded ${isReached ? step.color : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <p className={`text-xs mt-4 font-medium ${themeConfig.mutedText}`}>
            Current status: <span className={themeConfig.headingColor}>{stageInfo.emoji} {stageInfo.label}</span>
          </p>
        </div>

        {/* Approved banner */}
        {approvalStage === 'approved' && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="font-bold text-emerald-800">Case Approved! 🎉</p>
              <p className="text-emerald-600 text-sm mt-0.5">
                Dr. Paul has fully approved your case report submission.
              </p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className={`${themeConfig.cardBg} rounded-2xl border ${themeConfig.cardBorder} p-6 space-y-5`}>
          <h2 className={`font-bold ${themeConfig.headingColor}`}>Student Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Student Name</label>
              <div className={`px-4 py-3 ${themeConfig.inputBg} border ${themeConfig.inputBorder} rounded-xl text-sm font-medium ${themeConfig.bodyText}`}>
                {userProfile?.name}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Case Number</label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g. DMT-2024-001"
                disabled={isProfileSetup}
                className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              {isProfileSetup && (
                <p className={`text-xs mt-1.5 ${themeConfig.mutedText}`}>Case number is locked after first save</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Start Year</label>
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                min={2018}
                max={2030}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Class Year</label>
              <select
                value={classYear}
                onChange={(e) => setClassYear(Number(e.target.value))}
                className={`${inputClass} ${themeConfig.selectBg}`}
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Deadline for Submission</label>
              <input
                type="date"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                className={inputClass}
              />
              <p className={`text-xs mt-1.5 ${themeConfig.mutedText}`}>
                Leave blank to use the default deadline (June 30, 2026)
              </p>
            </div>
          </div>
        </div>

        {/* Case Sections - RED category */}
        <div className={`${themeConfig.cardBg} rounded-2xl border-2 border-red-300 p-6 space-y-5`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <h2 className={`font-bold ${themeConfig.headingColor}`}>Case Sections</h2>
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">Required</span>
              </div>
              <p className={`text-xs mt-0.5 ${themeConfig.mutedText}`}>Track completion of each section of your case report</p>
            </div>
            <span className={`text-sm tabular-nums font-semibold ${themeConfig.mutedText}`}>{completedCount} / 5</span>
          </div>
          <ProgressChecklist sections={sections} onChange={setSections} theme={themeConfig} />
        </div>

        {/* Document Submission */}
        <div className={`${themeConfig.cardBg} rounded-2xl border ${themeConfig.cardBorder} p-6 space-y-4`}>
          <div>
            <h2 className={`font-bold ${themeConfig.headingColor}`}>Case Document</h2>
            <p className={`text-xs mt-0.5 ${themeConfig.mutedText}`}>
              Paste a shared Google Drive, OneDrive, or Dropbox link to your case document
            </p>
          </div>

          <div>
            <label className={labelClass}>Document Share Link</label>
            <input
              type="url"
              value={documentLink}
              onChange={(e) => setDocumentLink(e.target.value)}
              placeholder="https://docs.google.com/... or https://onedrive.live.com/..."
              className={inputClass}
            />
          </div>

          {documentLink && (
            <a
              href={documentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Preview link →
            </a>
          )}

          <div className={`border ${themeConfig.cardBorder} ${themeConfig.inputBg} rounded-xl p-3 text-xs ${themeConfig.mutedText} space-y-1`}>
            <p className={`font-semibold ${themeConfig.bodyText}`}>How to share from Google Docs:</p>
            <p>File → Share → Copy link → set access to &quot;Anyone with the link&quot;</p>
          </div>
        </div>

        {/* Accountability Section */}
        {(deadlineUrgent || showExtension || extensionReason) && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h2 className="font-bold text-amber-900">Accountability Check</h2>
                <p className="text-sm text-amber-700 mt-1">
                  {daysLeft <= 14
                    ? `Your deadline is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}! Are you on track?`
                    : `Your deadline is approaching (${daysLeft} days). Let us know if you need an extension.`
                  }
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                Extension Reason (if deadline cannot be met)
              </label>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="If you cannot meet your deadline, please explain your reason here so your supervisors are informed..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-900 resize-none"
              />
              <p className="text-xs text-amber-600 mt-1.5">
                This will be saved with your case record and visible to supervisors.
              </p>
            </div>
          </div>
        )}

        {/* Show accountability toggle if not already urgent */}
        {!deadlineUrgent && !showExtension && !extensionReason && (
          <button
            onClick={() => setShowExtension(true)}
            className={`text-xs ${themeConfig.mutedText} hover:underline`}
          >
            Unable to meet deadline? Submit an extension reason →
          </button>
        )}

        {/* Save */}
        <div className="flex items-center gap-4 pb-8">
          <button
            onClick={handleSave}
            disabled={saving || !caseNumber.trim()}
            className={`${themeConfig.button} disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm text-sm`}
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {saveMessage.ok ? '' : '⚠ '}{saveMessage.text}
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
