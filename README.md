# Personal Blog + Portfolio

A full-stack personal blog and portfolio system built with FastAPI and Next.js.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic 2
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Database:** PostgreSQL 16, Redis 7
- **DevOps:** Docker Compose, GitHub Actions

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local backend development)
- Node.js 20+ (for local frontend development)

### Quick Start with Docker

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Run database migrations
docker compose exec api alembic upgrade head

# Seed admin user
docker compose exec api python scripts/seed.py
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Local Development (without Docker)

**Backend:**

```bash
cd apps/api
pip install -e ".[dev]"
# Set DATABASE_URL to your PostgreSQL instance
python -m pytest -v        # run tests
ruff check .               # lint
mypy app/                  # type check
```

**Frontend:**

```bash
cd apps/web
npm install
npm run dev                # start dev server
npm run build              # production build
npx tsc --noEmit           # type check
```

## Project Structure

```
blog/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js frontend
├── docker-compose.yml
└── .github/workflows/
```

## License

MIT
