import { Html5Qrcode } from "html5-qrcode";
import API from "../api/axios";

/**
 * Supported 1D and 2D barcode formats for native BarcodeDetector
 */
const SUPPORTED_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "qr_code",
  "data_matrix",
  "itf",
  "codabar",
];

/**
 * Convert a File or Blob into base64 Data URL
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Enhanced Canvas Image Preprocessing Utility
 * Applies contrast enhancement, grayscale, binarization, and rotation sweep
 */
export async function preprocessImageCanvas(file, rotationDegrees = 0, binarize = true) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Handle rotated canvas dimensions (90° / 270° swap width and height)
      if (rotationDegrees === 90 || rotationDegrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.save();
      if (rotationDegrees === 90) {
        ctx.translate(canvas.width, 0);
        ctx.rotate((90 * Math.PI) / 180);
      } else if (rotationDegrees === 180) {
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate((180 * Math.PI) / 180);
      } else if (rotationDegrees === 270) {
        ctx.translate(0, canvas.height);
        ctx.rotate((270 * Math.PI) / 180);
      }

      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // Binarize and enhance contrast for difficult barcode scans
      if (binarize) {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          let sumBrightness = 0;
          for (let i = 0; i < data.length; i += 16) {
            sumBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          const avgBrightness = sumBrightness / (data.length / 16);
          const threshold = Math.min(Math.max(avgBrightness, 90), 160);

          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const v = gray > threshold ? 255 : 0;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn("ImageData binarization skipped:", e);
        }
      }

      resolve(canvas);
    };

    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Primary Pass: Fast Client-Side Barcode Scanning with Rotation Sweep & Preprocessing
 */
export async function scanBarcodeFromFile(file) {
  // Pass 1: Native BarcodeDetector (Direct Bitmap)
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: SUPPORTED_FORMATS });
      const bitmap = await createImageBitmap(file);
      const results = await barcodeDetector.detect(bitmap);
      if (results && results.length > 0 && results[0].rawValue) {
        return results[0].rawValue.trim();
      }
    } catch {
      /* fallback to next scanner */
    }
  }

  // Pass 2: Html5Qrcode Direct
  try {
    let hiddenContainer = document.getElementById("html5-qrcode-hidden-scanner");
    if (!hiddenContainer) {
      hiddenContainer = document.createElement("div");
      hiddenContainer.id = "html5-qrcode-hidden-scanner";
      hiddenContainer.style.position = "absolute";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.top = "-9999px";
      hiddenContainer.style.width = "480px";
      hiddenContainer.style.height = "480px";
      document.body.appendChild(hiddenContainer);
    }

    const html5QrCode = new Html5Qrcode("html5-qrcode-hidden-scanner", { verbose: false });
    const decodedText = await html5QrCode.scanFile(file, true);
    try { await html5QrCode.clear(); } catch { /* ignore cleanup error */ }
    if (decodedText && decodedText.trim()) {
      return decodedText.trim();
    }
  } catch {
    /* fallback to sweep */
  }

  // Pass 3: Preprocessing & Rotation Sweep (0°, 90°, 180°, 270°)
  const angles = [0, 90, 180, 270];
  for (const angle of angles) {
    try {
      const canvas = await preprocessImageCanvas(file, angle, true);
      if (!canvas) continue;

      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: SUPPORTED_FORMATS });
          const results = await barcodeDetector.detect(canvas);
          if (results && results.length > 0 && results[0].rawValue) {
            return results[0].rawValue.trim();
          }
        } catch {
          /* continue to html5 */
        }
      }

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (blob) {
        const prepFile = new File([blob], `rot-${angle}.png`, { type: "image/png" });
        const html5QrCode = new Html5Qrcode("html5-qrcode-hidden-scanner", { verbose: false });
        try {
          const text = await html5QrCode.scanFile(prepFile, true);
          try { await html5QrCode.clear(); } catch { /* ignore */ }
          if (text && text.trim()) {
            return text.trim();
          }
        } catch {
          try { await html5QrCode.clear(); } catch { /* ignore */ }
        }
      }
    } catch (sweepErr) {
      console.warn(`Rotation sweep ${angle}° warning:`, sweepErr);
    }
  }

  return null;
}

/**
 * Secondary Pass: Multimodal Vision AI Fallback
 * Converts image to base64, passes to backend Vision AI endpoint, and parses category-agnostic product details
 */
export async function scanWithVisionAI(file) {
  try {
    const base64Data = await fileToBase64(file);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageBase64", base64Data);

    const res = await API.post("/products/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 15000,
    });

    if (res.data && res.data.detected) {
      const pName = res.data.product_name || res.data.productName;
      const cat = res.data.category || mapCategoryName("", pName);
      const rawExp = res.data.expiry_date || res.data.expiryDate || null;

      return {
        detected: true,
        productName: pName,
        brand: res.data.brand || "",
        category: cat,
        expiryDate: rawExp,
        storageSuggestion: res.data.storage_suggestion || getSuggestedStorage(cat),
        barcode: res.data.barcode || null,
        confidenceScore: Math.round((res.data.confidence || res.data.confidence_score || 0.95) * 100),
        engine: res.data.engine || "Multimodal Vision AI Engine",
      };
    }

    if (res.data && res.data.detected === false) {
      return {
        detected: false,
        message: res.data.message || "No product recognized in this photo. Please ensure label is clear and well-lit.",
      };
    }
  } catch (apiErr) {
    console.warn("Backend Vision AI call failed:", apiErr.message);
  }

  // Clean failure: never inject fake Paracetamol or mock medicine
  return {
    detected: false,
    message: "No recognizable product or packaging text found in this photo. Please ensure good lighting and clear view of label.",
  };
}

/**
 * Scan barcode from an active HTML Video or Canvas element
 */
export async function scanBarcodeFromElement(element) {
  if (typeof window !== "undefined" && "BarcodeDetector" in window && element) {
    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: SUPPORTED_FORMATS });
      const results = await barcodeDetector.detect(element);
      if (results && results.length > 0 && results[0].rawValue) {
        return results[0].rawValue.trim();
      }
    } catch {
      /* ignore detector error */
    }
  }
  return null;
}

/**
 * Universal Multi-Category Barcode Lookup
 * Chains Open Food Facts -> Open Beauty Facts -> UPCItemDB -> Verified Catalog
 */
export async function fetchProductByBarcode(barcode) {
  if (!barcode) return null;
  const cleanBarcode = barcode.trim();

  // 1. Try Backend Proxy (which executes universal multi-database chain)
  try {
    const res = await API.get(`/lookup-barcode?code=${encodeURIComponent(cleanBarcode)}`, {
      timeout: 6000,
    });
    if (res.data && res.data.found) {
      const cat = mapCategoryName(res.data.category, res.data.product_name || res.data.name);
      return {
        found: true,
        barcode: cleanBarcode,
        name: res.data.product_name || res.data.name,
        brand: res.data.brand || "",
        category: cat,
        storageSuggestion: res.data.storage_suggestion || getSuggestedStorage(cat),
        imageUrl: res.data.imageUrl || null,
        source: res.data.source || "Database Lookup",
      };
    }
  } catch (apiErr) {
    console.warn("Backend barcode proxy notice, trying direct client lookup:", apiErr.message);
  }

  // 2. Direct Fallback: Open Food Facts
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`,
      { headers: { "User-Agent": "Expirova/1.0" } }
    );
    if (offRes.ok) {
      const data = await offRes.json();
      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.product_name_en || p.generic_name || p.brands || `Item ${cleanBarcode}`;
        const cat = mapCategoryName(Array.isArray(p.categories_tags) ? p.categories_tags[0] : p.categories, name);
        return {
          found: true,
          barcode: cleanBarcode,
          name,
          brand: p.brands || "",
          category: cat,
          storageSuggestion: getSuggestedStorage(cat),
          imageUrl: p.image_front_small_url || p.image_url || null,
          source: "Open Food Facts",
        };
      }
    }
  } catch {
    /* try next catalog */
  }

  // 3. Direct Fallback: Open Beauty Facts (Personal Care / Shampoo / Cosmetics)
  try {
    const obfRes = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`,
      { headers: { "User-Agent": "Expirova/1.0" } }
    );
    if (obfRes.ok) {
      const data = await obfRes.json();
      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.product_name_en || p.generic_name || p.brands || `Item ${cleanBarcode}`;
        const cat = mapCategoryName(Array.isArray(p.categories_tags) ? p.categories_tags[0] : p.categories, name);
        return {
          found: true,
          barcode: cleanBarcode,
          name,
          brand: p.brands || "",
          category: cat,
          storageSuggestion: getSuggestedStorage(cat),
          imageUrl: p.image_front_small_url || p.image_url || null,
          source: "Open Beauty Facts",
        };
      }
    }
  } catch {
    /* unregistered item */
  }

  // 4. Return clean not found (NO fake medicine data)
  return {
    found: false,
    barcode: cleanBarcode,
    name: "",
    category: "",
  };
}

/**
 * Maps raw product category tags to standardized user-facing categories
 */
export function mapCategoryName(rawCat, productName = "") {
  const text = `${rawCat || ""} ${productName || ""}`.toLowerCase();

  if (/\b(shampoo|conditioner|hair|scalp|oil)\b/i.test(text)) return "Hair Care";
  if (/\b(lotion|cream|moistur|skin|face|sunscreen|serum)\b/i.test(text)) return "Skin Care";
  if (/\b(soap|wash|bath|dental|tooth|deodorant|perfume|beauty|personal|cosmetic)\b/i.test(text)) return "Personal Care";
  if (/\b(juice|drink|cola|soda|tea|coffee|milk|water|beverage)\b/i.test(text)) return "Beverage";
  if (/\b(cleaner|detergent|dish|floor|bleach|surface|cleaning)\b/i.test(text)) return "Household";
  if (/\b(tablet|capsule|syrup|pharma|medicine|crocin|dolo|paracetamol|fever|cough|antibiotic)\b/i.test(text)) return "Medicine";
  if (/\b(food|grocery|biscuit|noodle|pasta|snack|cookie|butter|flour|oil|sauce|spice)\b/i.test(text)) return "Food & Grocery";

  return "Personal Care";
}

export function getSuggestedStorage(category) {
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
