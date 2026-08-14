import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Prev
        </Link>
      )}
      {start > 1 && (
        <Link
          href={buildHref(1)}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          1
        </Link>
      )}
      {start > 2 && <span className="px-2 text-muted">…</span>}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${
            page === currentPage
              ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium"
              : "text-muted hover:text-foreground"
          }`}
        >
          {page}
        </Link>
      ))}
      {end < totalPages - 1 && <span className="px-2 text-muted">…</span>}
      {end < totalPages && (
        <Link
          href={buildHref(totalPages)}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          {totalPages}
        </Link>
      )}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
