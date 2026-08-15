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
  UploadResponse,
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
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/admin/login")
    ) {
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
  return adminFetch<void>(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
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

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (res.status === 401) {
    removeToken();
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/admin/login")
    ) {
      window.location.href = "/admin/login";
    }
    throw new AdminApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "Unknown error");
    throw new AdminApiError(detail, res.status);
  }
  return res.json() as Promise<UploadResponse>;
}
