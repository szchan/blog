"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTag,
  deleteTag,
  getAdminTags,
  updateTag,
} from "@/lib/admin-api";
import type { TagCreate, TagUpdate } from "@/lib/types";

export function useAdminTags() {
  return useQuery({
    queryKey: ["admin", "tags"],
    queryFn: getAdminTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagCreate) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagUpdate }) =>
      updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
  });
}
