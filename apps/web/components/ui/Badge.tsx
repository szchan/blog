import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "gradient";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles =
    variant === "gradient"
      ? "gradient-text font-semibold"
      : "text-muted bg-surface-light rounded-full px-3 py-1 text-xs";
  return <span className={styles}>{children}</span>;
}
