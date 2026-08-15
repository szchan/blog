import type {
  CategoryWithCount,
  PaginatedResponse,
  PostDetail,
  PostListItem,
  Project,
  TagWithCount,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function fetchApi<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new ApiError(`API error: ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export async function getPosts(
  page = 1,
  perPage = 10,
  tag?: string,
  category?: string,
): Promise<PaginatedResponse<PostListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (tag) params.set("tag", tag);
  if (category) params.set("category", category);
  return fetchApi<PaginatedResponse<PostListItem>>(`/api/posts?${params}`);
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    return await fetchApi<PostDetail>(`/api/posts/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getTags(): Promise<TagWithCount[]> {
  return fetchApi<TagWithCount[]>("/api/tags");
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  return fetchApi<CategoryWithCount[]>("/api/categories");
}

export async function getProjects(): Promise<Project[]> {
  return fetchApi<Project[]>("/api/projects");
}

export async function getProject(slug: string): Promise<Project | null> {
  try {
    return await fetchApi<Project>(`/api/projects/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  const data = await getPosts(1, 100);
  return data.items.map((p) => p.slug);
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const projects = await getProjects();
  return projects.map((p) => p.slug);
}
