import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/activities.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await svc.listActivities({
    status: req.query.status,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({ ok: true, data });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await svc.getActivityBySlug(req.params.slug);
  res.json({ ok: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getActivityById(req.params.id);
  res.json({ ok: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.createActivity(req.body, req.user.id);
  res.status(201).json({ ok: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.updateActivity(req.params.id, req.body);
  res.json({ ok: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await svc.deleteActivity(req.params.id);
  res.json({ ok: true, data });
});
