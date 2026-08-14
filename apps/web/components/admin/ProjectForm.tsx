"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateProject, useUpdateProject } from "@/hooks/useAdminProjects";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import type { Project } from "@/lib/types";

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [content, setContent] = useState(project?.content ?? "");
  const [techStack, setTechStack] = useState(
    project?.tech_stack.join(", ") ?? "",
  );
  const [githubUrl, setGithubUrl] = useState(project?.github_url ?? "");
  const [demoUrl, setDemoUrl] = useState(project?.demo_url ?? "");
  const [coverImage, setCoverImage] = useState(project?.cover_image ?? "");
  const [sortOrder, setSortOrder] = useState(
    project?.sort_order ?? 0,
  );
  const [submitError, setSubmitError] = useState("");

  const isEdit = !!project;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const data = {
      title,
      slug,
      description,
      content,
      tech_stack: techStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      github_url: githubUrl,
      demo_url: demoUrl || null,
      cover_image: coverImage || null,
      sort_order: sortOrder,
    };

    if (isEdit && project) {
      updateProject.mutate(
        { id: project.id, data },
        {
          onSuccess: () => router.push("/admin/projects"),
          onError: () => setSubmitError("Failed to save. Please try again."),
        },
      );
    } else {
      createProject.mutate(data, {
        onSuccess: () => router.push("/admin/projects"),
        onError: () => setSubmitError("Failed to save. Please try again."),
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
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <MarkdownEditor value={content} onChange={setContent} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Tech Stack (comma-separated)</label>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="React, FastAPI, PostgreSQL"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">GitHub URL</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Demo URL</label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Cover Image URL</label>
        <input
          type="text"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createProject.isPending || updateProject.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {createProject.isPending || updateProject.isPending
            ? "Saving..."
            : isEdit
              ? "Update Project"
              : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
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
