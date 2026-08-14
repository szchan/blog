import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getPost, getPosts, getProjects } from "@/lib/api";

const mockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
});

describe("api client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("getPosts returns paginated data", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        items: [
          {
            id: "1",
            title: "Test",
            slug: "test",
            excerpt: "Excerpt",
            cover_image: null,
            status: "published",
            views: 0,
            created_at: "2026-01-01T00:00:00Z",
            published_at: "2026-01-01T00:00:00Z",
            tags: [],
            category: null,
          },
        ],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1,
      }),
    );

    const result = await getPosts(1, 10);
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe("Test");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/posts?page=1&per_page=10",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("getPosts passes tag and category params", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ items: [], total: 0, page: 1, per_page: 10, total_pages: 0 }));

    await getPosts(1, 10, "react", "frontend");
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(calledUrl).toContain("tag=react");
    expect(calledUrl).toContain("category=frontend");
  });

  it("getPost returns null on 404", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({ detail: "Not found" }, false, 404));

    const result = await getPost("nonexistent");
    expect(result).toBeNull();
  });

  it("getPost rethrows non-404 errors", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({}, false, 500));

    await expect(getPost("test")).rejects.toThrow(ApiError);
  });

  it("getProjects returns project list", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        {
          id: "1",
          title: "My Project",
          slug: "my-project",
          description: "A project",
          content: "Details",
          tech_stack: ["React"],
          github_url: "https://github.com/me/repo",
          demo_url: null,
          cover_image: null,
          sort_order: 0,
          created_at: "2026-01-01T00:00:00Z",
        },
      ]),
    );

    const result = await getProjects();
    expect(result[0].title).toBe("My Project");
    expect(result[0].tech_stack).toEqual(["React"]);
  });
});
