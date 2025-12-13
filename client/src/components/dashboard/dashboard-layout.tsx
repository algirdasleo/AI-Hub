"use client";

import { ReactNode, useState } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export interface DashboardLayoutProps {
  children: ReactNode | ((props: { selectedConversationId?: string }) => ReactNode);
  title: string;
  extraHeaderContent?: ReactNode;
}

export function DashboardLayout({ children, title, extraHeaderContent }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

  // Extract view from pathname: /app/chat -> chat, /app/overview -> overview
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentView = pathSegments[pathSegments.length - 1] || "overview";

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        currentView={currentView}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 pt-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {extraHeaderContent}
        </header>

        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-6xl px-4">
            {typeof children === "function" ? children({ selectedConversationId }) : children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
