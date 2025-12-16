"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { MessageRole } from "@shared/types/chat/message";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "@/lib/markdown-components";
import { MODELS } from "@shared/config/models";
import "katex/dist/katex.min.css";

export interface Message {
  id: string;
  role: MessageRole;
  content?: string;
  isStreaming?: boolean;
  model?: string;
  modelId?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs?: number | null;
  stats?: {
    tokens_used: number;
    cost_usd: number;
    latency_ms: number | null;
  };
}

interface MessageDisplayProps {
  messages: Message[];
  modelName?: string;
  emptyStateMessage?: string;
  className?: string;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  isLoading?: boolean;
  error?: string | null;
  disableAnimation?: boolean;
}

export function MessageDisplay({
  messages,
  modelName,
  emptyStateMessage,
  className,
  messagesEndRef,
  isLoading = false,
  error = null,
}: MessageDisplayProps) {
  if (error) {
    return (
      <div className={`flex-1 min-h-0 overflow-hidden ${className || ""}`}>
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-0 overflow-hidden ${className || ""}`}>
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && !isLoading ? (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-sm">
                  {emptyStateMessage || `Start a conversation${modelName ? ` with ${modelName}` : ""}`}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`space-y-1 ${message.role === MessageRole.USER ? "text-right" : "text-left"}`}
                >
                  <div className="text-xs text-muted-foreground">
                    {message.role === MessageRole.USER
                      ? "You"
                      : message.model
                        ? MODELS[message.model]?.name || message.model
                        : modelName || "AI"}
                  </div>
                  {message.content ? (
                    message.role === MessageRole.USER ? (
                      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg inline-block max-w-[80%] text-sm">
                        {message.content}
                      </div>
                    ) : (
                      <div className="space-y-2 inline-block max-w-[90%]">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeKatex, rehypeSanitize]}
                            components={markdownComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        {(message.usage || message.stats) && (
                          <div className="text-xs text-muted-foreground pt-1">
                            {message.usage ? (
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex items-center gap-1 cursor-help"
                                  title={`Input: ${message.usage.inputTokens} • Output: ${message.usage.outputTokens} • Total: ${message.usage.totalTokens}`}
                                >
                                  <span>🎯</span>
                                  <span>{message.usage.totalTokens} tokens</span>
                                </div>
                                {message.latencyMs !== null && message.latencyMs !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span>⏱️</span>
                                    <span>{message.latencyMs}ms</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="space-x-2">
                                  {message.stats && message.stats.tokens_used > 0 && (
                                    <span>
                                      <span>🎯</span>
                                      <span>{message.stats.tokens_used} tokens</span>
                                    </span>
                                  )}
                                  {message.stats && message.stats.cost_usd > 0 && (
                                    <span>
                                      <span>💰</span>
                                      <span>${message.stats.cost_usd.toFixed(6)}</span>
                                    </span>
                                  )}
                                  {message.stats && message.stats.latency_ms !== null && (
                                    <span>
                                      <span>⏱️</span>
                                      <span>{message.stats.latency_ms}ms</span>
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-muted-foreground text-sm text-gray-500">...</p>
                  )}
                </div>
              ))
            )}
            {messagesEndRef && <div ref={messagesEndRef} />}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
