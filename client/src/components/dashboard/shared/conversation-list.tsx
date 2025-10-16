"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, GitCompare, RefreshCw, AlertCircle } from "lucide-react";
import { useConversations, type ViewType, type ConversationItem } from "@/hooks/useConversations";
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

interface ConversationListProps {
  viewType: ViewType;
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export function ConversationList({
  viewType,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  className,
}: ConversationListProps) {
  const { conversations, isLoading, error, refetch } = useConversations(viewType);

  const getIcon = () => {
    return viewType === "chat" ? <MessageSquare className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />;
  };

  const getEmptyMessage = () => {
    return viewType === "chat"
      ? "No chat conversations yet. Start a new conversation to get started!"
      : "No comparison conversations yet. Create a comparison to get started!";
  };

  const getNewButtonText = () => {
    return viewType === "chat" ? "New Chat" : "New Comparison";
  };

  if (error) {
    return (
      <div className={`flex flex-col h-full ${className || ""}`}>
        <div className="p-4 border-b">
          <Button onClick={onNewConversation} className="w-full">
            {getIcon()}
            <span className="ml-2">{getNewButtonText()}</span>
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Header with New Conversation Button */}
      <div className="p-4 border-b">
        <Button onClick={onNewConversation} className="w-full">
          {getIcon()}
          <span className="ml-2">{getNewButtonText()}</span>
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <div className="mb-4">{getIcon()}</div>
                <p className="text-sm">{getEmptyMessage()}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversationId}
                    onClick={() => onConversationSelect(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: ConversationItem;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 ${
        isSelected ? "bg-muted" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(conversation.createdAt)}</p>
        </div>
        <div className="flex-shrink-0">
          {conversation.type === "chat" ? (
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
          ) : (
            <GitCompare className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </button>
  );
}
