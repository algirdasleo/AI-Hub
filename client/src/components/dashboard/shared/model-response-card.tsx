"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from "lucide-react";
import { PrettyMarkdown } from "@/components/pretty-markdown";
import type { ComparisonModel } from "@/hooks/useComparisonPanel";

interface ModelResponseCardProps {
  model: ComparisonModel;
  isStreaming: boolean;
}

function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms}ms`;
}

export function ModelResponseCard({ model }: ModelResponseCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!model.isLoading || model.latencyMs) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [model.isLoading, model.latencyMs]);

  useEffect(() => {
    if (!model.isLoading) {
      setElapsedTime(0);
    }
  }, [model.isLoading]);

  const displayLatency = model.latencyMs || (model.isLoading ? elapsedTime : 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{model.modelName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {model.provider}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        {model.error ? (
          <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{model.error}</span>
          </div>
        ) : model.isLoading ? (
          <div className="space-y-3 flex flex-col h-full">
            <div className="text-sm overflow-y-auto max-h-80 flex-1">
              {model.content ? (
                <PrettyMarkdown content={model.content} />
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 shrink-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 animate-spin" />
                <span className="text-xs">{model.content ? "Generating..." : "Starting generation..."}</span>
              </div>
              {displayLatency > 0 && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium">
                  <Clock className={`h-3 w-3 ${!model.latencyMs && model.isLoading ? "animate-pulse" : ""}`} />
                  <span>
                    {formatLatency(displayLatency)}
                    {!model.latencyMs && model.isLoading && <span className="opacity-60">*</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : model.content ? (
          <div className="space-y-2">
            <div className="text-sm overflow-y-auto max-h-80">
              <PrettyMarkdown content={model.content} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Complete</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                {model.latencyMs && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatLatency(model.latencyMs)}</span>
                  </div>
                )}
                {model.usage && (
                  <div
                    className="flex items-center gap-1 cursor-help"
                    title={`Input: ${model.usage.inputTokens} • Output: ${model.usage.outputTokens} • Total: ${model.usage.totalTokens}`}
                  >
                    <span>🎯</span>
                    <span>{model.usage.totalTokens} tokens</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm italic">No response generated</div>
        )}
      </CardContent>
    </Card>
  );
}
