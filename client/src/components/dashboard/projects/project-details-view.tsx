"use client";

import { useState, useEffect } from "react";
import { Project } from "@shared/types/projects";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { DocumentsSection } from "./documents-section";
import { ProjectChatView } from "./project-chat-view";

interface ProjectDetailsViewProps {
  project: Project;
  selectedConversationId?: string;
  onBack: () => void;
  onAddDocuments: (files: File[]) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onConversationSelect?: (conversationId: string) => void;
  onNewChat?: () => void;
}

export function ProjectDetailsView({
  project,
  selectedConversationId,
  onBack,
  onAddDocuments,
  onDeleteDocument,
  onConversationSelect,
  onNewChat,
}: ProjectDetailsViewProps) {
  const [activeTab, setActiveTab] = useState("documents");

  // Switch to chat tab when a conversation is selected, back to documents when cleared
  useEffect(() => {
    setActiveTab(selectedConversationId ? "chat" : "documents");
  }, [selectedConversationId]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        {activeTab === "chat" && onNewChat && (
          <Button variant="outline" size="sm" onClick={onNewChat}>
            New Chat
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList>
          <TabsTrigger value="documents">Documents ({project.documents.length})</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="flex-1 overflow-hidden mt-0">
          <DocumentsSection
            project={project}
            onAddDocuments={onAddDocuments}
            onDeleteDocument={onDeleteDocument}
          />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
          <ProjectChatView
            project={project}
            selectedConversationId={selectedConversationId}
            onConversationSelect={onConversationSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
