import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/rooms.controller.js';

const router = Router();

// Admin-only: bookings are read from the public Google Sheet (read-only).
router.get('/bookings', requireAuth, ctrl.listBookings);

export default router;
