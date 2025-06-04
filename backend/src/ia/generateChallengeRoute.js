import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const DIFICULTAD_POR_CANTIDAD = {
  5:    { facil: 1, media: 3, dificil: 1 },
  10:   { facil: 3, media: 4, dificil: 3 },
  15:   { facil: 3, media: 7, dificil: 5 },
};

export const generateChallengeRoute = async (city, cantidad) => {
  const modelo = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const distribucion = DIFICULTAD_POR_CANTIDAD[cantidad];
  if (!distribucion) throw new Error("Cantidad de misiones no válida (solo 5, 10 o 15)");

  const prompt = `
Eres un guía turístico profesional. Diseña una ruta de ${cantidad} misiones para explorar la ciudad de ${city}, en una sola zona urbana (ej: casco antiguo, barrio moderno, entorno de una avenida principal...).

👉 La ruta debe seguir un camino lógico y realista: como si el usuario caminara de un punto a otro. No debe haber idas y vueltas. Cada punto debe estar cerca del anterior (menos de 5-10 minutos a pie).

🎯 Asigna estas dificultades, en orden mezclado:
- Fácil: ${distribucion.facil}
- Media: ${distribucion.media}
- Difícil: ${distribucion.dificil}

📦 Devuelve un array JSON con ${cantidad} objetos en orden de recorrido. Cada misión debe tener esta estructura:

[
  {
    "orden": 1, // posición en la ruta
    "title": "Máximo 8 palabras",
    "description": "Pista clara de lo que se debe buscar y dónde",
    "difficulty": "facil" | "media" | "dificil",
    "keywords": ["clave1", "clave2", ...],
    "nombre_objeto": "Qué se debe fotografiar",
    "historia": "Texto cultural sobre el objeto (250-400 palabras)"
  },
  ...
]

🎨 IMPORTANTE:
- La dificultad debe ajustarse al tipo de pista: fácil si es evidente, difícil si requiere observación o detalle escondido.
- Usa tono cálido, informativo y turístico.
- No hables del usuario ni des instrucciones en la historia.
- NO uses etiquetas tipo \`\`\`, solo devuelve el array JSON puro.
    `;

  try {
    const result = await modelo.generateContent(prompt);
    const response = await result.response;
    const raw = response.text().trim();

    //debug
    console.log("📥 RAW IA:\n", raw);
    const cleaned = raw.replace(/```(json)?/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
  
    console.log("🧼 JSON limpio:\n", cleaned);
    console.log("🔍 Match encontrado:\n", match ? match[0].slice(0, 500) : "❌ Ninguno");
    //debug

    const jsonMatch = raw.replace(/```(json)?/g, "").match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("La IA no devolvió un array válido");

    //debug
   let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch (e) {
      console.error("❌ Error al parsear JSON:\n", match[0]);
      throw new Error("JSON mal formado de la IA");
    }
    //debug

    if (!Array.isArray(parsed)) throw new Error("No es un array");

    const valid = parsed.every(m =>
      typeof m.orden === 'number' &&
      m.title && m.description &&
      ['facil', 'media', 'dificil'].includes(m.difficulty) &&
      Array.isArray(m.keywords) &&
      m.nombre_objeto && m.historia
    );

    if (!valid) throw new Error("Al menos una misión está mal formada");

    return parsed;
  } catch (error) {
    console.error("❌ Error al generar ruta de reto:", error.message);
    throw new Error("No se pudo generar la ruta de misiones");
  }
};
