import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/portfolios.service.js';

/**
 * PUBLIC — list portfolios (active only). Admin passes ?all=1 to include
 * hidden (is_active = 0) rows for the management page.
 */
export const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === '1' || req.query.all === 'true';
  const data = await svc.getAllPortfolios({ includeInactive });
  res.json({ ok: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getPortfolioById(req.params.id);
  res.json({ ok: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.createPortfolio(req.body);
  res.status(201).json({ ok: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.updatePortfolio(req.params.id, req.body);
  res.json({ ok: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await svc.deletePortfolio(req.params.id);
  res.json({ ok: true, data });
});
