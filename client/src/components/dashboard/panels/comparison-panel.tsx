"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { MultiModelSelector } from "@/components/dashboard/shared/multi-model-selector";
import { ComparisonItem } from "@/components/dashboard/shared/comparison-item";
import { MessageInput } from "@/components/dashboard/shared";
import { useComparisonPanel } from "@/hooks/useComparisonPanel";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODELS } from "@shared/config/models";
import type { ComparisonStreamParams } from "@shared/types/comparison/comparison-request";
import { transformComparisonPromptsToHistory } from "@/lib/comparison-utils";

export default function ComparisonPanel({
  selectedConversationId,
  onNewConversation,
}: {
  selectedConversationId?: string;
  onNewConversation?: () => void;
}) {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
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

  // Load history once when a conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      setHistoryLoaded(true);
      refetch();
    } else {
      setHistoryLoaded(false);
    }
  }, [selectedConversationId, refetch]);

  useEffect(() => {
    if (selectedConversationId && comparisonPrompts.length > 0) {
      const uniqueModels = new Set<string>();
      comparisonPrompts.forEach((prompt) => {
        prompt.outputs.forEach((output) => {
          if (output.model) {
            uniqueModels.add(output.model);
          }
        });
      });
      setSelectedModelIds(Array.from(uniqueModels));
    }
  }, [selectedConversationId, comparisonPrompts]);

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
      conversationId: selectedConversationId || conversationId,
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

  const displayHistoryItems =
    selectedConversationId && historyLoaded ? conversationHistory : history.filter((h) => h.isComplete);

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
                      resetConversation();
                      onNewConversation?.();
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
                {selectedConversationId && isLoadingHistory && (
                  <div className="text-sm text-muted-foreground">Loading history...</div>
                )}

                {displayHistoryItems.map((historyItem) => (
                  <ComparisonItem key={historyItem.id} historyItem={historyItem} />
                ))}

                {isStreaming && currentModels.length > 0 && (
                  <ComparisonItem
                    prompt={history.find((item) => !item.isComplete)?.prompt || "Processing..."}
                    currentModels={currentModels}
                    isStreaming={true}
                  />
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
