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

### Response (both endpoints)

```json
{
  "token": "<jwt>",
  "user": { "id": "<uuid>", "email": "user@example.com" }
}
```

## Protecting a route

Import `authenticate` from `src/middleware/authenticate.ts` and add it before the handler:

```ts
import { authenticate } from '../middleware/authenticate';

router.get('/me', authenticate, handler);
```

Inside the handler, `req.user` is typed as `{ userId: string; email: string }` via `AuthRequest`.

## JWT

- Algorithm: HS256 (default)
- Payload: `{ userId, email, iat, exp }`
- Secret: `JWT_SECRET` env var
- Expiry: `JWT_EXPIRES_IN` env var (default `7d`)

## Password hashing

bcryptjs with a cost factor of `12`. Hashes are stored in the `passwordHash` column — the plaintext password is never persisted.
