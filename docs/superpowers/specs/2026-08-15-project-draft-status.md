# Project Draft/Published Status Design

- **日期**: 2026-08-15
- **项目**: 个人博客 + 作品集
- **范围**: 给 projects 表添加 draft/published 状态，与 posts 一致

## 目标

Projects 当前创建后即公开可见。需要添加 draft/published 状态控制，使新项目默认为草稿，手动发布后才在公开页面显示。

## 设计

### 数据库

在 `projects` 表添加两个字段：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `status` | enum | not null, default 'draft' | draft / published |
| `published_at` | datetime | nullable | 发布时填充 |

迁移时将现有 projects 的 status 设为 `published`，`published_at` 设为 `created_at`。

### 后端

#### Model (`app/models/project.py`)

新增 `ProjectStatus` enum（`draft` / `published`），与 `PostStatus` 结构相同但独立定义。

Project model 添加：
- `status: Mapped[ProjectStatus]` — `mapped_column(Enum(ProjectStatus), default=ProjectStatus.draft)`
- `published_at: Mapped[datetime | None]` — `mapped_column(DateTime, nullable=True)`

#### Schemas (`app/schemas/project.py`)

- `ProjectResponse`：加 `status: ProjectStatus`
- `ProjectCreate`：加 `status: ProjectStatus = ProjectStatus.draft`
- `ProjectUpdate`：加 `status: ProjectStatus | None = None`

#### Service (`app/services/project.py`)

- `list_projects()`：改为只返回 `status == published` 的项目，按 `sort_order` 排序（公开 API 调用）
- `get_all_projects()`：新增方法，返回全部项目（admin API 调用），与 PostService 的 `get_all_posts()` 模式一致
- `get_project(slug)`：只返回 published 项目，draft 返回 None
- `create_project(data)`：若 status 为 published，填充 `published_at`
- `update_project(id, data)`：若 status 从 draft 改为 published，填充 `published_at`；若改回 draft，清空 `published_at`
- Admin API（`list_projects` / `get_project_by_id`）继续返回全部项目（在 admin router 中直接调用 repo，不走 service 的公开过滤）

#### Public API (`app/api/projects.py`)

无需改动 — 已通过 service 层过滤。

#### Admin API (`app/api/admin/projects.py`)

无需改动 — admin router 改为调用 `svc.get_all_projects()` 返回全部项目（含 draft）。

### 前端

#### Types (`lib/types.ts`)

`Project` 接口添加 `status: PostStatus`（复用已有的 `"draft" | "published"` 类型）。

#### Admin Form (`components/admin/ProjectForm.tsx`)

添加 Status 下拉框（draft / published），与 PostForm 中的实现一致：
- 新建时默认 draft
- 编辑时显示当前状态
- 提交时包含 status 字段

#### Admin List (`app/admin/projects/page.tsx`）

项目列表每行添加 status badge（与 posts 列表一致：published 用 gradient badge，draft 用 default badge）。

#### Public Pages

无需改动 — API 已过滤，前端 `.catch(() => [])` 降级处理不变。

### 测试

- 公开 API `GET /api/projects` 只返回 published 项目
- 公开 API `GET /api/projects/{slug}` 对 draft 项目返回 404
- Admin API `GET /api/admin/projects` 返回全部项目（含 draft）
- 创建 project 默认 status 为 draft
- 更新 status 为 published 时填充 published_at

## 非目标

- 不重构 PostStatus 为共享 enum（YAGNI）
- 不给 projects 添加标签/分类功能
- 不修改 posts 的任何现有行为
