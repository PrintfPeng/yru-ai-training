import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/participants.controller.js';

const router = Router();

const listQuery = z.object({
  q:      z.string().max(100).optional(),
  limit:  z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const idParam = z.object({ id: z.coerce.number().int().positive() });

const updateBody = z.object({
  first_name:   z.string().min(1).max(100).optional(),
  last_name:    z.string().min(1).max(100).optional(),
  email:        z.string().email().max(150).optional(),
  phone:        z.string().min(9).max(20).optional(),
  organization: z.string().max(255).nullable().optional(),
  position:     z.string().max(150).nullable().optional(),
});

router.get   ('/',    requireAuth, validate({ query: listQuery }),                ctrl.list);
router.get   ('/:id', requireAuth, validate({ params: idParam }),                 ctrl.getById);
router.patch ('/:id', requireAuth, validate({ params: idParam, body: updateBody }), ctrl.update);
router.delete('/:id', requireAuth, requireRole('super_admin'),
                      validate({ params: idParam }),                              ctrl.remove);

export default router;
