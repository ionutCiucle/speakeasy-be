# 2026-Mar__Unit-tests

## Plan

Add a unit test suite across all services. Each service gets its own tests co-located with its source. Tests run in CI as part of the Preflight check.

---

## Test stack

- **Runner:** [Vitest](https://vitest.dev/) — fast, TypeScript-native, Jest-compatible API
- **Mocking:** Vitest built-ins (`vi.mock`, `vi.fn`, `vi.spyOn`)
- **Scope:** unit tests only — store functions are mocked, no real DB or RabbitMQ connections

---

## What to test

### Auth Service
- `controller.ts` — `register`: duplicate email, successful registration; `login`: wrong password, user not found, successful login + JWT shape
- `store.ts` — `findUserByEmail`, `createUser` (Prisma mocked)

### User Service
- `controller.ts` — `getMe`: upserts on first call; `updateMe`: returns updated profile; `getUserById`: 404 on missing user
- `store.ts` — `findUserById`, `upsertUser`, `updateUser` (Prisma mocked)

### Friendship Service
- `controller.ts` — `sendRequest`: self-request rejected; `acceptRequest`: wrong user forbidden, happy path; `rejectRequest`: happy path; `blockUser`: non-participant forbidden; `getFriends`: returns list
- `store.ts` — `createRequest`, `findById`, `updateStatus`, `listFriends` (Prisma mocked)

### Tab Service
- `controller.ts` — `handleCreateTab`: creates tab; `handleAddItem`: 404 on missing tab; `handleUpdateItem`: 404 on wrong tab; `handleAddParticipant`: emits event; `handleRecordSettlement`: emits event; `handleCloseTab`: forbidden for non-creator
- `store.ts` — all store functions (Prisma mocked)

### Notification Service
- `handlers.ts` — each handler logs the correct message
- `consumer.ts` — `dispatch` routes to the correct handler per routing key

---

## Steps

- [x] Step 1 — Add Vitest infrastructure
  - Installed `vitest@^2.1.9` in each service (v2 required — v4 needs Node ≥20.12, we're on 20.10)
  - Added `"test": "vitest run --passWithNoTests"` and `"test:watch": "vitest"` to each service's `package.json`
  - Added root `"test": "npm run test --workspaces --if-present"` script
  - Added `Test` step to `.github/workflows/preflight.yml`
  - `--passWithNoTests` keeps CI green until test files are added
- [ ] Step 2 — Write tests for Auth Service
- [ ] Step 3 — Write tests for User Service
- [ ] Step 4 — Write tests for Friendship Service
- [ ] Step 5 — Write tests for Tab Service
- [ ] Step 6 — Write tests for Notification Service
- [ ] Step 7 — Add `test` step to `.github/workflows/preflight.yml`
