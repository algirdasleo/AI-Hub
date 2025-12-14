"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ModelResponseCard } from "./model-response-card";
import { formatTimeAgo } from "@/lib/time-utils";
import type { ComparisonHistoryItem, ComparisonModel } from "@/hooks/useComparisonPanel";

interface ComparisonItemProps {
  historyItem?: ComparisonHistoryItem;
  prompt?: string;
  responses?: string[];
  timestamp?: Date;
  isComplete?: boolean;
  isStreaming?: boolean;
  currentModels?: ComparisonModel[];
}

export function ComparisonItem({
  historyItem,
  prompt,
  responses,
  timestamp,
  isComplete = true,
  isStreaming = false,
  currentModels = [],
}: ComparisonItemProps) {
  const displayPrompt = historyItem?.prompt || prompt || "";
  const displayResponses =
    isStreaming && currentModels.length > 0
      ? currentModels
      : historyItem?.models ||
        (responses || []).map((response, index) => ({
          modelId: `model-${index}`,
          modelName: `Model ${index + 1}`,
          provider: `provider-${index}`,
          content: response,
          isLoading: false,
        }));
  const displayTimestamp = historyItem?.timestamp || timestamp || new Date();
  const displayIsComplete = isStreaming ? false : (historyItem?.isComplete ?? isComplete);
  const displayIsStreaming = isStreaming || !displayIsComplete;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {displayIsStreaming && <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>}
              {displayIsStreaming && (
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Currently comparing...
                </span>
              )}
              {!displayIsStreaming && (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{formatTimeAgo(displayTimestamp)}</span>
                </>
              )}
            </div>
            <Badge variant={displayIsComplete ? "default" : "secondary"}>
              {displayIsComplete ? "Complete" : "In Progress"}
            </Badge>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">{displayIsStreaming ? "Current Prompt:" : "Prompt:"}</p>
            <p className="text-sm">{displayPrompt}</p>
          </div>
        </div>
        <div
          className={`grid gap-4 ${displayResponses.length === 2 ? "grid-cols-2" : displayResponses.length === 3 ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {displayResponses.map((model) => (
            <ModelResponseCard key={model.modelId} model={model} isStreaming={displayIsStreaming} />
          ))}
        </div>
      </div>
    </div>
  );
}
