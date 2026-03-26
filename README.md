# speakeasy-be

Node.js microservices backend for the Speakeasy app.

## Architecture

`speakeasy-be` is an npm workspaces monorepo of independent microservices. Each service owns its own database, Prisma schema, and Express app. All client traffic enters through the **gateway**. Async events flow through RabbitMQ to the notification service.

```
Client → gateway:4000 → auth-service:3000
                       → user-service:3001
                       → friendship-service:3002
                       → tab-service:3003

friendship-service ──┐
tab-service ─────────┴→ RabbitMQ → notification-service
```

| Service | Port | Responsibility |
|---|---|---|
| `services/gateway` | 4000 | Single entry point — routing, JWT validation, rate limiting |
| `services/auth` | 3000 | Registration, login, JWT issuance |
| `services/user` | 3001 | User profiles |
| `services/friendship` | 3002 | Friend requests, acceptance, blocking |
| `services/tab` | 3003 | Tabs, line items, participants, settlements |
| `services/notification` | — | Async event consumer — handles push/email/SMS delivery |

Clients should only talk to the **gateway** (port 4000). All other services are internal.

Full architecture details: [docs/claude/architecture.md](docs/claude/architecture.md)

## Stack

- **Runtime:** Node.js 24
- **Framework:** Express 5
- **Language:** TypeScript 5 (strict mode)
- **ORM:** Prisma 5 (PostgreSQL)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Messaging:** RabbitMQ (amqplib)
- **Monorepo:** npm workspaces
- **Linting:** ESLint + `@typescript-eslint`
- **Testing:** Vitest

## Prerequisites

- Node.js 24 (`nvm use` will pick up the pinned version from `.nvmrc`)
- Docker (for Postgres instances + RabbitMQ)

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start infrastructure (Postgres databases + RabbitMQ):
   ```bash
   docker compose up -d
   ```

3. Copy and fill in each service's env file:
   ```bash
   cp services/auth/.env.example services/auth/.env
   cp services/user/.env.example services/user/.env
   cp services/friendship/.env.example services/friendship/.env
   cp services/tab/.env.example services/tab/.env
   cp services/notification/.env.example services/notification/.env
   cp services/gateway/.env.example services/gateway/.env
   ```

4. Run database migrations for each service that uses Prisma:
   ```bash
   cd services/auth && npx prisma migrate dev && cd ../..
   cd services/user && npx prisma migrate dev && cd ../..
   cd services/friendship && npx prisma migrate dev && cd ../..
   cd services/tab && npx prisma migrate dev && cd ../..
   ```

## Running services

Start each service in a separate terminal:

```bash
npm run dev:auth            # auth service on :3000
npm run dev:user            # user service on :3001
npm run dev:friendship      # friendship service on :3002
npm run dev:tab             # tab service on :3003
npm run dev:notification    # notification consumer
npm run dev:gateway         # gateway on :4000
```

## Environment variables

Each service reads its own `.env`. Copy from `.env.example` in the service directory.

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

## Other commands

```bash
npm run ts:check    # TypeScript type check (all services)
npm run lint:check  # ESLint (all services)
npm run test        # Vitest unit tests (all services)
```
