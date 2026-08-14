export type PostStatus = "draft" | "published";

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface TagWithCount extends Tag {
  post_count: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryWithCount extends Category {
  post_count: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  status: PostStatus;
  views: number;
  created_at: string;
  published_at: string | null;
  tags: Tag[];
  category: Category | null;
}

export interface PostDetail extends PostListItem {
  content: string;
  author: User;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  tech_stack: string[];
  github_url: string;
  demo_url: string | null;
  cover_image: string | null;
  sort_order: number;
  created_at: string;
}

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
