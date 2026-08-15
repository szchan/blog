"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { TechBadge } from "@/components/projects/TechBadge";
import type { Project } from "@/lib/types";
import { resolveImageUrl } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className="block">
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <GlassCard className="h-full p-6">
          {project.cover_image && (
            <Image
              src={resolveImageUrl(project.cover_image)}
              alt={project.title}
              width={400}
              height={200}
              className="h-40 w-full rounded-t-2xl object-cover"
            />
          )}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              {project.title}
            </h3>
            <p className="text-sm text-muted">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech) => (
                <TechBadge key={tech} tech={tech} />
              ))}
            </div>
            {project.demo_url && (
              <span className="text-xs text-primary-light">
                Live demo available
              </span>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}
