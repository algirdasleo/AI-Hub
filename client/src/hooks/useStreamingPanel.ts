import { useState, useRef, useEffect } from "react";
import { EventType } from "@shared/types/core/event-types";
import { MessageRole } from "@shared/types/chat/message";
import { SSEHandler } from "@/lib/sse-handler";
import type { ChatStreamParams, ChatJobResponse } from "@shared/types/chat";
import type { Result } from "@shared/utils";
import type { ModelStreamTextData, ModelStreamErrorData, ModelStreamUsageData } from "@shared/types/comparison";
import { AIProvider } from "@shared/config/model-schemas";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs?: number | null;
  modelId?: string;
}

interface StreamingService {
  createChatJob(params: ChatStreamParams): Promise<Result<ChatJobResponse>>;
  streamChat(uid: string): SSEHandler;
}

export default function useStreamingPanel(service: StreamingService) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const activeStreamRef = useRef<SSEHandler | null>(null);

  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.close();
      }
    };
  }, []);

  const sendMessage = async (
    content: string,
    meta: { provider: AIProvider; modelId: string; settings: object; useWebSearch: boolean },
  ) => {
    if (!content.trim() || isLoading) return;
    if (activeStreamRef.current) {
      activeStreamRef.current.close();
      activeStreamRef.current = null;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: MessageRole.USER, content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: MessageRole.ASSISTANT, content: "", isStreaming: true },
    ]);

    try {
      const jobRes = await service.createChatJob({
        conversationId: conversationIdRef.current,
        prompt: content,
        provider: meta.provider,
        modelId: meta.modelId,
        settings: meta.settings,
        useWebSearch: meta.useWebSearch,
      });

      if (!jobRes.isSuccess) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: `Error: ${jobRes.error?.message || "Failed"}`, isStreaming: false }
              : msg,
          ),
        );
        setIsLoading(false);
        return;
      }

      if (jobRes.value.conversationId) {
        conversationIdRef.current = jobRes.value.conversationId;
      }

      const stream = service.streamChat(jobRes.value.uid);
      activeStreamRef.current = stream;
      let fullText = "";

      stream.onConnectionError(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: "Error: Connection failed", isStreaming: false } : msg,
          ),
        );
        setIsLoading(false);
      });

      stream.listen({
        [EventType.TEXT]: (data: ModelStreamTextData) => {
          if (data?.text) {
            fullText += data.text;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantId ? { ...msg, content: fullText } : msg)),
            );
          }
        },
        [EventType.LATENCY_MS]: (data: any) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    latencyMs: data?.ms,
                  }
                : msg,
            ),
          );
        },
        [EventType.USAGE]: (data: ModelStreamUsageData) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    usage: {
                      inputTokens: data.inputTokens,
                      outputTokens: data.outputTokens,
                      totalTokens: data.totalTokens,
                    },
                    modelId: data.modelId,
                  }
                : msg,
            ),
          );
        },
        [EventType.ERROR]: (data: ModelStreamErrorData) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: `Error: ${data?.error}`, isStreaming: false } : msg,
            ),
          );
          setIsLoading(false);
        },
        [EventType.COMPLETE]: () => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, isStreaming: false } : msg)),
          );
          setIsLoading(false);
        },
      });
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Error: ${error instanceof Error ? error.message : "Error"}`, isStreaming: false }
            : msg,
        ),
      );
      setIsLoading(false);
    }
  };

  const newChat = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.close();
      activeStreamRef.current = null;
    }
    conversationIdRef.current = undefined;
    setMessages([]);
    setIsLoading(false);
  };

  return { messages, isLoading, sendMessage, newChat };
}
