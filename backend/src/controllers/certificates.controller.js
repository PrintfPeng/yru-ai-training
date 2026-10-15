import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/certificates.service.js';

/**
 * PUBLIC — /verify/:code
 * Returns the certificate + substitutions so the frontend can render it
 * (or verifiers can confirm authenticity).
 */
export const getByCode = asyncHandler(async (req, res) => {
  const code = req.query.code || req.params.code;
  const data = await svc.getCertificateByCode(code);
  res.json({ ok: true, data });
});

/** ADMIN — read the per-year certificate running counter. */
export const getCounter = asyncHandler(async (req, res) => {
  const data = await svc.getYearCounter(Number(req.params.beYear));
  res.json({ ok: true, data });
});

/** ADMIN — set the starting number for a year's certificate sequence. */
export const setCounter = asyncHandler(async (req, res) => {
  const data = await svc.setYearStart(Number(req.params.beYear), Number(req.body.start_no));
  res.json({ ok: true, data });
});
