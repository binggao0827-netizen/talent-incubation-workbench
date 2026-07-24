# Talent Incubation Workbench

????????React ???Express/tRPC ????? MySQL + Drizzle ORM ????

## Prerequisites

- Node.js 20 or later
- Corepack enabled
- pnpm 10.4.1 (the version pinned in `package.json`)
- MySQL 8 for persistence and integration tests

## Local setup

```bash
corepack pnpm@10.4.1 install --frozen-lockfile
Copy-Item .env.example .env
# Edit .env and point DATABASE_URL to a dedicated local database.
docker compose -f docker-compose.dev.yml up -d
# Wait until the MySQL container is healthy before running migrations.

corepack pnpm@10.4.1 db:migrate
corepack pnpm@10.4.1 dev
```

On macOS/Linux, replace `Copy-Item` with `cp`. The `dev` script is cross-platform and starts the app on port 3000 by default.
If Docker Desktop is installed, `docker-compose.dev.yml` starts an isolated MySQL 8 database on `localhost:3306`. Its data is kept in the named Docker volume `talent_incubation_mysql_data`; it is separate from production.

To stop the local database without deleting data:

```bash
docker compose -f docker-compose.dev.yml down

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm check` | TypeScript type check |
| `pnpm test` | Unit and database-backed integration tests |
| `pnpm build` | Production frontend and server build |
| `pnpm db:generate` | Generate a Drizzle migration after schema changes |
| `pnpm db:migrate` | Apply existing migrations to `DATABASE_URL` |

## Environment and safety

Start from `.env.example`; it contains placeholders only. `.env` is ignored by Git.

`DATABASE_URL` is required for writes, migrations, and the database-backed test cases. Use a separate database for local development and CI. Do not run migrations or tests against the production database.

Some optional features rely on Manus Forge, OAuth, OpenAI, Google Maps, and analytics configuration. They remain unavailable until their corresponding variables are supplied.

## Deployment

```bash
pnpm build
pnpm start
```

Production deployment additionally requires the production environment variables, database access, and the relevant third-party credentials. These secrets are intentionally not stored in this repository.
