// backend/src/controllers/locationController.js
import { supabase } from "../../config/supabaseClient.js";
import axios from "axios";
import { checkAndAwardAchievements } from '../logrocontroller.js';

// API Key de OpenCage (o Google Geocoding API)
const GEOCODING_API_KEY = "TU_API_KEY";
const GEOCODING_API_URL = "https://api.opencagedata.com/geocode/v1/json";

// 📌 Función para obtener ciudad a partir de coordenadas
export const getCityFromCoordinates = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Se requieren latitud y longitud." });
        }

        // Llamar a OpenCage API para obtener la ciudad
        const response = await axios.get(GEOCODING_API_URL, {
            params: {
                q: `${latitude},${longitude}`,
                key: GEOCODING_API_KEY,
                language: "es",
            },
        });

        // Get city data from the response
        const cityName = response.data.results[0]?.components?.city || "Ubicación desconocida";
        
        // Look up the city in our database
        const { data: cityData, error: cityError } = await supabase
            .from("cities")
            .select("*")
            .ilike("name", cityName)
            .single();
            
        if (cityError && cityError.code !== 'PGRST116') {
            throw cityError;
        }
        
        // If city exists in our database
        if (cityData && cityData.id && req.user && req.user.id) {
            // Record the visit
            await recordCityVisit(req.user.id, cityData.id);
            
            // Check for achievements
            const achievements = await checkAndAwardAchievements(req.user.id, 'CITY_VISITED');
            
            // Return city data with achievement info
            return res.status(200).json({
                city: cityData,
                achievements: {
                    newAchievements: achievements?.newAchievements || [],
                    pointsEarned: achievements?.pointsEarned || 0
                }
            });
        }
        
        // If city not found in database, just return the name
        return res.json({ city: cityName });
    } catch (error) {
        console.error("Error obteniendo ciudad:", error);
        res.status(500).json({ error: "Error obteniendo la ubicación." });
    }
};

// 📌 Función para obtener info de una ciudad manualmente ingresada
export const getCityFromName = async (req, res) => {
    try {
        const { city } = req.body;

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

        // If user is authenticated, record the visit and check achievements
        if (req.user && req.user.id) {
            await recordCityVisit(req.user.id, cityData.id);
            
            // Check for achievements
            const achievements = await checkAndAwardAchievements(req.user.id, 'CITY_VISITED');
            
            return res.json({
                ...cityData,
                achievements: {
                    newAchievements: achievements?.newAchievements || [],
                    pointsEarned: achievements?.pointsEarned || 0
                }
            });
        }

        return res.json(cityData);
    } catch (error) {
        console.error("Error buscando ciudad:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
};

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
        } else {
            console.log(`👤 User ${userId} already visited city ${cityId} - skipping record`);
        }
    } catch (error) {
        console.error("Error recording city visit:", error);
        throw error;
    }
}
// Guardar o actualizar la ubicación del usuario
export const saveUserLocation = async (req, res) => {
  const { user_id, city_id } = req.body;
  if (!user_id || !city_id) return res.status(400).json({ error: 'Faltan datos' });
  try {
    // Verificar si ya existe
    const { data: existing, error: findError } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    if (findError) return res.status(500).json({ error: findError.message });
    if (existing) {
      // Actualizar
      const { data, error } = await supabase
        .from('user_locations')
        .update({ city_id, last_seen_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    } else {
      // Insertar
      const { data, error } = await supabase
        .from('user_locations')
        .insert([{ user_id, city_id, last_seen_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
