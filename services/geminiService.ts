import { GoogleGenAI, Type } from "@google/genai";
import { RecipeSuggestion } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "El nombre creativo y atractivo de la receta."
        },
        ingredients: {
            type: Type.ARRAY,
            description: "Una lista de todos los ingredientes necesarios para la receta, incluyendo cantidades.",
            items: {
                type: Type.STRING
            }
        },
        steps: {
            type: Type.ARRAY,
            description: "Una guía paso a paso para preparar y cocinar el plato.",
            items: {
                type: Type.STRING
            }
        },
    },
    required: ['title', 'ingredients', 'steps']
};

export const suggestRecipe = async (prompt: string): Promise<RecipeSuggestion> => {
    try {
        const fullPrompt = `Eres un chef creativo dentro de un recetario digital hecho con amor. Tu nombre es Asistente de Gaba. Tu objetivo es proporcionar una receta maravillosa basada en la solicitud del usuario. Sé cálido y alentador en tus respuestas.
        Solicitud del usuario: "${prompt}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        // Basic validation
        if (!parsedJson.title || !Array.isArray(parsedJson.ingredients) || !Array.isArray(parsedJson.steps)) {
            throw new Error("Invalid recipe format received from API.");
        }

        return parsedJson as RecipeSuggestion;
    } catch (error) {
        console.error("Error fetching recipe from Gemini API:", error);
        throw new Error("Lo siento, tuve problemas para crear una receta. ¡Por favor, inténtalo de nuevo!");
    }
};