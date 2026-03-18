'use client';

import dynamic from 'next/dynamic';

const SupervisorDashboard = dynamic(
  () => import('@/components/SupervisorDashboard'),
  { ssr: false }
);

export default function SupervisorPage() {
  return <SupervisorDashboard />;
}
