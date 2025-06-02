import express from 'express';
import {
  getActiveChallenge,
  generateChallengeWithMissions,
  completeChallenge,
  discardActiveChallenge
} from '../controllers/challengeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de retos requieren autenticación
router.use(authMiddleware);

// Rutas de retos
router.get('/activo', getActiveChallenge);
router.post('/generar', generateChallengeWithMissions);
router.post('/:id/finalizar', completeChallenge);
router.delete("/activo", discardActiveChallenge);

export default router;
