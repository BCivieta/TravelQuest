import { supabase } from '../config/supabaseClient.js';
import { generateChallengeRoute } from '../ia/generateChallengeRoute.js';

/**
 * GET /api/retos/activo
 */
export const getActiveChallenge = async (req, res) => {
  const userId = req.user?.id;

  try {
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('created_by', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (challengeError) throw challengeError;
    if (!challenge) return res.status(404).json({ message: 'No hay reto activo' });

    const { data: missionsData, error: missionsError } = await supabase
      .from('user_missions')
      .select(`
        mission_id,
        status,
        completed_at,
        missions ( id, title, difficulty, created_at )
      `)
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id);

    if (missionsError) throw missionsError;

    const missions = missionsData.map(m => ({
      id: m.missions.id,
      title: m.missions.title,
      difficulty: m.missions.difficulty,
      created_at: m.missions.created_at,
      completed_at: m.completed_at,
      status: m.status,
    }));

    res.status(200).json({ id: challenge.id, missions });
  } catch (error) {
    console.error("❌ Error al obtener reto activo:", error.message);
    res.status(500).json({ message: "Error al obtener reto activo" });
  }
};

/**
 * POST /api/retos/generar
 */
export const generateChallengeWithMissions = async (req, res) => {
  const userId = req.user?.id;
  const { cityId, totalMissions } = req.body;

  if (!userId || !cityId || !totalMissions) {
    return res.status(400).json({ message: "Faltan parámetros necesarios" });
  }

  try {
    const { data: active, error: activeError } = await supabase
      .from('challenges')
      .select('id')
      .eq('created_by', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeError) throw activeError;
    if (active) return res.status(409).json({ message: "Ya tienes un reto activo" });

    const { data: cityData, error: cityError } = await supabase
      .from("cities")
      .select("name")
      .eq("id", cityId)
      .single();
    if (cityError) throw cityError;
    const nombreCiudad = cityData.name;

    const { data: reto, error: retoError } = await supabase
      .from('challenges')
      .insert([{ 
        title: `Reto en ${nombreCiudad}`, 
        city_id: cityId, 
        created_by: userId,
        status: 'active' // ✅ Nuevo campo
      }])
      .select()
      .single();

    if (retoError || !reto) throw retoError;

    const iaMissions = await generateChallengeRoute(nombreCiudad, totalMissions);
    if (!Array.isArray(iaMissions)) throw new Error("La IA no devolvió un array válido de misiones");

    const misionesCreadas = [];

    for (const mision of iaMissions) {
      const dificultadMap = { facil: 1, media: 3, dificil: 5 };
      const dificultad = dificultadMap[mision.difficulty] || 3;
      console.log("🧾 Datos misión a insertar:", {
    city_id: cityId,
    title: mision.title,
    description: mision.description,
    difficulty: dificultad,
    keywords: mision.keywords,
    nombre_objeto: mision.nombre_objeto,
    historia: mision.historia,
  });
      const { data: m, error: mError } = await supabase
        .from('missions')
        .insert([{
          city_id: cityId,
          title: mision.title,
          description: mision.description,
          difficulty: dificultad,
          keywords: mision.keywords,
          nombre_objeto: mision.nombre_objeto,
          historia: mision.historia,
        }])
        .select()
        .single();

      if (mError) {
      console.error("❌ Error insertando misión:", mError.details || mError.message || mError);
      continue; // evita que la app reviente si una misión falla
    }

      const { error: umError } = await supabase
        .from('user_missions')
        .insert([{
          user_id: userId,
          mission_id: m.id,
          challenge_id: reto.id,
        }]);

      if (umError) {
      console.error("❌ Error insertando en user_missions:", umError.details || umError.message || umError);
      continue;
    }
      misionesCreadas.push(m);
    }

    res.status(201).json({ id: reto.id, missions: misionesCreadas });
  } catch (error) {
    console.error("❌ Error generando reto:", error.message);
    res.status(500).json({ message: "Error al generar reto", error: error.message });
  }
};

/**
 * POST /api/retos/:id/finalizar
 */
export const completeChallenge = async (req, res) => {
  const userId = req.user?.id;
  const challengeId = req.params.id;

  try {
    const { error } = await supabase
      .from('challenges')
      .update({ 
        completed_at: new Date().toISOString(),
        status: 'completed' // ✅ Estado actualizado
      })
      .eq('id', challengeId)
      .eq('created_by', userId);

    if (error) throw error;

    res.status(200).json({ message: "Reto finalizado correctamente" });
  } catch (error) {
    console.error("❌ Error al finalizar reto:", error.message);
    res.status(500).json({ message: "No se pudo finalizar el reto" });
  }
};

/**
 * DELETE /api/retos/activo
 */
export const discardActiveChallenge = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "No autenticado" });

  try {
    const { error } = await supabase
      .from("challenges")
      .update({ 
        completed_at: new Date().toISOString(),
        status: 'discarded' // ✅ Estado actualizado
      })
      .eq("created_by", userId)
      .eq("status", "active");

    if (error) throw error;

    res.status(200).json({ message: "Reto descartado correctamente" });
  } catch (error) {
    console.error("❌ Error descartando reto:", error.message);
    res.status(500).json({ message: "Error al descartar reto" });
  }
};
