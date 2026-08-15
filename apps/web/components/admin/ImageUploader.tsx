"use client";

import { useState } from "react";
import { uploadImage, AdminApiError } from "@/lib/admin-api";
import { resolveImageUrl } from "@/lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadImage(file);
      onChange(result.url);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fullUrl = value ? resolveImageUrl(value) : "";

  return (
    <div className="flex flex-col gap-2">
      <label className="mb-1 block text-sm text-muted">Cover Image</label>
      {fullUrl && (
        <img
          src={fullUrl}
          alt="Cover preview"
          className="h-32 w-full rounded-lg border border-border object-cover"
        />
      )}
      {!fullUrl && (
        <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
          No image uploaded
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        aria-label="Upload image"
        className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-light file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-surface"
      />
      {uploading && <p className="text-xs text-muted">Uploading...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL..."
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}
