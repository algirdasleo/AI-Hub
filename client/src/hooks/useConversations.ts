"use client";

import { useState, useEffect, useCallback } from "react";
import { chatService } from "@/services/chat";
import { comparisonService } from "@/services/comparison";
import { Conversation } from "@shared/types/chat/conversation";
import { ComparisonConversation } from "@shared/types/comparison/conversation";

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

  return {
    conversations,
    isLoading,
    error,
    refetch,
  };
}
