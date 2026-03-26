# Architecture

## Overview

`speakeasy-be` is an npm workspaces monorepo of independent microservices. Each service owns its own database, Prisma schema, and Express app. All client traffic enters through the **gateway**.

```
Client → gateway:4000 → auth-service:3000
                       → user-service:3001
```

---

## Services

| Service | Port | Responsibility |
|---|---|---|
| `services/gateway` | 4000 | Routing, JWT validation, rate limiting |
| `services/auth` | 3000 | Registration, login, JWT issuance |
| `services/user` | 3001 | User profiles |

### Gateway

- Proxies `/api/auth/*` → auth service (public)
- Proxies `/api/users/*` → user service (protected — validates JWT via `@speakeasy/middleware` before forwarding)
- Rate limiting: 100 req / 15 min window
- The only service exposed to clients

### Auth Service

- `POST /api/auth/register` — hash password → create user → return JWT
- `POST /api/auth/login` — verify password → return JWT
- All routes are public — no Prisma schema shared with other services

### User Service

- `GET /api/users/me` — get own profile (from JWT `userId`)
- `PATCH /api/users/me` — update `displayName`, `avatarUrl`
- `GET /api/users/:id` — get profile by ID
- Does not store credentials — `User.id` matches `userId` from Auth JWT

---

## Shared packages

| Package | Purpose |
|---|---|
| `@speakeasy/middleware` | `authenticate` Express middleware — validates JWT Bearer token, attaches `req.user` |
| `@speakeasy/types` | Shared TypeScript interfaces (`JwtPayload`) |
| `@speakeasy/tsconfig` | Shared `tsconfig` base extended by each service |

---

## Service structure

Each service follows the same flat file layout — no single-file folders:

```
services/<name>/
  src/
    server.ts     - process entry, loads .env, starts Express
    app.ts        - Express setup, mounts router
    routes.ts     - route definitions
    controller.ts - request handlers
    store.ts      - Prisma queries (no HTTP logic)
    prisma.ts     - PrismaClient singleton
    types.ts      - service-local TypeScript types
  prisma/
    schema.prisma
    migrations/
    client/       - generated Prisma client (gitignored, auto-generated via postinstall)
  package.json
  tsconfig.json
  .env.example
```

---

## Adding a new service

1. Create `services/<name>/` following the structure above
2. Add a Prisma model and run `npx prisma migrate dev --name init` from the service directory
3. Add `"dev:<name>"` script to root `package.json`
4. Add a new `db-<name>` service to `docker-compose.yml`
5. Register the proxy route in `services/gateway/src/proxy.ts` and `app.ts`

---

## Prisma conventions

- Each service has its own schema and generated client at `prisma/client/` — never share across services
- The `PrismaClient` singleton lives in `src/prisma.ts` — import only from there
- Store functions return Prisma's inferred types — don't manually redeclare them
- `prisma generate` runs automatically via `postinstall` in each service's `package.json`
- After a schema change: `npx prisma migrate dev` (local), `npx prisma migrate deploy` (CI/prod)

---

## Local development setup

```bash
docker compose up -d    # start all Postgres instances (db-auth:5432, db-user:5433)
npm run dev:auth        # auth service on :3000
npm run dev:user        # user service on :3001
npm run dev:gateway     # gateway on :4000
```

Data persists in named Docker volumes across restarts. To reset: `docker compose down -v`.

**Docker Compose is infrastructure, not an npm script.** CI uses GitHub Actions service containers instead.

---

## Environment variables

Each service has its own `.env` (gitignored). Copy from `.env.example` in the service directory.

| Variable | Services | Purpose |
|---|---|---|
| `PORT` | all | HTTP listen port |
| `JWT_SECRET` | auth, user, gateway | Sign / verify JWTs |
| `JWT_EXPIRES_IN` | auth | Token expiry e.g. `7d` |
| `DATABASE_URL` | auth, user | Prisma connection string |
| `AUTH_SERVICE_URL` | gateway | Internal URL of auth service |
| `USER_SERVICE_URL` | gateway | Internal URL of user service |
