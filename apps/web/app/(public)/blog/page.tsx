import type { Metadata } from "next";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { TagFilter } from "@/components/blog/TagFilter";
import { getPosts, getTags } from "@/lib/api";

export const metadata: Metadata = {
  description: "Articles on software engineering, web development, and more.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = parseInt((sp.page as string) ?? "1", 10);
  const tag = sp.tag as string | undefined;
  const category = sp.category as string | undefined;

  const [postsData, tags] = await Promise.all([
    getPosts(page, 9, tag, category).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      per_page: 9,
      total_pages: 0,
    })),
    getTags().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold gradient-text">Blog</h1>
        <TagFilter tags={tags} activeTag={tag} basePath="/blog" />
      </header>

      {postsData.items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {postsData.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination
            currentPage={postsData.page}
            totalPages={postsData.total_pages}
            basePath="/blog"
            searchParams={{ tag, category }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-lg text-muted">
            No posts found{tag ? ` for tag "${tag}"` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
