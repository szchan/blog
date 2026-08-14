"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { ProjectForm } from "@/components/admin/ProjectForm";
import type { Project } from "@/lib/types";

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["admin", "project", id],
    queryFn: () => adminFetch<Project>(`/api/admin/projects/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="text-muted">Loading project...</p>;
  }

  if (!project) {
    return <p className="text-muted">Project not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Project</h1>
      <ProjectForm project={project} />
    </div>
  );
}
