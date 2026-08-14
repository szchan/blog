"use client";

import { ProjectForm } from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">New Project</h1>
      <ProjectForm />
    </div>
  );
}
