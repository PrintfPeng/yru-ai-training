import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/rooms.service.js';

/**
 * ADMIN — list room bookings read from the public Google Sheet.
 * `?refresh=1` bypasses the in-memory cache.
 */
export const listBookings = asyncHandler(async (req, res) => {
  const force = req.query.refresh === '1' || req.query.refresh === 'true';
  const data = await svc.listRoomBookings({ force });
  res.json({ ok: true, data });
});
