"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ModelResponseCard } from "./model-response-card";
import type { ComparisonHistoryItem } from "@/hooks/useComparisonPanel";

interface ComparisonHistoryItemProps {
  historyItem: ComparisonHistoryItem;
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

export function ComparisonHistoryItemComponent({ historyItem }: ComparisonHistoryItemProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatTimeAgo(historyItem.timestamp)}</span>
            </div>
            <Badge variant={historyItem.isComplete ? "default" : "secondary"}>
              {historyItem.isComplete ? "Complete" : "In Progress"}
            </Badge>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Prompt:</p>
            <p className="text-sm">{historyItem.prompt}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`grid gap-4 ${historyItem.models.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {historyItem.models.map((model) => (
            <ModelResponseCard key={model.modelId} model={model} isStreaming={false} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
