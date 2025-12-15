import { supabaseServer } from "@server/db/supabase.js";
import { Tables } from "@server/db/tables.js";
import { MessageRole } from "@shared/types/chat/index.js";
import { ErrorType, Result } from "@shared/utils/index.js";

export async function createProjectConversation(projectId: string, userId: string, title?: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECT_CONVERSATIONS)
      .insert([{ project_id: projectId, user_id: userId, title }])
      .select("id, project_id, user_id, title, created_at, updated_at");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: "No conversation data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error creating project conversation",
      details: error,
    });
  }
}

export async function addProjectMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  model?: string,
) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECT_MESSAGES)
      .insert([{ conversation_id: conversationId, role, content, model }])
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: "No message data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error adding project message",
      details: error,
    });
  }
}

export async function updateProjectMessageContent(messageId: string, content: string) {
  try {
    const { error } = await supabaseServer.from(Tables.PROJECT_MESSAGES).update({ content }).eq("id", messageId);

    if (error) throw error;

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error updating message content",
      details: error,
    });
  }
}

export async function insertProjectMessageStats(
  messageId: string,
  tokensUsed: number,
  costUsd: number,
  latencyMs?: number,
) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECT_MESSAGE_STATS)
      .insert([
        {
          message_id: messageId,
          tokens_used: tokensUsed,
          cost_usd: costUsd,
          latency_ms: latencyMs,
        },
      ])
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: "No message stats data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error inserting message stats",
      details: error,
    });
  }
}

export async function getProjectConversations(projectId: string, userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECT_CONVERSATIONS)
      .select("id, project_id, user_id, title, created_at, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching project conversations",
      details: error,
    });
  }
}

export async function getProjectConversationMessages(conversationId: string, projectId: string, userId: string) {
  try {
    const { data: conversation, error: convError } = await supabaseServer
      .from(Tables.PROJECT_CONVERSATIONS)
      .select("id")
      .eq("id", conversationId)
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (convError || !conversation) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Conversation not found or access denied",
      });
    }

    const { data, error } = await supabaseServer
      .from(Tables.PROJECT_MESSAGES)
      .select(
        `
        id,
        role,
        content,
        model,
        created_at,
        stats:project_message_stats(
          id,
          tokens_used,
          cost_usd,
          latency_ms
        )
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching conversation messages",
      details: error,
    });
  }
}

export async function deleteProjectConversation(conversationId: string, projectId: string, userId: string) {
  try {
    const { data: conversation, error: convError } = await supabaseServer
      .from(Tables.PROJECT_CONVERSATIONS)
      .select("id")
      .eq("id", conversationId)
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (convError || !conversation) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Conversation not found or access denied",
      });
    }

    const { error: deleteError } = await supabaseServer
      .from(Tables.PROJECT_CONVERSATIONS)
      .delete()
      .eq("id", conversationId);

    if (deleteError) throw deleteError;

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error deleting conversation",
      details: error,
    });
  }
}
