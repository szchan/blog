import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25",
  secondary:
    "glass text-foreground hover:border-white/20",
  ghost: "text-muted hover:text-foreground",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
