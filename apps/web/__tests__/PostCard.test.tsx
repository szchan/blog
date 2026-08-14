import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostCard } from "@/components/blog/PostCard";
import type { PostListItem } from "@/lib/types";

const mockPost: PostListItem = {
  id: "1",
  title: "Getting Started with FastAPI",
  slug: "getting-started-fastapi",
  excerpt: "A guide to building APIs with FastAPI.",
  cover_image: null,
  status: "published",
  views: 42,
  created_at: "2026-01-01T00:00:00Z",
  published_at: "2026-01-02T00:00:00Z",
  tags: [
    { id: "t1", name: "Python", slug: "python" },
    { id: "t2", name: "API", slug: "api" },
  ],
  category: { id: "c1", name: "Backend", slug: "backend" },
};

describe("PostCard", () => {
  it("renders the post title", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Getting Started with FastAPI")).toBeInTheDocument();
  });

  it("renders the excerpt", () => {
    render(<PostCard post={mockPost} />);
    expect(
      screen.getByText("A guide to building APIs with FastAPI."),
    ).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
  });

  it("renders the category badge", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Backend")).toBeInTheDocument();
  });

  it("links to the correct slug", () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/getting-started-fastapi");
  });

  it("renders without excerpt or tags", () => {
    const minimalPost: PostListItem = {
      ...mockPost,
      excerpt: null,
      tags: [],
      category: null,
    };
    render(<PostCard post={minimalPost} />);
    expect(screen.getByText("Getting Started with FastAPI")).toBeInTheDocument();
  });
});
