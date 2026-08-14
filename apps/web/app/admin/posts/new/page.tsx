"use client";

import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">New Post</h1>
      <PostForm />
    </div>
  );
}
