import { Router } from 'express';
import { z } from 'zod';
import { validate } from '@speakeasy/middleware';
import { register, login } from './controller';

const router = Router();

export const authSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

router.post('/register', validate(authSchema), register);
router.post('/login', validate(authSchema), login);

export default router;
