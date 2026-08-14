"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-bold text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 text-2xl font-semibold text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-muted">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary-light underline hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc pl-6 text-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal pl-6 text-muted">{children}</ol>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="rounded bg-surface-light px-1.5 py-0.5 font-mono text-sm text-primary-light">
                {children}
              </code>
            ) : (
              <code className={`block font-mono text-sm ${className ?? ""}`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-surface p-4 border border-border">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-primary pl-4 italic text-muted">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table className="mb-4 w-full border-collapse text-sm">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-surface-light px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-muted">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
