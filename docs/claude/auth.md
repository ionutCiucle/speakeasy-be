# Auth

JWT-based authentication with bcrypt password hashing.

## Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create account, returns JWT |
| `POST` | `/api/auth/login` | No | Verify credentials, returns JWT |

### Request body (both endpoints)

```json
{ "email": "user@example.com", "password": "secret" }
```

### Success response (both endpoints)

Register returns `201`, login returns `200`.

```json
{
  "token": "<jwt>",
  "user": { "id": "<uuid>", "email": "user@example.com" }
}
```

### Error responses

| Status | Condition |
|---|---|
| `400` | Missing `email` or `password` |
| `401` | Wrong password (login only) |
| `409` | Email already registered (register only) |

## Trying it locally

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'
```

Use the returned `token` as a Bearer token for protected routes:

```bash
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer <token>"
```

## Protecting a route

Import `authenticate` from `@speakeasy/middleware` and add it before the handler:

```ts
import { authenticate } from '@speakeasy/middleware';

router.get('/me', authenticate, handler);
```

Inside the handler, `req.user` is typed as `{ userId: string; email: string }`.

## JWT

- Algorithm: HS256 (default)
- Payload: `{ userId, email, iat, exp }`
- Secret: `JWT_SECRET` env var
- Expiry: `JWT_EXPIRES_IN` env var (default `7d`)

## Password hashing

bcryptjs with a cost factor of `12`. Hashes are stored in the `passwordHash` column — the plaintext password is never persisted.

## User profile creation

The auth service and the user service have **separate databases**. The auth DB stores credentials only (`id`, `email`, `passwordHash`). The user DB stores profiles (`displayName`, `avatarUrl`, etc.).

A user profile is **not** created at registration. It is created lazily on the first call to `GET /api/users/me`, which calls `upsertUser(userId)`. This means:

- A fresh JWT is valid for all protected routes immediately after registration.
- The user profile row in the user DB will not exist until `GET /api/users/me` is called for the first time.
- Any service that looks up a user profile by ID should handle the case where the profile does not yet exist.
