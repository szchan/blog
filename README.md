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
