# 2026-Apr__Payload-validation

## Status: COMPLETE ✓

## Goal

Move request body validation out of controller functions and into a shared Zod-based middleware. Add unit tests that cover the validation layer for the auth and tab `createTab` endpoints.

---

## Changes

### `@speakeasy/middleware`

- Added `validate(schema: ZodType)` — an Express middleware factory that calls `schema.safeParse(req.body)` and returns `400 { message: 'Validation failed', errors: [{ field, message }] }` on failure, or calls `next()` on success.
- Added `zod` to `dependencies` in `package.json`.
- Added `tsconfig.json` (extends `@speakeasy/tsconfig/base`) — was missing, causing vite/oxc to fail when traversing into the package during test transforms.

### Auth Service

- `routes.ts` — added `authSchema` (Zod, exported) requiring `email: string min(1)` and `password: string min(1)`; wired `validate(authSchema)` before `register` and `login` handlers; added `@speakeasy/middleware` dependency.
- `controller.ts` — removed manual `if (!email || !password)` guards from `register` and `login`; validation is now the middleware's responsibility.

### Tab Service

- `routes.ts` — added `createTabSchema` (Zod, exported) requiring `title: string min(1)`, `venue: string`, `currency: { code, name }`, optional `notes`, and `members`/`menuItems` arrays; wired `validate(createTabSchema)` before `handleCreateTab`.

### Tests

- `services/auth/src/controller.test.ts` — new `payload validation` describe block (5 tests): 4 invalid-payload cases (`missing email`, `missing password`, `empty email`, `empty password`) assert `400 Validation failed`; 1 valid-payload case asserts `next()` is called.
- `services/tab/src/controller.test.ts` — new `createTab payload validation` describe block (9 tests): 8 invalid-payload cases covering missing/empty `title`, missing `venue`, missing or partially-formed `currency`, missing `members`, missing `menuItems`; 1 valid-payload case asserts `next()` is called.

---

## Test counts after this change

| Service | Tests |
|---|---|
| auth | 13 |
| tab | 24 |
