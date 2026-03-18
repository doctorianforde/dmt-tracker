# DMT Case Tracker — Setup Guide

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing `dmt-tracker-a80f2`)
3. Enable these services:
   - **Authentication** → Email/Password sign-in
   - **Firestore Database** → Start in Production mode
   - **Storage** → Default bucket

## 2. Firebase Config

1. Project Settings → Your apps → Add web app
2. Copy the config values into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

## 4. Storage CORS (for file uploads)

In Firebase Console → Storage → Rules, use:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cases/{caseNumber}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 5. Create Supervisor Accounts

Supervisor accounts must be created manually (students self-register):

1. Go to Firebase Console → Authentication → Add user
2. Enter the supervisor's email and a temporary password
3. Go to Firestore → `users` collection → Create a document with the user's UID:

```json
{
  "name": "Dr. Paul",
  "email": "drpaul@university.edu",
  "role": "drpaul"
}
```

Valid roles: `student`, `supervisor1`, `supervisor2`, `drpaul`

## 6. Local Development

```bash
cd dmt-tracker
npm install
cp .env.local.example .env.local
# Fill in your Firebase values in .env.local
npm run dev
```

## 7. Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel project settings
4. Deploy — Vercel detects Next.js automatically

## User Flows

| Role | Login | Can Do |
|------|-------|--------|
| Student | Self-register | View/edit own profile, track sections, upload file |
| Supervisor 1 | Admin-created | View all student cases (read-only) |
| Supervisor 2 | Admin-created | View all student cases (read-only) |
| Dr. Paul | Admin-created | View all cases + give/revoke Green Light |
