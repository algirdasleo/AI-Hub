import React from "react";
import { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-bold mt-3 mb-2">{children}</h4>,
  h5: ({ children }) => <h5 className="text-base font-bold mt-3 mb-2">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-bold mt-2 mb-2">{children}</h6>,
  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline hover:opacity-80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc list-outside mb-4 pl-6 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside mb-4 pl-6 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-base">{children}</li>,
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm text-foreground">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted p-4 rounded-lg overflow-auto mb-4 border border-border">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted-foreground pl-4 my-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted border-b border-border">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2">{children}</td>,
  hr: () => <hr className="my-6 border-border" />,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through text-muted-foreground">{children}</del>,
};
