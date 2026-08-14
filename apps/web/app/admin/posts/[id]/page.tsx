"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { PostForm } from "@/components/admin/PostForm";
import type { PostDetail } from "@/lib/types";

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin", "post", id],
    queryFn: () => adminFetch<PostDetail>(`/api/admin/posts/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="text-muted">Loading post...</p>;
  }

  if (!post) {
    return <p className="text-muted">Post not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Post</h1>
      <PostForm post={post} key={post.id} />
    </div>
  );
}
