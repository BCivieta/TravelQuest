import express from 'express';
import { getCityFromCoordinates, getCityFromName, saveUserLocation } from '../controllers/opcional/locationcontroller.js';
import { checkAndAwardAchievements } from '../controllers/logrocontroller.js';
import { supabase } from '../config/supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function to record city visit
async function recordCityVisit(userId, cityId) {
  try {
    // Check if this city visit is already recorded
    const { data: existingVisit, error: checkError } = await supabase
      .from('user_cities')
      .select('id')
      .eq('user_id', userId)
      .eq('city_id', cityId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    // If not already recorded, add it
    if (!existingVisit) {
      const { error: insertError } = await supabase
        .from('user_cities')
        .insert({
          user_id: userId,
          city_id: cityId,
          visited_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
      
      console.log(`👤 User ${userId} visited city ${cityId} - recorded successfully`);
      return true; // New visit recorded
    } else {
      console.log(`👤 User ${userId} already visited city ${cityId} - skipping record`);
      return false; // Already visited
    }
  } catch (error) {
    console.error("Error recording city visit:", error);
    throw error;
  }
}

// 📌 Obtener ciudad desde coordenadas (latitud, longitud)
router.post('/from-coordinates', authMiddleware, getCityFromCoordinates);

// 📌 Buscar información de una ciudad por nombre
router.post('/from-name', authMiddleware, async (req, res) => {
  try {
    const { city } = req.body;
    const userId = req.user.id;

    if (!city) {
      return res.status(400).json({ error: "El nombre de la ciudad es requerido." });
    }

    // Buscar ciudad en la base de datos de Supabase
    const { data: cityData, error } = await supabase
      .from("cities")
      .select("*")
      .ilike("name", city) // Búsqueda sin distinguir mayúsculas/minúsculas
      .single();

    if (error) throw error;
    if (!cityData) return res.status(404).json({ error: "Ciudad no encontrada." });

    // Record the visit and check if it's a new visit
    const isNewVisit = await recordCityVisit(userId, cityData.id);
    
    // Check for achievements if this is a new visit
    let achievementData = null;
    if (isNewVisit) {
      try {
        achievementData = await checkAndAwardAchievements(userId, 'CITY_VISITED');
        console.log("🏆 Achievement check completed after city visit");
      } catch (achievementError) {
        console.error("Error checking achievements:", achievementError);
        // Don't fail the whole request if achievement check fails
      }
    }

    return res.json({
      ...cityData,
      achievements: achievementData ? {
        newAchievements: achievementData.newAchievements || [],
        pointsEarned: achievementData.pointsEarned || 0
      } : null
    });
  } catch (error) {
    console.error("Error buscando ciudad:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// Add a new endpoint to manually check city-related achievements
router.post('/check-city-achievements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const achievements = await checkAndAwardAchievements(userId, 'CITY_VISITED');
    
    res.status(200).json({
      message: "Logros de ciudades verificados correctamente",
      newAchievements: achievements?.newAchievements || [],
      pointsEarned: achievements?.pointsEarned || 0
    });
  } catch (error) {
    console.error("Error checking city achievements:", error);
    res.status(500).json({ error: "Error al verificar logros de ciudades" });
  }
});

router.post('/user_location', saveUserLocation);

export default router;
