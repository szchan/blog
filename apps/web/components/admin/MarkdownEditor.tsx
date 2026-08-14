"use client";

import { PostContent } from "@/components/blog/PostContent";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your post in Markdown...",
}: MarkdownEditorProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-muted">Content (Markdown)</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[400px] flex-1 rounded-lg border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-muted">Preview</label>
        <div className="min-h-[400px] flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4">
          {value ? (
            <PostContent content={value} />
          ) : (
            <p className="text-sm text-muted">Preview will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
}
