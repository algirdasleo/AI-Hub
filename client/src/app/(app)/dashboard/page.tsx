"use client";

import { use, useEffect, useState } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import OverviewPanel from "@/components/dashboard/panels/overview-panel";
import ChatPanel from "@/components/dashboard/panels/chat-panel";
import ComparisonPanel from "@/components/dashboard/panels/comparison-panel";
import ProjectsPanel from "@/components/dashboard/panels/projects-panel";
import TrackingPanel from "@/components/dashboard/panels/tracking-panel";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModelSelector, ModelSettingsPopover, type ModelSettings } from "@/components/dashboard/shared";

function getViewFromUrl(): string {
  if (typeof window === "undefined") return "overview";
  return new URL(window.location.href).searchParams.get("view") || "overview";
}

export default function DashboardPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const params = searchParams ? use(searchParams) : undefined;
  const initialView = params?.view ?? getViewFromUrl();
  const [view, setView] = useState<string>(() => initialView);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

  const [selectedModelId, setSelectedModelId] = useState("claude-3-7-sonnet-latest");
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    temperature: 0.7,
    maxOutputTokens: undefined,
  });

  useEffect(() => {
    const onPop = () => setView(getViewFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setViewAndUrl = (next: string) => {
    setView(next);
    if (next !== view) {
      setSelectedConversationId(undefined);
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete("conversation");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <SidebarProvider>
      <AppSidebar
        onNavigate={(to) => setViewAndUrl(to)}
        currentView={view === "chat" ? "chat" : "comparison"}
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
                  <BreadcrumbPage className="line-clamp-1">
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Model selection for chat view */}
          {view === "chat" && (
            <div className="flex items-center gap-2">
              <ModelSelector selectedModelId={selectedModelId} onModelSelect={setSelectedModelId} />
              <ModelSettingsPopover settings={modelSettings} onSettingsChange={setModelSettings} />
            </div>
          )}
        </header>

        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-6xl px-4">
            {view === "overview" && <OverviewPanel />}
            {view === "chat" && (
              <ChatPanel
                selectedConversationId={selectedConversationId}
                selectedModelId={selectedModelId}
                modelSettings={modelSettings}
              />
            )}
            {view === "comparison" && <ComparisonPanel selectedConversationId={selectedConversationId} />}
            {view === "projects" && <ProjectsPanel />}
            {view === "tracking" && <TrackingPanel />}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
