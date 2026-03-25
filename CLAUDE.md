# speakeasy-be

Node.js REST API backend for the Speakeasy app. Companion to `speakeasy-ui`.

## Stack

- **Runtime:** Node.js 20 / Express 5
- **Language:** TypeScript 5 (strict mode)
- **ORM:** Prisma 5 (PostgreSQL)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Linting:** ESLint + `@typescript-eslint`

## Architecture

### Entry point

`src/server.ts` → loads `.env`, starts Express on `PORT`

`src/app.ts` → mounts CORS, JSON body parser, and all routers

### Directory conventions

```
src/
  app.ts                  - Express app setup
  server.ts               - process entry point
  controllers/            - request handlers (one file per domain)
  middleware/             - Express middleware
  routes/                 - router definitions (one file per domain)
  store/                  - DB access layer (Prisma queries)
  lib/                    - shared singletons (prisma client, etc.)
  types/                  - shared TypeScript interfaces
prisma/
  schema.prisma           - Prisma schema + migrations source
```

### Request lifecycle

`route` → `controller` → `store` (Prisma) → response

Controllers own HTTP concerns (status codes, request parsing, response shape). Store functions own DB queries — no HTTP logic there.

### Auth flow

- `POST /api/auth/register` — hash password → create user → return JWT
- `POST /api/auth/login` — verify password → return JWT
- Protected routes use the `authenticate` middleware (`src/middleware/authenticate.ts`), which validates the `Authorization: Bearer <token>` header and attaches `req.user` (`{ userId, email }`)

## Documentation index

- [Architecture](docs/claude/architecture.md)
- [Auth](docs/claude/auth.md)
- [Work History](docs/claude/work-history/)
