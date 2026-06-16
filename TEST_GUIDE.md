# Supervisor Dashboard Test Guide

## Quick Test Setup

### Test Accounts to Create

#### Supervisors (via `/supervisor-signup`)

1. **Supervisor 1**
   - Email: `supervisor1@test.edu`
   - Password: `Test1234!`
   - Name: `Dr. Davin Powdhar`
   - Role: **Supervisor 1**
   - Invite Code: (Check your `.env.local` for `NEXT_PUBLIC_CODE_SUPERVISOR1`)

2. **Supervisor 2**
   - Email: `supervisor2@test.edu`
   - Password: `Test1234!`
   - Name: `Dr. Windale`
   - Role: **Supervisor 2**
   - Invite Code: (Check your `.env.local` for `NEXT_PUBLIC_CODE_SUPERVISOR2`)

3. **Dr. Paul**
   - Email: `drpaul@test.edu`
   - Password: `Test1234!`
   - Name: `Dr. Paul`
   - Role: **Dr. Paul (Lead Supervisor)**
   - Invite Code: (Check your `.env.local` for `NEXT_PUBLIC_CODE_DRPAUL`)

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
     - Mark sections: All 5/5 complete
     - Save

3. **Student 3 - At Supervisor 2**
   - Email: `student3@test.edu`
   - Password: `Test1234!`
   - Name: `Carol Davis`
   - After signup, go to `/student` and enter:
     - Case Number: `DMT-2024-003`
     - Start Year: `2024`
     - Class Year: `3`
     - Primary Supervisor: `Dr. Davin Powdhar`
     - Mark sections: All 5/5 complete
     - Save

4. **Student 4 - At Dr. Paul**
   - Email: `student4@test.edu`
   - Password: `Test1234!`
   - Name: `David Wilson`
   - After signup, go to `/student` and enter:
     - Case Number: `DMT-2024-004`
     - Start Year: `2024`
     - Class Year: `3`
     - Primary Supervisor: `Dr. Davin Powdhar`
     - Mark sections: All 5/5 complete
     - Save

---

## Manual Case Status Setup

Since the approval system is being implemented, you'll need to manually update Firestore to set different approval statuses for testing:

### Firebase Console Steps:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to **Collections → cases**

#### Case 1: DMT-2024-001 (Pending - Student Not Submitted)
- **approvalStage**: `pending`
- **submitted**: `false`
- **sections**: All `false` or partial

#### Case 2: DMT-2024-002 (Supervisor 1 Review)
- **approvalStage**: `supervisor1`
- **submitted**: `true`
- **sections**: All `true`
- **supervisor1Approval**: 
  ```
  {
    approved: false
  }
  ```

#### Case 3: DMT-2024-003 (Supervisor 2 Review)
- **approvalStage**: `supervisor2`
- **submitted**: `true`
- **sections**: All `true`
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor2Name**: `Dr. Windale`
- **supervisor1Approval**: 
  ```
  {
    approved: true,
    approvedAt: <2 days ago>
  }
  ```

#### Case 4: DMT-2024-004 (Dr. Paul Review)
- **approvalStage**: `drpaul`
- **submitted**: `true`
- **sections**: All `true`
- **supervisor1Name**: `Dr. Davin Powdhar`
- **supervisor2Name**: `Dr. Windale`
- **supervisor1Approval**: 
  ```
  {
    approved: true,
    approvedAt: <3 days ago>
  }
  ```
- **supervisor2Approval**: 
  ```
  {
    approved: true,
    approvedAt: <1 day ago>
  }
  ```

---

## Testing the Supervisor Dashboard

### After Creating Test Accounts:

#### **Test as Supervisor 1**

1. Sign in to `/` with `supervisor1@test.edu` / `Test1234!`
2. You'll be redirected to `/supervisor`
3. You should see:
   - ✅ Orange "Supervisor 1" banner with your responsibilities
   - 4 case records in the table
   - **For DMT-2024-001**: Mark as "Pending" with "Awaiting Submission" status
   - **For DMT-2024-002**: Show "🟠 Accept for Review" button (ready to approve)
   - **For DMT-2024-003**: Show "Waiting for approval" (already approved by you)
   - **For DMT-2024-004**: Show "Waiting for approval" (already approved by you)

#### **Test as Supervisor 2**

1. Sign in with `supervisor2@test.edu` / `Test1234!`
2. Go to `/supervisor`
3. You should see:
   - ✅ Amber "Supervisor 2" banner with your responsibilities
   - 4 case records
   - **For DMT-2024-001 & 002**: No action buttons (not at your stage yet)
   - **For DMT-2024-003**: Show "🟡 Approve & Send to Dr. Paul" button
   - **For DMT-2024-004**: Show "Waiting for approval" (already approved by you)

#### **Test as Dr. Paul**

1. Sign in with `drpaul@test.edu` / `Test1234!`
2. Go to `/supervisor`
3. You should see:
   - ✅ Green "Dr. Paul" banner explaining final approval authority
   - 4 case records
   - **For DMT-2024-001, 002, 003**: No action buttons (Supervisor 2 hasn't approved yet)
   - **For DMT-2024-004**: Show "✅ Grant Final Approval" button (ready for final approval)

---

## What You're Testing

### ✅ Tiered Approval System
- [x] Supervisor 1 must approve first
- [x] Supervisor 2 can only act after Supervisor 1
- [x] Dr. Paul can only act after both supervisors
- [x] UI shows role-appropriate buttons only

### ✅ Student Submission
- [x] Students see only Supervisor 1 selection
- [x] Cannot select Supervisor 2 directly
- [x] Progress pipeline shows current stage

### ✅ Visibility
- [x] All supervisors see all student cases
- [x] Approval status clearly labeled
- [x] Role-specific instructions in banner

### ✅ Approval Tracking
- [x] Shows approval timestamps
- [x] Shows who approved (supervisor name)
- [x] Shows progression through stages

---

## Expected Visual Indicators

### Status Badges
- 🔘 **Pending** (gray) - Awaiting submission & Supervisor 1 review
- 🔘 **Supervisor 1** (orange) - Awaiting Supervisor 1 approval
- 🔘 **Supervisor 2** (amber) - Supervisor 1 approved, awaiting Supervisor 2
- 🔘 **Dr. Paul** (yellow) - Both supervisors approved, awaiting Dr. Paul
- 🔘 **Approved** (green) - Final approval granted

### Action Buttons (colored by role)
- Supervisor 1: Orange buttons
- Supervisor 2: Amber buttons  
- Dr. Paul: Green buttons

---

## Next Steps for Full Testing

Once the approval action handlers are wired up:

1. Click approval buttons and see cases advance
2. Test rejection flow (send back to pending)
3. Test approval rejection reasons
4. Verify timestamps update correctly
5. Test Dr. Paul revoke functionality

---

## Troubleshooting

**Can't see supervisor dashboard?**
- Make sure you've created the supervisor account via `/supervisor-signup`
- Check that the invite codes in `.env.local` match what you used

**Cases not appearing?**
- Make sure student accounts were created first
- Then manually create case records in Firestore with the student UIDs

**Buttons not showing?**
- Verify the approval status fields in Firestore are set correctly
- Make sure case `approvalStage` matches the button logic

