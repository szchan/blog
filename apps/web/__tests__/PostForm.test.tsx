import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostForm } from "@/components/admin/PostForm";

vi.mock("@/lib/admin-api", () => ({
  getAdminTags: vi.fn().mockResolvedValue([
    { id: "t1", name: "Python", slug: "python" },
    { id: "t2", name: "React", slug: "react" },
  ]),
  getAdminCategories: vi.fn().mockResolvedValue([
    { id: "c1", name: "Backend", slug: "backend" },
  ]),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("PostForm", () => {
  it("renders title and slug fields", () => {
    renderWithProviders(<PostForm />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Slug")).toBeInTheDocument();
  });

  it("renders content textarea and preview", () => {
    renderWithProviders(<PostForm />);
    expect(screen.getByPlaceholderText("Write your post in Markdown...")).toBeInTheDocument();
  });

  it("renders status dropdown with draft and published options", () => {
    renderWithProviders(<PostForm />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders create button for new post", () => {
    renderWithProviders(<PostForm />);
    expect(screen.getByText("Create Post")).toBeInTheDocument();
  });

  it("renders update button for existing post", () => {
    renderWithProviders(
      <PostForm post={{
        id: "1",
        title: "Test",
        slug: "test",
        excerpt: "Test excerpt",
        content: "# Hello",
        cover_image: null,
        status: "draft",
        views: 0,
        created_at: "2026-01-01T00:00:00Z",
        published_at: null,
        tags: [],
        category: null,
        author: { id: "u1", email: "a@b.com", username: "admin", is_admin: true, created_at: "2026-01-01T00:00:00Z" },
        updated_at: "2026-01-01T00:00:00Z",
      }} />,
    );
    expect(screen.getByText("Update Post")).toBeInTheDocument();
  });
});
