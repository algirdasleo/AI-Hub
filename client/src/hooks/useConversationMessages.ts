"use client";

import { useState, useEffect, useCallback } from "react";
import { chatService } from "@/services/chat";
import { comparisonService } from "@/services/comparison";
import { UIMessage } from "@shared/types/chat/message";
import { ComparisonPrompt } from "@shared/types/comparison/conversation";
import { type ViewType } from "./useConversations";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  model?: string;
  stats?: {
    tokens_used: number;
    cost_usd: number;
    latency_ms: number | null;
  };
}

interface DatabaseMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useConversationMessages(conversationId: string | null, viewType: ViewType) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [comparisonPrompts, setComparisonPrompts] = useState<ComparisonPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setComparisonPrompts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (viewType === "chat") {
        const result = await chatService.getMessages(conversationId);
        if (result.isSuccess) {
          const chatMessages: ConversationMessage[] = result.value.map((msg: DatabaseMessage | UIMessage) => {
            let content: string | undefined;

            if ("content" in msg && typeof msg.content === "string") {
              content = msg.content;
            } else if ("parts" in msg && msg.parts && msg.parts.length > 0) {
              const textPart = msg.parts.find((part) => part.type === "text");
              if (textPart && "text" in textPart) {
                content = textPart.text;
              }
            }

            const message: ConversationMessage = {
              id: msg.id,
              role: msg.role === "user" ? "user" : "assistant",
              content,
            };

            // Handle both single object and array of stats from Supabase
            if ("stats" in msg && msg.stats) {
              const statsData = Array.isArray(msg.stats) ? msg.stats[0] : msg.stats;
              if (statsData) {
                message.stats = statsData;
              }
            }

            return message;
          });
          setMessages(chatMessages);
          setComparisonPrompts([]);
        } else {
          setError(result.error.message || "Failed to load chat messages");
        }
      } else if (viewType === "comparison") {
        const result = await comparisonService.getMessages(conversationId);
        if (result.isSuccess) {
          setComparisonPrompts(result.value);

          const comparisonMessages: ConversationMessage[] = [];
          result.value.forEach((prompt: ComparisonPrompt) => {
            comparisonMessages.push({
              id: prompt.id,
              role: "user",
              content: prompt.content,
            });

            prompt.outputs.forEach((output) => {
              const message: ConversationMessage = {
                id: output.id,
                role: "assistant",
                content: output.content,
                model: output.model,
              };

              if (output.stats && output.stats.length > 0) {
                message.stats = {
                  tokens_used: output.stats[0].tokens_used,
                  cost_usd: output.stats[0].cost_usd,
                  latency_ms: output.stats[0].latency_ms,
                };
              }

              comparisonMessages.push(message);
            });
          });

          setMessages(comparisonMessages);
        } else {
          setError(result.error.message || "Failed to load comparison messages");
        }
      }
    } catch {
      setError(`Failed to load ${viewType} messages`);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, viewType]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    comparisonPrompts,
    isLoading,
    error,
    refetch: loadMessages,
  };
}
