import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`glass gradient-border rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
