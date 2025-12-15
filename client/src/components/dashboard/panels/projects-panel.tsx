"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectsList } from "@/components/dashboard/projects/projects-list";
import { ProjectDetailsView } from "@/components/dashboard/projects/project-details-view";
import { CreateProjectDialog } from "@/components/dashboard/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectsPanel({
  selectedConversationId,
  selectedProjectId,
  onNewConversation,
  onProjectSelect = () => {},
}: {
  selectedConversationId?: string;
  selectedProjectId?: string;
  onNewConversation?: () => void;
  onProjectSelect?: (projectId: string) => void;
} = {}) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { projects, createProject, deleteProject, addDocuments, deleteDocument } = useProjects([]);

  // Find the selected project from the projects list using selectedProjectId prop
  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : undefined;

  const handleCreateProject = async (name: string, description: string) => {
    try {
      await createProject(name, description);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Handle error silently or show user feedback
    }
  };

  const handleAddDocuments = async (files: File[]) => {
    if (!selectedProject) return;
    try {
      await addDocuments(selectedProject.id, files);
    } catch (error) {
      // Handle error silently or show user feedback
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedProject) return;
    try {
      await deleteDocument(selectedProject.id, documentId);
    } catch (error) {
      // Handle error silently or show user feedback
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      // Handle error silently or show user feedback
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {selectedProject ? (
        <ProjectDetailsView
          project={selectedProject}
          selectedConversationId={selectedConversationId}
          onBack={() => onProjectSelect("")}
          onAddDocuments={handleAddDocuments}
          onDeleteDocument={handleDeleteDocument}
          onNewChat={() => {}}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Projects</h2>
              <p className="text-muted-foreground mt-1">
                Create and manage your RAG projects with documents and AI chat
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          <ProjectsList
            projects={projects}
            onSelectProject={onProjectSelect}
            onDeleteProject={handleDeleteProject}
          />
        </>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
