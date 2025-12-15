"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "@/lib/markdown-components";
import "katex/dist/katex.min.css";

const defaultClasses = "prose prose-sm dark:prose-invert max-w-none";

interface PrettyMarkdownProps {
  content: string;
  className?: string;
}

export function PrettyMarkdown({ content, className }: PrettyMarkdownProps) {
  const finalClassName = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <div className={finalClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
