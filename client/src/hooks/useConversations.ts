"use client";

import { useState, useEffect, useCallback } from "react";
import { chatService } from "@/services/chat";
import { comparisonService } from "@/services/comparison";
import { Conversation } from "@shared/types/chat/conversation";
import { ComparisonConversation } from "@shared/types/comparison/conversation";
import { Result } from "@shared/utils/result";

export type ViewType = "chat" | "comparison";

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: Date;
  type: ViewType;
}

export function useConversations(viewType: ViewType) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (viewType === "chat") {
        const result = await chatService.getConversations();
        if (result.isSuccess) {
          const chatConversations: ConversationItem[] = result.value.map((conv: Conversation) => ({
            id: conv.id,
            title: conv.title,
            createdAt: conv.createdAt,
            type: "chat" as const,
          }));
          setConversations(chatConversations);
        } else {
          setError(result.error.message || "Failed to load chat conversations");
        }
      } else if (viewType === "comparison") {
        const result = await comparisonService.getConversations();
        if (result.isSuccess) {
          const comparisonConversations: ConversationItem[] = result.value.map((conv: ComparisonConversation) => ({
            id: conv.id,
            title: conv.title || "Untitled Comparison",
            createdAt: conv.created_at,
            type: "comparison" as const,
          }));
          setConversations(comparisonConversations);
        } else {
          setError(result.error.message || "Failed to load comparison conversations");
        }
      }
    } catch (err) {
      setError(`Failed to load ${viewType} conversations`);
      console.error(`Error loading ${viewType} conversations:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [viewType]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const refetch = () => {
    loadConversations();
  };

  const deleteConversation = async (conversationId: string): Promise<Result<null>> => {
    try {
      if (viewType === "chat") {
        const result = await chatService.deleteConversation(conversationId);
        if (result.isSuccess) {
          setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
          return Result.ok(null);
        } else {
          return Result.fail(result.error);
        }
      } else if (viewType === "comparison") {
        const result = await comparisonService.deleteConversation(conversationId);
        if (result.isSuccess) {
          setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
          return Result.ok(null);
        } else {
          return Result.fail(result.error);
        }
      }
      return Result.fail({
        type: "DatabaseError" as const,
        message: "Invalid view type",
      });
    } catch (err) {
      return Result.fail({
        type: "DatabaseError" as const,
        message: `Failed to delete ${viewType} conversation`,
        details: err,
      });
    }
  };

  return {
    conversations,
    isLoading,
    error,
    refetch,
    deleteConversation,
  };
}
