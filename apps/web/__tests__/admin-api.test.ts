import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminApiError,
  adminFetch,
  createPost,
  deletePost,
  getAdminPosts,
  getMe,
  login,
  updatePost,
} from "@/lib/admin-api";
import { getToken, removeToken, setToken } from "@/lib/auth";

const mockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
  text: async () => (typeof data === "string" ? data : JSON.stringify(data)),
});

describe("admin-api client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it("login returns token response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ access_token: "jwt-token", token_type: "bearer" }),
    );

    const result = await login({ email: "admin@test.com", password: "pass" });
    expect(result.access_token).toBe("jwt-token");
    expect(result.token_type).toBe("bearer");
  });

  it("login throws on wrong credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({}, false, 401));

    await expect(
      login({ email: "bad@test.com", password: "wrong" }),
    ).rejects.toThrow(AdminApiError);
  });

  it("adminFetch sends Authorization header when token exists", async () => {
    setToken("my-jwt-token");
    global.fetch = vi.fn().mockResolvedValue(mockResponse({ id: "1" }));

    await getMe();

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1].headers["Authorization"]).toBe("Bearer my-jwt-token");
  });

  it("adminFetch does not send Authorization header without token", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse([]));

    await getAdminPosts();

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1].headers["Authorization"]).toBeUndefined();
  });

  it("adminFetch clears token and redirects on 401", async () => {
    setToken("expired-token");
    global.fetch = vi.fn().mockResolvedValue(mockResponse({}, false, 401));
    const originalHref = window.location.href;
    const hrefSpy = vi.spyOn(window.location, "href", "set");

    await expect(adminFetch("/api/admin/posts")).rejects.toThrow(AdminApiError);
    expect(getToken()).toBeNull();
    expect(hrefSpy).toHaveBeenCalledWith("/admin/login");

    Object.defineProperty(window.location, "href", {
      value: originalHref,
      writable: true,
    });
  });

  it("getAdminPosts returns post list", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        {
          id: "1",
          title: "Post 1",
          slug: "post-1",
          excerpt: null,
          cover_image: null,
          status: "draft",
          views: 0,
          created_at: "2026-01-01T00:00:00Z",
          published_at: null,
          tags: [],
          category: null,
        },
      ]),
    );

    const result = await getAdminPosts();
    expect(result[0].title).toBe("Post 1");
    expect(result[0].status).toBe("draft");
  });

  it("createPost sends POST with body", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        id: "1",
        title: "New",
        slug: "new",
        excerpt: null,
        cover_image: null,
        status: "draft",
        views: 0,
        created_at: "2026-01-01T00:00:00Z",
        published_at: null,
        tags: [],
        category: null,
      }),
    );

    await createPost({
      title: "New",
      slug: "new",
      content: "content",
      tag_ids: [],
      status: "draft",
    });

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1].method).toBe("POST");
    expect(JSON.parse(callArgs[1].body)).toEqual({
      title: "New",
      slug: "new",
      content: "content",
      tag_ids: [],
      status: "draft",
    });
  });

  it("updatePost sends PUT with body", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        id: "1",
        title: "Updated",
        slug: "updated",
        excerpt: null,
        cover_image: null,
        status: "published",
        views: 0,
        created_at: "2026-01-01T00:00:00Z",
        published_at: null,
        tags: [],
        category: null,
      }),
    );

    await updatePost("1", { title: "Updated" });

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toBe("http://localhost:8000/api/admin/posts/1");
    expect(callArgs[1].method).toBe("PUT");
  });

  it("deletePost sends DELETE and returns void", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse(undefined, true, 204),
    );

    await deletePost("1");

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1].method).toBe("DELETE");
  });
});
