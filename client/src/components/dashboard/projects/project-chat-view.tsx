"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Project } from "@shared/types/projects";
import { Button } from "@/components/ui/button";
import { MessageInput, MessageDisplay, type Message } from "@/components/dashboard/shared";
import { MessageRole } from "@shared/types/chat/message";
import { AIProvider } from "@shared/config/model-schemas";
import { EventType } from "@shared/types/core/event-types";
import { ModelStreamTextData } from "@shared/types/comparison";
import { chatService } from "@/services/chat";
import { projectConversationService } from "@/services/project-conversation";
import { SSEHandler } from "@/lib/sse-handler";
import { UIMessage } from "@shared/types/chat/message";

interface ProjectChatViewProps {
  project: Project;
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

export function ProjectChatView({ project, selectedConversationId, onConversationSelect }: ProjectChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(selectedConversationId || null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseHandlerRef = useRef<SSEHandler | null>(null);

  const shouldShowInitialScreen = !hasStarted && messages.length === 0;

  const loadConversationMessages = useCallback(
    async (convId: string) => {
      try {
        setIsLoadingHistory(true);
        const result = await projectConversationService.getConversationMessages(project.id, convId);

        if (result.isSuccess) {
          const convertedMessages: Message[] = result.value.map((msg: UIMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.parts && msg.parts.length > 0 && msg.parts[0].type === "text" ? msg.parts[0].text : "",
            isStreaming: false,
          }));
          setMessages(convertedMessages);
        }
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [project.id],
  );

  // Load conversation history when selectedConversationId changes
  useEffect(() => {
    if (selectedConversationId) {
      loadConversationMessages(selectedConversationId);
      setConversationId(selectedConversationId);
      setHasStarted(true);
    }
  }, [selectedConversationId, loadConversationMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createMessage = (role: MessageRole, content: string, isStreaming: boolean = false): Message => ({
    id: Date.now().toString(),
    role,
    content,
    isStreaming,
  });

  const handleSend = useCallback(async () => {
    if (!prompt.trim()) return;

    const userMessage = createMessage(MessageRole.USER, prompt);
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setHasStarted(true);

    try {
      let currentConvId = conversationId;

      // Create a new conversation if needed
      if (!currentConvId) {
        const title = prompt.split("?")[0].split(" ").slice(0, 6).join(" ") || "Project Chat";
        const convResult = await projectConversationService.createConversation(project.id, title);

        if (convResult.isSuccess) {
          currentConvId = convResult.value.id;
          setConversationId(currentConvId);
          onConversationSelect?.(currentConvId);
        } else {
          throw new Error("Failed to create conversation");
        }
      }

      // Create chat job with projectId
      const jobResult = await chatService.createChatJob({
        prompt: prompt,
        conversationId: currentConvId,
        provider: AIProvider.OpenAI,
        modelId: "gpt-4-turbo",
        projectId: project.id,
        useWebSearch: false,
      });

      if (!jobResult.isSuccess) {
        throw new Error("Failed to create chat job");
      }

      const { uid } = jobResult.value;

      // Create assistant message placeholder
      const assistantMessage = createMessage(MessageRole.ASSISTANT, "", true);
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream response
      sseHandlerRef.current = chatService.streamChat(uid);
      let fullContent = "";

      sseHandlerRef.current
        .on(EventType.TEXT, (data: ModelStreamTextData) => {
          fullContent += data.text;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === MessageRole.ASSISTANT) {
              lastMsg.content = fullContent;
            }
            return updated;
          });
        })
        .on(EventType.COMPLETE, () => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === MessageRole.ASSISTANT) {
              lastMsg.isStreaming = false;
            }
            return updated;
          });
        })
        .onConnectionError((error: Event) => {
          setMessages((prev) => [
            ...prev,
            createMessage(MessageRole.ASSISTANT, "Sorry, I encountered an error. Please try again."),
          ]);
        });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        createMessage(MessageRole.ASSISTANT, "Sorry, I encountered an error. Please try again."),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, project.id, conversationId, onConversationSelect]);

  const handleNewChat = () => {
    setMessages([]);
    setPrompt("");
    setConversationId(null);
    setHasStarted(false);
  };

  if (!project.documents.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2 max-w-md">
          <div className="text-5xl mb-2">📄</div>
          <h3 className="font-semibold">No documents to chat with</h3>
          <p className="text-sm text-muted-foreground">Upload documents in the Documents tab to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {shouldShowInitialScreen ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Start chatting with your documents</h1>
              <p className="text-muted-foreground">
                Ask questions about the content of your {project.documents.length} uploaded file(s)
              </p>
            </div>

            <MessageInput
              prompt={prompt}
              onPromptChange={setPrompt}
              onSend={handleSend}
              isLoading={isLoading}
              useWebSearch={false}
              onWebSearchToggle={() => {}}
              placeholder="Ask a question about your documents..."
              className="w-full text-base"
              autoFocus={true}
            />

            <div className="grid grid-cols-2 gap-2 pt-4">
              {[
                { icon: "📋", title: "Summarize", prompt: "Summarize the key points from the documents" },
                { icon: "💡", title: "Insights", prompt: "What are the main insights?" },
                { icon: "📊", title: "Data", prompt: "Find specific data points or statistics" },
                { icon: "⚖️", title: "Compare", prompt: "Compare and contrast the documents" },
              ].map(({ icon, title, prompt: text }) => (
                <Button
                  key={title}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-start text-left text-sm"
                  onClick={() => setPrompt(text)}
                >
                  <div className="font-medium">
                    {icon} {title}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Loading conversation...</p>
            </div>
          ) : (
            <>
              <MessageDisplay
                messages={messages}
                modelName="Document Assistant"
                messagesEndRef={messagesEndRef}
                isLoading={isLoading}
                disableAnimation={false}
              />
              <div className="p-4 border-t">
                <MessageInput
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onSend={handleSend}
                  isLoading={isLoading}
                  useWebSearch={false}
                  onWebSearchToggle={() => {}}
                  className="max-w-[75%] mx-auto"
                  autoFocus={true}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
