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
import type { CaseRecord, CaseSections } from '@/types';

const DEFAULT_SECTIONS: CaseSections = {
  intro: false,
  caseReport: false,
  discussion: false,
  conclusion: false,
};

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
  const [sections, setSections] = useState<CaseSections>(DEFAULT_SECTIONS);
  const [documentLink, setDocumentLink] = useState('');

  const isProfileSetup = !!userProfile?.caseNumber;

  useEffect(() => {
    async function load() {
      if (!user || !userProfile) return;
      if (userProfile.caseNumber) {
        setCaseNumber(userProfile.caseNumber);
        setStartYear(userProfile.startYear ?? new Date().getFullYear());
        setClassYear(userProfile.classYear ?? 1);
        const rec = await getCaseRecord(userProfile.caseNumber);
        if (rec) {
          setCaseRecord(rec);
          setSections(rec.sections);
          setDocumentLink(rec.documentLink ?? '');
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
      };

      await saveCaseRecord(caseNumber.trim(), payload);
      await updateUserProfile(user.uid, {
        caseNumber: caseNumber.trim(),
        startYear,
        classYear,
      });
      await refreshProfile();
      const updated = await getCaseRecord(caseNumber.trim());
      setCaseRecord(updated);
      showMessage('Progress saved successfully!', true);
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
  const firstName = userProfile?.name?.split(' ')[0] ?? 'Student';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isProfileSetup ? `Welcome back, ${firstName}` : 'Set Up Your Profile'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isProfileSetup
              ? `Case ${userProfile?.caseNumber} · Year ${userProfile?.classYear} · Started ${userProfile?.startYear}`
              : 'Complete your student profile below to begin tracking your case'}
          </p>
        </div>

        <DeadlineCountdown />

        {caseRecord?.greenLight && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="font-bold text-emerald-800">Green Light Received</p>
              <p className="text-emerald-600 text-sm mt-0.5">
                Dr. Paul has approved your case report submission.
              </p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Student Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Student Name
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium">
                {userProfile?.name}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Case Number
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g. DMT-2024-001"
                disabled={isProfileSetup}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
              {isProfileSetup && (
                <p className="text-xs text-slate-400 mt-1.5">Case number is locked after first save</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Start Year
              </label>
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                min={2018}
                max={2030}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Class Year
              </label>
              <select
                value={classYear}
                onChange={(e) => setClassYear(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Case Sections</h2>
            <span className="text-sm text-slate-400 tabular-nums">{completedCount} / 4</span>
          </div>
          <ProgressChecklist sections={sections} onChange={setSections} />
        </div>

        {/* Document Submission */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">Case Document</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste a shared Google Drive, OneDrive, or Dropbox link to your case document
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Document Share Link
            </label>
            <input
              type="url"
              value={documentLink}
              onChange={(e) => setDocumentLink(e.target.value)}
              placeholder="https://docs.google.com/... or https://onedrive.live.com/..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
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

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600">How to share from Google Docs:</p>
            <p>File → Share → Copy link → set access to &quot;Anyone with the link&quot;</p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4 pb-8">
          <button
            onClick={handleSave}
            disabled={saving || !caseNumber.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm text-sm"
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {saveMessage.ok ? '✓ ' : '⚠ '}{saveMessage.text}
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
