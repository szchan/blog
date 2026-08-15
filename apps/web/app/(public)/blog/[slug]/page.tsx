import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PostContent } from "@/components/blog/PostContent";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAllPostSlugs, getPost } from "@/lib/api";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt ?? post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      type: "article",
      publishedTime: post.published_at ?? undefined,
      tags: post.tags.map((t) => t.name),
    },
  };
}

export default async function BlogPostPage(
  props: PageProps<"/blog/[slug]">,
) {
  const { slug } = await props.params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <Button href="/blog" variant="ghost" className="mb-8">
        ← Back to blog
      </Button>

      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {post.category && <Badge>{post.category.name}</Badge>}
          {post.published_at && (
            <time>
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          <span>· {post.views} views</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-muted">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>By {post.author.username}</span>
        </div>
      </header>

      {post.cover_image && (
        <Image
          src={post.cover_image.startsWith("http") ? post.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${post.cover_image}`}
          alt={post.title}
          width={1200}
          height={400}
          className="mb-8 rounded-2xl object-cover"
        />
      )}

      <PostContent content={post.content} />

      {post.tags.length > 0 && (
        <footer className="mt-12 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Tags:</span>
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                <Badge variant="gradient">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
