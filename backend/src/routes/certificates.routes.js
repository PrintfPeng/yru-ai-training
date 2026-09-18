import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import * as ctrl from '../controllers/certificates.controller.js';

const router = Router();

const codeParam = z.object({
  code: z.string().regex(/^YRU-AI-\d{4}-\d{6}$/i, 'Invalid certificate code format'),
});

// PUBLIC — anyone with the code (or scanning the cert's QR) can verify
router.get('/public/:code', validate({ params: codeParam }), ctrl.getByCode);

export default router;
