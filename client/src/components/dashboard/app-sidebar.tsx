"use client";

import * as React from "react";
import { Command, Compass, Folder, GitCompare, MessageCircle } from "lucide-react";

import { NavConversations } from "@/components/dashboard/nav-conversations";
import { NavProjects } from "@/components/dashboard/nav-projects";
import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { TeamSwitcher } from "@/components/dashboard/team-switcher";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

const data = {
  teams: [
    {
      name: "AI Hub",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "overview",
      icon: Compass,
    },
    {
      title: "Chat",
      url: "chat",
      icon: MessageCircle,
    },
    {
      title: "Compare",
      url: "comparison",
      icon: GitCompare,
    },
    {
      title: "Projects",
      url: "projects",
      icon: Folder,
    },
  ],
  navSecondary: [],
};

export function AppSidebar({
  currentView = "chat",
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  selectedProjectId,
  onProjectSelect,
  onProjectConversationSelect,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  currentView?: string;
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
  onNewConversation?: () => void;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  onProjectConversationSelect?: (projectId: string, conversationId: string) => void;
}) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        {currentView === "chat" || currentView === "comparison" ? (
          <NavConversations
            currentView={currentView}
            selectedConversationId={selectedConversationId}
            onConversationSelect={onConversationSelect}
            onNewConversation={onNewConversation}
          />
        ) : currentView === "projects" ? (
          <NavProjects
            selectedProjectId={selectedProjectId}
            selectedConversationId={selectedConversationId}
            onProjectSelect={onProjectSelect}
            onConversationSelect={onProjectConversationSelect}
          />
        ) : null}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
