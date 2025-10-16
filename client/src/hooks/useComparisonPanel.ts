"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { comparisonService } from "@/services/comparison";
import { SSEHandler } from "@/lib/sse-handler";
import { EventType } from "@shared/types/core/event-types";
import type { ComparisonStreamParams } from "@shared/types/comparison/comparison-request";

export interface ComparisonModel {
  modelId: string;
  modelName: string;
  provider: string;
  content: string;
  isLoading: boolean;
  error?: string;
  latencyMs?: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface ComparisonHistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  models: ComparisonModel[];
  isComplete: boolean;
}

export interface ComparisonResponse {
  currentModels: ComparisonModel[];
  history: ComparisonHistoryItem[];
  isStreaming: boolean;
  conversationId: string | undefined;
  startComparison: (params: ComparisonStreamParams) => Promise<void>;
  stopComparison: () => void;
  resetConversation: () => void;
}

export function useComparisonPanel(initialConversationId?: string): ComparisonResponse {
  const [currentModels, setCurrentModels] = useState<ComparisonModel[]>([]);
  const [history, setHistory] = useState<ComparisonHistoryItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const streamHandlerRef = useRef<SSEHandler | null>(null);
  const currentComparisonRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | undefined>(initialConversationId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (initialConversationId) {
      setConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  const startComparison = useCallback(async (params: ComparisonStreamParams) => {
    try {
      setIsStreaming(true);

      const comparisonId = Date.now().toString();
      currentComparisonRef.current = comparisonId;

      const initialModels: ComparisonModel[] = params.models.map((model) => ({
        modelId: model.modelId,
        modelName: model.modelId,
        provider: model.provider,
        content: "",
        isLoading: true,
      }));

      const newHistoryItem: ComparisonHistoryItem = {
        id: comparisonId,
        prompt: params.prompt,
        timestamp: new Date(),
        models: initialModels,
        isComplete: false,
      };

      setHistory((prev) => [...prev, newHistoryItem]);
      setCurrentModels(initialModels);

      const jobParams = {
        ...params,
        conversationId: conversationIdRef.current,
      };

      const jobResult = await comparisonService.createComparisonJob(jobParams);
      if (!jobResult.isSuccess) {
        throw new Error(jobResult.error.message);
      }

      if (jobResult.value.conversationId) {
        setConversationId(jobResult.value.conversationId);
        conversationIdRef.current = jobResult.value.conversationId;
      }

      const streamHandler = comparisonService.streamComparison(jobResult.value.uid);
      streamHandlerRef.current = streamHandler;

      streamHandler
        .on(EventType.TEXT, (data) => {
          const { modelId, text } = data;

          setCurrentModels((prev) =>
            prev.map((model) =>
              model.modelId === modelId
                ? {
                    ...model,
                    content: model.content + text,
                  }
                : model,
            ),
          );

          setHistory((prev) =>
            prev.map((item) =>
              item.id === comparisonId
                ? {
                    ...item,
                    models: item.models.map((model) =>
                      model.modelId === modelId ? { ...model, content: model.content + text } : model,
                    ),
                  }
                : item,
            ),
          );
        })
        .on(EventType.LATENCY_MS, (data) => {
          const { modelId, ms } = data;

          setCurrentModels((prev) =>
            prev.map((model) =>
              model.modelId === modelId
                ? {
                    ...model,
                    latencyMs: ms,
                  }
                : model,
            ),
          );

          setHistory((prev) =>
            prev.map((item) =>
              item.id === comparisonId
                ? {
                    ...item,
                    models: item.models.map((model) =>
                      model.modelId === modelId ? { ...model, latencyMs: ms } : model,
                    ),
                  }
                : item,
            ),
          );
        })
        .on(EventType.USAGE, (data) => {
          const { modelId, inputTokens, outputTokens, totalTokens } = data;

          const usage = { inputTokens, outputTokens, totalTokens };

          setCurrentModels((prev) =>
            prev.map((model) =>
              model.modelId === modelId
                ? {
                    ...model,
                    usage,
                  }
                : model,
            ),
          );

          setHistory((prev) =>
            prev.map((item) =>
              item.id === comparisonId
                ? {
                    ...item,
                    models: item.models.map((model) => (model.modelId === modelId ? { ...model, usage } : model)),
                  }
                : item,
            ),
          );
        })
        .on(EventType.COMPLETE, (data) => {
          if (data && "modelId" in data) {
            const { modelId } = data as { modelId: string };

            setCurrentModels((prev) =>
              prev.map((model) => (model.modelId === modelId ? { ...model, isLoading: false } : model)),
            );

            setHistory((prev) =>
              prev.map((item) =>
                item.id === comparisonId
                  ? {
                      ...item,
                      models: item.models.map((model) =>
                        model.modelId === modelId ? { ...model, isLoading: false } : model,
                      ),
                    }
                  : item,
              ),
            );

            setCurrentModels((currentModels) => {
              const allComplete = currentModels.every((model) => model.modelId === modelId || !model.isLoading);

              if (allComplete) {
                setIsStreaming(false);
                setHistory((prev) =>
                  prev.map((item) => (item.id === comparisonId ? { ...item, isComplete: true } : item)),
                );
              }

              return currentModels;
            });
          } else {
            setIsStreaming(false);

            setCurrentModels((prev) =>
              prev.map((model) => ({
                ...model,
                isLoading: false,
              })),
            );

            setHistory((prev) =>
              prev.map((item) =>
                item.id === comparisonId
                  ? {
                      ...item,
                      isComplete: true,
                      models: item.models.map((model) => ({ ...model, isLoading: false })),
                    }
                  : item,
              ),
            );
          }
        })
        .on(EventType.ERROR, (data) => {
          console.error("Comparison streaming error:", data);
          const { modelId, error } = data;

          setCurrentModels((prev) =>
            prev.map((model) =>
              model.modelId === modelId
                ? {
                    ...model,
                    isLoading: false,
                    error: error || "Streaming error occurred",
                  }
                : model,
            ),
          );

          setHistory((prev) =>
            prev.map((item) =>
              item.id === comparisonId
                ? {
                    ...item,
                    models: item.models.map((model) =>
                      model.modelId === modelId
                        ? { ...model, isLoading: false, error: error || "Streaming error occurred" }
                        : model,
                    ),
                  }
                : item,
            ),
          );
        })
        .onConnectionError((error) => {
          console.error("Connection error:", error);
          setCurrentModels((prev) =>
            prev.map((model) => ({
              ...model,
              isLoading: false,
              error: "Connection error occurred",
            })),
          );
          setIsStreaming(false);
        });
    } catch (error) {
      console.error("Failed to start comparison:", error);
      setCurrentModels((prev) =>
        prev.map((model) => ({
          ...model,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })),
      );
      setIsStreaming(false);
    }
  }, []);

  const stopComparison = useCallback(() => {
    if (streamHandlerRef.current) {
      streamHandlerRef.current.close();
      streamHandlerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentModels((prev) =>
      prev.map((model) => ({
        ...model,
        isLoading: false,
      })),
    );
  }, []);

  const resetConversation = useCallback(() => {
    setConversationId(undefined);
    setHistory([]);
    setCurrentModels([]);
  }, []);

  return {
    currentModels,
    history,
    isStreaming,
    conversationId: conversationId,
    startComparison,
    stopComparison,
    resetConversation,
  };
}
