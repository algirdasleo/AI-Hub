"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectConversation } from "@shared/types/projects";
import { projectConversationService } from "@/services/project-conversation";
import { Result } from "@shared/utils/result";

export interface ProjectConversationItem {
  id: string;
  projectId: string;
  title: string;
  createdAt: Date;
}

export function useProjectConversations(projectId: string) {
  const [conversations, setConversations] = useState<ProjectConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!projectId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await projectConversationService.getProjectConversations(projectId);

      if (result.isSuccess) {
        setConversations(
          result.value.map((conv) => ({
            id: conv.id,
            projectId: conv.projectId,
            title: conv.title,
            createdAt: conv.createdAt,
          })),
        );
      } else {
        setError(result.error.message || "Failed to load conversations");
      }
    } catch {
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = async (title: string): Promise<Result<ProjectConversation>> => {
    try {
      const result = await projectConversationService.createConversation(projectId, title);

      if (result.isSuccess) {
        const newConv: ProjectConversationItem = {
          id: result.value.id,
          projectId: result.value.project_id,
          title: result.value.title,
          createdAt: new Date(result.value.created_at),
        };
        setConversations((prev) => [newConv, ...prev]);

        return Result.ok({
          id: result.value.id,
          projectId: result.value.project_id,
          userId: result.value.user_id,
          title: result.value.title,
          createdAt: new Date(result.value.created_at),
          updatedAt: result.value.updated_at ? new Date(result.value.updated_at) : undefined,
          messages: [],
        });
      } else {
        return Result.fail(result.error);
      }
    } catch (err) {
      return Result.fail({
        type: "DatabaseError" as const,
        message: `Failed to create project conversation`,
        details: err,
      });
    }
  };

  const deleteConversation = async (conversationId: string): Promise<Result<null>> => {
    try {
      const result = await projectConversationService.deleteConversation(projectId, conversationId);
      if (result.isSuccess) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
        return Result.ok(null);
      } else {
        return Result.fail(result.error);
      }
    } catch (err) {
      return Result.fail({
        type: "DatabaseError" as const,
        message: `Failed to delete project conversation`,
        details: err,
      });
    }
  };

  return {
    conversations,
    isLoading,
    error,
    loadConversations,
    createConversation,
    deleteConversation,
  };
}
