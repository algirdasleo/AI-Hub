"use client";

import { useState } from "react";
import ChatPanel from "@/components/dashboard/panels/chat-panel";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ModelSelector, ModelSettingsPopover, type ModelSettings } from "@/components/dashboard/shared";

export default function ChatPage() {
  const [selectedModelId, setSelectedModelId] = useState("claude-sonnet-4-5");
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    temperature: 0.7,
    maxOutputTokens: undefined,
  });

  return (
    <DashboardLayout
      title="Chat"
      extraHeaderContent={
        <div className="flex items-center gap-2">
          <ModelSelector selectedModelId={selectedModelId} onModelSelect={setSelectedModelId} />
          <ModelSettingsPopover settings={modelSettings} onSettingsChange={setModelSettings} />
        </div>
      }
    >
      {({ selectedConversationId }) => (
        <ChatPanel
          selectedConversationId={selectedConversationId}
          selectedModelId={selectedModelId}
          modelSettings={modelSettings}
        />
      )}
    </DashboardLayout>
  );
}
