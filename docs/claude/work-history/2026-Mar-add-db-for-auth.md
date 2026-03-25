# 2026-Mar — Add DB for Auth

## What was done

Replaced the in-memory user store with Prisma ORM backed by PostgreSQL.

### Files created

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | `User` model definition |
| `src/lib/prisma.ts` | Singleton `PrismaClient` instance |

### Files modified

| File | Change |
|---|---|
| `src/store/userStore.ts` | Rewrote all functions to use Prisma queries |
| `src/controllers/authController.ts` | Awaited async store calls, removed manual `id`/`createdAt` fields |
| `src/types/index.ts` | Removed manual `User` interface — type now inferred from Prisma |
| `package.json` | Added `prisma` + `@prisma/client` deps, added `postinstall: prisma generate` |
| `.env` / `.env.example` | Added `DATABASE_URL` |

### Design decisions

- **Prisma v5 over v7.** v7 requires Node ≥ 20.19; project runs on Node 20.10, so v5 was pinned.
- **Inferred Prisma types.** Store functions return Prisma's inferred return types — no manual `User` interface to keep in sync with the schema.
- **`postinstall` hook.** `prisma generate` runs automatically after `npm ci` so CI always has up-to-date generated types without an explicit workflow step.
- **Unique constraint on `email` at DB level.** Enforced in `schema.prisma` via `@unique`, not just in application code.

## Planned follow-up

- [ ] Run `npx prisma migrate dev --name init` once a local Postgres instance is configured
- [ ] Add `DATABASE_URL` to GitHub Actions secrets for CI migration checks
