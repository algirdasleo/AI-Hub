"use client";

import { Project, Document } from "@shared/types/projects";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { DocumentsSection } from "./documents-section";
import { ProjectChatView } from "./project-chat-view";

interface ProjectDetailsViewProps {
  project: Project;
  onBack: () => void;
  onAddDocuments: (documents: Document[]) => void;
  onDeleteDocument: (documentId: string) => void;
}

export function ProjectDetailsView({
  project,
  onBack,
  onAddDocuments,
  onDeleteDocument,
}: ProjectDetailsViewProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="flex-1 flex flex-col overflow-hidden">
        <TabsList>
          <TabsTrigger value="documents">Documents ({project.documents.length})</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        {/* Content */}
        <TabsContent value="documents" className="flex-1 overflow-hidden mt-0">
          <DocumentsSection
            project={project}
            onAddDocuments={onAddDocuments}
            onDeleteDocument={onDeleteDocument}
          />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
          <ProjectChatView project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
