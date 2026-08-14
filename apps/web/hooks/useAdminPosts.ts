"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, deletePost, getAdminPosts, updatePost } from "@/lib/admin-api";
import type { PostCreate, PostUpdate } from "@/lib/types";

export function useAdminPosts() {
  return useQuery({
    queryKey: ["admin", "posts"],
    queryFn: getAdminPosts,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostCreate) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PostUpdate }) =>
      updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}
