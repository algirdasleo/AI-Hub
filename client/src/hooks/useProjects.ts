"use client";

import { useState, useCallback, useEffect } from "react";
import type { Project, ProjectDTO, Document } from "@shared/types/projects";
import { projectsService } from "@/services/projects";

export function useProjects(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : undefined;

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await projectsService.getProjects();
      if (result.isSuccess) {
        const formattedProjects: Project[] = (result.value as ProjectDTO[]).map((proj) => ({
          id: proj.id,
          name: proj.name,
          description: proj.description,
          createdAt: proj.createdAt,
          documents: proj.documents.map((doc) => ({
            id: doc.id,
            name: doc.name,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
            type: doc.type || "application/octet-stream",
          })),
        }));
        setProjects(formattedProjects);
      } else {
        setError(result.error?.message || "Failed to load projects");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (name: string, description: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await projectsService.createProject(name, description);
      if (result.isSuccess) {
        const newProject: Project = {
          id: result.value.id,
          name: result.value.name,
          description: result.value.description || "",
          createdAt: result.value.createdAt,
          documents: [],
        };
        setProjects((prev) => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        return newProject;
      } else {
        setError(result.error?.message || "Failed to create project");
        throw result.error;
      }
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await projectsService.deleteProject(projectId);
        if (result.isSuccess) {
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
          if (selectedProjectId === projectId) {
            setSelectedProjectId(undefined);
          }
        } else {
          setError(result.error?.message || "Failed to delete project");
          throw result.error;
        }
      } catch (err) {
        setError(String(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedProjectId],
  );

  const addDocuments = useCallback(async (projectId: string, files: File[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const uploadedDocs: Document[] = [];

      for (const file of files) {
        const result = await projectsService.uploadDocument(projectId, file);

        if (result?.isSuccess) {
          const newDoc: Document = {
            id: result.value.documentId,
            name: result.value.fileName,
            size: result.value.fileSize,
            uploadedAt: new Date().toISOString(),
            type: file.type,
          };
          uploadedDocs.push(newDoc);
        } else {
          setError(`Failed to upload ${file.name}: ${result?.error}`);
        }
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, documents: [...p.documents, ...uploadedDocs] } : p)),
      );

      return uploadedDocs;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (projectId: string, documentId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await projectsService.deleteDocument(projectId, documentId);
      if (result.isSuccess) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, documents: p.documents.filter((d) => d.id !== documentId) } : p,
          ),
        );
      } else {
        setError(result.error?.message || "Failed to delete document");
        throw result.error;
      }
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
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
    isLoading,
    error,
  };
}
