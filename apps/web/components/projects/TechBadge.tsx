interface TechBadgeProps {
  tech: string;
}

export function TechBadge({ tech }: TechBadgeProps) {
  return (
    <span className="rounded-md border border-border bg-surface-light px-2.5 py-1 text-xs font-mono text-primary-light">
      {tech}
    </span>
  );
}
