import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/assessments.controller.js';

const router = Router();

const idParam   = z.object({ id:   z.coerce.number().int().positive() });
const slugParam = z.object({ slug: z.string().min(1).max(255) });

const formField = z.object({
  id:         z.string().min(1).max(40),
  type:       z.enum(['short_answer', 'paragraph', 'multiple_choice',
                      'checkboxes', 'dropdown', 'file_upload',
                      'date', 'time', 'rating']),
  label:      z.string().min(1).max(500),
  required:   z.boolean().optional(),
  options:    z.array(z.string()).optional(),
  helpText:   z.string().max(500).optional(),
  validation: z.record(z.any()).optional(),
});

const formSchema = z.object({ fields: z.array(formField).min(1) });

const createBody = z.object({
  title:        z.string().min(1).max(255),
  description:  z.string().max(65535).nullable().optional(),
  type:         z.enum(['pre_test', 'post_test', 'satisfaction', 'custom']).default('satisfaction'),
  form_schema:  formSchema,
  is_published: z.boolean().default(false),
  open_at:      z.string().nullable().optional(),
  close_at:     z.string().nullable().optional(),
});

const updateBody = createBody.partial();

const submitBody = z.object({
  participant_id: z.coerce.number().int().positive(),
  response_data:  z.record(z.any()),
});

/* ---------- ADMIN — nested under an activity ---------- */
router.get('/by-activity/:id',
  requireAuth, validate({ params: idParam }), ctrl.listForActivity);

router.post('/by-activity/:id',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: createBody }), ctrl.create);

/* ---------- ADMIN — by assessment id ---------- */
router.get   ('/:id',
  requireAuth, validate({ params: idParam }), ctrl.getById);

router.patch ('/:id',
  requireAuth, requireRole('super_admin', 'admin'),
  validate({ params: idParam, body: updateBody }), ctrl.update);

router.delete('/:id',
  requireAuth, requireRole('super_admin'),
  validate({ params: idParam }), ctrl.remove);

/* ---------- PUBLIC (trainee) ---------- */
router.get('/public/activity/:slug/active',
  validate({ params: slugParam }), ctrl.getActiveBySlug);

router.post('/:id/public/submit',
  validate({ params: idParam, body: submitBody }), ctrl.publicSubmit);

export default router;
