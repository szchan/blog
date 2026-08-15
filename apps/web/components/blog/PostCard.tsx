"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import type { PostListItem } from "@/lib/types";
import { resolveImageUrl } from "@/lib/utils";

interface PostCardProps {
  post: PostListItem;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <GlassCard className="h-full p-6">
          {post.cover_image && (
            <Image
              src={resolveImageUrl(post.cover_image)}
              alt={post.title}
              width={400}
              height={200}
              className="h-40 w-full rounded-t-2xl object-cover"
            />
          )}
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
      </motion.div>
    </Link>
  );
}
