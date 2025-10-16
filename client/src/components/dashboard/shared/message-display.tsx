"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { MessageRole } from "@shared/types/chat/message";

export interface Message {
  id: string;
  role: MessageRole;
  content?: string;
  isStreaming?: boolean;
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
                    {message.role === MessageRole.USER ? "You" : modelName || "AI"}
                  </div>
                  {message.content ? (
                    message.role === MessageRole.USER ? (
                      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg inline-block max-w-[80%] text-sm">
                        {message.content}
                      </div>
                    ) : (
                      <div className="bg-muted px-3 py-2 rounded-lg inline-block max-w-[90%]">
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    )
                  ) : (
                    <p className="text-muted-foreground text-sm">...</p>
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
