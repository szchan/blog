import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/blog/PostCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getPosts, getProjects } from "@/lib/api";

export const revalidate = 60;

export default async function Home() {
  const [postsData, projects] = await Promise.all([
    getPosts(1, 6).catch(() => ({ items: [], total: 0, page: 1, per_page: 6, total_pages: 0 })),
    getProjects().catch(() => []),
  ]);

  const recentPosts = postsData.items.slice(0, 6);
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 py-16 text-center">
        <h1 className="text-5xl font-bold gradient-text sm:text-6xl">
          Building things for the web
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Full-stack developer. I write about software engineering, build
          open-source projects, and share what I learn along the way.
        </p>
        <div className="flex gap-4">
          <Button href="/blog">Read the Blog</Button>
          <Button href="/projects" variant="secondary">
            View Projects
          </Button>
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Recent Posts
            </h2>
            <Button href="/blog" variant="ghost">
              View all →
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {featuredProjects.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Featured Projects
            </h2>
            <Button href="/projects" variant="ghost">
              View all →
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
