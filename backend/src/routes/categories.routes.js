import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/categories.controller.js';

const router = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({ all: z.string().optional() });

const createBody = z.object({
  name:          z.string().trim().min(1).max(100),
  slug:          z.string().trim().max(120).optional(),
  description:   z.string().max(500).nullable().optional(),
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
