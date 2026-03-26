import { createProxyMiddleware } from 'http-proxy-middleware';

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3000';
const USER_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:3001';
const FRIENDSHIP_URL = process.env.FRIENDSHIP_SERVICE_URL ?? 'http://localhost:3002';
const TAB_URL = process.env.TAB_SERVICE_URL ?? 'http://localhost:3003';

export const authProxy = createProxyMiddleware({
  target: AUTH_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/auth/' },
});

export const userProxy = createProxyMiddleware({
  target: USER_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/users/' },
});

export const friendshipProxy = createProxyMiddleware({
  target: FRIENDSHIP_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/friendships/' },
});

export const tabProxy = createProxyMiddleware({
  target: TAB_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/tabs/' },
});
