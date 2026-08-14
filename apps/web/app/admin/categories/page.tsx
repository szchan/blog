"use client";

import { useState } from "react";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useAdminCategories";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    createCategory.mutate(
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
    updateCategory.mutate(
      { id: editId, data: { name: editName, slug: editSlug } },
      { onSuccess: () => setEditId(null) },
    );
  };

  if (isLoading) {
    return <p className="text-muted">Loading categories...</p>;
  }

  const categories_list = categories ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Categories</h1>

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
          disabled={createCategory.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Category
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categories_list.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-light px-3 py-1"
          >
            {editId === cat.id ? (
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
                <span className="text-sm text-foreground">{cat.name}</span>
                <span className="text-xs text-muted">/{cat.slug}</span>
                <button
                  onClick={() => startEdit(cat.id, cat.name, cat.slug)}
                  className="text-xs text-primary-light hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {categories_list.length === 0 && (
        <p className="text-muted">No categories yet. Create one above!</p>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        onConfirm={() => {
          if (deleteId) {
            deleteCategory.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
