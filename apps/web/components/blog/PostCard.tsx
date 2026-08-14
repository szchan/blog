import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import type { PostListItem } from "@/lib/types";

interface PostCardProps {
  post: PostListItem;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block transition-transform hover:scale-[1.02]">
      <GlassCard className="h-full p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            {post.category && <Badge>{post.category.name}</Badge>}
            {post.published_at && (
              <time>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted line-clamp-2">{post.excerpt}</p>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="gradient">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
