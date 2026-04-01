# 2026-Apr__Fix-CORS-gateway

## Status: COMPLETE ✓

## Problem

After the UI switched from axios to `fetch`, cross-origin requests to the gateway started failing with:

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
at http://localhost:4000/api/tabs/. (Reason: CORS request did not succeed). Status code: (null).
```

`fetch` sends an `Authorization` header on every protected request, which triggers a CORS preflight (OPTIONS). The gateway's `cors()` with no options does not explicitly set `Access-Control-Allow-Headers`, and `origin: '*'` is too permissive to be reliable across browser CORS versions.

## Root cause

`cors()` with no config:
- Does not explicitly advertise `Authorization` in `Access-Control-Allow-Headers` — relies on reflecting `Access-Control-Request-Headers`, which can be unreliable
- Uses `origin: '*'` (any origin) rather than a pinned client origin

Additionally, `http-proxy-middleware` replaces the gateway's response headers with the upstream service's headers when piping the proxy response back to the browser, so the browser effectively sees the internal service CORS headers rather than the gateway's.

## Fix

**`services/gateway/src/app.ts`** — replaced bare `cors()` with explicit config:

```js
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:8081',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**`services/gateway/.env.example`** — added `CLIENT_URL=http://localhost:8081` (Expo web default; override in `.env` if the UI runs on a different port).

## Notes

- Internal services (tab, auth, etc.) retain their own `cors()` — harmless since they're only reachable server-to-server through the gateway, never directly from a browser
- `CLIENT_URL` must be set correctly in `services/gateway/.env` for the local stack; it will also need to be set in CI/prod environments
