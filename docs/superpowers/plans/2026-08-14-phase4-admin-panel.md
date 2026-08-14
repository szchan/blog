# Phase 4: Frontend Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin panel — login, post editor with Markdown + live preview, project/tag/category management — all client-side rendered with React Query and JWT Bearer token auth.

**Architecture:** Admin pages are `'use client'` components under `app/admin/`. Auth uses Bearer token stored in localStorage (login response returns `access_token` in body). React Query manages server state with auto-invalidation after mutations. A shared admin layout provides sidebar navigation + auth guard. The existing public pages and design system from Phase 3 remain untouched.

**Tech Stack:** Next.js 16.3.1, React 19.2.8, @tanstack/react-query, Tailwind CSS v4, react-markdown + remark-gfm (reused from Phase 3), Vitest + RTL.

## Global Constraints

- Run all commands from `apps/web/` directory
- Node 20+, npm
- Next.js 16: `params`/`searchParams` are Promises (Server Components) — Client Components use `useParams()` from `next/navigation`
- Next.js 16: Turbopack is default (no `--turbopack` flag)
- Tailwind CSS v4: `@import "tailwindcss"` + `@theme` in globals.css (no `tailwind.config.js`)
- Path alias: `@/*` maps to `./` relative to `apps/web/`
- API base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- Backend CORS allows `http://localhost:3000` with credentials
- Auth: Bearer token in `Authorization` header (backend's `oauth2_scheme` extracts it); login returns `{ access_token, token_type }` in response body
- TypeScript strict mode
- Conventional commits
- DO NOT add comments to code unless asked
- Admin pages are `'use client'` — use `useParams()` for dynamic route params, not the `params` prop
- Existing Phase 3 files must not break — `npm run build` and `npm test` (23 tests) must pass after each task

---

## File Structure

```
apps/web/
├── app/
│   ├── admin/                          # Admin panel (all 'use client')
│   │   ├── layout.tsx                    # Auth guard + sidebar (skips guard on /admin/login)
│   │   ├── login/
│   │   │   └── page.tsx                  # Login form
│   │   ├── posts/
│   │   │   ├── page.tsx                  # Posts list (all statuses)
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # New post editor
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Edit post editor
│   │   ├── projects/
│   │   │   ├── page.tsx                  # Projects list
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # New project form
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Edit project form
│   │   ├── tags/
│   │   │   └── page.tsx                  # Tags list + inline create/edit/delete
│   │   └── categories/
│   │       └── page.tsx                  # Categories list + inline create/edit/delete
│   └── layout.tsx                       # MODIFY: wrap children with QueryProvider
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx              # Navigation sidebar
│   │   ├── AuthGuard.tsx                 # Redirects to login if unauthenticated
│   │   ├── MarkdownEditor.tsx            # Textarea + live preview (split pane)
│   │   ├── PostForm.tsx                  # Create/edit post form
│   │   ├── ProjectForm.tsx              # Create/edit project form
│   │   └── ConfirmDialog.tsx             # Delete confirmation modal
│   └── (existing Phase 3 components unchanged)
├── lib/
│   ├── api.ts                           # UNCHANGED (public API)
│   ├── admin-api.ts                     # NEW: admin API client (auth header + CRUD)
│   ├── auth.ts                          # NEW: token storage (localStorage)
│   └── types.ts                         # MODIFY: add admin request types
├── hooks/
│   ├── useAuth.ts                       # useMe, useLogin, useLogout
│   ├── useAdminPosts.ts                # CRUD hooks for posts
│   ├── useAdminTags.ts                 # CRUD hooks for tags
│   ├── useAdminCategories.ts           # CRUD hooks for categories
│   └── useAdminProjects.ts             # CRUD hooks for projects
├── providers/
│   └── QueryProvider.tsx                # 'use client' — React Query context
└── __tests__/
    └── admin-api.test.ts               # Admin API client tests
```

---

## Task 1: React Query Provider, Auth Utilities, Admin API Client

**Files:**
- Modify: `package.json` (add @tanstack/react-query)
- Create: `providers/QueryProvider.tsx`, `lib/auth.ts`, `lib/admin-api.ts`
- Modify: `lib/types.ts` (add admin request types), `app/layout.tsx` (wrap with QueryProvider)
- Create: `__tests__/admin-api.test.ts`

**Interfaces:**
- Produces: `QueryProvider`, `getToken`/`setToken`/`removeToken`, `adminFetch<T>`, all admin CRUD + auth API functions, admin request types

- [ ] **Step 1: Install React Query**

Run from `apps/web/`:

```bash
npm install @tanstack/react-query
```

- [ ] **Step 2: Create `providers/QueryProvider.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Modify `app/layout.tsx` — wrap children with QueryProvider**

Add the import and wrap `{children}`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Blog",
    template: "%s | Blog",
  },
  description: "Personal blog + portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Append admin request types to `lib/types.ts`**

Add these types at the end of the file:

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface PostCreate {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  tag_ids: string[];
  category_id?: string | null;
  status: PostStatus;
}

export interface PostUpdate {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  cover_image?: string | null;
  status?: PostStatus;
  tag_ids?: string[];
  category_id?: string | null;
}

export interface TagCreate {
  name: string;
  slug: string;
}

export interface TagUpdate {
  name?: string;
  slug?: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
}

export interface ProjectCreate {
  title: string;
  slug: string;
  description: string;
  content: string;
  tech_stack: string[];
  github_url: string;
  demo_url?: string | null;
  cover_image?: string | null;
  sort_order?: number;
}

export interface ProjectUpdate {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  tech_stack?: string[];
  github_url?: string;
  demo_url?: string | null;
  cover_image?: string | null;
  sort_order?: number;
}
```

- [ ] **Step 5: Create `lib/auth.ts`**

```typescript
const TOKEN_KEY = "blog_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}
```

- [ ] **Step 6: Create `lib/admin-api.ts`**

```typescript
import { getToken, removeToken } from "@/lib/auth";
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  LoginRequest,
  PostCreate,
  PostListItem,
  PostUpdate,
  Project,
  ProjectCreate,
  ProjectUpdate,
  Tag,
  TagCreate,
  TagUpdate,
  TokenResponse,
  User,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export async function adminFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new AdminApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "Unknown error");
    throw new AdminApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new AdminApiError("Incorrect email or password", res.status);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function getMe(): Promise<User> {
  return adminFetch<User>("/api/auth/me");
}

export async function logout(): Promise<void> {
  try {
    await adminFetch<void>("/api/auth/logout", { method: "POST" });
  } finally {
    removeToken();
  }
}

export async function getAdminPosts(): Promise<PostListItem[]> {
  return adminFetch<PostListItem[]>("/api/admin/posts");
}

export async function createPost(data: PostCreate): Promise<PostListItem> {
  return adminFetch<PostListItem>("/api/admin/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePost(
  id: string,
  data: PostUpdate,
): Promise<PostListItem> {
  return adminFetch<PostListItem>(`/api/admin/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<void> {
  return adminFetch<void>(`/api/admin/posts/${id}`, { method: "DELETE" });
}

export async function getAdminTags(): Promise<Tag[]> {
  return adminFetch<Tag[]>("/api/admin/tags");
}

export async function createTag(data: TagCreate): Promise<Tag> {
  return adminFetch<Tag>("/api/admin/tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTag(id: string, data: TagUpdate): Promise<Tag> {
  return adminFetch<Tag>(`/api/admin/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTag(id: string): Promise<void> {
  return adminFetch<void>(`/api/admin/tags/${id}`, { method: "DELETE" });
}

export async function getAdminCategories(): Promise<Category[]> {
  return adminFetch<Category[]>("/api/admin/categories");
}

export async function createCategory(data: CategoryCreate): Promise<Category> {
  return adminFetch<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: CategoryUpdate,
): Promise<Category> {
  return adminFetch<Category>(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return adminFetch<void>(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export async function getAdminProjects(): Promise<Project[]> {
  return adminFetch<Project[]>("/api/admin/projects");
}

export async function createProject(data: ProjectCreate): Promise<Project> {
  return adminFetch<Project>("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  id: string,
  data: ProjectUpdate,
): Promise<Project> {
  return adminFetch<Project>(`/api/admin/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return adminFetch<void>(`/api/admin/projects/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 7: Write failing test `__tests__/admin-api.test.ts`**

```typescript
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
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS (23 existing + 9 new = 32 tests)

- [ ] **Step 9: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/providers/ apps/web/lib/ apps/web/__tests__/admin-api.test.ts apps/web/app/layout.tsx
git commit -m "feat: add React Query provider, auth utilities, and admin API client"
```

---

## Task 2: Admin Layout + Sidebar + Auth Guard

**Files:**
- Create: `components/admin/AdminSidebar.tsx`, `components/admin/AuthGuard.tsx`
- Create: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `useAuth` hook from Task 1 (via hooks/useAuth.ts — create in this task)
- Produces: `AdminSidebar`, `AuthGuard`, admin layout with sidebar + auth guard

- [ ] **Step 1: Create `hooks/useAuth.ts`**

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getMe, login, logout } from "@/lib/admin-api";
import { setToken, removeToken } from "@/lib/auth";
import type { LoginRequest } from "@/lib/types";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const result = await login(data);
      setToken(result.access_token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/admin/posts");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      removeToken();
      queryClient.clear();
      router.push("/admin/login");
    },
  });
}
```

- [ ] **Step 2: Create `components/admin/AdminSidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks/useAuth";

const navItems = [
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/categories", label: "Categories" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="p-6">
        <Link href="/admin/posts" className="text-lg font-bold gradient-text">
          Admin
        </Link>
      </div>
      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-surface-light text-foreground font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface-light"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          View Site →
        </Link>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-foreground disabled:opacity-50"
        >
          {logout.isPending ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create `components/admin/AuthGuard.tsx`**

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMe } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isError } = useMe();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isError && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isError, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Create `app/admin/layout.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthGuard } from "@/components/admin/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds. The admin routes are registered.

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: PASS (32 tests, existing + admin-api)

- [ ] **Step 7: Commit**

```bash
git add apps/web/hooks/ apps/web/components/admin/ apps/web/app/admin/
git commit -m "feat: add admin layout, sidebar, and auth guard"
```

---

## Task 3: Login Page

**Files:**
- Create: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `useLogin` from `hooks/useAuth.ts`
- Produces: Login page at `/admin/login`

- [ ] **Step 1: Create `app/admin/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useLogin, useMe } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  const { data: user } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/admin/posts");
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { email, password },
      {
        onError: () => {
          setError("Incorrect email or password");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass gradient-border w-full max-w-sm rounded-2xl p-8">
        <h1 className="mb-6 text-center text-2xl font-bold gradient-text">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="mt-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
          >
            {login.isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with `/admin/login` route registered.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: PASS (32 tests)

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/admin/login/
git commit -m "feat: add admin login page"
```

---

## Task 4: Posts Management List

**Files:**
- Create: `hooks/useAdminPosts.ts`, `app/admin/posts/page.tsx`, `components/admin/ConfirmDialog.tsx`

**Interfaces:**
- Consumes: `getAdminPosts`, `deletePost` from `lib/admin-api.ts`
- Produces: Posts list page at `/admin/posts` with delete + links to editor

- [ ] **Step 1: Create `hooks/useAdminPosts.ts`**

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, deletePost, getAdminPosts, updatePost } from "@/lib/admin-api";
import type { PostCreate, PostUpdate } from "@/lib/types";

export function useAdminPosts() {
  return useQuery({
    queryKey: ["admin", "posts"],
    queryFn: getAdminPosts,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostCreate) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PostUpdate }) =>
      updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}
```

- [ ] **Step 2: Create `components/admin/ConfirmDialog.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="glass gradient-border w-full max-w-sm rounded-2xl p-6">
        <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mb-4 text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/posts/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminPosts, useDeletePost } from "@/hooks/useAdminPosts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";

export default function AdminPostsPage() {
  const { data: posts, isLoading } = useAdminPosts();
  const deletePost = useDeletePost();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted">Loading posts...</p>;
  }

  const posts_list = posts ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          New Post
        </Link>
      </div>

      {posts_list.length === 0 ? (
        <p className="text-muted">No posts yet. Create one!</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Views</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts_list.map((post) => (
                <tr key={post.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-foreground hover:text-primary-light"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === "published" ? "gradient" : "default"}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{post.views}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(post.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) {
            deletePost.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: PASS (32 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/web/hooks/useAdminPosts.ts apps/web/components/admin/ConfirmDialog.tsx apps/web/app/admin/posts/page.tsx
git commit -m "feat: add admin posts list with delete"
```

---

## Task 5: Post Editor (Create/Edit with Markdown + Live Preview)

**Files:**
- Create: `components/admin/MarkdownEditor.tsx`, `components/admin/PostForm.tsx`
- Create: `app/admin/posts/new/page.tsx`, `app/admin/posts/[id]/page.tsx`

**Interfaces:**
- Consumes: `useCreatePost`, `useUpdatePost` from `hooks/useAdminPosts.ts`; `getAdminTags`, `getAdminCategories` from `lib/admin-api.ts`; `PostContent` from Phase 3 for preview
- Produces: Post editor pages (new + edit), `MarkdownEditor` (textarea + live preview), `PostForm` (full form with tag/category selection)

- [ ] **Step 0: Add backend GET `/api/admin/posts/{id}` endpoint**

The admin posts router (`apps/api/app/api/admin/posts.py`) currently has no GET-by-ID endpoint. The edit page needs to fetch the full post (including `content`) by ID. Add this endpoint:

Add this import at the top of `apps/api/app/api/admin/posts.py`:

```python
from app.schemas.post import PostCreate, PostDetailResponse, PostListResponse, PostUpdate
```

Add this route handler after the `list_all_posts` function:

```python
@router.get("/{post_id}", response_model=PostDetailResponse)
def get_post_by_id(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> PostDetailResponse:
    svc = PostService(db)
    post = svc.repo.get_by_id(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostDetailResponse.model_validate(post)
```

Run from `apps/api/`:

```bash
uv run ruff check . && uv run mypy app/ && uv run python -m pytest -v
```

Expected: All checks pass. The new endpoint is auth-guarded and returns PostDetail (with content, author, updated_at).

- [ ] **Step 1: Create `components/admin/MarkdownEditor.tsx`**

```tsx
"use client";

import { PostContent } from "@/components/blog/PostContent";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your post in Markdown...",
}: MarkdownEditorProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-muted">Content (Markdown)</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[400px] flex-1 rounded-lg border border-border bg-surface p-4 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-sm text-muted">Preview</label>
        <div className="min-h-[400px] flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4">
          {value ? (
            <PostContent content={value} />
          ) : (
            <p className="text-sm text-muted">Preview will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/admin/PostForm.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreatePost, useUpdatePost } from "@/hooks/useAdminPosts";
import { getAdminCategories, getAdminTags } from "@/lib/admin-api";
import { useQuery } from "@tanstack/react-query";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import type { PostDetail, PostListItem, PostStatus } from "@/lib/types";

interface PostFormProps {
  post?: PostDetail;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const { data: tags } = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: getAdminTags,
  });
  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getAdminCategories,
  });

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [status, setStatus] = useState<PostStatus>(
    post?.status ?? "draft",
  );
  const [tagIds, setTagIds] = useState<string[]>(
    post?.tags?.map((t) => t.id) ?? [],
  );
  const [categoryId, setCategoryId] = useState<string>(
    post?.category?.id ?? "",
  );

  const isEdit = !!post;

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      cover_image: coverImage || null,
      status,
      tag_ids: tagIds,
      category_id: categoryId || null,
    };

    if (isEdit && post) {
      updatePost.mutate(
        { id: post.id, data },
        { onSuccess: () => router.push("/admin/posts") },
      );
    } else {
      createPost.mutate(data, {
        onSuccess: () => router.push("/admin/posts"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Excerpt</label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          placeholder="Short summary..."
        />
      </div>

      <MarkdownEditor value={content} onChange={setContent} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Cover Image URL</label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Tags</label>
        <div className="flex flex-wrap gap-2">
          {(tags ?? []).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                tagIds.includes(tag.id)
                  ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
                  : "bg-surface-light text-muted hover:text-foreground"
              }`}
            >
              {tag.name}
            </button>
          ))}
          {(tags ?? []).length === 0 && (
            <span className="text-sm text-muted">No tags yet. Create some in the Tags tab.</span>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">None</option>
          {(categories ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createPost.isPending || updatePost.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {createPost.isPending || updatePost.isPending
            ? "Saving..."
            : isEdit
              ? "Update Post"
              : "Create Post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/admin/posts/new/page.tsx`**

```tsx
"use client";

import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">New Post</h1>
      <PostForm />
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/posts/[id]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { PostForm } from "@/components/admin/PostForm";
import type { PostDetail } from "@/lib/types";

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin", "post", id],
    queryFn: () => adminFetch<PostDetail>(`/api/admin/posts/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="text-muted">Loading post...</p>;
  }

  if (!post) {
    return <p className="text-muted">Post not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Post</h1>
      <PostForm post={post} />
    </div>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with `/admin/posts/new` and `/admin/posts/[id]` routes.

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: PASS (32 tests)

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/admin/MarkdownEditor.tsx apps/web/components/admin/PostForm.tsx apps/web/app/admin/posts/new/ apps/web/app/admin/posts/\[id\]/
git commit -m "feat: add post editor with Markdown and live preview"
```

---

## Task 6: Projects Management (List + Create/Edit)

**Files:**
- Create: `hooks/useAdminProjects.ts`, `components/admin/ProjectForm.tsx`
- Create: `app/admin/projects/page.tsx`, `app/admin/projects/new/page.tsx`, `app/admin/projects/[id]/page.tsx`

**Interfaces:**
- Consumes: `getAdminProjects`, `createProject`, `updateProject`, `deleteProject` from `lib/admin-api.ts`; `PostContent` for project content preview
- Produces: Projects list, new/edit project forms

- [ ] **Step 0: Add backend GET `/api/admin/projects/{id}` endpoint**

The admin projects router (`apps/api/app/api/admin/projects.py`) has no GET-by-ID endpoint. The edit page needs to fetch the full project by ID. Add this route handler:

Add this route handler after the `list_projects` function:

```python
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> ProjectResponse:
    svc = ProjectService(db)
    project = svc.repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)
```

> Note: `ProjectRepository` inherits `get_by_id` from `BaseRepository` (calls `session.get(self.model, obj_id)`). `ProjectResponse` uses `from_attributes=True` so `model_validate` works on the ORM object.

Run from `apps/api/`:

```bash
uv run ruff check . && uv run mypy app/ && uv run python -m pytest -v
```

Expected: All checks pass.

- [ ] **Step 1: Create `hooks/useAdminProjects.ts`**

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getAdminProjects,
  updateProject,
} from "@/lib/admin-api";
import type { ProjectCreate, ProjectUpdate } from "@/lib/types";

export function useAdminProjects() {
  return useQuery({
    queryKey: ["admin", "projects"],
    queryFn: getAdminProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreate) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
}
```

- [ ] **Step 2: Create `components/admin/ProjectForm.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateProject, useUpdateProject } from "@/hooks/useAdminProjects";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import type { Project } from "@/lib/types";

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [content, setContent] = useState(project?.content ?? "");
  const [techStack, setTechStack] = useState(
    project?.tech_stack.join(", ") ?? "",
  );
  const [githubUrl, setGithubUrl] = useState(project?.github_url ?? "");
  const [demoUrl, setDemoUrl] = useState(project?.demo_url ?? "");
  const [coverImage, setCoverImage] = useState(project?.cover_image ?? "");
  const [sortOrder, setSortOrder] = useState(
    project?.sort_order ?? 0,
  );

  const isEdit = !!project;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title,
      slug,
      description,
      content,
      tech_stack: techStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      github_url: githubUrl,
      demo_url: demoUrl || null,
      cover_image: coverImage || null,
      sort_order: sortOrder,
    };

    if (isEdit && project) {
      updateProject.mutate(
        { id: project.id, data },
        { onSuccess: () => router.push("/admin/projects") },
      );
    } else {
      createProject.mutate(data, {
        onSuccess: () => router.push("/admin/projects"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <MarkdownEditor value={content} onChange={setContent} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Tech Stack (comma-separated)</label>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="React, FastAPI, PostgreSQL"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">GitHub URL</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Demo URL</label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Cover Image URL</label>
        <input
          type="text"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createProject.isPending || updateProject.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {createProject.isPending || updateProject.isPending
            ? "Saving..."
            : isEdit
              ? "Update Project"
              : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/admin/projects/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminProjects, useDeleteProject } from "@/hooks/useAdminProjects";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminProjectsPage() {
  const { data: projects, isLoading } = useAdminProjects();
  const deleteProject = useDeleteProject();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted">Loading projects...</p>;
  }

  const projects_list = projects ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
        >
          New Project
        </Link>
      </div>

      {projects_list.length === 0 ? (
        <p className="text-muted">No projects yet. Create one!</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Tech Stack</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted">Order</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects_list.map((project) => (
                <tr key={project.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="text-foreground hover:text-primary-light"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {project.tech_stack.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{project.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(project.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        onConfirm={() => {
          if (deleteId) {
            deleteProject.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/projects/new/page.tsx`**

```tsx
"use client";

import { ProjectForm } from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">New Project</h1>
      <ProjectForm />
    </div>
  );
}
```

- [ ] **Step 5: Create `app/admin/projects/[id]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { ProjectForm } from "@/components/admin/ProjectForm";
import type { Project } from "@/lib/types";

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["admin", "project", id],
    queryFn: () => adminFetch<Project>(`/api/admin/projects/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="text-muted">Loading project...</p>;
  }

  if (!project) {
    return <p className="text-muted">Project not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Project</h1>
      <ProjectForm project={project} />
    </div>
  );
}
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with all admin project routes.

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: PASS (32 tests)

- [ ] **Step 8: Commit**

```bash
git add apps/web/hooks/useAdminProjects.ts apps/web/components/admin/ProjectForm.tsx apps/web/app/admin/projects/
git commit -m "feat: add admin projects management with create/edit/delete"
```

---

## Task 7: Tags + Categories Management

**Files:**
- Create: `hooks/useAdminTags.ts`, `hooks/useAdminCategories.ts`
- Create: `app/admin/tags/page.tsx`, `app/admin/categories/page.tsx`

**Interfaces:**
- Consumes: `getAdminTags`, `createTag`, `updateTag`, `deleteTag`, `getAdminCategories`, `createCategory`, `updateCategory`, `deleteCategory` from `lib/admin-api.ts`
- Produces: Tags and categories management pages with inline create/edit/delete

- [ ] **Step 1: Create `hooks/useAdminTags.ts`**

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTag,
  deleteTag,
  getAdminTags,
  updateTag,
} from "@/lib/admin-api";
import type { TagCreate, TagUpdate } from "@/lib/types";

export function useAdminTags() {
  return useQuery({
    queryKey: ["admin", "tags"],
    queryFn: getAdminTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagCreate) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagUpdate }) =>
      updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
  });
}
```

- [ ] **Step 2: Create `hooks/useAdminCategories.ts`**

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from "@/lib/admin-api";
import type { CategoryCreate, CategoryUpdate } from "@/lib/types";

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getAdminCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryCreate) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}
```

- [ ] **Step 3: Create `app/admin/tags/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  useAdminTags,
  useCreateTag,
  useDeleteTag,
  useUpdateTag,
} from "@/hooks/useAdminTags";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminTagsPage() {
  const { data: tags, isLoading } = useAdminTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    createTag.mutate(
      { name: newName, slug: newSlug },
      {
        onSuccess: () => {
          setNewName("");
          setNewSlug("");
        },
      },
    );
  };

  const startEdit = (id: string, name: string, slug: string) => {
    setEditId(id);
    setEditName(name);
    setEditSlug(slug);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName || !editSlug) return;
    updateTag.mutate(
      { id: editId, data: { name: editName, slug: editSlug } },
      { onSuccess: () => setEditId(null) },
    );
  };

  if (isLoading) {
    return <p className="text-muted">Loading tags...</p>;
  }

  const tags_list = tags ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tags</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="slug"
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={createTag.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Tag
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {tags_list.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-light px-3 py-1"
          >
            {editId === tag.id ? (
              <form onSubmit={handleUpdate} className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-24 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none"
                />
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-24 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none"
                />
                <button type="submit" className="text-xs text-primary-light">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="text-xs text-muted"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <span className="text-sm text-foreground">{tag.name}</span>
                <span className="text-xs text-muted">/{tag.slug}</span>
                <button
                  onClick={() => startEdit(tag.id, tag.name, tag.slug)}
                  className="text-xs text-primary-light hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(tag.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {tags_list.length === 0 && (
        <p className="text-muted">No tags yet. Create one above!</p>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Tag"
        message="Are you sure you want to delete this tag?"
        onConfirm={() => {
          if (deleteId) {
            deleteTag.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/categories/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useAdminCategories";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    createCategory.mutate(
      { name: newName, slug: newSlug },
      {
        onSuccess: () => {
          setNewName("");
          setNewSlug("");
        },
      },
    );
  };

  const startEdit = (id: string, name: string, slug: string) => {
    setEditId(id);
    setEditName(name);
    setEditSlug(slug);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName || !editSlug) return;
    updateCategory.mutate(
      { id: editId, data: { name: editName, slug: editSlug } },
      { onSuccess: () => setEditId(null) },
    );
  };

  if (isLoading) {
    return <p className="text-muted">Loading categories...</p>;
  }

  const categories_list = categories ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Categories</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="slug"
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add Category
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categories_list.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-light px-3 py-1"
          >
            {editId === cat.id ? (
              <form onSubmit={handleUpdate} className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-24 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none"
                />
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-24 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none"
                />
                <button type="submit" className="text-xs text-primary-light">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="text-xs text-muted"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <span className="text-sm text-foreground">{cat.name}</span>
                <span className="text-xs text-muted">/{cat.slug}</span>
                <button
                  onClick={() => startEdit(cat.id, cat.name, cat.slug)}
                  className="text-xs text-primary-light hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {categories_list.length === 0 && (
        <p className="text-muted">No categories yet. Create one above!</p>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        onConfirm={() => {
          if (deleteId) {
            deleteCategory.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with all admin routes:
`/admin/login`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]`, `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/tags`, `/admin/categories`

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: PASS (32 tests)

- [ ] **Step 7: Commit**

```bash
git add apps/web/hooks/useAdminTags.ts apps/web/hooks/useAdminCategories.ts apps/web/app/admin/tags/ apps/web/app/admin/categories/
git commit -m "feat: add admin tags and categories management"
```

---

## Verification Checklist (Run After All Tasks)

- [ ] `npm test` — all 32 tests pass (23 Phase 3 + 9 Phase 4 admin-api)
- [ ] `npm run build` — production build succeeds with all admin routes
- [ ] `npm run lint` — no lint errors
- [ ] Start backend (`docker compose up -d` or `uv run uvicorn app.main:app --reload`)
- [ ] `npm run dev` — navigate to `/admin/login`, log in with admin@example.com / changeme123
- [ ] After login: redirected to `/admin/posts`
- [ ] Create a tag and category in their respective tabs
- [ ] Create a post with Markdown content — verify live preview works
- [ ] Edit the post — verify form is pre-filled
- [ ] Delete a post — confirm dialog appears, post disappears from list
- [ ] Create/edit/delete a project
- [ ] Logout — redirected to `/admin/login`
- [ ] Try accessing `/admin/posts` without login — redirected to `/admin/login`
- [ ] Public pages (`/`, `/blog`, `/projects`, `/about`) still work unchanged

## Known Simplifications (Deferred to Phase 5)

- **Image upload**: Cover images use text URL input. The backend `POST /api/admin/upload` endpoint is not yet implemented. File upload + static serving can be added in Phase 5.
- **Admin component tests**: Only the admin API client has tests. Form/interaction tests (login flow, post editor, tag inline edit) deferred to Phase 5.
- **Slug auto-generation**: Slugs are manually entered. Auto-generating from title can be added as a UX enhancement.
- **Optimistic updates**: Mutations invalidate queries after success. Optimistic updates (instant UI feedback) deferred to Phase 5.
