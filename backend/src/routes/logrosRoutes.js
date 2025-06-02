import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getUserAchievements,
  checkAndAwardAchievements
} from '../controllers/logroController.js';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// ✅ Todas las rutas requieren autenticación
router.use(authMiddleware);

// 🔹 Obtener logros del usuario
router.get('/mis-logros', async (req, res) => {
  try {
    const logros = await getUserAchievements(req.user.id);
    res.json(logros);
  } catch (error) {
    console.error('❌ Error al obtener logros:', error);
    res.status(500).json({ error: 'Error al obtener logros' });
  }
});

// 🔹 Endpoint para verificar logros especiales
router.post('/verificar-especiales', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkAndAwardAchievements(userId, 'CHECK_SPECIAL_ACHIEVEMENTS');
    
    res.json({
      message: `Se verificaron logros especiales`,
      newAchievements: result.newAchievements,
      pointsEarned: result.pointsEarned
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al verificar logros especiales',
      error: error.message 
    });
  }
});

// 🔹 Endpoint GENERAL para verificar y otorgar logros
router.post('/check-all', async (req, res) => {
  try {
    const userId = req.user.id;
    const { trigger } = req.body || {};

    console.log(`🧪 Endpoint /logros/check-all llamado. UserID: ${userId}, Trigger: ${trigger}`);

    const result = await checkAndAwardAchievements(userId, trigger || 'GENERAL');

    res.status(200).json({
      message: 'Logros verificados correctamente',
      newAchievements: result.newAchievements,
      pointsEarned: result.pointsEarned
    });
  } catch (error) {
    console.error('❌ Error en /logros/check-all:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Obtener todos los logros disponibles
router.get('/', async (req, res) => {
  try {
    console.log('📊 Obteniendo todos los logros disponibles');
    const { data, error } = await supabase
      .from('achievements')
      .select('*');
    
    if (error) throw error;

    console.log(`✅ Encontrados ${data.length} logros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error al obtener todos los logros:', error);
    res.status(500).json({ error: 'Error al obtener todos los logros' });
  }
});

export default router;
