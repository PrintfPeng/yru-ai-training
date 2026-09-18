import { Router } from 'express';
import authRoutes          from './auth.routes.js';
import activitiesRoutes    from './activities.routes.js';
import participantsRoutes  from './participants.routes.js';
import registrationsRoutes from './registrations.routes.js';
import assessmentsRoutes   from './assessments.routes.js';
import certificatesRoutes  from './certificates.routes.js';

const router = Router();

// Health check — used by monitoring / smoke tests
router.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'yru-ai-training-api', time: new Date().toISOString() })
);

router.use('/auth',          authRoutes);
router.use('/activities',    activitiesRoutes);
router.use('/participants',  participantsRoutes);
router.use('/registrations', registrationsRoutes);
router.use('/assessments',   assessmentsRoutes);
router.use('/certificates',  certificatesRoutes);

export default router;
