"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectsList } from "@/components/dashboard/projects/projects-list";
import { ProjectDetailsView } from "@/components/dashboard/projects/project-details-view";
import { CreateProjectDialog } from "@/components/dashboard/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const INITIAL_PROJECTS = [
  {
    id: "1",
    name: "Q3 Financial Report",
    description: "Analysis of quarterly financial statements",
    createdAt: new Date().toISOString(),
    documents: [],
  },
];

export default function ProjectsPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const {
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    deleteProject,
    addDocuments,
    deleteDocument,
  } = useProjects(INITIAL_PROJECTS);

  const handleCreateProject = (name: string, description: string) => {
    createProject(name, description);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {selectedProject ? (
        <ProjectDetailsView
          project={selectedProject}
          onBack={() => setSelectedProjectId(undefined)}
          onAddDocuments={(docs) => addDocuments(selectedProject.id, docs)}
          onDeleteDocument={(docId) => deleteDocument(selectedProject.id, docId)}
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
            onSelectProject={setSelectedProjectId}
            onDeleteProject={deleteProject}
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
