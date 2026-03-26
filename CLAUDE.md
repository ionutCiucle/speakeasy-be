# speakeasy-be

Node.js microservices backend for the Speakeasy app. Companion to `speakeasy-ui`.

## Stack

- **Runtime:** Node.js 24 / Express 5
- **Language:** TypeScript 5 (strict mode)
- **ORM:** Prisma 5 (PostgreSQL)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Monorepo:** npm workspaces
- **Linting:** ESLint + `@typescript-eslint`

## Monorepo structure

```
speakeasy-be/
  services/
    auth/       - JWT issuance, registration, login       (port 3000)
    user/       - user profiles                           (port 3001)
    gateway/    - single entry point, proxies + rate limiting (port 4000)
  packages/
    middleware/ - shared JWT authenticate middleware (@speakeasy/middleware)
    types/      - shared TypeScript interfaces (@speakeasy/types)
    tsconfig/   - shared tsconfig base (@speakeasy/tsconfig)
```

Clients should only talk to the **gateway** (port 4000). Services are internal.

## Running locally

```bash
docker compose up -d        # start all Postgres instances
npm run dev:auth            # auth service on :3000
npm run dev:user            # user service on :3001
npm run dev:gateway         # gateway on :4000
```

Each service reads its own `.env` — copy from the `.env.example` in that directory.

## Documentation index

- [Architecture](docs/claude/architecture.md)
- [Auth](docs/claude/auth.md)
- [Git Workflow](docs/claude/git-workflow.md)
- [Work History](docs/claude/work-history/)
