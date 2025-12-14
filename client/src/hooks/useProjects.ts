"use client";

import { useState, useCallback } from "react";
import type { Project, Document } from "@shared/types/projects";

export function useProjects(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : undefined;

  const createProject = useCallback((name: string, description: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      documents: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    return newProject;
  }, []);

  const deleteProject = useCallback(
    (projectId: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(undefined);
      }
    },
    [selectedProjectId],
  );

  const addDocuments = useCallback((projectId: string, newDocuments: Document[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, documents: [...p.documents, ...newDocuments] } : p)),
    );
  }, []);

  const deleteDocument = useCallback((projectId: string, documentId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, documents: p.documents.filter((d) => d.id !== documentId) } : p,
      ),
    );
  }, []);

  return {
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    deleteProject,
    addDocuments,
    deleteDocument,
  };
}
