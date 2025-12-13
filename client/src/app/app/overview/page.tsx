"use client";

import OverviewPanel from "@/components/dashboard/panels/overview-panel";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();

  const handleNavigate = (view: string) => {
    router.push(`/app/${view}`);
  };

  return (
    <DashboardLayout title="Overview">
      <OverviewPanel onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
