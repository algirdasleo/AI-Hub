import { apiFetch } from "@/lib/fetcher";
import { ProjectConversation, ProjectConversationDTO } from "@shared/types/projects";
import { UIMessage } from "@shared/types/chat/message";
import { Result } from "@shared/utils/result";

export const projectConversationService = {
  async getProjectConversations(projectId: string): Promise<Result<ProjectConversation[]>> {
    const result = await apiFetch<ProjectConversationDTO[]>(`/api/projects/${projectId}/conversations`, {
      method: "GET",
    });

    if (result.isSuccess) {
      const conversations: ProjectConversation[] = result.value.map((conv) => ({
        id: conv.id,
        projectId: conv.project_id,
        userId: conv.user_id,
        title: conv.title,
        createdAt: new Date(conv.created_at),
        updatedAt: conv.updated_at ? new Date(conv.updated_at) : undefined,
        messages: [],
      }));
      return Result.ok(conversations);
    } else {
      return Result.fail(result.error);
    }
  },

  async getConversationMessages(projectId: string, conversationId: string) {
    return apiFetch<UIMessage[]>(`/api/projects/${projectId}/conversations/${conversationId}/messages`, {
      method: "GET",
    });
  },

  async createConversation(projectId: string, title: string) {
    return apiFetch<ProjectConversationDTO>(`/api/projects/${projectId}/conversations`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },

  async deleteConversation(projectId: string, conversationId: string) {
    return apiFetch<{ success: boolean; message: string }>(
      `/api/projects/${projectId}/conversations/${conversationId}`,
      {
        method: "DELETE",
      },
    );
  },
};
