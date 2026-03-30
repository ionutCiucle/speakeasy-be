# Logging System

## Context

The project previously had no structured logging — only bare `console.log` statements in `server.ts` files. A proper logging system was added to improve observability across all services by capturing HTTP requests, controller operations, store queries, and errors in a structured, machine-readable format.

## Approach

**Library:** [pino](https://getpino.io/) — fast, structured JSON logger, well-suited for Node.js microservices.

- `pino` — core logger
- `pino-http` — Express HTTP request/response middleware
- `@speakeasy/logger` — shared package wrapping `createLogger()` so all services get a consistent setup

## Shared logger package

`packages/logger/src/index.ts` exports `createLogger(name: string)`:

- Sets the `name` field on every log line (e.g. `"auth"`, `"user"`)
- Reads log level from `LOG_LEVEL` env var (default `"info"`)
- Uses `pino-pretty` in development, plain JSON in production

## What is logged

| Layer | Events |
|-------|--------|
| HTTP (pino-http middleware) | Every request + response — method, url, status, duration |
| Controller | `debug` on missing fields, `warn` on business-rule failures (duplicate email, invalid credentials, 404), `info` on success |
| Store | `debug` before each Prisma call, `error` (with thrown error) on failure |
| Server startup | `info` with port number |

## Files changed

| File | Change |
|------|--------|
| `packages/logger/src/index.ts` | New — `createLogger` factory |
| `packages/logger/package.json` | New |
| `packages/logger/tsconfig.json` | New |
| `services/auth/src/app.ts` | Added pino-http middleware, exports `logger` |
| `services/auth/src/controller.ts` | Added operation logs |
| `services/auth/src/store.ts` | Added query/error logs |
| `services/auth/src/server.ts` | Replaced `console.log` with `logger.info` |
| `services/auth/package.json` | Added `pino`, `pino-http`, `@speakeasy/logger` |
| `services/user/src/app.ts` | Added pino-http middleware, exports `logger` |
| `services/user/src/controller.ts` | Added operation logs |
| `services/user/src/store.ts` | Added query/error logs |
| `services/user/src/server.ts` | Replaced `console.log` with `logger.info` |
| `services/user/package.json` | Added `pino`, `pino-http`, `@speakeasy/logger` |

## Configuration

Set `LOG_LEVEL` in each service's `.env` to control verbosity:

```
LOG_LEVEL=debug   # show all logs including store queries
LOG_LEVEL=info    # default — startup + controller success/warn events
LOG_LEVEL=warn    # only warnings and errors
```

In development (`NODE_ENV` not set to `"production"`), output is pretty-printed via `pino-pretty`. In production, output is newline-delimited JSON suitable for log aggregators (Datadog, Loki, etc.).
