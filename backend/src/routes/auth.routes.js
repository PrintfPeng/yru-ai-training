import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200),
});

router.post('/login',  validate({ body: loginSchema }), ctrl.login);
router.post('/logout', requireAuth, ctrl.logout);
router.get ('/me',     requireAuth, ctrl.me);

export default router;
