'use client';

import { useRef, useState } from 'react';
import Avatar from './Avatar';
import { fileToAvatarDataURL } from '@/lib/image';
import { updateUserProfile } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';

export default function AvatarUpload({ size = 96 }: { size?: number }) {
  const { userProfile, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userProfile) return null;

  const save = async (photoURL: string | null) => {
    setBusy(true);
    setError(null);
    try {
      await updateUserProfile(userProfile.uid, { photoURL: photoURL ?? '' });
      await refreshProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Couldn’t save your photo.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await save(await fileToAvatarDataURL(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Couldn’t read that image.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={userProfile.photoURL ? 'Change profile photo' : 'Upload profile photo'}
      >
        <Avatar name={userProfile.name} photoURL={userProfile.photoURL || undefined} size={size} />
        <span className="absolute inset-0 rounded-full bg-black/45 text-white text-xs font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          {busy ? 'Saving…' : userProfile.photoURL ? 'Change' : 'Add photo'}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-accent text-on-accent flex items-center justify-center shadow ring-2 ring-surface">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {userProfile.photoURL && !busy && (
        <button type="button" onClick={() => save(null)} className="text-xs text-muted hover:text-danger">
          Remove photo
        </button>
      )}
      {error && <p className="text-xs text-danger max-w-[12rem] text-center">{error}</p>}
    </div>
  );
}
