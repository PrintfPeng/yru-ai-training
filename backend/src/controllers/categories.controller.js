import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/categories.service.js';

/**
 * PUBLIC — list categories (active only). Admin passes ?all=1 to include
 * hidden (is_active = 0) rows for the management page.
 */
export const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === '1' || req.query.all === 'true';
  const data = await svc.getAllCategories({ includeInactive });
  res.json({ ok: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getCategoryById(req.params.id);
  res.json({ ok: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.createCategory(req.body);
  res.status(201).json({ ok: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.updateCategory(req.params.id, req.body);
  res.json({ ok: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await svc.deleteCategory(req.params.id);
  res.json({ ok: true, data });
});
