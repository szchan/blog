"use client";

import { useState } from "react";
import {
  useAdminTags,
  useCreateTag,
  useDeleteTag,
  useUpdateTag,
} from "@/hooks/useAdminTags";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminTagsPage() {
  const { data: tags, isLoading } = useAdminTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    createTag.mutate(
      { name: newName, slug: newSlug },
      {
        onSuccess: () => {
          setNewName("");
          setNewSlug("");
        },
      },
    );
  };

  const startEdit = (id: string, name: string, slug: string) => {
    setEditId(id);
    setEditName(name);
    setEditSlug(slug);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName || !editSlug) return;
    updateTag.mutate(
      { id: editId, data: { name: editName, slug: editSlug } },
      { onSuccess: () => setEditId(null) },
    );
  };

  if (isLoading) {
    return <p className="text-muted">Loading tags...</p>;
  }

  const tags_list = tags ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tags</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="slug"
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={createTag.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Tag
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {tags_list.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-light px-3 py-1"
          >
            {editId === tag.id ? (
              <form onSubmit={handleUpdate} className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-24 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none"
                />
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-24 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none"
                />
                <button type="submit" className="text-xs text-primary-light">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="text-xs text-muted"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <span className="text-sm text-foreground">{tag.name}</span>
                <span className="text-xs text-muted">/{tag.slug}</span>
                <button
                  onClick={() => startEdit(tag.id, tag.name, tag.slug)}
                  className="text-xs text-primary-light hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(tag.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {tags_list.length === 0 && (
        <p className="text-muted">No tags yet. Create one above!</p>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Tag"
        message="Are you sure you want to delete this tag?"
        onConfirm={() => {
          if (deleteId) {
            deleteTag.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
