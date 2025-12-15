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

// Helper to update model in currentModels array
const updateCurrentModel = (
  models: ComparisonModel[],
  modelId: string,
  updater: (model: ComparisonModel) => Partial<ComparisonModel>,
) => models.map((model) => (model.modelId === modelId ? { ...model, ...updater(model) } : model));

// Helper to update model in history
const updateHistoryModel = (
  history: ComparisonHistoryItem[],
  comparisonId: string,
  modelId: string,
  updater: (model: ComparisonModel) => Partial<ComparisonModel>,
) =>
  history.map((item) =>
    item.id === comparisonId ? { ...item, models: updateCurrentModel(item.models, modelId, updater) } : item,
  );

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
    setConversationId(initialConversationId);
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
          setCurrentModels((prev) => updateCurrentModel(prev, modelId, (m) => ({ content: m.content + text })));
          setHistory((prev) =>
            updateHistoryModel(prev, comparisonId, modelId, (m) => ({ content: m.content + text })),
          );
        })
        .on(EventType.LATENCY_MS, (data) => {
          const { modelId, ms } = data;
          setCurrentModels((prev) => updateCurrentModel(prev, modelId, () => ({ latencyMs: ms })));
          setHistory((prev) => updateHistoryModel(prev, comparisonId, modelId, () => ({ latencyMs: ms })));
        })
        .on(EventType.USAGE, (data) => {
          const { modelId, inputTokens, outputTokens, totalTokens } = data;
          const usage = { inputTokens, outputTokens, totalTokens };
          setCurrentModels((prev) => updateCurrentModel(prev, modelId, () => ({ usage })));
          setHistory((prev) => updateHistoryModel(prev, comparisonId, modelId, () => ({ usage })));
        })
        .on(EventType.COMPLETE, (data) => {
          if (data && "modelId" in data) {
            const { modelId } = data as { modelId: string };
            setCurrentModels((prev) => updateCurrentModel(prev, modelId, () => ({ isLoading: false })));
            setHistory((prev) => updateHistoryModel(prev, comparisonId, modelId, () => ({ isLoading: false })));

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
            setCurrentModels((prev) => prev.map((model) => ({ ...model, isLoading: false })));
            setHistory((prev) =>
              prev.map((item) =>
                item.id === comparisonId
                  ? { ...item, isComplete: true, models: item.models.map((m) => ({ ...m, isLoading: false })) }
                  : item,
              ),
            );
          }
        })
        .on(EventType.ERROR, (data) => {
          const { modelId, error } = data;
          const errorMsg = error || "Streaming error occurred";
          setCurrentModels((prev) =>
            updateCurrentModel(prev, modelId, () => ({ isLoading: false, error: errorMsg })),
          );
          setHistory((prev) =>
            updateHistoryModel(prev, comparisonId, modelId, () => ({ isLoading: false, error: errorMsg })),
          );
        })
        .onConnectionError((error) => {
          setCurrentModels((prev) =>
            prev.map((model) => ({ ...model, isLoading: false, error: "Connection error occurred" })),
          );
          setIsStreaming(false);
        });
    } catch (error) {
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
    conversationIdRef.current = undefined;
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
