import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/certificates.controller.js';

const router = Router();

// Buddhist year bounds — loose but sane (พ.ศ. 2500–2700).
const beYearParam = z.object({ beYear: z.coerce.number().int().min(2500).max(2700) });

// Codes can be the legacy YRU-AI-2569-000042 or the new ควท.มรย.2570/03/001
// (Thai letters, digits, '.', '/', '-'). Lookups use a parametrized query so
// a permissive-but-bounded validation is safe.
const codeStr = z.string().min(3).max(50).regex(/^[฀-๿\w./-]+$/, 'Invalid certificate code');

// PUBLIC — anyone with the code (or scanning the cert's QR) can verify.
// Query-based form handles codes containing '/' (new format) without the
// URL-path %2F pitfalls behind nginx; legacy path form kept for old links.
router.get('/public',       validate({ query:  z.object({ code: codeStr }) }), ctrl.getByCode);
router.get('/public/:code', validate({ params: z.object({ code: codeStr }) }), ctrl.getByCode);

// ADMIN — per-year running number for certificate codes (ควท.มรย.{ปี}/03/{run}).
router.get('/counter/:beYear',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: beYearParam }),
  ctrl.getCounter);

router.patch('/counter/:beYear',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: beYearParam, body: z.object({ start_no: z.coerce.number().int().min(1).max(999) }) }),
  ctrl.setCounter);

export default router;
