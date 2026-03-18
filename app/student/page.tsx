'use client';

import dynamic from 'next/dynamic';

const StudentDashboard = dynamic(
  () => import('@/components/StudentDashboard'),
  { ssr: false }
);

export default function StudentPage() {
  return <StudentDashboard />;
}
