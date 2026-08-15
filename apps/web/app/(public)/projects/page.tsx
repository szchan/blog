import type { Metadata } from "next";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source projects and experiments.",
};

export default async function ProjectsPage() {
  const projects = await getProjects().catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold gradient-text">Projects</h1>
        <p className="mt-2 text-muted">
          Things I&apos;ve built and open-sourced.
        </p>
      </header>

      {projects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted">
          <p>No projects yet.</p>
        </div>
      )}
    </div>
  );
}
