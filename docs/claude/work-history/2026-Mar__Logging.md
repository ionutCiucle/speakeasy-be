# Logging System (pino)

**Goal:** Add structured logging across all services — replacing bare `console.log` calls with a consistent, machine-readable pino logger.

## Approach

- New shared package `@speakeasy/logger` exports `createLogger(name)` so all services share identical setup
- `pino-http` middleware added as the first Express middleware in each HTTP service — logs every request/response automatically
- Controllers log at `info` on success, `warn` on business-rule failures (duplicate email, invalid credentials, 404, 403), `debug` on missing input fields
- Stores wrap every Prisma call with `debug` (before) and `error` (on throw)
- `publisher.ts` files in friendship and tab services replace `console.error` with `logger.error`
- Notification service (no Express app) gets a standalone `src/logger.ts` module imported by consumer and handlers
- Log level driven by `LOG_LEVEL` env var (default `"info"`); `pino-pretty` in development, plain JSON in production

## Plan

- [x] Create branch `feature/logging`
- [x] Create `packages/logger/src/index.ts` — `createLogger` factory
- [x] Add `pino`, `pino-http`, `@speakeasy/logger` to each service's `package.json`
- [x] Update auth service — `app.ts`, `server.ts`, `controller.ts`, `store.ts`
- [x] Update user service — `app.ts`, `server.ts`, `controller.ts`, `store.ts`
- [x] Update friendship service — `app.ts`, `server.ts`, `controller.ts`, `store.ts`, `publisher.ts`
- [x] Update tab service — `app.ts`, `server.ts`, `controller.ts`, `store.ts`, `publisher.ts`
- [x] Update notification service — `server.ts`, `consumer.ts`, `handlers.ts`, new `logger.ts`
- [x] Update gateway service — `app.ts`, `server.ts`
- [x] Save plan to `docs/claude/logging.md`
