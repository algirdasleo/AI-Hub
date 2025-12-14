"use client";

import * as React from "react";
import {
  Command,
  Compass,
  Folder,
  GitCompare,
  MessageCircle,
  MessageCircleQuestion,
  Settings2,
} from "lucide-react";

import { NavConversations } from "@/components/dashboard/nav-conversations";
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
    // {
    //   title: "Tracking",
    //   url: "tracking",
    //   icon: ClipboardList,
    //   badge: "10",
    // },
  ],
  navSecondary: [
    //   {
    //     title: "Settings",
    //     url: "#",
    //     icon: Settings2,
    //   },
    //   {
    //     title: "Docs",
    //     url: "#",
    //     icon: MessageCircleQuestion,
    //   },
  ],
};

export function AppSidebar({
  currentView = "chat",
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  currentView?: string;
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
  onNewConversation?: () => void;
}) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      {currentView === "chat" || currentView === "comparison" ? (
        <SidebarContent>
          <NavConversations
            currentView={currentView}
            selectedConversationId={selectedConversationId}
            onConversationSelect={onConversationSelect}
            onNewConversation={onNewConversation}
          />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      ) : (
        <SidebarContent>
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
