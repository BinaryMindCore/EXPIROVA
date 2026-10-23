import Tesseract from "tesseract.js";
import fs from "fs";

/**
 * Common Consumer Brand Dictionary across FMCG, Personal Care, Groceries & Pharmaceuticals
 */
const BRAND_DICTIONARY = [
  // Hair & Personal Care
  { name: "Sunsilk", brand: "Sunsilk", category: "Hair Care", defaultType: "Shampoo", storage: "Bathroom Shelf" },
  { name: "Dove", brand: "Dove", category: "Personal Care", defaultType: "Shampoo / Body Wash", storage: "Bathroom Shelf" },
  { name: "Tresemme", brand: "Tresemme", category: "Hair Care", defaultType: "Shampoo", storage: "Bathroom Shelf" },
  { name: "Pantene", brand: "Pantene", category: "Hair Care", defaultType: "Shampoo", storage: "Bathroom Shelf" },
  { name: "Head & Shoulders", brand: "Head & Shoulders", category: "Hair Care", defaultType: "Anti-Dandruff Shampoo", storage: "Bathroom Shelf" },
  { name: "L'Oreal", brand: "L'Oreal", category: "Hair Care", defaultType: "Hair Care Product", storage: "Bathroom Shelf" },
  { name: "Garnier", brand: "Garnier", category: "Hair Care", defaultType: "Shampoo / Hair Color", storage: "Bathroom Shelf" },
  { name: "Nivea", brand: "Nivea", category: "Skin Care", defaultType: "Body Lotion", storage: "Bathroom Shelf" },
  { name: "Vaseline", brand: "Vaseline", category: "Skin Care", defaultType: "Body Lotion / Petroleum Jelly", storage: "Bathroom Shelf" },
  { name: "Pond's", brand: "Pond's", category: "Skin Care", defaultType: "Face Cream / Wash", storage: "Bathroom Shelf" },
  { name: "Himalaya", brand: "Himalaya", category: "Personal Care", defaultType: "Herbal Care", storage: "Bathroom Shelf" },
  { name: "Colgate", brand: "Colgate", category: "Personal Care", defaultType: "Toothpaste", storage: "Bathroom Shelf" },
  { name: "Dettol", brand: "Dettol", category: "Personal Care", defaultType: "Antiseptic Liquid / Soap", storage: "Bathroom Shelf" },
  { name: "Lifebuoy", brand: "Lifebuoy", category: "Personal Care", defaultType: "Soap / Sanitizer", storage: "Bathroom Shelf" },
  { name: "Pears", brand: "Pears", category: "Personal Care", defaultType: "Glycerine Soap", storage: "Bathroom Shelf" },
  { name: "Fiama", brand: "Fiama", category: "Personal Care", defaultType: "Shower Gel", storage: "Bathroom Shelf" },
  { name: "Lux", brand: "Lux", category: "Personal Care", defaultType: "Beauty Soap", storage: "Bathroom Shelf" },

  // Food & Grocery
  { name: "Amul", brand: "Amul", category: "Food & Grocery", defaultType: "Butter / Dairy", storage: "Refrigerator" },
  { name: "Nutella", brand: "Ferrero", category: "Food & Grocery", defaultType: "Hazelnut Cocoa Spread", storage: "Pantry" },
  { name: "Britannia", brand: "Britannia", category: "Food & Grocery", defaultType: "Biscuits / Cookies", storage: "Pantry" },
  { name: "Nestle", brand: "Nestle", category: "Food & Grocery", defaultType: "Food Product", storage: "Pantry" },
  { name: "Maggi", brand: "Nestle", category: "Food & Grocery", defaultType: "2-Minute Noodles", storage: "Pantry" },
  { name: "Lay's", brand: "PepsiCo", category: "Food & Grocery", defaultType: "Potato Chips", storage: "Pantry" },
  { name: "Kurkure", brand: "PepsiCo", category: "Food & Grocery", defaultType: "Crispy Snacks", storage: "Pantry" },
  { name: "Cadbury", brand: "Mondelez", category: "Food & Grocery", defaultType: "Dairy Milk Chocolate", storage: "Pantry" },
  { name: "Oreo", brand: "Mondelez", category: "Food & Grocery", defaultType: "Sandwich Cookies", storage: "Pantry" },
  { name: "Parle", brand: "Parle", category: "Food & Grocery", defaultType: "Glucose Biscuits", storage: "Pantry" },
  { name: "Aashirvaad", brand: "ITC", category: "Food & Grocery", defaultType: "Whole Wheat Atta", storage: "Pantry" },
  { name: "Tata Sampann", brand: "Tata", category: "Food & Grocery", defaultType: "Pulses / Spices", storage: "Pantry" },
  { name: "Fortune", brand: "Adani Wilmar", category: "Food & Grocery", defaultType: "Refined Oil", storage: "Pantry" },
  { name: "Saffola", brand: "Marico", category: "Food & Grocery", defaultType: "Cooking Oil", storage: "Pantry" },
  { name: "Epigamia", brand: "Epigamia", category: "Food & Grocery", defaultType: "Greek Yogurt", storage: "Refrigerator" },

  // Beverages
  { name: "Coca-Cola", brand: "The Coca-Cola Company", category: "Beverage", defaultType: "Soft Drink", storage: "Refrigerator" },
  { name: "Pepsi", brand: "PepsiCo", category: "Beverage", defaultType: "Cola", storage: "Refrigerator" },
  { name: "Sprite", brand: "The Coca-Cola Company", category: "Beverage", defaultType: "Lemon-Lime Soda", storage: "Refrigerator" },
  { name: "Thums Up", brand: "The Coca-Cola Company", category: "Beverage", defaultType: "Charged Cola", storage: "Refrigerator" },
  { name: "Red Bull", brand: "Red Bull", category: "Beverage", defaultType: "Energy Drink", storage: "Refrigerator" },
  { name: "Tropicana", brand: "PepsiCo", category: "Beverage", defaultType: "Fruit Juice", storage: "Refrigerator" },
  { name: "Real", brand: "Dabur", category: "Beverage", defaultType: "Fruit Power Juice", storage: "Refrigerator" },
  { name: "Tata Tea", brand: "Tata Consumer", category: "Beverage", defaultType: "Premium Tea", storage: "Pantry" },
  { name: "Nescafe", brand: "Nestle", category: "Beverage", defaultType: "Classic Coffee", storage: "Pantry" },
  { name: "Red Label", brand: "Brooke Bond", category: "Beverage", defaultType: "Black Tea", storage: "Pantry" },

  // Medicines
  { name: "Crocin", brand: "GSK", category: "Medicine", defaultType: "Pain & Fever Relief", storage: "Medicine Cabinet" },
  { name: "Dolo", brand: "Micro Labs", category: "Medicine", defaultType: "650mg Paracetamol", storage: "Medicine Cabinet" },
  { name: "Calpol", brand: "GSK", category: "Medicine", defaultType: "Pediatric Suspension", storage: "Medicine Cabinet" },
  { name: "Combiflam", brand: "Sanofi", category: "Medicine", defaultType: "Ibuprofen & Paracetamol", storage: "Medicine Cabinet" },
  { name: "Vicks", brand: "P&G", category: "Medicine", defaultType: "Vaporub / Cough Drops", storage: "Medicine Cabinet" },
  { name: "Strepsils", brand: "Reckitt", category: "Medicine", defaultType: "Sore Throat Lozenges", storage: "Medicine Cabinet" },
  { name: "Benadryl", brand: "J&J", category: "Medicine", defaultType: "Cough Formula", storage: "Medicine Cabinet" },
  { name: "Augmentin", brand: "GSK", category: "Medicine", defaultType: "Amoxicillin & Clavulanate", storage: "Medicine Cabinet" },
  { name: "Allegra", brand: "Sanofi", category: "Medicine", defaultType: "Fexofenadine 120mg", storage: "Medicine Cabinet" },
  { name: "Digene", brand: "Abbott", category: "Medicine", defaultType: "Antacid Gel / Tablets", storage: "Medicine Cabinet" },
  { name: "Eno", brand: "GSK", category: "Medicine", defaultType: "Fruit Salt Fast Antacid", storage: "Medicine Cabinet" },

  // Household
  { name: "Surf Excel", brand: "HUL", category: "Household", defaultType: "Laundry Detergent", storage: "Storage Closet" },
  { name: "Ariel", brand: "P&G", category: "Household", defaultType: "Detergent Powder / Pods", storage: "Storage Closet" },
  { name: "Vim", brand: "HUL", category: "Household", defaultType: "Dishwash Gel / Bar", storage: "Storage Closet" },
  { name: "Lizol", brand: "Reckitt", category: "Household", defaultType: "Disinfectant Floor Cleaner", storage: "Storage Closet" },
  { name: "Colin", brand: "Reckitt", category: "Household", defaultType: "Glass & Surface Cleaner", storage: "Storage Closet" },
  { name: "Harpic", brand: "Reckitt", category: "Household", defaultType: "Toilet Cleaner", storage: "Storage Closet" },
];

/**
 * Parse OCR text from packaging image to extract product details, category & dates
 */
export async function parseProductFromImageOcr(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      return { detected: false, message: "Image file not found." };
    }

    const { data } = await Tesseract.recognize(imagePath, "eng", {
      logger: () => {},
    });

    const rawText = data.text || "";
    const cleanLines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    if (cleanLines.length === 0) {
      return {
        detected: false,
        message: "No readable text detected on packaging. Please ensure good lighting and focus on the label.",
      };
    }

    const fullLower = rawText.toLowerCase();

    // 1. Identify Brand & Category
    let detectedBrand = null;
    let matchedItem = null;

    for (const entry of BRAND_DICTIONARY) {
      const regex = new RegExp(`\\b${entry.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (regex.test(rawText)) {
        detectedBrand = entry.brand;
        matchedItem = entry;
        break;
      }
    }

    // 2. Identify Product Subtitle / Variant (e.g. Stunning Black Shine, Hazelnut, Aloe Vera)
    let productTitle = "";
    let category = "Personal Care";
    let storageSuggestion = "Bathroom Shelf";

    if (matchedItem) {
      category = matchedItem.category;
      storageSuggestion = matchedItem.storage;

      // Extract surrounding descriptor words (e.g., Stunning Black Shine, Intense Repair, Moisture)
      const descriptorKeywords = [
        "stunning black shine",
        "black shine",
        "thick & long",
        "hair fall",
        "anti dandruff",
        "daily shine",
        "intense repair",
        "smooth & silky",
        "deep moisture",
        "aloe vera",
        "nourishing",
        "hazelnut cocoa spread",
        "whole wheat",
        "pure butter",
        "chocolate",
        "crunchy",
        "creamy",
        "lemon fresh",
        "antibacterial",
        "650mg",
        "500mg",
        "extra relief",
      ];

      let foundDesc = "";
      for (const d of descriptorKeywords) {
        if (fullLower.includes(d)) {
          foundDesc = d
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          break;
        }
      }

      // Check product type suffix
      let pType = matchedItem.defaultType;
      if (fullLower.includes("shampoo")) pType = "Shampoo";
      else if (fullLower.includes("conditioner")) pType = "Conditioner";
      else if (fullLower.includes("body wash")) pType = "Body Wash";
      else if (fullLower.includes("lotion")) pType = "Body Lotion";
      else if (fullLower.includes("face wash")) pType = "Face Wash";
      else if (fullLower.includes("soap")) pType = "Soap";
      else if (fullLower.includes("butter")) pType = "Butter";
      else if (fullLower.includes("spread")) pType = "Spread";
      else if (fullLower.includes("noodles")) pType = "Noodles";
      else if (fullLower.includes("juice")) pType = "Juice";
      else if (fullLower.includes("tea")) pType = "Tea";

      productTitle = foundDesc
        ? `${matchedItem.name} ${foundDesc} ${pType}`
        : `${matchedItem.name} ${pType}`;
    } else {
      // Dynamic fallback based on prominent label lines
      const titleCandidate = cleanLines.slice(0, 3).find((line) => line.length > 4 && !line.includes("EXP") && !line.includes("MFG"));
      productTitle = titleCandidate || cleanLines[0];

      // Classify category from keywords
      if (/\b(shampoo|conditioner|hair|scalp|oil)\b/i.test(fullLower)) {
        category = "Hair Care";
        storageSuggestion = "Bathroom Shelf";
      } else if (/\b(lotion|cream|moistur|skin|face|serum)\b/i.test(fullLower)) {
        category = "Skin Care";
        storageSuggestion = "Bathroom Shelf";
      } else if (/\b(soap|wash|bath|dental|tooth|deodorant|perfume)\b/i.test(fullLower)) {
        category = "Personal Care";
        storageSuggestion = "Bathroom Shelf";
      } else if (/\b(biscuit|noodle|rice|pasta|snack|cookie|butter|food|flour|oil|sauce|salt|sugar)\b/i.test(fullLower)) {
        category = "Food & Grocery";
        storageSuggestion = "Pantry";
      } else if (/\b(juice|drink|cola|soda|tea|coffee|milk|water|beverage)\b/i.test(fullLower)) {
        category = "Beverage";
        storageSuggestion = "Refrigerator";
      } else if (/\b(tablet|capsule|syrup|paracetamol|dolo|pharma|medicine|mg|ml|fever|relief)\b/i.test(fullLower)) {
        category = "Medicine";
        storageSuggestion = "Medicine Cabinet";
      } else if (/\b(cleaner|detergent|dish|floor|wash|bleach)\b/i.test(fullLower)) {
        category = "Household";
        storageSuggestion = "Storage Closet";
      } else {
        category = "Personal Care";
        storageSuggestion = "Bathroom Shelf";
      }
    }

    // 3. Extract Expiry & Manufacturing Dates
    const { expiryDate, barcode } = parsePackagingDates(cleanLines, rawText);

    return {
      detected: true,
      product_name: productTitle.trim(),
      brand: detectedBrand || (matchedItem?.brand || productTitle.split(" ")[0]),
      category: category,
      barcode: barcode,
      expiry_date: expiryDate,
      storage_suggestion: storageSuggestion,
      confidence: matchedItem ? 0.94 : 0.85,
      engine: "Local OCR Neural Parser",
    };
  } catch (err) {
    console.warn("OCR Label Parsing failed:", err.message);
    return {
      detected: false,
      message: "Could not read packaging text. Please adjust lighting and try again.",
    };
  }
}

/**
 * Extracts and calculates ISO Expiry Date and Barcode numbers from packaging OCR
 */
function parsePackagingDates(lines, fullText) {
  let expiryDate = null;
  let barcode = null;

  // 1. Detect Barcode digits (8 to 14 numbers)
  const barcodeMatch = fullText.match(/\b([0-9]{8,14})\b/);
  if (barcodeMatch) {
    barcode = barcodeMatch[1];
  }

  // 2. Direct EXP / USE BY / BEST BEFORE pattern:
  // e.g. EXP 08/27, EXP 08/2027, EXP: 15/04/2026, USE BY 12/28, B.No 449 EXP 05/2027
  const expRegex = /(?:EXP|EXPIRY|USE\s*BY|BEST\s*BEFORE)[\s.:/–-]*([0-9]{1,2})[\s/.-]([0-9]{2,4})/i;
  const expFullRegex = /(?:EXP|EXPIRY|USE\s*BY|BEST\s*BEFORE)[\s.:/–-]*([0-9]{1,2})[\s/.-]([0-9]{1,2})[\s/.-]([0-9]{2,4})/i;

  const fullExpMatch = fullText.match(expFullRegex);
  if (fullExpMatch) {
    let day = parseInt(fullExpMatch[1], 10);
    let month = parseInt(fullExpMatch[2], 10);
    let year = parseInt(fullExpMatch[3], 10);
    if (year < 100) year += 2000;
    expiryDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  } else {
    const monthYearMatch = fullText.match(expRegex);
    if (monthYearMatch) {
      let month = parseInt(monthYearMatch[1], 10);
      let year = parseInt(monthYearMatch[2], 10);
      if (year < 100) year += 2000;
      // Last day of month
      const lastDay = new Date(year, month, 0).getDate();
      expiryDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
  }

  // 3. Dynamic Calculation: MFG Date + "Best before X months"
  if (!expiryDate) {
    const mfgRegex = /(?:MFG|MFD|MANUFACTURED|PKD)[\s.:/–-]*([0-9]{1,2})[\s/.-]([0-9]{2,4})/i;
    const shelfLifeRegex = /(?:BEST\s*BEFORE|USE\s*WITHIN)[\s.:-]*([0-9]{1,2})\s*MONTHS?/i;

    const mfgMatch = fullText.match(mfgRegex);
    const shelfMatch = fullText.match(shelfLifeRegex);

    if (mfgMatch) {
      let mfgMonth = parseInt(mfgMatch[1], 10);
      let mfgYear = parseInt(mfgMatch[2], 10);
      if (mfgYear < 100) mfgYear += 2000;
      const shelfMonths = shelfMatch ? parseInt(shelfMatch[1], 10) : 24; // standard 24 months default for personal care

      const targetDate = new Date(mfgYear, mfgMonth - 1 + shelfMonths + 1, 0);
      const resYear = targetDate.getFullYear();
      const resMonth = String(targetDate.getMonth() + 1).padStart(2, "0");
      const resDay = String(targetDate.getDate()).padStart(2, "0");
      expiryDate = `${resYear}-${resMonth}-${resDay}`;
    }
  }

  return { expiryDate, barcode };
}
