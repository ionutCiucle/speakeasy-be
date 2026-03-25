# Architecture

## Layer responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| Router | `src/routes/` | Map HTTP method + path to controller function |
| Controller | `src/controllers/` | Parse request, call store, return response |
| Store | `src/store/` | All Prisma queries — no HTTP logic |
| Middleware | `src/middleware/` | Cross-cutting concerns (auth, future: logging, validation) |
| Lib | `src/lib/` | Shared singletons (e.g. `prisma.ts`) |

## Adding a new domain

1. Add the Prisma model to `prisma/schema.prisma` and run `npx prisma migrate dev --name <name>`.
2. Create `src/store/<domain>Store.ts` — query functions only, typed via Prisma's inferred return types.
3. Create `src/controllers/<domain>Controller.ts` — one exported function per endpoint.
4. Create `src/routes/<domain>.ts` — wire up the router and export it.
5. Mount the router in `src/app.ts` under `/api/<domain>`.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | JWT expiry string e.g. `7d` |
| `DATABASE_URL` | Prisma PostgreSQL connection string |

See `.env.example` for the full template.

## Prisma conventions

- The singleton client lives in `src/lib/prisma.ts` — always import from there, never instantiate `PrismaClient` elsewhere.
- Store functions return Prisma's inferred types directly — don't manually re-declare them in `src/types/`.
- After any schema change: `npx prisma migrate dev` (local), `npx prisma migrate deploy` (CI/prod).
- `prisma generate` runs automatically via the `postinstall` npm script.
