import { supabase } from '../config/supabaseClient.js';

export const LOGROS = {
  PRIMERA_CIUDAD: 'primera_ciudad',
  TROTAMUNDOS: 'trotamundos',
  PRIMERA_MISION: 'primera_mision',
  MISION_FACIL: 'mision_facil',
  MISION_MEDIA: 'mision_media',
  MISION_DIFICIL: 'mision_dificil',
  DIEZ_MISIONES: 'diez_misiones',
  CIEN_MISIONES: 'cien_misiones',
  PRIMERA_PARADA: 'primera_parada',
  MOCHILERO: 'primer_viaje',
  EXPLORADOR_EXPERTO: 'cinco_viajes',
  MARATON_MISIONES: 'maraton_misiones'
};

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

export const checkAndAwardAchievements = async (userId, trigger = 'GENERAL') => {
  try {
    console.log(`🏁 Iniciando revisión de logros para el usuario ${userId}`);
    console.log("🎯 Trigger recibido:", trigger);

    const { data: userAchievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
    if (achievementsError) throw achievementsError;

    const { data: allAchievements, error: allAchievementsError } = await supabase
      .from('achievements')
      .select('*');
    if (allAchievementsError) throw allAchievementsError;

    const unlockedAchievementIds = userAchievements.map(a => a.achievement_id);
    const newAchievements = [];
    let totalPointsEarned = 0;
    const addPoints = (points) => totalPointsEarned += points;

    await checkCityAchievements(userId, unlockedAchievementIds, allAchievements, newAchievements, addPoints);
    await checkMissionAchievements(userId, unlockedAchievementIds, allAchievements, newAchievements, addPoints);
    await checkTravelAchievements(userId, unlockedAchievementIds, allAchievements, newAchievements, addPoints);

    if (totalPointsEarned > 0) {
      await updateUserScore(userId, totalPointsEarned);
    }

    return { newAchievements, pointsEarned: totalPointsEarned };
  } catch (error) {
    console.error('Error in checkAndAwardAchievements:', error);
    throw error;
  }
};

async function checkCityAchievements(userId, unlockedIds, allAchievements, newAchievements, addPoints) {
  try {
    console.log("📍 Revisando logros de ciudad.");

    await checkSingleAchievement(
      LOGROS.PRIMERA_CIUDAD,
      true,
      userId,
      unlockedIds,
      allAchievements,
      newAchievements,
      addPoints
    );

    const { data: locations, error } = await supabase
      .from('user_locations')
      .select('city_id')
      .eq('user_id', userId);
    if (error) throw error;

    const cityIds = locations.map(l => l.city_id);
    const uniqueCities = new Set(cityIds).size;

    await checkSingleAchievement(
      LOGROS.TROTAMUNDOS,
      uniqueCities >= 5,
      userId,
      unlockedIds,
      allAchievements,
      newAchievements,
      addPoints
    );
  } catch (error) {
    console.error('Error checking city achievements:', error);
    throw error;
  }
}

async function checkMissionAchievements(userId, unlockedIds, allAchievements, newAchievements, addPoints) {
  try {
    const { data: missions, error } = await supabase
      .from('user_missions')
      .select(`
        mission_id,
        completed_at,
        missions (
          difficulty
        )
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null);
    if (error) throw error;

    const difficultyCount = { 1: 0, 3: 0, 5: 0 };
    const completionsByDay = {};

    for (const m of missions) {
      const diff = m.missions?.difficulty;
      if (diff && difficultyCount.hasOwnProperty(diff)) {
        difficultyCount[diff]++;
      }

      const dateKey = new Date(m.completed_at).toISOString().split('T')[0];
      completionsByDay[dateKey] = (completionsByDay[dateKey] || 0) + 1;
    }

    const hasMarathonDay = Object.values(completionsByDay).some(count => count >= 5);

    await checkSingleAchievement(LOGROS.PRIMERA_MISION, missions.length >= 1, userId, unlockedIds, allAchievements, newAchievements, addPoints);
    await checkSingleAchievement(LOGROS.MISION_FACIL, difficultyCount[1] >= 1, userId, unlockedIds, allAchievements, newAchievements, addPoints);
    await checkSingleAchievement(LOGROS.MISION_MEDIA, difficultyCount[3] >= 1, userId, unlockedIds, allAchievements, newAchievements, addPoints);
    await checkSingleAchievement(LOGROS.MISION_DIFICIL, difficultyCount[5] >= 1, userId, unlockedIds, allAchievements, newAchievements, addPoints);
    await checkSingleAchievement(LOGROS.DIEZ_MISIONES, missions.length >= 10, userId, unlockedIds, allAchievements, newAchievements, addPoints);
    await checkSingleAchievement(LOGROS.CIEN_MISIONES, missions.length >= 100, userId, unlockedIds, allAchievements, newAchievements, addPoints);
    await checkSingleAchievement(LOGROS.MARATON_MISIONES, hasMarathonDay, userId, unlockedIds, allAchievements, newAchievements, addPoints);
  } catch (error) {
    console.error('Error checking mission achievements:', error);
    throw error;
  }
}

async function checkTravelAchievements(userId, unlockedIds, allAchievements, newAchievements, addPoints) {
  try {
    const { data: books, error: booksError } = await supabase
      .from('travel_books')
      .select('id')
      .eq('user_id', userId);
    if (booksError) throw booksError;

    const travelBookIds = books.map(book => book.id);
    if (!travelBookIds.length) return;

    const { data: travelDays, error: daysError } = await supabase
      .from('travel_days')
      .select(`
        id,
        travel_date,
        diary_entries (id)
      `)
      .in('travel_book_id', travelBookIds);
    if (daysError) throw daysError;

    const uniqueDatesWithDiaries = new Set(
      travelDays
        .filter(day => (day.diary_entries || []).length > 0)
        .map(day => new Date(day.travel_date).toDateString())
    );

    const totalDaysWithDiaries = uniqueDatesWithDiaries.size;

    await checkSingleAchievement(
      LOGROS.MOCHILERO,
      totalDaysWithDiaries >= 1,
      userId,
      unlockedIds,
      allAchievements,
      newAchievements,
      addPoints
    );

    await checkSingleAchievement(
      LOGROS.EXPLORADOR_EXPERTO,
      totalDaysWithDiaries >= 5,
      userId,
      unlockedIds,
      allAchievements,
      newAchievements,
      addPoints
    );
  } catch (error) {
    console.error('❌ Error checking travel achievements:', error);
    throw error;
  }
}

async function checkSingleAchievement(code, conditionMet, userId, unlockedIds, allAchievements, newAchievements, addPoints) {
  try {
    const achievement = allAchievements.find(a => a.code === code);
    if (!achievement || unlockedIds.includes(achievement.id)) return false;

    if (conditionMet) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });
      if (error) throw error;

      newAchievements.push(achievement);
      addPoints(achievement.points || 0);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error al evaluar '${code}':`, error);
    return false;
  }
}

async function updateUserScore(userId, pointsToAdd) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('score')
      .eq('id', userId)
      .single();
    if (error) throw error;

    const currentScore = data?.score || 0;
    const newScore = currentScore + pointsToAdd;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ score: newScore })
      .eq('id', userId);
    if (updateError) throw updateError;

    console.log(`📊 Score actualizado: ${currentScore} → ${newScore} (+${pointsToAdd})`);
    return newScore;
  } catch (error) {
    console.error('Error actualizando el score:', error);
    throw error;
  }
}
