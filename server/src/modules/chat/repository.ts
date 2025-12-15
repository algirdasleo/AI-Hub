import { supabaseServer } from "@server/db/supabase.js";
import { Tables } from "@server/db/tables.js";
import { MessageRole } from "@shared/types/chat/index.js";
import { ErrorType, Result } from "@shared/utils/index.js";
import { FeatureType } from "@shared/config/index.js";

export async function createChatConversation(userId: string, title?: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.CHAT_CONVERSATIONS)
      .insert([{ user_id: userId, title }])
      .select("id");

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
      message: "Error creating conversation",
      details: error,
    });
  }
}

export async function addMessage(conversationId: string, role: MessageRole, content: string, model?: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.CHAT_MESSAGES)
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
      message: "Error adding message",
      details: error,
    });
  }
}

export async function updateMessageContent(messageId: string, content: string) {
  try {
    const { error } = await supabaseServer.from(Tables.CHAT_MESSAGES).update({ content }).eq("id", messageId);

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

export async function insertChatMessageStats(
  messageId: string,
  tokensUsed: number,
  costUsd: number,
  latencyMs?: number,
) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.CHAT_MESSAGE_STATS)
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
        message: "No chat message stats data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error inserting chat message stats",
      details: error,
    });
  }
}

export async function updateUsageAggregates(
  model: string,
  userId: string,
  conversationId: string,
  tokensUsed: number,
  costUsd: number,
) {
  try {
    await supabaseServer.rpc("upsert_usage_per_model", {
      p_model: model,
      p_tokens: tokensUsed,
      p_cost: costUsd,
    });

    await supabaseServer.rpc("upsert_usage_user_model", {
      p_user_id: userId,
      p_model: model,
      p_tokens: tokensUsed,
      p_cost: costUsd,
      p_type: FeatureType.CHAT,
    });

    await supabaseServer.rpc("upsert_usage_conversation", {
      p_conversation_id: conversationId,
      p_tokens: tokensUsed,
      p_cost: costUsd,
    });

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error updating usage aggregates",
      details: error,
    });
  }
}

export async function getUserConversations(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.CHAT_CONVERSATIONS)
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching user conversations",
      details: error,
    });
  }
}

export async function getConversationMessages(conversationId: string, userId: string) {
  try {
    const { data: conversation, error: convError } = await supabaseServer
      .from(Tables.CHAT_CONVERSATIONS)
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (convError || !conversation) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Conversation not found or access denied",
      });
    }

    const { data, error } = await supabaseServer
      .from(Tables.CHAT_MESSAGES)
      .select(
        `
        id,
        role,
        content,
        model,
        created_at,
        stats:chat_message_stats(
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

export async function deleteChatConversation(conversationId: string, userId: string) {
  try {
    const { data: conversation, error: convError } = await supabaseServer
      .from(Tables.CHAT_CONVERSATIONS)
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (convError || !conversation) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Conversation not found or access denied",
      });
    }

    const { error: deleteError } = await supabaseServer
      .from(Tables.CHAT_CONVERSATIONS)
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
