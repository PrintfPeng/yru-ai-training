import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/activities.controller.js';

const router = Router();

const listQuery = z.object({
  status: z.enum(['draft', 'published', 'assessment', 'completed', 'cancelled']).optional(),
  limit:  z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const idParam = z.object({ id: z.coerce.number().int().positive() });
const slugParam = z.object({ slug: z.string().min(1).max(255) });

// cover_image_url accepts either:
//   - a normal http(s) URL (typically ≤500 chars), or
//   - a data:image/... base64 string (browser FileReader.readAsDataURL — can be MBs).
// We only require it to look like one of the two, and cap at ~10 MB of chars.
const coverImageUrlSchema = z.string()
  .max(10_000_000)
  .regex(/^(https?:\/\/|data:image\/)/i, 'cover_image_url must be an http(s) URL or a data:image URI');

const createBody = z.object({
  title:           z.string().min(1).max(255),
  slug:            z.string().min(1).max(255).optional(),
  description:     z.string().max(65535).optional(),
  location:        z.string().max(255).optional(),
  start_date:      z.string().min(1),               // ISO or 'YYYY-MM-DD HH:MM:SS'
  end_date:        z.string().min(1),
  capacity:        z.number().int().min(0).default(0),
  status:          z.enum(['draft', 'published', 'assessment', 'completed', 'cancelled']).default('draft'),
  cover_image_url: coverImageUrlSchema.optional(),
  // ----- richer detail fields (course detail page) -----
  batch_no:            z.number().int().min(1).nullable().optional(),
  title_en:            z.string().max(255).nullable().optional(),
  register_open_at:    z.string().min(1).nullable().optional(),   // 'YYYY-MM-DD HH:MM:SS' or ISO
  register_close_date: z.string().min(1).nullable().optional(),   // 'YYYY-MM-DD HH:MM:SS' or ISO
  has_selection:       z.boolean().optional(),
  fee_text:            z.string().max(255).nullable().optional(),
  travel_text:         z.string().max(500).nullable().optional(),
  venue_links:         z.array(z.object({
                         label: z.string().min(1).max(100),
                         url:   z.string().min(1).max(500),
                       })).nullable().optional(),
  note_text:           z.string().max(2000).nullable().optional(),
  // ----- registration model (เดี่ยว/ทีม) -----
  registration_type:   z.enum(['individual', 'team']).optional(),
  team_max_members:    z.number().int().min(1).max(20).nullable().optional(),
  team_cert_mode:      z.enum(['per_person', 'team']).nullable().optional(),
  register_form_schema: z.object({
    fields: z.array(z.object({
      key:      z.string().min(1).max(40),
      type:     z.string().min(1).max(30),
      label:    z.string().min(1).max(200),
      options:  z.array(z.string()).optional(),
      required: z.boolean().optional(),
      core:     z.boolean().optional(),
      member:   z.number().int().min(1).max(20).optional(), // team: which member block (1-based)
      allowOther: z.boolean().optional(),                   // dropdown: allow "อื่นๆ" free text
    })),
  }).nullable().optional(),
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
