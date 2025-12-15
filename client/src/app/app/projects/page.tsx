"use client";

import ProjectsPanel from "@/components/dashboard/panels/projects-panel";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function ProjectsPage() {
  return <DashboardLayout title="Projects">{(props) => <ProjectsPanel {...props} />}</DashboardLayout>;
}
