import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authenticate } from '@speakeasy/middleware';
import { authProxy, userProxy, friendshipProxy } from './proxy';

const app = express();

app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public — forward to auth service
app.use('/api/auth', authProxy);

// Protected — validate JWT then forward to user service
app.use('/api/users', authenticate, userProxy);

// Protected — validate JWT then forward to friendship service
app.use('/api/friendships', authenticate, friendshipProxy);

export default app;
