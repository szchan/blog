"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getAdminProjects,
  updateProject,
} from "@/lib/admin-api";
import type { ProjectCreate, ProjectUpdate } from "@/lib/types";

export function useAdminProjects() {
  return useQuery({
    queryKey: ["admin", "projects"],
    queryFn: getAdminProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreate) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}
