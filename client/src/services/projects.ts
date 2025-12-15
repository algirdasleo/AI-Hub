import { apiFetch } from "@/lib/fetcher";

export interface ProjectDTO {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  documents: DocumentDTO[];
}

export interface DocumentDTO {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  status: string;
}

export const projectsService = {
  async createProject(name: string, description?: string) {
    return apiFetch<ProjectDTO>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },

  async getProjects() {
    return apiFetch<ProjectDTO[]>("/api/projects", {
      method: "GET",
    });
  },

  async getProject(projectId: string) {
    return apiFetch<ProjectDTO>(`/api/projects/${projectId}`, {
      method: "GET",
    });
  },

  async updateProject(projectId: string, name?: string, description?: string) {
    return apiFetch<ProjectDTO>(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    });
  },

  async deleteProject(projectId: string) {
    return apiFetch<{ success: boolean; message: string }>(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
  },

  async uploadDocument(projectId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      if (!process.env.NEXT_PUBLIC_SERVER_URL) {
        throw new Error("NEXT_PUBLIC_SERVER_URL not defined");
      }

      const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/projects/${projectId}/documents`;
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload document: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return { isSuccess: true, value: data };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { isSuccess: false, error: errorMsg };
    }
  },

  async deleteDocument(projectId: string, documentId: string) {
    return apiFetch<{ success: boolean; message: string }>(`/api/projects/${projectId}/documents/${documentId}`, {
      method: "DELETE",
    });
  },
};
