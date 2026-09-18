import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/participants.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await svc.listParticipants({
    q: req.query.q,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({ ok: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getParticipantById(req.params.id);
  res.json({ ok: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.updateParticipant(req.params.id, req.body);
  res.json({ ok: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await svc.deleteParticipant(req.params.id);
  res.json({ ok: true, data });
});
