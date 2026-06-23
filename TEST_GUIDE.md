# Supervisor Dashboard Test Guide

## Quick Test Setup

### Invite Codes

Check your `.env.local` for:

```
NEXT_PUBLIC_CODE_SUPERVISOR
NEXT_PUBLIC_CODE_DRPAUL
```

### Test Accounts to Create

#### Supervisors (via `/supervisor-signup`)

1. **Supervisor 1**
   - Email: `supervisor1@test.edu`
   - Password: `Test1234!`
   - Name: `Dr. Davin Powdhar`
   - Invite Code: `NEXT_PUBLIC_CODE_SUPERVISOR`

2. **Supervisor 2**
   - Email: `supervisor2@test.edu`
   - Password: `Test1234!`
   - Name: `Dr. Windale`
   - Invite Code: `NEXT_PUBLIC_CODE_SUPERVISOR`

3. **Dr. Paul**
   - Email: `drpaul@test.edu`
   - Password: `Test1234!`
   - Name: `Dr. Paul`
   - Invite Code: `NEXT_PUBLIC_CODE_DRPAUL`

#### Students (via main signup `/`)

1. **Student 1 - Pending**
   - Email: `student1@test.edu`
   - Password: `Test1234!`
   - Name: `Alice Johnson`
   - After signup, go to `/student` and enter:
     - Case Number: `DMT-2024-001`
     - Start Year: `2024`
     - Class Year: `4`
     - Primary Supervisor: `Dr. Davin Powdhar`
     - Mark sections: 2/5 complete
     - Save

2. **Student 2 - At Supervisor 1**
   - Email: `student2@test.edu`
   - Password: `Test1234!`
   - Name: `Bob Smith`
   - After signup, go to `/student` and enter:
     - Case Number: `DMT-2024-002`
     - Start Year: `2024`
     - Class Year: `4`
     - Primary Supervisor: `Dr. Davin Powdhar`
     - Secondary Supervisor: `Dr. Windale`
     - Mark sections: All 5/5 complete
     - Save, then click **Submit for Review**

3. **Student 3 - At Supervisor 2**
   - Email: `student3@test.edu`
   - Password: `Test1234!`
   - Name: `Carol Davis`
   - After signup, go to `/student` and enter:
     - Case Number: `DMT-2024-003`
     - Start Year: `2024`
     - Class Year: `3`
     - Primary Supervisor: `Dr. Davin Powdhar`
     - Secondary Supervisor: `Dr. Windale`
     - Mark sections: All 5/5 complete
     - Save, then click **Submit for Review**
   - Sign in as **Dr. Davin Powdhar** and approve the case to move it to Supervisor 2

4. **Student 4 - At Dr. Paul**
   - Email: `student4@test.edu`
   - Password: `Test1234!`
   - Name: `David Wilson`
   - After signup, go to `/student` and enter:
     - Case Number: `DMT-2024-004`
     - Start Year: `2024`
     - Class Year: `3`
     - Primary Supervisor: `Dr. Davin Powdhar`
     - Secondary Supervisor: `Dr. Windale`
     - Mark sections: All 5/5 complete
     - Save, then click **Submit for Review**
   - Sign in as **Dr. Davin Powdhar** and approve the case
   - Sign in as **Dr. Windale** and approve the case

---

## Manual Case Status Setup

If you prefer to set up cases manually in Firestore instead of clicking through the UI:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to **Collections → cases**

### Case 1: DMT-2024-001 (Pending - Student Not Submitted)
- **approvalStage**: `pending`
- **sections**: All `false` or partial

### Case 2: DMT-2024-002 (Supervisor 1 Review)
- **approvalStage**: `supervisor1`
- **sections**: All `true`
- **supervisor1Uid**: `<Dr. Davin's UID>`
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor1Approval**:
  ```
  { approved: false }
  ```

### Case 3: DMT-2024-003 (Supervisor 2 Review)
- **approvalStage**: `supervisor2`
- **sections**: All `true`
- **supervisor1Uid**: `<Dr. Davin's UID>`
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor2Uid**: `<Dr. Windale's UID>`
- **supervisor2Name**: `Dr. Windale`
- **supervisor1Approval**:
  ```
  { approved: true, approvedAt: <timestamp> }
  ```

### Case 4: DMT-2024-004 (Dr. Paul Review)
- **approvalStage**: `drpaul`
- **sections**: All `true`
- **supervisor1Uid**: `<Dr. Davin's UID>`
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor2Uid**: `<Dr. Windale's UID>`
- **supervisor2Name**: `Dr. Windale`
- **supervisor1Approval**:
  ```
  { approved: true, approvedAt: <timestamp> }
  ```
- **supervisor2Approval**:
  ```
  { approved: true, approvedAt: <timestamp> }
  ```

---

## Testing the Supervisor Dashboard

### After Creating Test Accounts:

#### **Test as Supervisor 1 (Dr. Davin Powdhar)**

1. Sign in to `/` with `supervisor1@test.edu` / `Test1234!`
2. You'll be redirected to `/supervisor`
3. You should see:
   - Generic Supervisor banner
   - 4 case records in the table
   - **For DMT-2024-001**: Mark as "Pending" with no action button
   - **For DMT-2024-002**: Show approval button (ready to approve)
   - **For DMT-2024-003**: Show "Waiting for approval" (already approved by you)
   - **For DMT-2024-004**: Show "Waiting for approval" (already approved by you)

#### **Test as Supervisor 2 (Dr. Windale)**

1. Sign in with `supervisor2@test.edu` / `Test1234!`
2. Go to `/supervisor`
3. You should see:
   - Generic Supervisor banner
   - 4 case records
   - **For DMT-2024-001 & 002**: No action buttons (not at your stage yet)
   - **For DMT-2024-003**: Show approval button
   - **For DMT-2024-004**: Show "Waiting for approval" (already approved by you)

#### **Test as Dr. Paul**

1. Sign in with `drpaul@test.edu` / `Test1234!`
2. Go to `/supervisor`
3. You should see:
   - Dr. Paul banner
   - 4 case records
   - **For DMT-2024-001, 002, 003**: No action buttons (both supervisors haven't approved yet)
   - **For DMT-2024-004**: Show "✅ Grant Final Approval" button

---

## What You're Testing

### ✅ Tiered Approval System
- [x] Supervisor 1 must approve first
- [x] Supervisor 2 can only act after Supervisor 1
- [x] Dr. Paul can only act after both supervisors
- [x] UI shows role-appropriate buttons only

### ✅ Student Submission
- [x] Students select Supervisor 1 (required) and Supervisor 2 (optional)
- [x] Students click "Submit for Review" to move case to Supervisor 1
- [x] Progress pipeline shows current stage

### ✅ Visibility
- [x] All supervisors see all student cases
- [x] Approval status clearly labeled
- [x] Role-specific instructions in banner

### ✅ Approval Tracking
- [x] Shows approval timestamps
- [x] Records per-supervisor approval objects
- [x] Shows progression through stages

---

## Expected Visual Indicators

### Status Badges
- 🔘 **Pending** (gray) - Awaiting student submission
- 🔘 **Supervisor 1** (orange) - Awaiting Supervisor 1 approval
- 🔘 **Supervisor 2** (amber) - Supervisor 1 approved, awaiting Supervisor 2
- 🔘 **Dr. Paul** (yellow) - Both supervisors approved, awaiting Dr. Paul
- 🔘 **Approved** (green) - Final approval granted

---

## Troubleshooting

**Can't see supervisor dashboard?**
- Make sure you've created the supervisor account via `/supervisor-signup`
- Check that the invite codes in `.env.local` match what you used

**Cases not appearing?**
- Make sure student accounts were created first
- Then manually create case records in Firestore with the student UIDs

**Buttons not showing?**
- Check the `approvalStage` in Firestore matches the logic
- Verify `supervisor1Approval.approved` is `true` for Supervisor 2 to see buttons
- Check that `supervisor1Uid`/`supervisor2Uid` match the signed-in supervisor's UID
