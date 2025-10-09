import { supabaseServer } from "@server/db/supabase.js";
import { Tables } from "@server/db/tables.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { FeatureType } from "@shared/config/index.js";

export async function createComparisonConversation(userId: string, title?: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.COMPARISON_CONVERSATIONS)
      .insert([{ user_id: userId, title }])
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: "No comparison conversation data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error creating comparison conversation",
      details: error,
    });
  }
}

export async function insertComparisonPrompt(conversationId: string, content: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.COMPARISON_PROMPTS)
      .insert([{ conversation_id: conversationId, content }])
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0)
      return Result.fail({ type: ErrorType.DatabaseError, message: "No prompt returned" });

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({ type: ErrorType.DatabaseError, message: "Error inserting prompt", details: error });
  }
}

export async function insertComparisonOutput(promptId: string, model: string, role: string, content: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.COMPARISON_OUTPUTS)
      .insert([{ prompt_id: promptId, model, role, content }])
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0)
      return Result.fail({ type: ErrorType.DatabaseError, message: "No output returned" });

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({ type: ErrorType.DatabaseError, message: "Error inserting output", details: error });
  }
}

export async function insertComparisonOutputStats(
  outputId: string,
  tokensUsed: number,
  costUsd: number,
  latencyMs?: number,
) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.COMPARISON_OUTPUT_STATS)
      .insert([{ output_id: outputId, tokens_used: tokensUsed, cost_usd: costUsd, latency_ms: latencyMs }])
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0)
      return Result.fail({ type: ErrorType.DatabaseError, message: "No stats returned" });

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({ type: ErrorType.DatabaseError, message: "Error inserting output stats", details: error });
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
      p_type: FeatureType.COMPARISON,
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

export async function getUserComparisonConversations(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.COMPARISON_CONVERSATIONS)
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching user comparison conversations",
      details: error,
    });
  }
}

export async function getComparisonConversationPrompts(conversationId: string, userId: string) {
  try {
    const { data: conversation, error: convError } = await supabaseServer
      .from(Tables.COMPARISON_CONVERSATIONS)
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (convError || !conversation) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Comparison conversation not found or access denied",
      });
    }

    const { data: prompts, error: promptsError } = await supabaseServer
      .from(Tables.COMPARISON_PROMPTS)
      .select(
        `
        id,
        content,
        created_at,
        outputs:comparison_outputs(
          id,
          model,
          role,
          content,
          created_at
        )
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (promptsError) throw promptsError;

    return Result.ok(prompts || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching comparison conversation prompts",
      details: error,
    });
  }
}
