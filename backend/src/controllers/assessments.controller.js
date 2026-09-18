import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/assessments.service.js';

/* ---------- ADMIN ---------- */

export const listForActivity = asyncHandler(async (req, res) => {
  const data = await svc.listAssessmentsForActivity(req.params.id);
  res.json({ ok: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getAssessmentById(req.params.id);
  res.json({ ok: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.createAssessment(req.params.id, req.body);
  res.status(201).json({ ok: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.updateAssessment(req.params.id, req.body);
  res.json({ ok: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await svc.deleteAssessment(req.params.id);
  res.json({ ok: true, data });
});

/* ---------- PUBLIC (trainee flow) ---------- */

/**
 * GET the active assessment for the given activity slug (used by AssessmentSurvey).
 */
export const getActiveBySlug = asyncHandler(async (req, res) => {
  const a = await svc.getActiveAssessmentBySlug(req.params.slug);
  if (!a) return res.json({ ok: true, data: null });
  res.json({ ok: true, data: a });
});

/**
 * Submit answers. Body: { participant_id, response_data }
 * Response includes the auto-issued certificate so frontend can redirect.
 */
export const publicSubmit = asyncHandler(async (req, res) => {
  const data = await svc.submitResponse({
    assessmentId: req.params.id,
    participantId: req.body.participant_id,
    responseData: req.body.response_data,
  });
  res.status(201).json({ ok: true, data });
});
