import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/registrations.service.js';
import { findParticipantByPhoneAndActivity } from '../services/participants.service.js';
import { getActivityBySlug } from '../services/activities.service.js';
import { AppError } from '../utils/AppError.js';

/**
 * ADMIN — list registrations for an activity
 */
export const listForActivity = asyncHandler(async (req, res) => {
  const data = await svc.listRegistrationsForActivity(req.params.id, {
    status: req.query.status,
  });
  res.json({ ok: true, data });
});

/**
 * PUBLIC — register a participant for an activity (from ActivityDetail form).
 * Uses activity slug so the URL is stable and marketing-friendly.
 */
export const publicRegister = asyncHandler(async (req, res) => {
  const activity = await getActivityBySlug(req.params.slug);
  const data = await svc.registerForActivity(activity.id, req.body.participant, req.body.note);
  res.status(201).json({ ok: true, data });
});

/**
 * PUBLIC — trainee QR flow, step 1: verify phone.
 * Body: { phone } — activity slug in URL param.
 * Returns participant (masked email/phone) so the confirm screen can show them.
 */
export const publicVerifyPhone = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { phone } = req.body;

  const p = await findParticipantByPhoneAndActivity(phone, slug);
  if (!p) {
    throw new AppError('NOT_REGISTERED',
      'ไม่พบเบอร์นี้ในรายชื่อผู้ลงทะเบียนของหลักสูตร', 404);
  }
  res.json({
    ok: true,
    data: {
      participant: {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        organization: p.organization,
        position: p.position,
        phone_last4: p.phone.slice(-4),
        email_masked: p.email.replace(/^(.).*(@.*)$/, '$1***$2'),
        registration_id: p.registration_id,
        registration_status: p.registration_status,
      },
    },
  });
});

/**
 * ADMIN — change registration status
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const data = await svc.updateRegistrationStatus(
    req.params.id, req.body.status, { note: req.body.note }
  );
  res.json({ ok: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await svc.deleteRegistration(req.params.id);
  res.json({ ok: true, data });
});
