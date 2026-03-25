# 2026-Mar — Project Bootstrap

## What was done

Bootstrapped the `speakeasy-be` Node.js/TypeScript Express server from scratch, including JWT auth and Prisma/PostgreSQL integration.

### Files created

| File | Purpose |
|---|---|
| `src/server.ts` | Process entry point |
| `src/app.ts` | Express app, CORS, router mounting |
| `src/routes/auth.ts` | `POST /api/auth/register`, `POST /api/auth/login` |
| `src/controllers/authController.ts` | Register + login handlers |
| `src/middleware/authenticate.ts` | JWT Bearer token guard, attaches `req.user` |
| `src/store/userStore.ts` | Prisma queries for user lookup and creation |
| `src/lib/prisma.ts` | Singleton `PrismaClient` |
| `src/types/index.ts` | `JwtPayload`, `LoginBody`, `RegisterBody` |
| `prisma/schema.prisma` | `User` model |
| `.github/workflows/preflight.yml` | CI: `npm ci` → lint → TS check on every PR |

### Design decisions

- **Prisma inferred types.** Store functions return Prisma's inferred types directly — no manual `User` interface to keep in sync with the schema.
- **Singleton Prisma client.** One `PrismaClient` instance in `src/lib/prisma.ts` to avoid connection pool exhaustion.
- **`postinstall` generates Prisma client.** `prisma generate` runs automatically after `npm ci` so CI always has up-to-date types without an explicit step in the workflow.
- **`crypto.randomUUID()`** used instead of the `uuid` package — built into Node 15+ so no extra dependency needed. (The `uuid` package v13 is ESM-only and incompatible with CommonJS ts-node-dev.)
- **Prisma v5** pinned instead of v7 — v7 requires Node ≥ 20.19 and the project runs on Node 20.10.

## Planned follow-up

- [ ] Run `npx prisma migrate dev --name init` once a local Postgres instance is configured
- [ ] Add `DATABASE_URL` to GitHub Actions secrets for CI migration checks
- [ ] Add request validation (e.g. Zod) on auth endpoints
- [ ] Add refresh token support
