import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/certificates.service.js';

/**
 * PUBLIC — /verify/:code
 * Returns the certificate + substitutions so the frontend can render it
 * (or verifiers can confirm authenticity).
 */
export const getByCode = asyncHandler(async (req, res) => {
  const data = await svc.getCertificateByCode(req.params.code);
  res.json({ ok: true, data });
});
