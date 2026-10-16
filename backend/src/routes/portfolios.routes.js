import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/portfolios.controller.js';

const router = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({ all: z.string().optional() });

// image_url: http(s) URL หรือ data:image/... base64 (ได้ถึง ~10MB), เหมือน
// activities.cover_image_url.
const imageUrlSchema = z.string()
  .max(10_000_000)
  .regex(/^(https?:\/\/|data:image\/)/i, 'image_url must be an http(s) URL or a data:image URI');

const createBody = z.object({
  title:         z.string().min(1).max(255),
  description:   z.string().min(1).max(65535),
  image_url:     imageUrlSchema,
  display_order: z.number().int().min(0).optional(),
  is_active:     z.boolean().optional(),
});

const updateBody = createBody.partial();

/* ---------- PUBLIC ---------- */
router.get('/',    validate({ query: listQuery }), ctrl.list);
router.get('/:id', validate({ params: idParam }),  ctrl.getById);

/* ---------- ADMIN ---------- */
router.post('/',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ body: createBody }), ctrl.create);

router.put('/:id',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: updateBody }), ctrl.update);

router.delete('/:id',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam }), ctrl.remove);

export default router;
