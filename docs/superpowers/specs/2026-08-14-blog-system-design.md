# 个人博客系统设计文档

- **日期**: 2026-08-14
- **项目**: 个人博客 + 作品集（GitHub 开源求职展示）
- **方案**: A — 均衡型全栈 Monorepo

## 1. 目标与范围

### 1.1 项目目标

构建一个个人博客 + 作品集系统，开源在 GitHub 上，用于求职时向面试官展示全栈工程能力。需要在以下四个方向均衡展示：

1. 测试与 CI/CD 工程素养
2. 后端架构质量
3. 前端工程化与体验
4. 数据库与部署架构

### 1.2 核心功能

- **博客**: 文章列表/详情、Markdown 编辑器后台、标签分类、分页
- **作品集**: 项目展示页（GitHub 集成）、项目详情
- **关于页**: 个人介绍
- **管理后台**: 文章/标签/分类/作品的增删改查，JWT 鉴权

### 1.3 技术选型

| 层面 | 选型 | 理由 |
|------|------|------|
| 后端框架 | FastAPI | Python 异步、自动 OpenAPI 文档、Pydantic 类型安全 |
| 前端框架 | Next.js (App Router) | SSG 预渲染、SEO 友好、行业主流 |
| 数据库 | PostgreSQL 16 | 生产级关系型数据库，展示 SQL 能力 |
| 缓存 | Redis 7 | 文章列表/详情缓存，展示基础设施能力 |
| ORM | SQLAlchemy 2.0 + Alembic | 类型提示友好、迁移管理 |
| 样式 | Tailwind CSS | utility 优先，自定义渐变色板 |
| 动效 | Framer Motion | 页面切换、滚动渐入、卡片 hover |
| 数据获取 | React Query (CSR) / SSG (公开页) | 管理页客户端状态、公开页预渲染 |
| 鉴权 | JWT (httpOnly cookie) | 无状态、前后端分离友好 |
| 容器化 | Docker Compose + Dockerfile | 一键开发环境、生产部署一致 |

### 1.4 非目标（YAGNI）

- 用户注册/登录系统（单作者模式，仅 admin）
- 评论系统
- 多语言/国际化
- 搜索引擎（首期不做，后续可加）
- 后台任务队列（Celery，首期不需要）

## 2. 整体架构

### 2.1 Monorepo 结构

```
blog/
├── apps/
│   ├── web/                    # Next.js 前端
│   │   ├── app/               # App Router 页面
│   │   ├── components/        # UI 组件
│   │   ├── lib/               # API client、工具函数
│   │   ├── hooks/             # 自定义 React Hooks
│   │   └── public/
│   │
│   └── api/                   # FastAPI 后端
│       ├── app/
│       │   ├── api/           # 路由层（routers）
│       │   ├── services/      # 业务逻辑层
│       │   ├── repositories/  # 数据访问层
│       │   ├── models/        # SQLAlchemy ORM 模型
│       │   ├── schemas/       # Pydantic 请求/响应模型
│       │   ├── core/          # 配置、安全、依赖注入
│       │   └── main.py        # 应用入口
│       ├── alembic/           # 数据库迁移
│       ├── tests/
│       └── pyproject.toml
│
├── docker-compose.yml          # 本地开发：PG + Redis + API + Web
├── .github/workflows/         # CI/CD
└── README.md
```

### 2.2 后端分层架构

请求流向自上而下，各层通过依赖注入连接：

```
HTTP Request
  → routers/    （路由层：参数校验、调用 service）
  → services/   （业务层：编排逻辑、权限检查）
  → repositories/（数据层：SQLAlchemy 查询）
  → models/     （ORM 模型 ↔ PostgreSQL）
```

- `schemas/` 用 Pydantic 定义请求/响应结构，与 ORM model 解耦
- `core/` 放配置管理（环境变量）、JWT 工具、FastAPI 依赖注入
- 各层通过依赖注入连接，方便单元测试 mock

### 2.3 前端数据流

```
构建时:  Next.js → 调用 FastAPI API → 预渲染博客/作品集静态页
运行时:  /admin/* 页面客户端渲染，JWT 鉴权，实时增删改
新文章:  后台发布 → Next.js ISR (revalidate: 60) 自动增量再生，1 分钟内生效
        （可选: 叠加 Vercel Deploy Hook 实现发布后即时重建）
```

## 3. 数据库设计

### 3.1 表结构

#### users

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| email | str | unique, not null | |
| username | str | unique, not null | |
| password_hash | str | not null | bcrypt 哈希 |
| is_admin | bool | default false | |
| created_at | datetime | default now | |

#### posts

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| title | str | not null | |
| slug | str | unique, not null | URL 友好 |
| excerpt | str | nullable | 摘要 |
| content | text | not null | Markdown 原文 |
| cover_image | str | nullable | 图片 URL |
| status | enum | not null, default 'draft' | draft / published |
| views | int | default 0 | |
| author_id | UUID | FK → users.id | |
| category_id | UUID | FK → categories.id, nullable | |
| published_at | datetime | nullable | 发布时填充 |
| created_at | datetime | default now | |
| updated_at | datetime | onupdate now | |

#### tags

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| name | str | not null | |
| slug | str | unique, not null | |

#### post_tags（多对多关联）

| 字段 | 类型 | 约束 |
|------|------|------|
| post_id | UUID | FK → posts.id |
| tag_id | UUID | FK → tags.id |

复合主键 (post_id, tag_id)。

#### categories

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| name | str | not null | |
| slug | str | unique, not null | |

#### projects

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | |
| title | str | not null | |
| slug | str | unique, not null | |
| description | str | not null | 简短描述 |
| content | text | not null | Markdown 详情 |
| tech_stack | JSON | not null | ["Python","React",...] |
| github_url | str | not null | |
| demo_url | str | nullable | |
| cover_image | str | nullable | |
| sort_order | int | default 0 | 控制展示顺序 |
| created_at | datetime | default now | |

### 3.2 索引

- `posts.slug` — unique index，详情页查询
- `posts.status` — index，筛选已发布文章
- `posts.published_at` — index，按时间排序
- `posts.author_id` — index，关联查询
- `projects.slug` — unique index
- `tags.slug` / `categories.slug` — unique index

## 4. API 设计

### 4.1 公开接口（无需鉴权）

| 方法 | 路径 | 查询参数 | 说明 |
|------|------|----------|------|
| GET | `/api/posts` | page, per_page, tag, category | 已发布文章列表，分页 + 过滤 |
| GET | `/api/posts/{slug}` | — | 文章详情，自增 views |
| GET | `/api/tags` | — | 标签列表（含文章计数） |
| GET | `/api/categories` | — | 分类列表（含文章计数） |
| GET | `/api/projects` | — | 作品列表，按 sort_order 排序 |
| GET | `/api/projects/{slug}` | — | 作品详情 |

所有列表接口返回统一分页结构：

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "per_page": 10,
  "total_pages": 5
}
```

### 4.2 管理接口（JWT 鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 JWT（设 httpOnly cookie） |
| POST | `/api/auth/logout` | 登出，清除 cookie |
| GET | `/api/auth/me` | 获取当前用户信息 |
| GET/POST | `/api/admin/posts` | 文章列表/创建 |
| GET/PUT/DELETE | `/api/admin/posts/{id}` | 文章详情/更新/删除 |
| GET/POST | `/api/admin/tags` | 标签列表/创建 |
| PUT/DELETE | `/api/admin/tags/{id}` | 标签更新/删除 |
| GET/POST | `/api/admin/categories` | 分类列表/创建 |
| PUT/DELETE | `/api/admin/categories/{id}` | 分类更新/删除 |
| GET/POST | `/api/admin/projects` | 作品列表/创建 |
| GET/PUT/DELETE | `/api/admin/projects/{id}` | 作品详情/更新/删除 |
| POST | `/api/admin/upload` | 图片上传 |

### 4.3 鉴权设计

- 单作者模式，预置一个 admin 账户（通过环境变量配置邮箱/密码，初始化脚本创建）
- 登录返回 JWT access token（过期时间 24h），设为 httpOnly cookie
- 管理接口通过 FastAPI `Depends(get_current_admin)` 注入 JWT 校验
- 密码用 bcrypt 哈希存储
- JWT payload: `{ "sub": user_id, "exp": ... }`

### 4.4 错误处理

统一错误响应格式：

```json
{
  "detail": "错误描述信息",
  "code": "POST_NOT_FOUND"
}
```

常见错误码：

| HTTP 状态 | code | 场景 |
|-----------|------|------|
| 401 | UNAUTHORIZED | 无效或过期 token |
| 403 | FORBIDDEN | 非 admin 用户 |
| 404 | NOT_FOUND | 资源不存在 |
| 422 | VALIDATION_ERROR | 请求参数校验失败（Pydantic 自动） |
| 500 | INTERNAL_ERROR | 未预期异常 |

## 5. 前端设计

### 5.1 页面结构（Next.js App Router）

```
app/
├── (public)/                    # 公开页面组，共享布局
│   ├── layout.tsx               # 顶部导航 + 页脚
│   ├── page.tsx                 # 首页：Hero + 最新文章 + 精选作品
│   ├── blog/
│   │   ├── page.tsx             # 文章列表（分页 + 标签筛选）
│   │   └── [slug]/page.tsx      # 文章详情（SSG 预渲染）
│   ├── projects/
│   │   ├── page.tsx             # 作品集展示
│   │   └── [slug]/page.tsx      # 作品详情（SSG 预渲染）
│   └── about/page.tsx           # 关于我
│
├── admin/                       # 管理后台（客户端渲染）
│   ├── layout.tsx               # 侧边栏布局 + 鉴权守卫
│   ├── login/page.tsx            # 登录页
│   ├── posts/
│   │   ├── page.tsx             # 文章管理列表
│   │   └── [id]/page.tsx        # 文章编辑器（Markdown 编辑 + 实时预览）
│   └── projects/
│       └── ...                  # 作品管理（同上结构）
```

### 5.2 组件分层

```
components/
├── ui/                # 基础组件（Button、Card、Input、Badge、Modal）
├── layout/            # Navbar、Footer、AdminSidebar、PageContainer
├── blog/              # PostCard、PostList、PostContent、TagFilter、Pagination
├── projects/          # ProjectCard、ProjectGrid、TechBadge
├── admin/             # MarkdownEditor、PostForm、ImageUploader、DataTable
└── effects/           # GradientBackground、GlassCard、PageTransition
```

### 5.3 设计系统（现代渐变风）

- **Tailwind CSS**: utility 优先，自定义渐变色板
- **Framer Motion**: 页面切换动画、滚动渐入、卡片 hover 动效
- **渐变元素**:
  - 首页 Hero: 动态渐变背景 + 粒子/网格装饰
  - 卡片: glassmorphism（半透明 + backdrop-blur + 渐变边框）
  - 文字: 标题用渐变文字（`bg-clip-text`）
  - 按钮: 渐变背景 + hover 光晕
- **暗色模式**: 默认暗色主题，支持切换浅色
- **代码高亮**: Shiki（支持暗色主题，SSG 时预渲染高亮）
- **Markdown 渲染**: react-markdown + remark/rehype 插件
- **响应式**: 移动端优先，断点 sm/md/lg/xl

### 5.4 数据获取策略

- **公开页（SSG）**: `generateStaticParams` + `fetch` 从 FastAPI 拉取数据，构建时生成静态 HTML。博客文章和作品详情页全部预渲染。
- **管理页（CSR）**: React Query（@tanstack/react-query）管理服务端状态，自动缓存 + 失效。admin 页面布局使用 `'use client'`。
- **API 客户端**: `lib/api.ts` 封装 fetch，统一 baseURL + 错误处理 + 认证 cookie 自动携带。

## 6. DevOps 与部署

### 6.1 Docker 本地开发

```yaml
# docker-compose.yml
services:
  postgres:    # PostgreSQL 16
  redis:       # Redis 7（缓存文章列表/详情）
  api:         # FastAPI + uvicorn --reload
  web:         # Next.js dev server
```

- `docker compose up` 一键启动全栈开发环境
- 数据库首次启动自动运行 Alembic 迁移 + 创建 admin 种子账户
- 热重载: 后端 uvicorn --reload，前端 next dev

### 6.2 生产部署

| 服务 | 部署目标 | 说明 |
|------|----------|------|
| 前端 web | Vercel | Next.js 原生支持，自动构建部署，边缘 CDN |
| 后端 api | Fly.io | Dockerfile 部署，多 region 可选 |
| PostgreSQL | Fly.io / Neon | 托管数据库 |
| Redis | Upstash | 托管 Redis（serverless） |
| 图片存储 | 本地 volume / S3 兼容 | 初期本地，后期可迁移 |

- 前端使用 Next.js ISR（`revalidate: 60`）每分钟增量再生，新文章自动生效，无需手动触发
- 可选增强: 后端发布文章时同时调用 Vercel Deploy Hook，实现发布后即时全量重建

### 6.3 CI/CD（GitHub Actions）

**PR 提交时触发**（`.github/workflows/ci.yml`）:

```
后端 job:  ruff lint → mypy 类型检查 → pytest 单元+API 测试
前端 job:  eslint → tsc 类型检查 → vitest 组件测试 → next build 验证
```

两个 job 并行执行，任一失败则 PR 不可合并。

**main 分支推送时**（`.github/workflows/deploy.yml`）:

```
后端:  构建 Docker image → 推送 Fly.io
前端:  触发 Vercel 部署（或 GitHub Actions 直接 build）
```

## 7. 测试策略

### 7.1 后端测试（Pytest + pytest-asyncio）

| 层级 | 范围 | 示例 |
|------|------|------|
| 单元测试 | services 层业务逻辑 | 发布文章时 `published_at` 正确填充 |
| 单元测试 | repositories 层数据访问 | 按标签过滤文章返回正确结果 |
| API 测试 | routers 层端到端 | `GET /api/posts` 返回正确分页结构 |
| 鉴权测试 | JWT 流程 | 无 token 访问 admin 接口返回 401 |

- 使用 SQLite 内存库作为测试数据库，隔离生产数据库
- Fixtures: 创建测试用户、测试文章、测试标签等共享数据
- 覆盖目标: ≥ 80%

### 7.2 前端测试（Vitest + RTL + Playwright）

| 层级 | 范围 | 示例 |
|------|------|------|
| 组件测试 | Vitest + React Testing Library | PostCard 正确渲染标题/摘要 |
| Hook 测试 | Vitest + RTL | usePosts 分页加载正确 |
| E2E 测试 | Playwright | 登录 → 创建文章 → 发布 → 首页可见 |

- 组件测试覆盖核心组件交互
- E2E 测试覆盖关键用户流程
- 测试数据通过 MSW (Mock Service Worker) mock API 响应

## 8. 实施顺序

建议分阶段交付，每阶段可独立验证:

1. **阶段 1 — 基础设施**: Monorepo 脚手架、Docker Compose、数据库模型 + 迁移、CI 基础流水线
2. **阶段 2 — 后端核心**: 分层架构搭建、公开 API、JWT 鉴权、管理 API、后端测试
3. **阶段 3 — 前端公开页**: 首页、博客列表/详情、作品集、关于页、设计系统
4. **阶段 4 — 前端管理后台**: 登录、文章编辑器、作品管理、图片上传
5. **阶段 5 — 集成与部署**: 前后端联调、生产部署配置、E2E 测试、README 文档
