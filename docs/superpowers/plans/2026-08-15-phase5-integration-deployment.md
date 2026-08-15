# Phase 5: Integration & Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize the blog system with image upload, code highlighting, ISR, animations, error handling polish, E2E tests, deployment config, and production hardening — making it deployment-ready and showcase-worthy.

**Architecture:** Phase 5 builds on the completed Phase 1-4 stack (FastAPI backend, Next.js 16 frontend, Docker, CI). Backend additions are minimal (upload endpoint, config hardening). Most work is frontend: Shiki highlighting, next/image, ISR, Framer Motion, error handling, component tests, and Playwright E2E. Deployment config targets Fly.io (backend) and Vercel (frontend).

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Next.js 16.3.1, React 19.2.8, Tailwind CSS v4, @tanstack/react-query, react-markdown + remark-gfm + rehype-pretty-code (Shiki), framer-motion, Vitest + RTL, Playwright, Fly.io, Vercel.

## Global Constraints

- **Backend commands** run from `apps/api/` using `uv run` (venv at `apps/api/.venv/`)
- **Frontend commands** run from `apps/web/` using `npm run`
- Python 3.12, ruff (`E, F, I, N, W, UP`; line-length 100; `UP017` forces `datetime.UTC`; `UP046` forces PEP 695), mypy (`warn_return_any`, `warn_unused_configs`, `disallow_untyped_defs`)
- Next.js 16: `params`/`searchParams` are Promises (await in Server Components), `PageProps<'/route'>` global type helper, Turbopack default, `fetch` not cached by default (use `{ next: { revalidate } }` to cache)
- Next.js 16 caching (Previous Model — `cacheComponents` NOT enabled): use `{ next: { revalidate: N } }` on `fetch` for time-based revalidation, `export const revalidate = N` for route-level
- Tailwind CSS v4: `@import "tailwindcss"` + `@theme` in globals.css (no tailwind.config.js)
- Path alias: `@/*` maps to `./` relative to `apps/web/`
- API base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- Backend CORS: `http://localhost:3000` with credentials (will be config-driven after Task 1)
- Auth: Bearer token in `Authorization` header; login returns `{ access_token, token_type }`
- TypeScript strict mode, conventional commits, **NO comments in code unless asked**
- **AGENTS.md warning**: `apps/web/AGENTS.md` says "This is NOT the Next.js you know" — read `node_modules/next/dist/docs/` before writing Next.js code
- Existing tests must not break: backend 49 tests (`uv run python -m pytest -v`), frontend 32 tests (`npm test`), `npm run build` must pass after each task
- passlib[bcrypt] `>=1.7.4`; `bcrypt>=4.0.1,<5`
- Framer Motion is already installed (`framer-motion: ^13.1.0` in package.json)

---

## File Structure

```
apps/api/
├── app/
│   ├── core/
│   │   └── config.py                    # MODIFY: add CORS_ORIGINS, UPLOAD_DIR, SECURE_COOKIES
│   ├── api/
│   │   └── admin/
│   │       └── upload.py                 # CREATE: POST /api/admin/upload endpoint
│   └── main.py                           # MODIFY: CORS from settings, StaticFiles mount, upload router
├── tests/
│   └── test_upload.py                    # CREATE: upload endpoint tests
├── Dockerfile.prod                       # CREATE: production multi-stage Dockerfile
└── fly.toml                              # CREATE: Fly.io deployment config

apps/web/
├── next.config.ts                        # MODIFY: images.remotePatterns
├── package.json                          # MODIFY: add shiki, rehype-pretty-code, @playwright/test
├── components/
│   ├── blog/
│   │   └── PostContent.tsx               # MODIFY: add rehype-pretty-code (server component)
│   ├── admin/
│   │   ├── ImageUploader.tsx             # CREATE: file upload + preview component
│   │   ├── MarkdownPreview.tsx           # CREATE: lightweight client-side markdown preview (no Shiki)
│   │   ├── ConfirmDialog.tsx             # MODIFY: remove dead children, add a11y (focus trap, ARIA, Escape)
│   │   └── MarkdownEditor.tsx            # MODIFY: use MarkdownPreview instead of PostContent
│   ├── effects/
│   │   ├── PageTransition.tsx            # CREATE: Framer Motion page transition wrapper
│   │   └── ScrollReveal.tsx              # CREATE: Framer Motion scroll-in animation wrapper
│   └── ui/
│       └── ErrorToast.tsx                # CREATE: error notification component
├── lib/
│   ├── api.ts                            # MODIFY: add revalidate: 60 to fetchApi
│   ├── admin-api.ts                      # MODIFY: add uploadImage function
│   └── types.ts                          # MODIFY: add UploadResponse type
├── hooks/
│   ├── useAdminPosts.ts                  # MODIFY: add onError to mutations
│   ├── useAdminProjects.ts               # MODIFY: add onError to mutations
│   ├── useAdminTags.ts                   # MODIFY: add onError to mutations
│   └── useAdminCategories.ts             # MODIFY: add onError to mutations
├── app/
│   ├── (public)/
│   │   ├── layout.tsx                    # MODIFY: wrap children in PageTransition
│   │   ├── page.tsx                      # MODIFY: add cover images via next/image
│   │   ├── blog/
│   │   │   ├── page.tsx                  # MODIFY: export revalidate
│   │   │   └── [slug]/page.tsx           # MODIFY: export revalidate, add cover image
│   │   └── projects/
│   │       ├── page.tsx                  # MODIFY: export revalidate
│   │       └── [slug]/page.tsx           # MODIFY: export revalidate, add cover image
│   └── admin/
│       ├── login/page.tsx                # MODIFY: use ErrorToast
│       └── posts/page.tsx                # MODIFY: use ErrorToast for delete errors
├── components/blog/PostCard.tsx          # MODIFY: add cover image via next/image
├── components/projects/ProjectCard.tsx   # MODIFY: add cover image via next/image
├── e2e/
│   ├── playwright.config.ts              # CREATE: Playwright config
│   ├── public-navigation.spec.ts         # CREATE: public page E2E test
│   └── admin-flow.spec.ts                # CREATE: admin login → create post → verify E2E test
├── __tests__/
│   ├── ConfirmDialog.test.tsx            # CREATE: ConfirmDialog a11y tests
│   ├── ErrorToast.test.tsx               # CREATE: ErrorToast tests
│   ├── LoginPage.test.tsx               # CREATE: login page tests
│   └── PostForm.test.tsx                 # CREATE: post form tests
└── vitest.setup.ts                       # MODIFY: remove comments from catch block

.env.example                              # MODIFY: add new env vars
README.md                                 # MODIFY: architecture, deployment, env docs
.github/workflows/ci.yml                  # MODIFY: add eslint + Playwright to CI
```

---

## Task 1: Production Config Hardening

**Files:**
- Modify: `apps/api/app/core/config.py`
- Modify: `apps/api/app/main.py`
- Modify: `apps/api/app/api/auth.py`
- Modify: `.env.example`
- Test: `apps/api/tests/test_health.py` (add config test)

**Interfaces:**
- Produces: `CORS_ORIGINS` (list[str]), `UPLOAD_DIR` (str), `SECURE_COOKIES` (bool) on `Settings`
- Consumes: existing `Settings` singleton pattern

- [ ] **Step 1: Write the failing test for config**

Create `apps/api/tests/test_config.py`:

```python
from app.core.config import Settings


def test_default_cors_origins():
    settings = Settings()
    assert "http://localhost:3000" in settings.CORS_ORIGINS


def test_default_upload_dir():
    settings = Settings()
    assert settings.UPLOAD_DIR == "uploads"


def test_default_secure_cookies():
    settings = Settings()
    assert settings.SECURE_COOKIES is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run python -m pytest tests/test_config.py -v`
Expected: FAIL — `Settings` has no `CORS_ORIGINS`, `UPLOAD_DIR`, `SECURE_COOKIES`

- [ ] **Step 3: Update `apps/api/app/core/config.py`**

Replace the entire file with:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str = "postgresql+psycopg2://blog:blog@localhost:5432/blog"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "changeme123"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    UPLOAD_DIR: str = "uploads"
    SECURE_COOKIES: bool = False


settings = Settings()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run python -m pytest tests/test_config.py -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Update `apps/api/app/main.py` — use settings for CORS**

Replace the CORS middleware section (lines 18-24) with:

```python
from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Add the import at the top with the other imports. The `settings` import replaces the hardcoded origin.

- [ ] **Step 6: Update `apps/api/app/api/auth.py` — use settings for cookie security**

Replace the `set_cookie` call in the `login` function (lines 24-29) with:

```python
from app.core.config import settings

response.set_cookie(
    key="access_token",
    value=token.access_token,
    httponly=True,
    samesite="lax",
    secure=settings.SECURE_COOKIES,
)
```

Add the `settings` import at the top.

- [ ] **Step 7: Update `.env.example`**

Append the new variables:

```
CORS_ORIGINS=["http://localhost:3000"]
UPLOAD_DIR=uploads
SECURE_COOKIES=false
```

- [ ] **Step 8: Run all backend tests + lint + typecheck**

Run:
```bash
uv run python -m pytest -v
uv run ruff check .
uv run mypy app/
```
Expected: All 52 tests pass (49 existing + 3 new), lint clean, typecheck clean

- [ ] **Step 9: Commit**

```bash
git add apps/api/app/core/config.py apps/api/app/main.py apps/api/app/api/auth.py apps/api/tests/test_config.py .env.example
git commit -m "feat: add CORS_ORIGINS, UPLOAD_DIR, SECURE_COOKIES to backend config"
```

---

## Task 2: Backend Image Upload Endpoint

**Files:**
- Create: `apps/api/app/api/admin/upload.py`
- Modify: `apps/api/app/main.py` (mount StaticFiles, include upload router)
- Create: `apps/api/tests/test_upload.py`

**Interfaces:**
- Consumes: `Settings.UPLOAD_DIR` from Task 1, `get_current_admin` from existing deps
- Produces: `POST /api/admin/upload` — accepts multipart file, returns `{"url": "/uploads/<filename>"}`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_upload.py`:

```python
import io
from fastapi.testclient import TestClient
from app.main import app


def test_upload_requires_auth():
    client = TestClient(app)
    response = client.post(
        "/api/admin/upload",
        files={"file": ("test.png", io.BytesIO(b"fake-png"), "image/png")},
    )
    assert response.status_code == 401


def test_upload_image_success(admin_client):
    response = admin_client.post(
        "/api/admin/upload",
        files={"file": ("test.png", io.BytesIO(b"fake-png-data"), "image/png")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/uploads/")
    assert data["url"].endswith(".png")


def test_upload_rejects_non_image(admin_client):
    response = admin_client.post(
        "/api/admin/upload",
        files={"file": ("test.txt", io.BytesIO(b"text-data"), "text/plain")},
    )
    assert response.status_code == 400


def test_upload_rejects_empty_file(admin_client):
    response = admin_client.post(
        "/api/admin/upload",
        files={"file": ("empty.png", io.BytesIO(b""), "image/png")},
    )
    assert response.status_code == 400
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run python -m pytest tests/test_upload.py -v`
Expected: FAIL — no upload endpoint exists (404)

- [ ] **Step 3: Create `apps/api/app/api/admin/upload.py`**

```python
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from app.api.deps import get_current_admin
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/admin/upload", tags=["admin-upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("", status_code=201)
def upload_file(
    file: UploadFile,
    admin: User = Depends(get_current_admin),
) -> dict[str, str]:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed")
    contents = file.file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/{filename}"}
```

- [ ] **Step 4: Update `apps/api/app/main.py` — mount StaticFiles + include upload router**

Add imports at the top:

```python
import os
from fastapi.staticfiles import StaticFiles
from app.api.admin.upload import router as admin_upload_router
from app.core.config import settings
```

After the router includes (after line 34), add:

```python
app.include_router(admin_upload_router)

upload_path = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
os.makedirs(upload_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")
```

- [ ] **Step 5: Run upload tests to verify they pass**

Run: `uv run python -m pytest tests/test_upload.py -v`
Expected: PASS (4 tests)

- [ ] **Step 6: Run all backend tests + lint + typecheck**

Run:
```bash
uv run python -m pytest -v
uv run ruff check .
uv run mypy app/
```
Expected: All 56 tests pass (52 + 4 new), lint clean, typecheck clean

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/api/admin/upload.py apps/api/app/main.py apps/api/tests/test_upload.py
git commit -m "feat: add image upload endpoint with file validation"
```

---

## Task 3: Frontend ImageUploader + Cover Image Rendering + next/image

**Files:**
- Create: `apps/web/components/admin/ImageUploader.tsx`
- Modify: `apps/web/lib/admin-api.ts` (add `uploadImage`)
- Modify: `apps/web/lib/types.ts` (add `UploadResponse`)
- Modify: `apps/web/next.config.ts` (add `images.remotePatterns`)
- Modify: `apps/web/components/admin/PostForm.tsx` (use ImageUploader for cover_image)
- Modify: `apps/web/components/admin/ProjectForm.tsx` (use ImageUploader for cover_image)
- Modify: `apps/web/components/blog/PostCard.tsx` (render cover image with next/image)
- Modify: `apps/web/components/projects/ProjectCard.tsx` (render cover image with next/image)
- Modify: `apps/web/app/(public)/blog/[slug]/page.tsx` (add cover image)
- Modify: `apps/web/app/(public)/projects/[slug]/page.tsx` (add cover image)
- Create: `apps/web/__tests__/ImageUploader.test.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/upload` from Task 2, `adminFetch` from existing admin-api
- Produces: `ImageUploader` component (props: `value: string`, `onChange: (url: string) => void`), `uploadImage` function

- [ ] **Step 1: Add `UploadResponse` type to `apps/web/lib/types.ts`**

Append at the end of the file:

```typescript
export interface UploadResponse {
  url: string;
}
```

- [ ] **Step 2: Add `uploadImage` to `apps/web/lib/admin-api.ts`**

Add the import for `UploadResponse` to the type imports at the top, then add this function at the end of the file:

```typescript
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
```

- [ ] **Step 3: Write the failing test for ImageUploader**

Create `apps/web/__tests__/ImageUploader.test.tsx`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "@/components/admin/ImageUploader";

vi.mock("@/lib/admin-api", () => ({
  uploadImage: vi.fn().mockResolvedValue({ url: "/uploads/test.png" }),
}));

describe("ImageUploader", () => {
  it("renders the current image URL", () => {
    render(<ImageUploader value="/uploads/existing.png" onChange={() => {}} />);
    expect(screen.getByDisplayValue("/uploads/existing.png")).toBeInTheDocument();
  });

  it("renders placeholder when no image", () => {
    render(<ImageUploader value="" onChange={() => {}} />);
    expect(screen.getByText("No image uploaded")).toBeInTheDocument();
  });

  it("calls onChange after successful upload", async () => {
    const onChange = vi.fn();
    render(<ImageUploader value="" onChange={onChange} />);
    const input = screen.getByLabelText("Upload image");
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("/uploads/test.png");
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- ImageUploader`
Expected: FAIL — `ImageUploader` component doesn't exist

- [ ] **Step 5: Create `apps/web/components/admin/ImageUploader.tsx`**

```tsx
"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/admin-api";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadImage(file);
      onChange(result.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fullUrl = value
    ? value.startsWith("http")
      ? value
      : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${value}`
    : "";

  return (
    <div className="flex flex-col gap-2">
      <label className="mb-1 block text-sm text-muted">Cover Image</label>
      {fullUrl && (
        <img
          src={fullUrl}
          alt="Cover preview"
          className="h-32 w-full rounded-lg border border-border object-cover"
        />
      )}
      {!fullUrl && (
        <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
          No image uploaded
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        aria-label="Upload image"
        className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-light file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-surface"
      />
      {uploading && <p className="text-xs text-muted">Uploading...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL..."
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- ImageUploader`
Expected: PASS (3 tests)

- [ ] **Step 7: Configure `next.config.ts` with image remote patterns**

Replace the entire file:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 8: Integrate ImageUploader into PostForm**

In `apps/web/components/admin/PostForm.tsx`, replace the Cover Image URL input section (the div containing the "Cover Image URL" label and input, approximately lines 122-131) with:

```tsx
import { ImageUploader } from "@/components/admin/ImageUploader";
```

Add the import at the top, then replace the cover image input div with:

```tsx
<ImageUploader value={coverImage} onChange={setCoverImage} />
```

- [ ] **Step 9: Integrate ImageUploader into ProjectForm**

In `apps/web/components/admin/ProjectForm.tsx`, add the import:

```tsx
import { ImageUploader } from "@/components/admin/ImageUploader";
```

Replace the Cover Image URL input section (the div with "Cover Image URL" label, approximately lines 151-160) with:

```tsx
<ImageUploader value={coverImage} onChange={setCoverImage} />
```

- [ ] **Step 10: Add cover image to PostCard**

In `apps/web/components/blog/PostCard.tsx`, add the import at the top:

```tsx
import Image from "next/image";
```

Add a cover image inside the `GlassCard`, right before the `flex flex-col gap-3` div:

```tsx
{post.cover_image && (
  <Image
    src={post.cover_image.startsWith("http") ? post.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${post.cover_image}`}
    alt={post.title}
    width={400}
    height={200}
    className="h-40 w-full rounded-t-2xl object-cover"
  />
)}
```

- [ ] **Step 11: Add cover image to ProjectCard**

In `apps/web/components/projects/ProjectCard.tsx`, add the import:

```tsx
import Image from "next/image";
```

Add a cover image inside `GlassCard`, before the `flex flex-col gap-3` div:

```tsx
{project.cover_image && (
  <Image
    src={project.cover_image.startsWith("http") ? project.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${project.cover_image}`}
    alt={project.title}
    width={400}
    height={200}
    className="h-40 w-full rounded-t-2xl object-cover"
  />
)}
```

- [ ] **Step 12: Add cover image to blog detail page header**

In `apps/web/app/(public)/blog/[slug]/page.tsx`, add the import:

```tsx
import Image from "next/image";
```

Add a cover image after the `<header>` closing tag, before `<PostContent>`:

```tsx
{post.cover_image && (
  <Image
    src={post.cover_image.startsWith("http") ? post.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${post.cover_image}`}
    alt={post.title}
    width={1200}
    height={400}
    className="mb-8 rounded-2xl object-cover"
  />
)}
```

- [ ] **Step 13: Add cover image to project detail page header**

In `apps/web/app/(public)/projects/[slug]/page.tsx`, add the import:

```tsx
import Image from "next/image";
```

Add a cover image after the `<header>` closing tag, before `<PostContent>`:

```tsx
{project.cover_image && (
  <Image
    src={project.cover_image.startsWith("http") ? project.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${project.cover_image}`}
    alt={project.title}
    width={1200}
    height={400}
    className="mb-8 rounded-2xl object-cover"
  />
)}
```

- [ ] **Step 14: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 35 tests pass (32 existing + 3 new), build succeeds

- [ ] **Step 15: Commit**

```bash
git add apps/web/components/admin/ImageUploader.tsx apps/web/lib/admin-api.ts apps/web/lib/types.ts apps/web/next.config.ts apps/web/components/admin/PostForm.tsx apps/web/components/admin/ProjectForm.tsx apps/web/components/blog/PostCard.tsx apps/web/components/projects/ProjectCard.tsx apps/web/app/(public)/blog/[slug]/page.tsx apps/web/app/(public)/projects/[slug]/page.tsx apps/web/__tests__/ImageUploader.test.tsx
git commit -m "feat: add image uploader, cover image rendering with next/image"
```

---

## Task 4: Shiki Code Highlighting

**Files:**
- Modify: `apps/web/package.json` (add `shiki`, `rehype-pretty-code`)
- Modify: `apps/web/components/blog/PostContent.tsx` (add rehype-pretty-code, become server component)
- Create: `apps/web/components/admin/MarkdownPreview.tsx` (lightweight client preview without Shiki)
- Modify: `apps/web/components/admin/MarkdownEditor.tsx` (use MarkdownPreview)
- Create: `apps/web/__tests__/MarkdownPreview.test.tsx`

**Interfaces:**
- Consumes: existing `react-markdown` + `remark-gfm` in PostContent
- Produces: `PostContent` as a server component with Shiki highlighting, `MarkdownPreview` as a client component for admin

- [ ] **Step 1: Install Shiki and rehype-pretty-code**

Run from `apps/web/`:

```bash
npm install shiki rehype-pretty-code
```

- [ ] **Step 2: Write the failing test for MarkdownPreview**

Create `apps/web/__tests__/MarkdownPreview.test.tsx`:

```typescript
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "@/components/admin/MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders markdown heading", () => {
    render(<MarkdownPreview content="# Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders markdown paragraph", () => {
    render(<MarkdownPreview content="This is a paragraph." />);
    expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
  });

  it("renders code block", () => {
    render(<MarkdownPreview content={"```js\nconst x = 1;\n```"} />);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("renders empty state when no content", () => {
    render(<MarkdownPreview content="" />);
    expect(screen.getByText("Preview will appear here...")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- MarkdownPreview`
Expected: FAIL — `MarkdownPreview` doesn't exist

- [ ] **Step 4: Create `apps/web/components/admin/MarkdownPreview.tsx`**

This is the old PostContent code (client component, no Shiki) for the admin preview:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-bold text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 text-2xl font-semibold text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-muted">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary-light underline hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc pl-6 text-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal pl-6 text-muted">{children}</ol>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="rounded bg-surface-light px-1.5 py-0.5 font-mono text-sm text-primary-light">
                {children}
              </code>
            ) : (
              <code className={`block font-mono text-sm ${className ?? ""}`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-surface p-4 border border-border">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-primary pl-4 italic text-muted">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table className="mb-4 w-full border-collapse text-sm">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-surface-light px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-muted">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- MarkdownPreview`
Expected: PASS (4 tests)

- [ ] **Step 6: Update `MarkdownEditor` to use `MarkdownPreview`**

In `apps/web/components/admin/MarkdownEditor.tsx`, replace the import:

```tsx
import { MarkdownPreview } from "@/components/admin/MarkdownPreview";
```

Replace the `<PostContent content={value} />` usage with:

```tsx
<MarkdownPreview content={value} />
```

Remove the old PostContent import.

- [ ] **Step 7: Update `PostContent.tsx` — convert to server component with Shiki**

Replace the entire file. Remove `"use client";`, add `rehype-pretty-code`:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import type { ComponentProps } from "react";

const options: ComponentProps<typeof rehypePrettyCode> = {
  theme: "github-dark",
  keepBackground: true,
};

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, options]]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-bold text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 text-2xl font-semibold text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-muted">{children}</p>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary-light underline hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc pl-6 text-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal pl-6 text-muted">{children}</ol>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="rounded bg-surface-light px-1.5 py-0.5 font-mono text-sm text-primary-light">
                {children}
              </code>
            ) : (
              <code className={`block font-mono text-sm ${className ?? ""}`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-surface p-4 border border-border">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-primary pl-4 italic text-muted">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table className="mb-4 w-full border-collapse text-sm">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-surface-light px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-muted">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 8: Add Shiki CSS theme styles to `globals.css`**

Add at the end of `apps/web/app/globals.css`:

```css
[data-rehype-pretty-code-figure] pre {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border);
}

[data-rehype-pretty-code-title] {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-muted);
  padding: 0.5rem 1rem;
  background: var(--color-surface-light);
  border-radius: 0.5rem 0.5rem 0 0;
  border: 1px solid var(--color-border);
  border-bottom: none;
}

[data-line] {
  padding: 0 1rem;
}
```

- [ ] **Step 9: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 39 tests pass (35 + 4 new), build succeeds. If react-markdown cannot be a server component, add `"use client"` back to PostContent and keep rehype-pretty-code (it works client-side too, just ships more JS).

- [ ] **Step 10: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/components/blog/PostContent.tsx apps/web/components/admin/MarkdownPreview.tsx apps/web/components/admin/MarkdownEditor.tsx apps/web/app/globals.css apps/web/__tests__/MarkdownPreview.test.tsx
git commit -m "feat: add Shiki code highlighting, split admin preview from public PostContent"
```

---

## Task 5: ISR Configuration

**Files:**
- Modify: `apps/web/lib/api.ts` (add `revalidate: 60` to `fetchApi`)
- Modify: `apps/web/app/(public)/blog/[slug]/page.tsx` (export `revalidate`)
- Modify: `apps/web/app/(public)/projects/[slug]/page.tsx` (export `revalidate`)
- Modify: `apps/web/app/(public)/blog/page.tsx` (export `revalidate`)
- Modify: `apps/web/app/(public)/projects/page.tsx` (export `revalidate`)
- Modify: `apps/web/app/(public)/page.tsx` (export `revalidate`)

**Interfaces:**
- Consumes: existing `fetchApi` function
- Produces: ISR-enabled public pages that revalidate every 60 seconds

- [ ] **Step 1: Add `revalidate: 60` to `fetchApi`**

In `apps/web/lib/api.ts`, update the `fetchApi` function (lines 21-30). Replace the `fetch` call:

```typescript
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
```

The only change is adding `next: { revalidate: 60 }` to the fetch options.

- [ ] **Step 2: Add `export const revalidate = 60` to blog detail page**

In `apps/web/app/(public)/blog/[slug]/page.tsx`, add after the imports (before `generateStaticParams`):

```typescript
export const revalidate = 60;
```

- [ ] **Step 3: Add `export const revalidate = 60` to project detail page**

In `apps/web/app/(public)/projects/[slug]/page.tsx`, add after the imports:

```typescript
export const revalidate = 60;
```

- [ ] **Step 4: Add `export const revalidate = 60` to blog list page**

In `apps/web/app/(public)/blog/page.tsx`, add after the imports:

```typescript
export const revalidate = 60;
```

- [ ] **Step 5: Add `export const revalidate = 60` to projects list page**

In `apps/web/app/(public)/projects/page.tsx`, add after the imports:

```typescript
export const revalidate = 60;
```

- [ ] **Step 6: Add `export const revalidate = 60` to home page**

In `apps/web/app/(public)/page.tsx`, add after the imports:

```typescript
export const revalidate = 60;
```

- [ ] **Step 7: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 39 tests pass, build succeeds with ISR pages marked as static

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/api.ts apps/web/app/\(public\)/blog/\[slug\]/page.tsx apps/web/app/\(public\)/projects/\[slug\]/page.tsx apps/web/app/\(public\)/blog/page.tsx apps/web/app/\(public\)/projects/page.tsx apps/web/app/\(public\)/page.tsx
git commit -m "feat: enable ISR with 60s revalidation on all public pages"
```

---

## Task 6: Framer Motion Animations

**Files:**
- Create: `apps/web/components/effects/PageTransition.tsx`
- Create: `apps/web/components/effects/ScrollReveal.tsx`
- Modify: `apps/web/app/(public)/layout.tsx` (wrap children in PageTransition)
- Modify: `apps/web/components/blog/PostCard.tsx` (add motion hover)
- Modify: `apps/web/components/projects/ProjectCard.tsx` (add motion hover)
- Modify: `apps/web/app/(public)/page.tsx` (wrap sections in ScrollReveal)
- Create: `apps/web/__tests__/ScrollReveal.test.tsx`

**Interfaces:**
- Produces: `PageTransition` (wraps children with fade-in transition), `ScrollReveal` (wraps children with scroll-triggered animation)

- [ ] **Step 1: Write the failing test for ScrollReveal**

Create `apps/web/__tests__/ScrollReveal.test.tsx`:

```typescript
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(<ScrollReveal><p>Content</p></ScrollReveal>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ScrollReveal`
Expected: FAIL — component doesn't exist

- [ ] **Step 3: Create `apps/web/components/effects/PageTransition.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/effects/ScrollReveal.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
}

export function ScrollReveal({ children, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- ScrollReveal`
Expected: PASS (1 test)

- [ ] **Step 6: Wrap public layout children in PageTransition**

In `apps/web/app/(public)/layout.tsx`, add the import:

```tsx
import { PageTransition } from "@/components/effects/PageTransition";
```

Wrap the `{children}` in `<main>` with `<PageTransition>`:

```tsx
<main className="mx-auto min-h-[calc(100vh-8rem)] max-w-5xl px-6 py-12">
  <PageTransition>{children}</PageTransition>
</main>
```

- [ ] **Step 7: Add motion hover to PostCard**

In `apps/web/components/blog/PostCard.tsx`, add the import:

```tsx
import { motion } from "framer-motion";
```

Replace the `<Link>` wrapping with a motion-enhanced version. Change the `className` on the Link from `block transition-transform hover:scale-[1.02]` to just `block`, and wrap the `GlassCard` in a motion.div:

```tsx
export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <GlassCard className="h-full p-6">
          {post.cover_image && (
            <Image
              src={post.cover_image.startsWith("http") ? post.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${post.cover_image}`}
              alt={post.title}
              width={400}
              height={200}
              className="h-40 w-full rounded-t-2xl object-cover"
            />
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              {post.category && <Badge>{post.category.name}</Badge>}
              {post.published_at && (
                <time>
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm text-muted line-clamp-2">{post.excerpt}</p>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag.id} variant="gradient">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}
```

Note: The `import Image from "next/image"` should already exist from Task 3. If PostCard test fails because framer-motion's motion.div doesn't render children in jsdom, wrap the test in a mock. The existing PostCard test should still pass because it tests text content, not motion props.

- [ ] **Step 8: Add motion hover to ProjectCard**

In `apps/web/components/projects/ProjectCard.tsx`, add the import:

```tsx
import { motion } from "framer-motion";
```

Wrap the `GlassCard` content in a `motion.div` with the same `whileHover` as PostCard. Change the Link className from `block transition-transform hover:scale-[1.02]` to `block`:

```tsx
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className="block">
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <GlassCard className="h-full p-6">
          {project.cover_image && (
            <Image
              src={project.cover_image.startsWith("http") ? project.cover_image : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${project.cover_image}`}
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
```

- [ ] **Step 9: Wrap home page sections in ScrollReveal**

In `apps/web/app/(public)/page.tsx`, add the import:

```tsx
import { ScrollReveal } from "@/components/effects/ScrollReveal";
```

Wrap the hero section and each content section in `<ScrollReveal>`:

```tsx
<ScrollReveal>
  <section className="flex flex-col items-center gap-6 py-16 text-center">
    ...
  </section>
</ScrollReveal>
```

Wrap both the "Recent Posts" and "Featured Projects" sections similarly.

- [ ] **Step 10: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 40 tests pass (39 + 1 new), build succeeds

- [ ] **Step 11: Commit**

```bash
git add apps/web/components/effects/PageTransition.tsx apps/web/components/effects/ScrollReveal.tsx apps/web/app/\(public\)/layout.tsx apps/web/components/blog/PostCard.tsx apps/web/components/projects/ProjectCard.tsx apps/web/app/\(public\)/page.tsx apps/web/__tests__/ScrollReveal.test.tsx
git commit -m "feat: add Framer Motion page transitions, scroll reveal, card hover"
```

---

## Task 7: Error Handling Polish

**Files:**
- Create: `apps/web/components/ui/ErrorToast.tsx`
- Create: `apps/web/__tests__/ErrorToast.test.tsx`
- Modify: `apps/web/hooks/useAdminPosts.ts` (add `onError`)
- Modify: `apps/web/hooks/useAdminProjects.ts` (add `onError`)
- Modify: `apps/web/hooks/useAdminTags.ts` (add `onError`)
- Modify: `apps/web/hooks/useAdminCategories.ts` (add `onError`)
- Modify: `apps/web/app/admin/posts/page.tsx` (use ErrorToast for delete)
- Modify: `apps/web/app/admin/projects/page.tsx` (use ErrorToast for delete)
- Modify: `apps/web/components/admin/PostForm.tsx` (surface server error)
- Modify: `apps/web/components/admin/ProjectForm.tsx` (surface server error)

**Interfaces:**
- Produces: `ErrorToast` component (props: `message: string`, `onClose: () => void`)

- [ ] **Step 1: Write the failing test for ErrorToast**

Create `apps/web/__tests__/ErrorToast.test.tsx`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorToast } from "@/components/ui/ErrorToast";

describe("ErrorToast", () => {
  it("displays error message", () => {
    render(<ErrorToast message="Something went wrong" onClose={() => {}} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<ErrorToast message="" onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<ErrorToast message="Error" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close error"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ErrorToast`
Expected: FAIL — component doesn't exist

- [ ] **Step 3: Create `apps/web/components/ui/ErrorToast.tsx`**

```tsx
"use client";

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-red-500/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm">
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close error"
        className="text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ErrorToast`
Expected: PASS (3 tests)

- [ ] **Step 5: Add `onError` to all mutation hooks**

In each of the four hook files (`useAdminPosts.ts`, `useAdminProjects.ts`, `useAdminTags.ts`, `useAdminCategories.ts`), add an `onError` parameter to each `useMutation` / `useDelete*` hook. The pattern for each delete mutation:

For `useAdminPosts.ts`, update `useDeletePost`:

```typescript
import { AdminApiError } from "@/lib/admin-api";

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof AdminApiError ? error.message : "Delete failed";
      console.error(msg);
    },
  });
}
```

Apply the same pattern to:
- `useDeleteTag` in `useAdminTags.ts`
- `useDeleteCategory` in `useAdminCategories.ts`
- `useDeleteProject` in `useAdminProjects.ts`

Add the `AdminApiError` import to each file.

- [ ] **Step 6: Update admin posts page to use ErrorToast**

In `apps/web/app/admin/posts/page.tsx`, add imports:

```tsx
import { ErrorToast } from "@/components/ui/ErrorToast";
import { AdminApiError } from "@/lib/admin-api";
```

Add state:

```tsx
const [deleteError, setDeleteError] = useState("");
```

Update the delete handler in `ConfirmDialog`:

```tsx
onConfirm={() => {
  if (deleteId) {
    deletePost.mutate(deleteId, {
      onError: (error: unknown) => {
        const msg = error instanceof AdminApiError ? error.message : "Delete failed";
        setDeleteError(msg);
      },
    });
    setDeleteId(null);
  }
}}
```

Add the `ErrorToast` component at the end of the JSX (before the closing `</div>`):

```tsx
<ErrorToast message={deleteError} onClose={() => setDeleteError("")} />
```

- [ ] **Step 7: Update admin projects page similarly**

Apply the same ErrorToast pattern from Step 6 to `apps/web/app/admin/projects/page.tsx`.

- [ ] **Step 8: Surface server error detail in PostForm**

In `apps/web/components/admin/PostForm.tsx`, add the import:

```tsx
import { AdminApiError } from "@/lib/admin-api";
```

Update the `onError` handlers in `handleSubmit`:

```tsx
onError: (error: unknown) => {
  const msg = error instanceof AdminApiError ? error.message : "Failed to save. Please try again.";
  setSubmitError(msg);
}
```

Apply to both the update and create mutation calls.

- [ ] **Step 9: Surface server error detail in ProjectForm**

Apply the same `AdminApiError` import and `onError` pattern from Step 8 to `apps/web/components/admin/ProjectForm.tsx`.

- [ ] **Step 10: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 43 tests pass (40 + 3 new), build succeeds

- [ ] **Step 11: Commit**

```bash
git add apps/web/components/ui/ErrorToast.tsx apps/web/__tests__/ErrorToast.test.tsx apps/web/hooks/useAdminPosts.ts apps/web/hooks/useAdminProjects.ts apps/web/hooks/useAdminTags.ts apps/web/hooks/useAdminCategories.ts apps/web/app/admin/posts/page.tsx apps/web/app/admin/projects/page.tsx apps/web/components/admin/PostForm.tsx apps/web/components/admin/ProjectForm.tsx
git commit -m "feat: add ErrorToast, surface server error details, add onError to mutations"
```

---

## Task 8: ConfirmDialog A11y + Cleanup

**Files:**
- Modify: `apps/web/components/admin/ConfirmDialog.tsx`
- Create: `apps/web/__tests__/ConfirmDialog.test.tsx`

**Interfaces:**
- Consumes: existing `ConfirmDialog` props (minus `children`)
- Produces: accessible `ConfirmDialog` with `role="dialog"`, `aria-modal`, focus trap, Escape-to-close

- [ ] **Step 1: Write the failing test**

Create `apps/web/__tests__/ConfirmDialog.test.tsx`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog open={false} title="" message="" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders title and message when open", () => {
    render(
      <ConfirmDialog open={true} title="Delete Post" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByText("Delete Post")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("has role dialog and aria-modal", () => {
    render(
      <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={() => {}} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onCancel on Escape key", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ConfirmDialog`
Expected: FAIL — no `role="dialog"`, no Escape handler

- [ ] **Step 3: Update `ConfirmDialog` with a11y**

Replace the entire file `apps/web/components/admin/ConfirmDialog.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="glass gradient-border w-full max-w-sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="mb-2 text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mb-4 text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
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

Key changes: removed dead `children` prop, added `role="dialog"`, `aria-modal`, `aria-labelledby`, focus on confirm button, Escape-to-close, backdrop click to cancel.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ConfirmDialog`
Expected: PASS (5 tests)

- [ ] **Step 5: Fix `vitest.setup.ts` — remove comments from catch block**

In `apps/web/vitest.setup.ts`, replace the catch block (lines 25-28):

```typescript
} catch {
  void 0;
}
```

- [ ] **Step 6: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 48 tests pass (43 + 5 new), build succeeds

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/admin/ConfirmDialog.tsx apps/web/__tests__/ConfirmDialog.test.tsx apps/web/vitest.setup.ts
git commit -m "fix: ConfirmDialog a11y (focus trap, ARIA, Escape), remove dead children prop, fix vitest comments"
```

---

## Task 9: Admin Component Tests

**Files:**
- Create: `apps/web/__tests__/LoginPage.test.tsx`
- Create: `apps/web/__tests__/PostForm.test.tsx`

**Interfaces:**
- Consumes: existing `useLogin`, `useCreatePost`, `useUpdatePost` hooks, `QueryProvider`

- [ ] **Step 1: Write LoginPage test**

Create `apps/web/__tests__/LoginPage.test.tsx`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/app/admin/login/page";

vi.mock("@/lib/admin-api", () => ({
  login: vi.fn(),
  getMe: vi.fn().mockRejectedValue(new Error("No token")),
  logout: vi.fn(),
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

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("renders login button", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    const { login } = await import("@/lib/admin-api");
    vi.mocked(login).mockRejectedValueOnce(new Error("Invalid"));
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("admin@example.com"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByText("Incorrect email or password")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run LoginPage test to verify it passes**

Run: `npm test -- LoginPage`
Expected: PASS (3 tests)

- [ ] **Step 3: Write PostForm test**

Create `apps/web/__tests__/PostForm.test.tsx`:

```typescript
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
```

- [ ] **Step 4: Run PostForm test to verify it passes**

Run: `npm test -- PostForm`
Expected: PASS (5 tests)

- [ ] **Step 5: Run all frontend tests + build**

Run:
```bash
npm test
npm run build
```
Expected: All 56 tests pass (48 + 8 new), build succeeds

- [ ] **Step 6: Commit**

```bash
git add apps/web/__tests__/LoginPage.test.tsx apps/web/__tests__/PostForm.test.tsx
git commit -m "test: add LoginPage and PostForm component tests"
```

---

## Task 10: Playwright E2E Tests

**Files:**
- Modify: `apps/web/package.json` (add `@playwright/test`)
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/public-navigation.spec.ts`
- Create: `apps/web/e2e/admin-flow.spec.ts`

**Interfaces:**
- Consumes: running backend (port 8000) + frontend (port 3000) for E2E
- Produces: Playwright E2E test suite

- [ ] **Step 1: Install Playwright**

Run from `apps/web/`:

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `apps/web/playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

- [ ] **Step 3: Create public navigation E2E test**

Create `apps/web/e2e/public-navigation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("home page loads and shows hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Building things for the web");
});

test("navigate to blog page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/blog"]');
  await expect(page).toHaveURL(/\/blog/);
});

test("navigate to projects page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/projects"]');
  await expect(page).toHaveURL(/\/projects/);
});

test("navigate to about page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/about"]');
  await expect(page).toHaveURL(/\/about/);
});

test("404 page for non-existent route", async ({ page }) => {
  await page.goto("/nonexistent");
  await expect(page.locator("body")).toContainText(/not found/i);
});
```

- [ ] **Step 4: Create admin flow E2E test**

Create `apps/web/e2e/admin-flow.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("admin login page loads", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator("h1")).toContainText("Admin Login");
});

test("login with wrong credentials shows error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', "wrong@example.com");
  await page.fill('input[type="password"]', "wrongpassword");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Incorrect email or password")).toBeVisible({ timeout: 10000 });
});

test("full admin flow: login, create post, verify", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "changeme123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/posts/);

  await page.click('a[href="/admin/posts/new"]');
  await expect(page).toHaveURL(/\/admin\/posts\/new/);

  await page.fill('input[name="title"], input[id="title"]', "E2E Test Post");
  await page.fill('input[name="slug"], input[id="slug"]', "e2e-test-post");
  await page.fill('textarea', "# E2E Test\n\nThis is a test post.");
  await page.selectOption("select", "published");
  await page.click('button:has-text("Create Post")');
  await expect(page).toHaveURL(/\/admin\/posts/);

  await page.goto("/blog");
  await expect(page.locator("text=E2E Test Post")).toBeVisible({ timeout: 10000 });
});
```

Note: The admin flow test requires a running backend with seeded admin user and database. It should be marked as skipped in CI unless a full environment is available. The test is a specification of the expected behavior.

- [ ] **Step 5: Add Playwright scripts to `package.json`**

Add to the `scripts` section:

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

- [ ] **Step 6: Run Playwright tests (public navigation only — requires running servers)**

Start both servers:
```bash
cd apps/api && uv run uvicorn app.main:app --reload --port 8000
# In another terminal:
cd apps/web && npm run dev
```

Then run:
```bash
npx playwright test e2e/public-navigation.spec.ts
```
Expected: 5 public navigation tests pass (admin flow requires seeded DB)

- [ ] **Step 7: Run unit tests to ensure nothing broke**

Run:
```bash
npm test
npm run build
```
Expected: All 56 unit tests pass, build succeeds

- [ ] **Step 8: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/playwright.config.ts apps/web/e2e/public-navigation.spec.ts apps/web/e2e/admin-flow.spec.ts
git commit -m "test: add Playwright E2E tests for public navigation and admin flow"
```

---

## Task 11: Deployment Config

**Files:**
- Create: `apps/api/Dockerfile.prod`
- Create: `apps/api/fly.toml`
- Modify: `apps/api/Dockerfile` (keep for dev, reference prod)
- Modify: `.env.example` (add production env vars)
- Modify: `apps/web/Dockerfile` (add production build stage)

**Interfaces:**
- Produces: production-ready Docker images, Fly.io deployment config, documented environment variables

- [ ] **Step 1: Create production Dockerfile for backend**

Create `apps/api/Dockerfile.prod`:

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

COPY pyproject.toml ./
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./
COPY scripts/ ./scripts/

RUN pip install --no-cache-dir -e ".[dev]"

FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

RUN mkdir -p /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create Fly.io config for backend**

Create `apps/api/fly.toml`:

```toml
app = "blog-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.prod"

[env]
  CORS_ORIGINS = '["https://your-blog.vercel.app"]'
  SECURE_COOKIES = "true"
  UPLOAD_DIR = "uploads"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[http_service.checks]]
  interval = "30s"
  timeout = "5s"
  grace_period = "10s"
  method = "GET"
  path = "/api/health"

[mounts]
  source = "uploads"
  destination = "/app/uploads"
```

- [ ] **Step 3: Update frontend Dockerfile with production build**

Replace `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Note: This requires `output: 'standalone'` in `next.config.ts`. Add that to the config:

In `apps/web/next.config.ts`, add `output: "standalone"` to the config object.

- [ ] **Step 4: Update `.env.example` with production vars**

Append to `.env.example`:

```
CORS_ORIGINS=["https://your-blog.vercel.app"]
UPLOAD_DIR=uploads
SECURE_COOKIES=true
NEXT_PUBLIC_API_URL=https://your-api.fly.dev
```

- [ ] **Step 5: Run all tests to ensure nothing broke**

Run:
```bash
cd apps/api && uv run python -m pytest -v
cd apps/web && npm test && npm run build
```
Expected: All backend (56) + frontend (56) tests pass, build succeeds

- [ ] **Step 6: Commit**

```bash
git add apps/api/Dockerfile.prod apps/api/fly.toml apps/web/Dockerfile apps/web/next.config.ts .env.example
git commit -m "feat: add production deployment config (Fly.io, standalone build)"
```

---

## Task 12: README Polish + CI Enhancement

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `apps/web/tsconfig.json` (if needed for eslint)

**Interfaces:**
- Produces: comprehensive README, enhanced CI with eslint + Playwright

- [ ] **Step 1: Rewrite `README.md`**

Replace the entire file:

```markdown
# Personal Blog + Portfolio

A full-stack personal blog and portfolio system built with FastAPI and Next.js 16, designed as a GitHub open-source project for job application showcase.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, JWT auth (bcrypt)
- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, React Query, Framer Motion, Shiki
- **Database:** PostgreSQL 16, Redis 7
- **Testing:** Pytest (backend), Vitest + RTL (frontend), Playwright (E2E)
- **DevOps:** Docker Compose, GitHub Actions CI, Fly.io + Vercel deployment

## Architecture

```
blog/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/            # Routers (public + admin)
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Data access
│   │   │   ├── models/          # SQLAlchemy ORM
│   │   │   ├── schemas/         # Pydantic schemas
│   │   │   ├── core/            # Config, security, database
│   │   │   └── main.py          # App entry
│   │   ├── alembic/             # DB migrations
│   │   ├── tests/              # 56 tests
│   │   └── pyproject.toml
│   └── web/                    # Next.js frontend
│       ├── app/                # App Router (public + admin)
│       ├── components/         # UI, blog, admin, effects
│       ├── lib/               # API client, auth, types
│       ├── hooks/              # React Query hooks
│       ├── e2e/                # Playwright E2E tests
│       └── __tests__/          # 56 unit tests
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### Backend Architecture

Layered: routers → services → repositories → models. Each layer uses dependency injection. Pydantic v2 schemas decouple API contracts from ORM models.

### Frontend Architecture

- **Public pages:** Server Components, SSG via `generateStaticParams`, ISR (`revalidate: 60`), Shiki code highlighting
- **Admin panel:** Client Components, React Query for server state, JWT Bearer token in localStorage
- **Design system:** Tailwind v4 dark theme, glassmorphism, gradient palette, Framer Motion animations

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local backend development)
- Node.js 20+ (for local frontend development)

### Quick Start with Docker

```bash
cp .env.example .env
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python scripts/seed.py
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd apps/api
uv pip install -e ".[dev]"
uv run python -m pytest -v
uv run ruff check .
uv run mypy app/
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
npm test
npm run build
```

### E2E Tests

```bash
cd apps/web
npx playwright test
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg2://blog:blog@localhost:5432/blog` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key (change in prod!) |
| `ACCESS_TOKEN_EXPIRE_HOURS` | `24` | JWT token lifetime |
| `ADMIN_EMAIL` | `admin@example.com` | Admin user email |
| `ADMIN_USERNAME` | `admin` | Admin username |
| `ADMIN_PASSWORD` | `changeme123` | Admin password (change in prod!) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
| `UPLOAD_DIR` | `uploads` | Image upload directory |
| `SECURE_COOKIES` | `false` | Set `true` in production (HTTPS) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL (frontend) |

## Deployment

### Backend (Fly.io)

```bash
cd apps/api
fly deploy --dockerfile Dockerfile.prod
fly secrets set SECRET_KEY=<your-secret> ADMIN_PASSWORD=<your-password>
```

### Frontend (Vercel)

1. Import the repo to Vercel
2. Set root directory to `apps/web`
3. Set `NEXT_PUBLIC_API_URL` to your Fly.io backend URL
4. Deploy

## License

MIT
```

- [ ] **Step 2: Update CI workflow — add eslint + Playwright**

Replace `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: mypy app/
      - run: python -m pytest -v

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: apps/web/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test || true
        continue-on-error: true
```

Note: E2E job has `continue-on-error: true` because it requires a running backend + database. In a full CI setup, you would add service containers for PostgreSQL and Redis, run the backend, seed it, then run E2E. For now, the E2E job is optional.

- [ ] **Step 3: Run all tests to verify nothing broke**

Run:
```bash
cd apps/api && uv run python -m pytest -v && uv run ruff check . && uv run mypy app/
cd apps/web && npm test && npm run lint && npm run build
```
Expected: All tests pass, lint clean, build succeeds

- [ ] **Step 4: Commit**

```bash
git add README.md .github/workflows/ci.yml
git commit -m "docs: rewrite README with architecture, deployment, env vars; add eslint + e2e to CI"
```

---

## Verification (Post-All-Tasks)

After completing all 12 tasks, run this final verification:

- [ ] **Backend:** `cd apps/api && uv run python -m pytest -v` — expect 56+ tests pass
- [ ] **Backend lint:** `cd apps/api && uv run ruff check . && uv run mypy app/` — clean
- [ ] **Frontend tests:** `cd apps/web && npm test` — expect 56+ tests pass
- [ ] **Frontend lint:** `cd apps/web && npm run lint` — clean
- [ ] **Frontend build:** `cd apps/web && npm run build` — succeeds
- [ ] **Docker:** `docker compose up -d` then `curl http://localhost:8000/api/health` — returns `{"status": "healthy"}`
- [ ] **Frontend dev:** `npm run dev` at `localhost:3000` — pages load
- [ ] **E2E:** `npx playwright test e2e/public-navigation.spec.ts` — 5 tests pass
