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

3. Add the invite codes (server-only — never shipped to the browser). Keep
   them different from each other — whichever one is submitted determines the
   account's role:

```
SUPERVISOR_INVITE_CODE=your-supervisor-invite-code
DRPAUL_INVITE_CODE=your-drpaul-invite-code
```

4. Generate a service-account key for the Admin SDK: Project Settings → Service
   Accounts → Generate new private key. Add its values to `.env.local`:

```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

This credential is privileged — it bypasses `firestore.rules` entirely. Never
commit it or expose it as a `NEXT_PUBLIC_*` variable.

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

## 5. Create Supervisor / Dr. Paul Accounts

Students self-register on `/`. Staff accounts (supervisor and Dr. Paul) work
differently, since they need to be gated by an invite code without exposing
that code to the browser — `/supervisor-signup` posts to a server-side API
route (`/api/supervisor-signup`) that checks the submitted code against both
`SUPERVISOR_INVITE_CODE` and `DRPAUL_INVITE_CODE` and creates the account
with the Firebase Admin SDK. The role is whichever code matched — the client
never sends a role directly, so there's nothing to spoof by editing the form:

1. Go to `http://localhost:3000/supervisor-signup`
2. Fill in the name, email, password, and invite code
3. Entering `SUPERVISOR_INVITE_CODE` creates a `supervisor`; entering
   `DRPAUL_INVITE_CODE` creates `drpaul`

`scripts/create-supervisor.mjs` still works as a fallback for one-off admin
provisioning directly via the Admin SDK, bypassing invite codes entirely:

```bash
# Edit the ACCOUNT object in scripts/create-supervisor.mjs first
node --env-file=.env.local scripts/create-supervisor.mjs
```

Valid roles in Firestore are: `student`, `supervisor`, `drpaul`. `firestore.rules`
only lets a client create their own profile with `role: 'student'` — anything
else has to go through the Admin SDK, which bypasses the rules by design.

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
3. Add all `NEXT_PUBLIC_FIREBASE_*` variables, `SUPERVISOR_INVITE_CODE`,
   `DRPAUL_INVITE_CODE`, and the three `FIREBASE_ADMIN_*` variables, in Vercel
   project settings. Paste `FIREBASE_ADMIN_PRIVATE_KEY` exactly as it appears
   in the downloaded JSON (Vercel's env var editor handles the embedded
   newlines fine).
4. Deploy — Vercel detects Next.js automatically

## User Flows

| Role | Login | Can Do |
|------|-------|--------|
| Student | Self-register on `/` | View/edit own profile and case, select supervisors, submit for review |
| Supervisor | Sign up via `/supervisor-signup` with `SUPERVISOR_INVITE_CODE` | View all cases, approve cases assigned by students |
| Dr. Paul | Sign up via `/supervisor-signup` with `DRPAUL_INVITE_CODE` | View all cases, grant/revoke final approval |
