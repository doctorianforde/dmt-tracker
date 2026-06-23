# DMT Case Tracker — Setup Guide

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing `dmt-tracker-a80f2`)
3. Enable these services:
   - **Authentication** → Email/Password sign-in
   - **Firestore Database** → Start in Production mode
   - **Storage** → Default bucket (optional — only needed if file uploads are enabled)

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

3. Add invite codes for supervisor sign-up:

```
NEXT_PUBLIC_CODE_SUPERVISOR=your-supervisor-invite-code
NEXT_PUBLIC_CODE_DRPAUL=your-drpaul-invite-code
```

## 3. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

## 4. Storage CORS (for file uploads)

If you enable file uploads, in Firebase Console → Storage → Rules, use:

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

Supervisor accounts must be created via `/supervisor-signup` (students self-register on `/`):

1. Go to `http://localhost:3000/supervisor-signup`
2. Fill in the supervisor's name, email, password, and the `NEXT_PUBLIC_CODE_SUPERVISOR` invite code
3. Repeat for Dr. Paul using the `NEXT_PUBLIC_CODE_DRPAUL` code

Valid roles in Firestore are: `student`, `supervisor`, `drpaul`.

## 6. Local Development

```bash
cd dmt-tracker
npm install
cp .env.local.example .env.local
# Fill in your Firebase values in .env.local
npm run dev
```

Available scripts:

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
npm run test     # Vitest
```

## 7. Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel project settings
4. Deploy — Vercel detects Next.js automatically

## User Flows

| Role | Login | Can Do |
|------|-------|--------|
| Student | Self-register on `/` | View/edit own profile and case, select supervisors, submit for review |
| Supervisor | Sign up via `/supervisor-signup` | View all cases, approve cases assigned by students |
| Dr. Paul | Sign up via `/supervisor-signup` | View all cases, grant/revoke final approval |
