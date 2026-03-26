# Architecture

## Overview

`speakeasy-be` is an npm workspaces monorepo of independent microservices. Each service owns its own database, Prisma schema, and Express app. All client traffic enters through the **gateway**. Async events flow through RabbitMQ to the notification service.

```
Client → gateway:4000 → auth-service:3000
                       → user-service:3001
                       → friendship-service:3002
                       → tab-service:3003

friendship-service ──┐
tab-service ─────────┴→ RabbitMQ → notification-service
```

---

## Services

| Service | Port | DB port | Responsibility |
|---|---|---|---|
| `services/gateway` | 4000 | — | Routing, JWT validation, rate limiting |
| `services/auth` | 3000 | 5432 | Registration, login, JWT issuance |
| `services/user` | 3001 | 5433 | User profiles |
| `services/friendship` | 3002 | 5434 | Friend requests, acceptance, blocking |
| `services/tab` | 3003 | 5435 | Tabs, line items, participants, settlements |
| `services/notification` | — | — | Async event consumer — push/email/SMS delivery |

### Gateway

- Proxies `/api/auth/*` → auth service (public)
- Proxies `/api/users/*`, `/api/friendships/*`, `/api/tabs/*` → respective services (protected — validates JWT via `@speakeasy/middleware` before forwarding)
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

### Friendship Service

- `POST /api/friendships/request` — send friend request
- `PATCH /api/friendships/:id/accept` — accept (addressee only)
- `PATCH /api/friendships/:id/reject` — reject (addressee only)
- `PATCH /api/friendships/:id/block` — block (either party)
- `GET /api/friendships` — list accepted friends
- Emits `friendship.requested`, `friendship.accepted` to RabbitMQ

### Tab Service

- `POST /api/tabs` — create tab (creator auto-added as participant)
- `GET /api/tabs/:id` — get tab with items, participants, settlements
- `POST /api/tabs/:id/items` — add line item
- `PATCH /api/tabs/:id/items/:itemId` — update item
- `POST /api/tabs/:id/participants` — add participant
- `POST /api/tabs/:id/settle` — record settlement
- `POST /api/tabs/:id/close` — close tab (creator only)
- Emits `tab.invite_sent` (on participant add), `tab.settled` to RabbitMQ

### Notification Service

- Purely reactive — no HTTP endpoints, never called by clients
- Subscribes to RabbitMQ events via durable queues on the `speakeasy.events` topic exchange
- Subscribed events: `friendship.requested`, `friendship.accepted`, `tab.invite_sent`, `tab.settled`
- Handlers currently log delivery — real push/email/SMS delivery to be added later

---

## Async messaging

- **Broker:** RabbitMQ (AMQP on 5672, management UI on 15672)
- **Exchange:** `speakeasy.events` — topic, durable
- **Publishers:** per-service `publisher.ts` — fire-and-forget, errors logged without crashing the service
- **Consumers:** notification service binds one durable queue per routing key

| Routing key | Publisher | Consumer action |
|---|---|---|
| `friendship.requested` | friendship | Notify addressee |
| `friendship.accepted` | friendship | Notify requester |
| `tab.invite_sent` | tab | Notify invited user |
| `tab.settled` | tab | Notify all participants |

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
    store.ts      - Prisma queries (no HTTP logic); owns the PrismaClient instance
    publisher.ts  - RabbitMQ publish helper (services that emit events only)
    types.ts      - service-local TypeScript types
  prisma/
    schema.prisma
    migrations/
    client/       - generated Prisma client (gitignored, auto-generated via postinstall)
  package.json
  tsconfig.json
  .env.example
```

The notification service is structurally different — no Express, no Prisma:

```
services/notification/
  src/
    server.ts   - entry point, calls startConsumer()
    consumer.ts - connects to RabbitMQ, binds queues, dispatches messages
    handlers.ts - one handler per event type
    types.ts    - event payload interfaces
```

---

## Adding a new service

1. Create `services/<name>/` following the structure above
2. Add a Prisma schema and run `npx prisma migrate dev --name init` from the service directory
3. Add `"dev:<name>"` script to root `package.json`
4. Add a new `db-<name>` service to `docker-compose.yml`
5. Register the proxy route in `services/gateway/src/proxy.ts` and `app.ts`

---

## Prisma conventions

- Each service has its own schema and generated client at `prisma/client/` — never share across services
- `PrismaClient` is instantiated at the top of `src/store.ts` — no separate `prisma.ts` file
- Store functions return Prisma's inferred types — don't manually redeclare them
- `prisma generate` runs automatically via `postinstall` in each service's `package.json`
- After a schema change: `npx prisma migrate dev` (local), `npx prisma migrate deploy` (CI/prod)

---

## Local development setup

```bash
docker compose up -d         # start all Postgres instances + RabbitMQ
npm run dev:auth             # auth service on :3000
npm run dev:user             # user service on :3001
npm run dev:friendship       # friendship service on :3002
npm run dev:tab              # tab service on :3003
npm run dev:notification     # notification consumer
npm run dev:gateway          # gateway on :4000
```

Data persists in named Docker volumes across restarts. To reset: `docker compose down -v`.

**Docker Compose is infrastructure, not an npm script.** CI uses GitHub Actions service containers instead.

---

## Environment variables

Each service has its own `.env` (gitignored). Copy from `.env.example` in the service directory.

| Variable | Services | Purpose |
|---|---|---|
| `PORT` | auth, user, friendship, tab, gateway | HTTP listen port |
| `JWT_SECRET` | auth, user, friendship, tab, gateway | Sign / verify JWTs |
| `JWT_EXPIRES_IN` | auth | Token expiry e.g. `7d` |
| `DATABASE_URL` | auth, user, friendship, tab | Prisma connection string |
| `RABBITMQ_URL` | friendship, tab, notification | RabbitMQ connection string e.g. `amqp://localhost` |
| `AUTH_SERVICE_URL` | gateway | Internal URL of auth service |
| `USER_SERVICE_URL` | gateway | Internal URL of user service |
| `FRIENDSHIP_SERVICE_URL` | gateway | Internal URL of friendship service |
| `TAB_SERVICE_URL` | gateway | Internal URL of tab service |
