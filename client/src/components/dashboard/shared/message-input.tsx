"use client";

import React, { useRef, useEffect } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Plus, Globe, ArrowUp } from "lucide-react";

interface MessageInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSend: () => void;
  isLoading: boolean;
  useWebSearch: boolean;
  onWebSearchToggle: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function MessageInput({
  prompt,
  onPromptChange,
  onSend,
  isLoading,
  useWebSearch,
  onWebSearchToggle,
  placeholder = "Ask, Search or Chat...",
  className,
  autoFocus = false,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!isLoading && textareaRef.current && prompt === "") {
      textareaRef.current.focus();
    }
  }, [isLoading, prompt]);

  return (
    <InputGroup className={`[--radius:24px] ${className || ""}`}>
      <InputGroupTextarea
        ref={textareaRef}
        placeholder={placeholder}
        className="min-h-[20px] resize-none border-0 bg-transparent p-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        rows={1}
        value={prompt}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <InputGroupAddon align="block-end">
        <InputGroupButton variant="outline" className="rounded-full" size="icon-sm">
          <Plus className="h-4 w-4" />
        </InputGroupButton>
        <InputGroupButton variant={useWebSearch ? "default" : "outline"} onClick={onWebSearchToggle} size="sm">
          <Globe className="h-6 w-6 mr-1" />
          Web search
        </InputGroupButton>
        <InputGroupButton
          variant="default"
          className="rounded-full ml-auto"
          size="icon-sm"
          onClick={onSend}
          disabled={!prompt.trim() || isLoading}
        >
          <ArrowUp className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
