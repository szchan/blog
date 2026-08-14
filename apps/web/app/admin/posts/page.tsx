"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminPosts, useDeletePost } from "@/hooks/useAdminPosts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";

export default function AdminPostsPage() {
  const { data: posts, isLoading } = useAdminPosts();
  const deletePost = useDeletePost();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted">Loading posts...</p>;
  }

  const posts_list = posts ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          New Post
        </Link>
      </div>

      {posts_list.length === 0 ? (
        <p className="text-muted">No posts yet. Create one!</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Views</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts_list.map((post) => (
                <tr key={post.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-foreground hover:text-primary-light"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === "published" ? "gradient" : "default"}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{post.views}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(post.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) {
            deletePost.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
