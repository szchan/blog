"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from "@/lib/admin-api";
import type { CategoryCreate, CategoryUpdate } from "@/lib/types";

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getAdminCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryCreate) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}
