"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminProjects, useDeleteProject } from "@/hooks/useAdminProjects";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { AdminApiError } from "@/lib/admin-api";

export default function AdminProjectsPage() {
  const { data: projects, isLoading } = useAdminProjects();
  const deleteProject = useDeleteProject();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  if (isLoading) {
    return <p className="text-muted">Loading projects...</p>;
  }

  const projects_list = projects ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          New Project
        </Link>
      </div>

      {projects_list.length === 0 ? (
        <p className="text-muted">No projects yet. Create one!</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Tech Stack</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Order</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects_list.map((project) => (
                <tr key={project.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="text-foreground hover:text-primary-light"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={project.status === "published" ? "gradient" : "default"}>
                      {project.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {project.tech_stack.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{project.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(project.id)}
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
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        onConfirm={() => {
          if (deleteId) {
            deleteProject.mutate(deleteId, {
              onError: (error: unknown) => {
                const msg = error instanceof AdminApiError ? error.message : "Delete failed";
                setDeleteError(msg);
              },
            });
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
      <ErrorToast message={deleteError} onClose={() => setDeleteError("")} />
    </div>
  );
}
