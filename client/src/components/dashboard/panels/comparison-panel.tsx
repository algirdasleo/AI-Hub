"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { MultiModelSelector } from "@/components/dashboard/shared/multi-model-selector";
import { ModelResponseCard } from "@/components/dashboard/shared/model-response-card";
import { ConversationHistoryItem } from "@/components/dashboard/shared/conversation-history-item";
import { MessageInput } from "@/components/dashboard/shared";
import { useComparisonPanel } from "@/hooks/useComparisonPanel";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODELS } from "@shared/config/models";
import type { ComparisonStreamParams } from "@shared/types/comparison/comparison-request";
import { transformComparisonPromptsToHistory } from "@/lib/comparison-utils";

export default function ComparisonPanel({ selectedConversationId }: { selectedConversationId?: string }) {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const {
    currentModels,
    history,
    isStreaming,
    conversationId,
    startComparison,
    stopComparison,
    resetConversation,
  } = useComparisonPanel(selectedConversationId);
  const {
    comparisonPrompts,
    isLoading: isLoadingHistory,
    refetch,
  } = useConversationMessages(selectedConversationId || conversationId || null, "comparison");

  const conversationHistory = transformComparisonPromptsToHistory(comparisonPrompts);

  useEffect(() => {
    if (conversationId && !isStreaming) {
      refetch();
    }
  }, [conversationId, isStreaming, refetch]);

  useEffect(() => {
    if (selectedConversationId === undefined) {
      setHasStarted(false);
      setCurrentPrompt("");
      setSelectedModelIds([]);
    }
  }, [selectedConversationId]);

  const shouldShowResults = hasStarted || (selectedConversationId && conversationHistory.length > 0);

  const handleModelToggle = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId],
    );
  };

  const handleStartComparison = async () => {
    if (!currentPrompt.trim() || selectedModelIds.length < 2) return;

    const comparisonParams: ComparisonStreamParams = {
      prompt: currentPrompt.trim(),
      useWebSearch,
      models: selectedModelIds.map((modelId) => ({
        provider: MODELS[modelId].provider,
        modelId,
        settings: {
          temperature: 0.7,
        },
      })),
    };

    setHasStarted(true);
    setCurrentPrompt(""); // Clear the input after sending
    await startComparison(comparisonParams);
  };

  const handleStopComparison = () => {
    stopComparison();
  };

  const handleNewComparison = () => {
    setHasStarted(false);
    setCurrentPrompt("");
    setSelectedModelIds([]);
    resetConversation();
  };

  const canStart = currentPrompt.trim() && selectedModelIds.length >= 2 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      {!shouldShowResults && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Model Comparison</h1>
              <p className="text-muted-foreground">Compare responses from multiple AI models side by side</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Models (2-3 models)</label>
                <MultiModelSelector
                  selectedModelIds={selectedModelIds}
                  onModelToggle={handleModelToggle}
                  maxModels={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Enter your prompt</label>
                <MessageInput
                  prompt={currentPrompt}
                  onPromptChange={setCurrentPrompt}
                  onSend={handleStartComparison}
                  isLoading={false}
                  useWebSearch={useWebSearch}
                  onWebSearchToggle={() => setUseWebSearch(!useWebSearch)}
                  placeholder="Enter a prompt to compare across models..."
                  className="w-full"
                  autoFocus={true}
                />
              </div>

              <Button onClick={handleStartComparison} disabled={!canStart} className="w-full" size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Comparison
              </Button>
            </div>
          </div>
        </div>
      )}

      {shouldShowResults && (
        <>
          <div className="border-b p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedConversationId ? "Comparison History" : "Model Comparisons"}
                </h2>
                {selectedConversationId && (
                  <p className="text-sm text-muted-foreground">Viewing selected conversation</p>
                )}
              </div>
              <div className="flex gap-2">
                {isStreaming ? (
                  <Button onClick={handleStopComparison} variant="destructive" size="sm">
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                ) : selectedConversationId ? (
                  <Button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("conversation");
                      window.history.replaceState({}, "", url.toString());
                      window.location.reload();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Start New Comparison
                  </Button>
                ) : (
                  <Button onClick={handleNewComparison} variant="outline" size="sm">
                    New Comparison
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* Show conversation history from database when we have a conversationId */}
                {conversationId && conversationHistory.length > 0 && !isLoadingHistory && (
                  <div className="space-y-4">
                    {conversationHistory.map((historyItem) => (
                      <ConversationHistoryItem key={historyItem.id} historyItem={historyItem} />
                    ))}
                  </div>
                )}

                {/* Show loading state */}
                {conversationId && isLoadingHistory && (
                  <div className="text-sm text-muted-foreground">Loading history...</div>
                )}

                {/* Show in-memory history only when we don't have a conversationId yet (initial state) */}
                {!conversationId &&
                  history
                    .filter((historyItem) => historyItem.isComplete)
                    .map((historyItem) => (
                      <ConversationHistoryItem key={historyItem.id} historyItem={historyItem} />
                    ))}

                {isStreaming && currentModels.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Currently comparing...
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Current Prompt:</p>
                        <p className="text-sm">
                          {history.find((item) => !item.isComplete)?.prompt || "Processing..."}
                        </p>
                      </div>
                    </div>
                    <div className={`grid gap-4 ${currentModels.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {currentModels.map((model) => (
                        <div key={model.modelId} className="max-h-96 overflow-hidden">
                          <ModelResponseCard model={model} isStreaming={isStreaming} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="border-t p-4 bg-background">
            <div className="max-w-4xl mx-auto">
              <MessageInput
                prompt={currentPrompt}
                onPromptChange={setCurrentPrompt}
                onSend={handleStartComparison}
                isLoading={isStreaming}
                useWebSearch={useWebSearch}
                onWebSearchToggle={() => setUseWebSearch(!useWebSearch)}
                placeholder="Enter a new prompt to compare..."
                className="w-full"
                autoFocus={true}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
