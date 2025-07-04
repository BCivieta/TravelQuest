import { supabase } from '../config/supabase.js';
import { LOGROS } from '../controllers/logroController.js'; // Add this import

/**
 * Registro de usuario con Supabase Auth
 */
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1. Registro con Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw new Error(signUpError.message || "Error registrando usuario");

    // 2. Login inmediato
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) throw new Error(loginError.message || "Error al iniciar sesión");

    const userId = loginData?.user?.id;
    if (!userId) throw new Error("No se pudo obtener el ID del usuario");

    // ✅ 3. Verificar si el perfil ya existe
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileLookupError) {
      throw new Error(profileLookupError.message || "Error verificando perfil existente");
    }

    // 🧱 Si no existe, lo insertamos
    if (!existingProfile) {
      const { error: profileInsertError } = await supabase
        .from("profiles")
        .insert([{ id: userId, username, score: 0 }]); // Initialize score to 0

      if (profileInsertError) {
        throw new Error(profileInsertError.message || "Error insertando perfil");
      }
      
      // Award first achievement (PRIMERA_CIUDAD)
      try {
        console.log("🏆 Otorgando primer logro al usuario:", userId);
        
        const { error: achievementError } = await supabase
          .from("user_achievements")
          .insert({
            user_id: userId,
            achievement_id: LOGROS.PRIMERA_CIUDAD,
            unlocked_at: new Date().toISOString()
          });
          
        if (achievementError) {
          console.error("❌ Error al otorgar primer logro:", achievementError);
        } else {
          console.log("✅ Primer logro otorgado correctamente");
          
          // Update user score
          const { data: achievementData } = await supabase
            .from('achievements')
            .select('points')
            .eq('id', LOGROS.PRIMERA_CIUDAD)
            .single();
            
          if (achievementData) {
            await supabase
              .from('profiles')
              .update({ score: achievementData.points })
              .eq('id', userId);
          }
        }
      } catch (achievementError) {
        console.error("❌ Error al procesar logros:", achievementError);
        // Continue with registration even if achievement fails
      }
    }

    // 4. Devolver token
    res.status(201).json({
      token: loginData.session.access_token, 
      userId: loginData.user.id 
    });

  } catch (error) {
    console.error("❌ Error en el registro:", error.message || error);
    res.status(500).json({ error: error.message || "Error inesperado en el servidor" });
  }
};

  

/**
 * Inicio de sesión con Supabase Auth
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;
         // Asegurarse de que hay sesión válida
        if (!data.session) {
            return res.status(401).json({ error: "Sesión no válida" });
        }
        //Devolver token
        res.json({ 
          token: data.session.access_token,
          userId: data.user.id
         });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verificar sesión de usuario con token de Supabase
 */
export const getProfile = async (req, res) => {
    try {
      const token = req.header("Authorization")?.split(" ")[1];
  
      if (!token) {
        return res.status(401).json({ error: "Token no proporcionado" });
      }
  
      // Obtener usuario desde Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData?.user) throw authError || new Error("Usuario no encontrado");
  
      const userId = authData.user.id;
  
      // Obtener el username desde la tabla 'profiles'
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
  
      if (profileError) throw profileError;
  
      // Devolver ambos
      res.json({
        user: authData.user,
        profile: {
          username: profileData.username,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

/**
 * Cerrar sesión de usuario
 */
export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Sesión cerrada (token debe eliminarse en frontend)" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Actualizar perfil
 */
export const updateProfile = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.updateUser({
            email,
            password
        });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
