"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMe } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isError } = useMe();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isError && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isError, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return null;
  }

  return <>{children}</>;
}
