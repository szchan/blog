"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreatePost, useUpdatePost } from "@/hooks/useAdminPosts";
import { getAdminCategories, getAdminTags, AdminApiError } from "@/lib/admin-api";
import { useQuery } from "@tanstack/react-query";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { PostDetail, PostStatus } from "@/lib/types";

interface PostFormProps {
  post?: PostDetail;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const { data: tags } = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: getAdminTags,
  });
  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getAdminCategories,
  });

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [status, setStatus] = useState<PostStatus>(
    post?.status ?? "draft",
  );
  const [tagIds, setTagIds] = useState<string[]>(
    post?.tags?.map((t) => t.id) ?? [],
  );
  const [categoryId, setCategoryId] = useState<string>(
    post?.category?.id ?? "",
  );
  const [submitError, setSubmitError] = useState("");

  const isEdit = !!post;

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const data = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      cover_image: coverImage || null,
      status,
      tag_ids: tagIds,
      category_id: categoryId || null,
    };

    if (isEdit && post) {
      updatePost.mutate(
        { id: post.id, data },
        {
          onSuccess: () => router.push("/admin/posts"),
          onError: (error: unknown) => {
            const msg = error instanceof AdminApiError ? error.message : "Failed to save. Please try again.";
            setSubmitError(msg);
          },
        },
      );
    } else {
      createPost.mutate(data, {
        onSuccess: () => router.push("/admin/posts"),
        onError: (error: unknown) => {
          const msg = error instanceof AdminApiError ? error.message : "Failed to save. Please try again.";
          setSubmitError(msg);
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Title</label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Slug</label>
          <input
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Excerpt</label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          placeholder="Short summary..."
        />
      </div>

      <MarkdownEditor value={content} onChange={setContent} />

      <ImageUploader value={coverImage} onChange={setCoverImage} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Tags</label>
        <div className="flex flex-wrap gap-2">
          {(tags ?? []).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                tagIds.includes(tag.id)
                  ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
                  : "bg-surface-light text-muted hover:text-foreground"
              }`}
            >
              {tag.name}
            </button>
          ))}
          {(tags ?? []).length === 0 && (
            <span className="text-sm text-muted">No tags yet. Create some in the Tags tab.</span>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">None</option>
          {(categories ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createPost.isPending || updatePost.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {createPost.isPending || updatePost.isPending
            ? "Saving..."
            : isEdit
              ? "Update Post"
              : "Create Post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      {submitError && (
        <p className="text-sm text-red-400">{submitError}</p>
      )}
    </form>
  );
}
