"use client";

import ComparisonPanel from "@/components/dashboard/panels/comparison-panel";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function ComparisonPage() {
  return (
    <DashboardLayout title="Compare">
      {({ selectedConversationId }) => (
        <ComparisonPanel selectedConversationId={selectedConversationId} />
      )}
    </DashboardLayout>
  );
}
