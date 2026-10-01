import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/registrations.controller.js';

const router = Router();

const idParam    = z.object({ id: z.coerce.number().int().positive() });
const slugParam  = z.object({ slug: z.string().min(1).max(255) });
const listQuery  = z.object({
  status: z.enum(['pending', 'confirmed', 'attended', 'cancelled']).optional(),
});

const participantSchema = z.object({
  first_name:   z.string().min(1).max(100),
  last_name:    z.string().min(1).max(100),
  email:        z.string().email().max(150),
  phone:        z.string().min(9).max(20),
  organization: z.string().max(255).nullable().optional(),
  position:     z.string().max(150).nullable().optional(),
});

const publicRegisterBody = z.object({
  participant: participantSchema,
  note:        z.string().max(2000).nullable().optional(),
});

const verifyPhoneBody = z.object({
  phone: z.string().min(9).max(20),
});

const statusPatchBody = z.object({
  status: z.enum(['pending', 'confirmed', 'attended', 'cancelled']),
  note:   z.string().max(2000).nullable().optional(),
});

/* ---------- PUBLIC ---------- */
router.post('/public/activity/:slug/register',
  validate({ params: slugParam, body: publicRegisterBody }),
  ctrl.publicRegister);

router.post('/public/activity/:slug/verify-phone',
  validate({ params: slugParam, body: verifyPhoneBody }),
  ctrl.publicVerifyPhone);

/* ---------- ADMIN ---------- */
router.get('/by-activity/:id',
  requireAuth,
  validate({ params: idParam, query: listQuery }),
  ctrl.listForActivity);

router.patch('/:id/status',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: statusPatchBody }),
  ctrl.updateStatus);

router.delete('/:id',
  requireAuth, requireRole('super_admin'),
  validate({ params: idParam }),
  ctrl.remove);

export default router;
