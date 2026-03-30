import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { authenticate } from '@speakeasy/middleware';
import { authProxy, userProxy, friendshipProxy, tabProxy } from './proxy';
import { apiReference } from '@scalar/express-api-reference';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API docs — OpenAPI spec + Scalar UI
app.get('/api-docs/spec', (_req, res) => {
  const spec = readFileSync(join(__dirname, '..', 'openapi.yaml'), 'utf-8');
  res.setHeader('Content-Type', 'application/yaml');
  res.send(spec);
});

app.use('/api-docs', apiReference({ url: '/api-docs/spec' }));

// Public — forward to auth service
app.use('/api/auth', authProxy);

// Protected — validate JWT then forward to user service
app.use('/api/users', authenticate, userProxy);

// Protected — validate JWT then forward to friendship service
app.use('/api/friendships', authenticate, friendshipProxy);

// Protected — validate JWT then forward to tab service
app.use('/api/tabs', authenticate, tabProxy);

export default app;
