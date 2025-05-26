import { supabase } from '../config/supabaseClient.js';
import { updateUserLevel } from './usercontroller.js';

// Define achievement types
// Update the LOGROS object to remove the unwanted achievements
export const LOGROS = {
  PRIMERA_CIUDAD: 'primera_ciudad',
  TROTAMUNDOS: 'trotamundos',
  // Removed: CIUDADANO_MUNDO: 'ciudadano_mundo',
  // Removed: MAPA_COMPLETO: 'mapa_completo',
  PRIMERA_MISION: 'primera_mision',
  MISION_FACIL: 'mision_facil',
  MISION_MEDIA: 'mision_media',
  MISION_DIFICIL: 'mision_dificil',
  DIEZ_MISIONES: 'diez_misiones',
  CIEN_MISIONES: 'cien_misiones',
  // Add other achievement types as needed
};

/**
 * Get all achievements for a user
 */
export const getUserAchievements = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting user achievements:', error);
    throw error;
  }
};

/**
 * Check and award achievements for a user
 */
export const checkAndAwardAchievements = async (userId, trigger = 'GENERAL') => {
  try {
    console.log(`🏆 Checking achievements for user ${userId}, trigger: ${trigger}`);
    
    // Get user's unlocked achievements
    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
      
    if (achievementsError) throw achievementsError;
    
    // Get all available achievements
    const { data: allAchievements, error: allAchievementsError } = await supabase
      .from('achievements')
      .select('*');
      
    if (allAchievementsError) throw allAchievementsError;
    
    // Get unlocked achievement IDs
    const unlockedAchievementIds = userAchievements.map(a => a.achievement_id);
    
    // Track newly awarded achievements
    const newAchievements = [];
    let totalPointsEarned = 0;
    
    // Helper function to add points
    const addPoints = (points) => {
      totalPointsEarned += points;
    };
    
    // Check city-related achievements
    await checkCityAchievements(userId, unlockedAchievementIds, allAchievements, newAchievements, addPoints);
    
    // Check mission-related achievements
    if (trigger === 'MISSION_COMPLETED' || trigger === 'CHECK_ALL') {
      await checkMissionAchievements(userId, unlockedAchievementIds, allAchievements, newAchievements, addPoints);
    }
    
    // Update user score if points were earned
    if (totalPointsEarned > 0) {
      await updateUserScore(userId, totalPointsEarned);
    }
    
    return {
      newAchievements,
      pointsEarned: totalPointsEarned
    };
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
};

/**
 * Check city-related achievements
 */
async function checkCityAchievements(userId, unlockedAchievementIds, allAchievements, newAchievements, addPoints) {
  try {
    // Get user's visited cities
    const { data: userCities, error: citiesError } = await supabase
      .from('user_cities')
      .select('city_id')
      .eq('user_id', userId);
      
    if (citiesError) throw citiesError;
    
    // Get the actual city data to verify they are real cities in our database
    const cityIds = userCities.map(uc => uc.city_id);
    
    if (cityIds.length > 0) {
      const { data: validCities, error: validCitiesError } = await supabase
        .from('cities')
        .select('id, name')
        .in('id', cityIds);
        
      if (validCitiesError) throw validCitiesError;
      
      // Only count cities that actually exist in our database
      const validCityIds = validCities.map(city => city.id);
      const uniqueValidCityCount = new Set(validCityIds).size;
      
      console.log(`👤 User has visited ${uniqueValidCityCount} valid cities`);
      
      // Check "Primera parada" achievement - first city visited
      await checkSingleAchievement(
        LOGROS.PRIMERA_CIUDAD,
        uniqueValidCityCount >= 1,
        userId,
        unlockedAchievementIds,
        allAchievements,
        newAchievements,
        addPoints
      );
      
      // Check "Trotamundos" achievement - 5 different cities
      await checkSingleAchievement(
        LOGROS.TROTAMUNDOS,
        uniqueValidCityCount >= 5,
        userId,
        unlockedAchievementIds,
        allAchievements,
        newAchievements,
        addPoints
      );
    }
  } catch (error) {
    console.error('Error checking city achievements:', error);
    throw error;
  }
}

/**
 * Check a single achievement and award it if conditions are met
 */
async function checkSingleAchievement(
  achievementCode,
  conditionMet,
  userId,
  unlockedAchievementIds,
  allAchievements,
  newAchievements,
  addPoints
) {
  try {
    // Find the achievement in the database
    const achievement = allAchievements.find(a => a.code === achievementCode);
    
    if (!achievement) {
      console.warn(`Achievement with code ${achievementCode} not found`);
      return false;
    }
    
    // Check if already unlocked
    if (unlockedAchievementIds.includes(achievement.id)) {
      return false; // Already unlocked
    }
    
    // Check if condition is met
    if (conditionMet) {
      // Award the achievement
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });
        
      if (error) {
        console.error(`Error awarding achievement ${achievementCode}:`, error);
        return false;
      }
      
      // Add to new achievements list
      newAchievements.push(achievement);
      
      // Add points
      addPoints(achievement.points || 0);
      
      console.log(`🏆 Achievement unlocked: ${achievement.title} (+${achievement.points} points)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking achievement ${achievementCode}:`, error);
    return false;
  }
}

/**
 * Update user's score with achievement points
 */
async function updateUserScore(userId, pointsToAdd) {
  try {
    // Get current score
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('score')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    const currentScore = userData?.score || 0;
    const newScore = currentScore + pointsToAdd;
    
    // Update score
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ score: newScore })
      .eq('id', userId);
      
    if (updateError) throw updateError;
    
    console.log(`👤 User score updated: ${currentScore} → ${newScore} (+${pointsToAdd})`);
    return newScore;
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  }
}

// Add this function to your logrocontroller.js file
export const getAllAchievements = async (req, res) => {
  try {
    console.log("📊 Obteniendo todos los logros disponibles");
    
    // Get all achievements from the database
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*');
      
    if (error) throw error;
    
    console.log(`✅ ${achievements.length} logros encontrados`);
    res.status(200).json(achievements);
  } catch (error) {
    console.error("❌ Error al obtener logros:", error.message);
    res.status(500).json({ 
      message: "Error al obtener logros", 
      error: error.message 
    });
  }
};