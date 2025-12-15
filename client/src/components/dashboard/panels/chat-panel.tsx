"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useStreamingPanel from "@/hooks/useStreamingPanel";
import { chatService } from "@/services/chat";
import { MODELS } from "@shared/config/models";
import {
  MessageInput,
  MessageDisplay,
  useConversationMessages,
  type ModelSettings,
  type Message,
} from "@/components/dashboard/shared";

export default function ChatPanel({
  selectedConversationId,
  selectedModelId,
  modelSettings,
}: {
  selectedConversationId?: string;
  selectedModelId: string;
  modelSettings: ModelSettings;
}) {
  const [prompt, setPrompt] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages: streamingMessages,
    isLoading: isStreaming,
    sendMessage,
    newChat,
  } = useStreamingPanel(chatService, selectedConversationId);
  const {
    messages: conversationMessages,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useConversationMessages(selectedConversationId || null, "chat");

  // When viewing a conversation, merge history with new streaming messages
  // When starting a new chat, use only streaming messages
  const displayMessages = selectedConversationId
    ? [...conversationMessages, ...streamingMessages]
    : streamingMessages;
  const isLoading = selectedConversationId ? isLoadingHistory : isStreaming;

  useEffect(() => {
    if (selectedConversationId === undefined) {
      newChat();
      setHasStarted(false);
      setPrompt("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  const shouldShowInitialScreen = !hasStarted && !selectedConversationId && displayMessages.length === 0;

  const selectedModel = MODELS[selectedModelId];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  useEffect(() => {
    if (!selectedModel) {
      console.warn("No model selected or model not found:", selectedModelId);
    }
  }, [selectedModel, selectedModelId]);

  const handleSend = () => {
    if (!prompt.trim() || !selectedModel) return;
    sendMessage(prompt, {
      provider: selectedModel.provider,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      settings: modelSettings,
      useWebSearch,
    });
    setPrompt("");
    setHasStarted(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Initial Setup Screen - Show when no conversation selected and no messages */}
      {shouldShowInitialScreen ? (
        <div className="flex flex-col h-full">
          {/* Header - Model selection now in main dashboard header */}

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">What can I help you with?</h1>
                <p className="text-muted-foreground">
                  Start a conversation with {selectedModel?.name || "your AI assistant"}
                </p>
              </div>

              <MessageInput
                prompt={prompt}
                onPromptChange={setPrompt}
                onSend={handleSend}
                isLoading={isLoading}
                useWebSearch={useWebSearch}
                onWebSearchToggle={() => setUseWebSearch(!useWebSearch)}
                placeholder="Ask me anything..."
                className="w-full text-base"
                autoFocus={true}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left"
                  onClick={() => setPrompt("Explain a complex topic in simple terms")}
                >
                  <div className="font-medium">💡 Explain</div>
                  <div className="text-sm text-muted-foreground mt-1">Break down complex ideas</div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left"
                  onClick={() => setPrompt("Help me write something")}
                >
                  <div className="font-medium">✍️ Write</div>
                  <div className="text-sm text-muted-foreground mt-1">Create content or emails</div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left"
                  onClick={() => setPrompt("Analyze and provide insights")}
                >
                  <div className="font-medium">🔍 Analyze</div>
                  <div className="text-sm text-muted-foreground mt-1">Deep dive into topics</div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area - Only this part scrollable */}
          <MessageDisplay
            messages={displayMessages as Message[]}
            modelName={selectedModel?.name}
            messagesEndRef={messagesEndRef}
            isLoading={isLoading}
            error={historyError}
            disableAnimation={!!selectedConversationId}
          />

          {/* Input Area */}
          <div className="p-4 border-t">
            <MessageInput
              prompt={prompt}
              onPromptChange={setPrompt}
              onSend={handleSend}
              isLoading={isLoading}
              useWebSearch={useWebSearch}
              onWebSearchToggle={() => setUseWebSearch(!useWebSearch)}
              className="max-w-[75%] mx-auto"
              autoFocus={true}
            />
          </div>
        </>
      )}
    </div>
  );
}
