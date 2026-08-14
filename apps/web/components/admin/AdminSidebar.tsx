"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/useAuth";

const navItems = [
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/categories", label: "Categories" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="p-6">
        <Link href="/admin/posts" className="text-lg font-bold gradient-text">
          Admin
        </Link>
      </div>
      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-surface-light text-foreground font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface-light"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          View Site →
        </Link>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-foreground disabled:opacity-50"
        >
          {logout.isPending ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
