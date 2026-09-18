import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/activities.controller.js';

const router = Router();

const listQuery = z.object({
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
  limit:  z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const idParam = z.object({ id: z.coerce.number().int().positive() });
const slugParam = z.object({ slug: z.string().min(1).max(255) });

const createBody = z.object({
  title:           z.string().min(1).max(255),
  slug:            z.string().min(1).max(255).optional(),
  description:     z.string().max(65535).optional(),
  location:        z.string().max(255).optional(),
  start_date:      z.string().min(1),               // ISO or 'YYYY-MM-DD HH:MM:SS'
  end_date:        z.string().min(1),
  capacity:        z.number().int().min(0).default(0),
  status:          z.enum(['draft', 'published', 'completed', 'cancelled']).default('draft'),
  cover_image_url: z.string().url().max(500).optional(),
});

const updateBody = createBody.partial();

/* ---------- PUBLIC ---------- */
router.get('/',           validate({ query: listQuery }),   ctrl.list);           // list
router.get('/slug/:slug', validate({ params: slugParam }),  ctrl.getBySlug);      // for QR/landing
router.get('/:id',        validate({ params: idParam }),    ctrl.getById);

/* ---------- ADMIN ---------- */
router.post('/',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ body: createBody }), ctrl.create);

router.patch('/:id',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: updateBody }), ctrl.update);

router.delete('/:id',
  requireAuth, requireRole('super_admin'),
  validate({ params: idParam }), ctrl.remove);

export default router;
