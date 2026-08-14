import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { TagWithCount } from "@/lib/types";

interface TagFilterProps {
  tags: TagWithCount[];
  activeTag?: string;
  basePath: string;
}

export function TagFilter({ tags, activeTag, basePath }: TagFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={basePath}>
        <Badge variant={activeTag ? "default" : "gradient"}>All</Badge>
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`${basePath}?tag=${tag.slug}`}
          className="transition-transform hover:scale-105"
        >
          <Badge variant={tag.slug === activeTag ? "gradient" : "default"}>
            {tag.name} ({tag.post_count})
          </Badge>
        </Link>
      ))}
    </div>
  );
}
