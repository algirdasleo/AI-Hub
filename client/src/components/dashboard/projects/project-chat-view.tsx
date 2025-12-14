"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Project } from "@shared/types/projects";
import { Button } from "@/components/ui/button";
import { MessageInput, MessageDisplay, type Message } from "@/components/dashboard/shared";
import { MessageRole } from "@shared/types/chat/message";

interface ProjectChatViewProps {
  project: Project;
}

export function ProjectChatView({ project }: ProjectChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shouldShowInitialScreen = !hasStarted && messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createMessage = (role: MessageRole, content: string): Message => ({
    id: Date.now().toString(),
    role,
    content,
    isStreaming: false,
  });

  const handleSend = useCallback(async () => {
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, createMessage(MessageRole.USER, prompt)]);
    setPrompt("");
    setIsLoading(true);
    setHasStarted(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessages((prev) => [
        ...prev,
        createMessage(
          MessageRole.ASSISTANT,
          `I've reviewed the documents in your "${project.name}" project. Based on the ${project.documents.length} file(s), I can help you analyze and extract information. What would you like to know?`,
        ),
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        createMessage(MessageRole.ASSISTANT, "Sorry, I encountered an error. Please try again."),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, project.name, project.documents.length]);

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
    </div>
  );
}
