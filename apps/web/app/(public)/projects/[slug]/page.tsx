import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PostContent } from "@/components/blog/PostContent";
import { TechBadge } from "@/components/projects/TechBadge";
import { Button } from "@/components/ui/Button";
import { getAllProjectSlugs, getProject } from "@/lib/api";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await getAllProjectSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) return { title: "Not Found" };

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
    },
  };
}

export default async function ProjectDetailPage(
  props: PageProps<"/projects/[slug]">,
) {
  const { slug } = await props.params;
  const project = await getProject(slug);

  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <Button href="/projects" variant="ghost" className="mb-8">
        ← Back to projects
      </Button>

      <header className="mb-8 flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-foreground">
          {project.title}
        </h1>
        <p className="text-lg text-muted">{project.description}</p>
        <div className="flex flex-wrap gap-2">
          {project.tech_stack.map((tech) => (
            <TechBadge key={tech} tech={tech} />
          ))}
        </div>
        <div className="flex gap-4">
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-light underline hover:text-primary"
          >
            View on GitHub →
          </a>
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-light underline hover:text-primary"
            >
              Live Demo →
            </a>
          )}
        </div>
      </header>

      {project.cover_image && (
        <Image
          src={project.cover_image.startsWith("http") ? project.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${project.cover_image}`}
          alt={project.title}
          width={1200}
          height={400}
          className="mb-8 rounded-2xl object-cover"
        />
      )}

      <PostContent content={project.content} />
    </article>
  );
}
