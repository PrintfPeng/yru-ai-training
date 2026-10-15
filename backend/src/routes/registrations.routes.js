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

// .passthrough(): keep any extra (custom) question answers so they can be
// stored in registrations.form_data.
const participantSchema = z.object({
  prefix:       z.string().max(20).nullable().optional(),
  first_name:   z.string().min(1).max(100),
  last_name:    z.string().min(1).max(100),
  email:        z.string().email().max(150),
  phone:        z.string().min(9).max(20),
  organization: z.string().max(255).nullable().optional(),
  position:     z.string().max(150).nullable().optional(),
}).passthrough();

const publicRegisterBody = z.object({
  participant: participantSchema,
  note:        z.string().max(2000).nullable().optional(),
  form_data:   z.record(z.any()).nullable().optional(),
});

const teamRegisterBody = z.object({
  team_name: z.string().min(1).max(255),
  members:   z.array(participantSchema).min(1).max(20),
  note:      z.string().max(2000).nullable().optional(),
});

const verifyPhoneBody = z.object({
  phone: z.string().min(9).max(20),
});

const statusPatchBody = z.object({
  status: z.enum(['pending', 'confirmed', 'attended', 'cancelled']),
  note:   z.string().max(2000).nullable().optional(),
});

/* ---------- PUBLIC ---------- */
router.get('/public/activity/:slug/registrants',
  validate({ params: slugParam }),
  ctrl.publicListRegistrants);

router.post('/public/activity/:slug/register',
  validate({ params: slugParam, body: publicRegisterBody }),
  ctrl.publicRegister);

router.post('/public/activity/:slug/register-team',
  validate({ params: slugParam, body: teamRegisterBody }),
  ctrl.publicRegisterTeam);

router.post('/public/activity/:slug/verify-phone',
  validate({ params: slugParam, body: verifyPhoneBody }),
  ctrl.publicVerifyPhone);

/* ---------- ADMIN ---------- */
router.get('/by-activity/:id',
  requireAuth,
  validate({ params: idParam, query: listQuery }),
  ctrl.listForActivity);

// Admin adds a registrant manually (after the window closed / to a draft, etc.)
router.post('/by-activity/:id',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: z.object({ participant: participantSchema, note: z.string().max(2000).nullable().optional() }) }),
  ctrl.adminCreate);

router.patch('/:id/status',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: statusPatchBody }),
  ctrl.updateStatus);

router.delete('/:id',
  requireAuth, requireRole('super_admin'),
  validate({ params: idParam }),
  ctrl.remove);

export default router;
