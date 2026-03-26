# 2026-Mar__Microservices-architecture

## Status: COMPLETE ✓

## Plan

Migrate `speakeasy-be` from a single Express server to a monorepo of independent microservices. Each service owns its own codebase, database, and deployment unit.

---

## Monorepo structure

```
speakeasy-be/
  services/
    auth/           - JWT issuance, registration, login, password management
    user/           - user profiles, avatars, preferences
    friendship/     - friend requests, acceptance, blocking, friend lists
    tab/            - tabs, line items, cost splitting, settlements
    notification/   - push/email/SMS delivery, subscribes to async events
  gateway/          - API gateway: routing, auth validation, rate limiting
  packages/
    types/          - shared TypeScript interfaces (user IDs, event payloads)
    tsconfig/       - shared tsconfig base
```

Each service under `services/` and `gateway/` is a standalone Node.js/Express app with its own `package.json`, `tsconfig.json`, Prisma schema, and Docker service.

---

## Services

### 1. Auth Service

Responsible for all security concerns — intentionally kept separate from User Service.

- `POST /auth/register` — create credentials, issue JWT
- `POST /auth/login` — verify credentials, issue JWT
- `POST /auth/refresh` — rotate JWT via refresh token
- `POST /auth/logout` — invalidate refresh token

**DB:** credentials, hashed passwords, refresh tokens

---

### 2. User Service

Manages profile data. Consumes identity from Auth Service via JWT — never handles credentials directly.

- `GET /users/:id` — fetch profile
- `PATCH /users/:id` — update name, avatar, preferences

**DB:** profiles (userId, displayName, avatarUrl, preferences)

---

### 3. Friendship Service

Handles bi-directional relationships. Validates user IDs via User Service.

- `POST /friendships/request` — send friend request
- `PATCH /friendships/:id/accept` — accept request
- `PATCH /friendships/:id/reject` — reject request
- `POST /friendships/:id/block` — block a user
- `GET /friendships` — list friends

Emits async events on request/acceptance for Notification Service.

**DB:** relationships graph (userId, friendId, status, timestamps)

---

### 4. Tab Service

Core domain. Owns the tab data model entirely. Stores only user IDs — never user profile data.

- `POST /tabs` — create tab
- `POST /tabs/:id/items` — add line item
- `PATCH /tabs/:id/items/:itemId` — update item
- `POST /tabs/:id/participants` — add participant
- `POST /tabs/:id/settle` — record settlement
- `POST /tabs/:id/close` — close tab

Emits async events on tab invite and settlement for Notification Service.

**DB:** tabs, line items, participants, settlements

---

### 5. Notification Service

Delivers push/email/SMS notifications. Purely reactive — subscribes to events from other services via a message broker, never called directly by clients.

**Subscribed events:**
- `friendship.requested` → notify target user
- `friendship.accepted` → notify requester
- `tab.invite_sent` → notify invited user
- `tab.settled` → notify all participants

**Message broker:** RabbitMQ (or Kafka at higher scale)

---

### 6. API Gateway

Single entry point for all client requests. Not a domain service.

- Routes requests to the correct service
- Validates JWT on all protected routes (delegates to Auth Service or validates locally)
- Rate limiting
- Request logging

---

## Communication patterns

| Interaction | Pattern |
|---|---|
| Login / Register | Sync REST → Auth Service |
| Load profile / friends | Sync REST → User / Friendship Service |
| Create / update a tab | Sync REST → Tab Service |
| Friend request sent | Async event → Notification Service |
| Tab invite sent | Async event → Notification Service |
| Tab settled | Async event → Notification Service |

---

## Data ownership

Each service has its own database — never shared across service boundaries.

| Service | Database |
|---|---|
| Auth | credentials, refresh tokens |
| User | profiles |
| Friendship | relationships graph |
| Tab | tabs, items, participants, settlements |
| Notification | delivery log (optional) |

Cross-service data access goes through API calls or events — never direct DB access.

---

## Steps

- [x] Step 1 — Set up monorepo tooling (`npm workspaces`, shared `tsconfig`, shared `types` package)
- [x] Step 2 — Migrate existing Auth code into `services/auth/`
- [x] Step 3 — Scaffold `services/user/` with User model and profile endpoints
  - Middleware moved to `packages/middleware` (`@speakeasy/middleware`) instead of per-service — shared by all future services
  - User model: `id` (from Auth JWT), `displayName`, `avatarUrl`, `createdAt`, `updatedAt`
  - Endpoints: `GET /api/users/me`, `PATCH /api/users/me`, `GET /api/users/:id` (all protected)
  - Per-service Prisma client generated to `prisma/client/` (gitignored) to avoid npm workspace hoisting conflicts
- [x] Step 4 — Scaffold `gateway/` with routing and JWT validation middleware
  - Runs on port 4000 — single entry point for all client requests
  - `/api/auth/*` → auth service (public, no token required)
  - `/api/users/*` → user service (protected via `@speakeasy/middleware`)
  - Rate limiting: 100 requests per 15 min window via `express-rate-limit`
  - `pathRewrite` used to restore the full path after Express strips the mount prefix
- [x] Step 5 — Update `docker-compose.yml` to run all services and a Postgres instance per service
  - `db-auth` on port 5432, `db-user` on port 5433
- [x] Step 6 — Scaffold `services/friendship/`
  - `FriendshipStatus` enum: PENDING, ACCEPTED, REJECTED, BLOCKED
  - Endpoints: `POST /request`, `PATCH /:id/accept`, `PATCH /:id/reject`, `PATCH /:id/block`, `GET /`
  - All routes protected — gateway validates JWT before forwarding
  - `db-friendship` on port 5434
- [x] Step 7 — Scaffold `services/tab/`
  - Models: `Tab`, `Item`, `Participant`, `Settlement`
  - Endpoints: `POST /`, `GET /:id`, `POST /:id/items`, `PATCH /:id/items/:itemId`, `POST /:id/participants`, `POST /:id/settle`, `POST /:id/close`
  - `db-tab` on port 5435
- [x] Step 8 — Add message broker (RabbitMQ) and scaffold `services/notification/`
  - RabbitMQ added to `docker-compose.yml` (AMQP on 5672, management UI on 15672)
  - Topic exchange `speakeasy.events` — durable, one queue per routing key
  - Friendship service publishes `friendship.requested`, `friendship.accepted`
  - Tab service publishes `tab.invite_sent` (on participant add), `tab.settled`
  - Notification service subscribes to all four events and logs delivery
  - Per-service `publisher.ts` — fire-and-forget, errors logged without crashing the service
- [x] Step 9 — Update CI preflight to run lint + type check across all workspaces
  - Upgraded Node 18 → 20 in workflow
  - Updated `eslint.config.mjs` to cover `services/*/src/**/*.ts` and `packages/*/src/**/*.ts`
  - Root `ts:check` and `lint:check` use `--workspaces --if-present` — runs across all services automatically

---

## Key constraints

- Services store only user IDs — never embed profile data from another service's DB
- No shared databases between services, even temporarily
- All inter-service sync calls go through internal HTTP (not exposed via the gateway)
- The gateway is the only service exposed to the public internet
