import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/types";

const mockProject: Project = {
  id: "1",
  title: "Portfolio Website",
  slug: "portfolio-website",
  description: "My personal portfolio built with Next.js.",
  content: "## Overview\n\nThis is my portfolio.",
  tech_stack: ["Next.js", "FastAPI", "PostgreSQL"],
  github_url: "https://github.com/me/portfolio",
  demo_url: "https://example.com",
  cover_image: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  status: "published",
  published_at: "2026-01-01T00:00:00Z",
};

describe("ProjectCard", () => {
  it("renders the project title", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Portfolio Website")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<ProjectCard project={mockProject} />);
    expect(
      screen.getByText("My personal portfolio built with Next.js."),
    ).toBeInTheDocument();
  });

  it("renders all tech stack badges", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("renders live demo indicator when demo_url exists", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Live demo available")).toBeInTheDocument();
  });

  it("does not render demo indicator when demo_url is null", () => {
    const noDemo: Project = { ...mockProject, demo_url: null };
    render(<ProjectCard project={noDemo} />);
    expect(screen.queryByText("Live demo available")).not.toBeInTheDocument();
  });

  it("links to the project detail page", () => {
    render(<ProjectCard project={mockProject} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/portfolio-website");
  });
});
