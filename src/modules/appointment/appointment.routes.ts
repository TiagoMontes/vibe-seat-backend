import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import {
  authenticateJWT,
  requireApproved,
  requireUser,
  requireAttendant,
} from '@/middleware/authMiddleware';

const router = Router();

// All routes require authentication and approved status
router.use(authenticateJWT, requireApproved);

// Users can create appointments and view available times
router.post('/', requireUser, appointmentController.create);
router.post(
  '/available-times',
  requireUser,
  appointmentController.getAvailableTimes
);

// Users can view their own appointments
router.get(
  '/my-appointments',
  requireUser,
  appointmentController.getMyAppointments
);

// Users can cancel their own appointments
router.patch('/:id/cancel', requireUser, appointmentController.cancel);

// Attendants and admins can view all appointments
router.get('/', requireAttendant, appointmentController.getAll);
router.get(
  '/allStatus',
  requireAttendant,
  appointmentController.getScheduledAppointments
);

// Attendants and admins can confirm presence and manage sessions
router.patch('/:id/confirm', requireAttendant, appointmentController.confirm);

export const appointmentRoutes = router;
