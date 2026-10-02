import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import * as ctrl from '../controllers/certificates.controller.js';

const router = Router();

// Codes can be the legacy YRU-AI-2569-000042 or the new ควท.มรย.2570/03/001
// (Thai letters, digits, '.', '/', '-'). Lookups use a parametrized query so
// a permissive-but-bounded validation is safe.
const codeStr = z.string().min(3).max(50).regex(/^[฀-๿\w./-]+$/, 'Invalid certificate code');

// PUBLIC — anyone with the code (or scanning the cert's QR) can verify.
// Query-based form handles codes containing '/' (new format) without the
// URL-path %2F pitfalls behind nginx; legacy path form kept for old links.
router.get('/public',       validate({ query:  z.object({ code: codeStr }) }), ctrl.getByCode);
router.get('/public/:code', validate({ params: z.object({ code: codeStr }) }), ctrl.getByCode);

export default router;
