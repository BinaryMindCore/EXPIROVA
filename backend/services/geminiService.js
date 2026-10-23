import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import { parseProductFromImageOcr } from "./ocrLabelParser.js";

/**
 * Universal Category-Agnostic Multimodal Vision AI Extractor
 * Identifies shampoo, cosmetics, food, beverages, and medicine from packaging
 */
export const extractMedicineData = async (imagePath) => {
  return extractProductVisionData(imagePath);
};

export const extractProductVisionData = async (imagePath) => {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  // 1. Primary AI Vision Attempt: Gemini Flash Vision
  if (apiKey && apiKey.length > 15 && !apiKey.includes("your_") && !apiKey.includes("dummy")) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const imageBytes = fs.readFileSync(imagePath);

      const prompt = `Analyze the uploaded product image. 

1. Identify the EXACT product name, brand, and type visible on the front or back label (e.g., "Sunsilk Co-Creations Stunning Black Shine Shampoo", "Amul Butter", "Crocin 650").
2. Determine Category: Choose strictly from ["Personal Care", "Hair Care", "Skin Care", "Food & Grocery", "Medicine", "Household", "Beverage"].
3. Extract Expiry Date:
   - Scan the container (neck, cap, crimp, bottom, or back label) for "EXP", "USE BY", "BEST BEFORE", "B.No", or "MFG + X Months".
   - Convert to standard ISO date (YYYY-MM-DD). If only month/year is given (e.g., 08/27), use the last day of that month (2027-08-31).
   - If only MFG date (e.g., MFG 04/2026) and shelf life (e.g., "Best before 24 months") are stated, calculate the expiry date dynamically.
   - If no expiry date or manufacturing info is found anywhere on the package, return null.

Return ONLY raw JSON (no markdown formatting, no code fences):
{
  "product_name": "Exact Name Found",
  "brand": "Brand Name",
  "category": "Detected Category",
  "barcode": "Detected numbers or null",
  "expiry_date": "YYYY-MM-DD or null",
  "storage_suggestion": "Suggested location based on category (e.g., Bathroom Shelf, Pantry, Refrigerator, Medicine Cabinet)",
  "confidence": 0.95
}`;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBytes.toString("base64"),
                },
              },
              prompt,
            ],
          });

          let text = (response.text || "").trim();
          text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === "object" && parsed.product_name) {
            return {
              detected: true,
              product_name: parsed.product_name,
              brand: parsed.brand || "",
              category: parsed.category || "General Products",
              barcode: parsed.barcode || null,
              expiry_date: parsed.expiry_date || null,
              storage_suggestion: parsed.storage_suggestion || getStorageSuggestion(parsed.category),
              confidence: parsed.confidence || 0.96,
              engine: "Gemini 2.5 Flash Vision",
            };
          }
        } catch (callErr) {
          console.warn(`Gemini Vision attempt ${attempt + 1} warning:`, callErr.message);
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    } catch (genAiErr) {
      console.warn("Gemini Vision AI initialization notice, using local OCR engine:", genAiErr.message);
    }
  }

  // 2. Real Optical Character Recognition (Tesseract OCR & Label Parser)
  console.log("Analyzing product packaging with Tesseract OCR parser...");
  const ocrResult = await parseProductFromImageOcr(imagePath);

  if (ocrResult && ocrResult.detected) {
    return ocrResult;
  }

  // 3. Clean Fail (NEVER return mock Paracetamol or fake data)
  return {
    detected: false,
    message: "No recognizable product name or expiry date found in this image. Please ensure packaging text is visible, avoid glare, and try again.",
  };
};

function getStorageSuggestion(category) {
  switch (category) {
    case "Hair Care":
    case "Skin Care":
    case "Personal Care":
      return "Bathroom Shelf";
    case "Food & Grocery":
      return "Pantry";
    case "Beverage":
      return "Refrigerator";
    case "Medicine":
      return "Medicine Cabinet";
    case "Household":
      return "Storage Closet";
    default:
      return "General Storage";
  }
}