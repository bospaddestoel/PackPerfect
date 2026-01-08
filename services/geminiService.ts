
import { GoogleGenAI, Type } from "@google/genai";
import { CategoryDef } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generatePackingSuggestions = async (holidayType: string, categories: CategoryDef[]) => {
  const categoryNames = categories.map(c => c.name).join(', ');
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a packing list for a ${holidayType} holiday. Categorize items ONLY into these categories: ${categoryNames}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              categoryName: { type: Type.STRING, description: `Must be exactly one of: ${categoryNames}` }
            },
            required: ["name", "categoryName"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
};
