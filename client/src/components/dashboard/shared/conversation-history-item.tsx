"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ModelResponseCard } from "./model-response-card";
import type { ComparisonHistoryItem } from "@/hooks/useComparisonPanel";

interface ConversationHistoryItemProps {
  historyItem?: ComparisonHistoryItem;
  prompt?: string;
  responses?: string[];
  timestamp?: Date;
  isComplete?: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ConversationHistoryItem({
  historyItem,
  prompt,
  responses,
  timestamp,
  isComplete = true,
}: ConversationHistoryItemProps) {
  const displayPrompt = historyItem?.prompt || prompt || "";
  const displayResponses =
    historyItem?.models ||
    (responses || []).map((response, index) => ({
      modelId: `model-${index}`,
      modelName: `Model ${index + 1}`,
      provider: `provider-${index}`,
      content: response,
      isLoading: false,
    }));
  const displayTimestamp = historyItem?.timestamp || timestamp || new Date();
  const displayIsComplete = historyItem?.isComplete ?? isComplete;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatTimeAgo(displayTimestamp)}</span>
            </div>
            <Badge variant={displayIsComplete ? "default" : "secondary"}>
              {displayIsComplete ? "Complete" : "In Progress"}
            </Badge>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Prompt:</p>
            <p className="text-sm">{displayPrompt}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={`grid gap-4 ${displayResponses.length === 2 ? "grid-cols-2" : displayResponses.length === 3 ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {displayResponses.map((model) => (
            <ModelResponseCard key={model.modelId} model={model} isStreaming={false} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
