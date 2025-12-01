import { GoogleGenAI } from "@google/genai";
import { Course } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = 'gemini-2.5-flash';

// Helper to extract JSON from code blocks if necessary
const extractJson = (text: string): any => {
  try {
    // Try parsing directly first
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from markdown code blocks
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON", e2);
        throw new Error("No se pudo interpretar la respuesta del mentor.");
      }
    }
    // Fallback: try finding the first { or [ and the last } or ]
    const start = text.search(/[{[]/);
    // lastIndexOf does not support regex, so we search for both } and ] and take the last one
    const lastCurly = text.lastIndexOf('}');
    const lastSquare = text.lastIndexOf(']');
    const end = Math.max(lastCurly, lastSquare);
    
    if (start !== -1 && end !== -1) {
       try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e3) {
        throw new Error("Formato de respuesta inválido.");
      }
    }
    throw new Error("No se encontró JSON válido en la respuesta.");
  }
};

export const generatePillars = async (topic: string): Promise<string[]> => {
  const prompt = `
    Actúa como un mentor experto en educación y estrategia de contenidos.
    El usuario quiere crear un curso sobre: "${topic}".
    Usa Google Search para identificar tendencias actuales y bases sólidas.
    Genera una lista de 10 "Temas Pilares" (Pillar Topics) fundamentales y amplios derivados de este tema principal.
    
    Devuelve la respuesta estrictamente como un array JSON de strings (ejemplo: ["Tema 1", "Tema 2"]).
    No incluyas texto adicional fuera del JSON.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // responseSchema is NOT allowed with googleSearch, so we rely on prompt engineering for JSON
    }
  });

  return extractJson(response.text || "[]");
};

export const generateVariations = async (pillar: string): Promise<string[]> => {
  const prompt = `
    Actúa como un mentor experto.
    El usuario ha seleccionado el tema pilar: "${pillar}".
    Usa Google Search si es necesario para buscar ángulos interesantes.
    Genera 10 variaciones de lecciones específicas o enfoques únicos para este pilar.
    Deben ser títulos atractivos para una lección o mini-curso.
    
    Devuelve la respuesta estrictamente como un array JSON de strings.
    No incluyas texto adicional fuera del JSON.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  return extractJson(response.text || "[]");
};

export const generateCourse = async (variation: string, pillar: string): Promise<Course> => {
  const prompt = `
    Actúa como un creador de cursos de clase mundial.
    Crea un curso detallado e interactivo para la lección: "${variation}" (parte del pilar "${pillar}").
    El curso debe ser educativo, práctico y visualmente estructurado.
    
    Estructura requerida (JSON):
    {
      "title": "Título atractivo del curso",
      "introduction": "Breve introducción motivadora (2-3 frases)",
      "modules": [
        {
          "title": "Título del Módulo 1",
          "content": "Contenido detallado en formato Markdown (usa negritas, listas, subtítulos). Mínimo 2 párrafos.",
          "imageKeyword": "Una sola palabra en inglés que represente visualmente este módulo (para buscar una imagen)",
          "keyPoints": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
        },
        ... (Genera entre 3 y 4 módulos)
      ],
      "quiz": [
        {
          "question": "¿Pregunta del test?",
          "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
          "correctAnswer": 0 (índice de la respuesta correcta, 0-3)
        },
        ... (Genera 3 preguntas)
      ]
    }

    Usa Google Search para asegurar que la información sea precisa y actual.
    Devuelve SOLAMENTE el JSON dentro de un bloque de código \`\`\`json \`\`\`.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  return extractJson(response.text || "{}");
};