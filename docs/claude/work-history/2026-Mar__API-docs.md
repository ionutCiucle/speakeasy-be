# API Docs (Scalar + OpenAPI)

**Goal:** Add an interactive API reference to the gateway using Scalar, backed by a hand-authored OpenAPI 3.1 spec covering all public endpoints.

## Approach

- Single `openapi.yaml` spec lives in `services/gateway/` — the gateway is the only public-facing service so it owns the full API surface
- `@scalar/express-api-reference` serves the UI at `GET /api-docs` in the gateway (no auth required)
- `GET /api-docs/spec` serves the raw YAML for tooling (Postman, code-gen, etc.)
- No annotations in individual service files — the spec is the single source of truth

## Plan

- [x] Phase 1 — Create branch `feature/api-docs` and this plan
- [ ] Phase 2 — Install `@scalar/express-api-reference` in `services/gateway`
- [ ] Phase 3 — Write `services/gateway/openapi.yaml` covering all endpoints:
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`
  - Users: `GET /api/users/me`, `PATCH /api/users/me`, `GET /api/users/:id`
  - Friendships: `POST /api/friendships/request`, `PATCH /api/friendships/:id/accept`, `PATCH /api/friendships/:id/reject`, `PATCH /api/friendships/:id/block`, `GET /api/friendships`
  - Tabs: `POST /api/tabs`, `GET /api/tabs/:id`, `POST /api/tabs/:id/items`, `PATCH /api/tabs/:id/items/:itemId`, `POST /api/tabs/:id/participants`, `POST /api/tabs/:id/settle`, `POST /api/tabs/:id/close`
- [ ] Phase 4 — Mount Scalar and spec route in `services/gateway/src/app.ts`
- [ ] Phase 5 — Preflight, commit, push, raise PR
