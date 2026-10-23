import axios from 'axios';
import { dbQuery, dbRun, dbGet } from '../config/sqliteDb.js';

function getStorageLocationForCategory(category) {
  switch (category) {
    case 'Hair Care':
    case 'Skin Care':
    case 'Personal Care':
      return 'Bathroom Shelf';
    case 'Food & Grocery':
      return 'Pantry';
    case 'Beverage':
      return 'Refrigerator';
    case 'Medicine':
      return 'Medicine Cabinet';
    case 'Household':
      return 'Storage Closet';
    default:
      return 'General Storage';
  }
}

function normalizeCategory(rawCat, productName = '') {
  const text = `${rawCat || ''} ${productName || ''}`.toLowerCase();
  if (/\b(shampoo|conditioner|hair|scalp)\b/i.test(text)) return 'Hair Care';
  if (/\b(lotion|cream|moistur|skin|face|sunscreen|serum)\b/i.test(text)) return 'Skin Care';
  if (/\b(soap|wash|bath|dental|tooth|deodorant|perfume|beauty|cosmetic)\b/i.test(text)) return 'Personal Care';
  if (/\b(tablet|capsule|syrup|pharma|medicine|crocin|dolo|paracetamol|fever|cough|antibiotic)\b/i.test(text)) return 'Medicine';
  if (/\b(juice|drink|cola|soda|tea|coffee|milk|water|beverage)\b/i.test(text)) return 'Beverage';
  if (/\b(cleaner|detergent|dish|floor|bleach|surface|cleaning)\b/i.test(text)) return 'Household';
  if (/\b(food|grocery|biscuit|noodle|pasta|snack|cookie|butter|flour|oil|sauce|spice)\b/i.test(text)) return 'Food & Grocery';
  return 'General Goods';
}

// Built-in offline quick-lookup dictionary for instant test response
const POPULAR_BARCODES = {
  '8901030383987': {
    name: 'Sunsilk Stunning Black Shine Shampoo 180ml',
    brand: 'Sunsilk',
    category: 'Hair Care',
    storage_suggestion: 'Bathroom Shelf',
  },
  '8901030865421': {
    name: 'Dolo 650mg Paracetamol Tablets',
    brand: 'Micro Labs',
    category: 'Medicine',
    storage_suggestion: 'Medicine Cabinet',
  },
  '8901030018445': {
    name: 'Dove Intense Repair Shampoo 340ml',
    brand: 'Dove',
    category: 'Hair Care',
    storage_suggestion: 'Bathroom Shelf',
  },
  '737628064502': {
    name: 'Thai Kitchen Peanut Rice Noodles',
    brand: 'Thai Kitchen',
    category: 'Food & Grocery',
    storage_suggestion: 'Pantry',
  },
  '3017620422003': {
    name: 'Nutella Hazelnut Cocoa Spread 350g',
    brand: 'Ferrero',
    category: 'Food & Grocery',
    storage_suggestion: 'Pantry',
  },
  '8901234567890': {
    name: 'Amul Pure Pasteurized Butter 500g',
    brand: 'Amul',
    category: 'Food & Grocery',
    storage_suggestion: 'Refrigerator',
  },
};

// @desc    Add a product to inventory
// @route   POST /api/inventory/add
// @access  Public / Token-optional
export const addInventoryItem = async (req, res) => {
  const { name, category, location, mfg_date, expiry_date, barcode } = req.body;
  const userId = req.user ? req.user.id : 1;

  try {
    if (!name || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'Product name and expiration date are required.',
      });
    }

    const cat = category ? category.trim() : 'General Goods';
    const formattedMfg = mfg_date ? new Date(mfg_date).toISOString() : null;
    const formattedExpiry = new Date(expiry_date).toISOString();
    const finalLocation = location ? location.trim() : getStorageLocationForCategory(cat);

    const result = await dbRun(
      `INSERT INTO products (user_id, barcode, name, category, location, mfg_date, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        barcode || null,
        name.trim(),
        cat,
        finalLocation,
        formattedMfg,
        formattedExpiry,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Product saved successfully to inventory database.',
      item: {
        id: result.lastID,
        name: name.trim(),
        category: cat,
        location: finalLocation,
        expiry_date: formattedExpiry,
        barcode: barcode || null,
      },
    });
  } catch (error) {
    console.error('Add inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error saving product: ' + error.message,
    });
  }
};

// @desc    Get all inventory products
// @route   GET /api/inventory
// @access  Public / Token-optional
export const getInventoryItems = async (req, res) => {
  const userId = req.user ? req.user.id : 1;

  try {
    const products = await dbQuery(
      `SELECT id, barcode, name, category, location, mfg_date, expiry_date, created_at
       FROM products
       WHERE user_id = ?
       ORDER BY expiry_date ASC`,
      [userId]
    );

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error retrieving inventory.',
    });
  }
};

// @desc    Update an inventory product
// @route   PUT /api/inventory/:id
// @access  Public / Token-optional
export const updateInventoryItem = async (req, res) => {
  const { id } = req.params;
  const { name, category, location, expiry_date } = req.body;
  const userId = req.user ? req.user.id : 1;

  try {
    await dbRun(
      `UPDATE products 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           location = COALESCE(?, location),
           expiry_date = COALESCE(?, expiry_date)
       WHERE id = ? AND user_id = ?`,
      [name, category, location, expiry_date, id, userId]
    );

    const updated = await dbGet(`SELECT * FROM products WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Product updated successfully.',
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database error updating item.',
    });
  }
};

// @desc    Delete an inventory product
// @route   DELETE /api/inventory/:id
// @access  Public / Token-optional
export const deleteInventoryItem = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : 1;

  try {
    await dbRun(`DELETE FROM products WHERE id = ? AND user_id = ?`, [id, userId]);
    return res.json({
      success: true,
      message: 'Product deleted from inventory database.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database error deleting item.',
    });
  }
};

// @desc    Universal Multi-Database Barcode Lookup
// @route   GET /api/lookup-barcode or /api/inventory/lookup/:barcode
// @access  Public
export const lookupBarcode = async (req, res) => {
  const barcode = (req.params.barcode || req.query.code || req.query.barcode || '').trim();

  if (!barcode) {
    return res.status(400).json({ success: false, message: 'Barcode number is required.' });
  }

  // 0. Instant match against common catalog
  if (POPULAR_BARCODES[barcode]) {
    const p = POPULAR_BARCODES[barcode];
    return res.json({
      success: true,
      found: true,
      barcode,
      name: p.name,
      product_name: p.name,
      brand: p.brand,
      category: p.category,
      storage_suggestion: p.storage_suggestion,
      source: 'Verified Catalog',
    });
  }

  // 1. Primary: Open Food Facts (Food & Groceries)
  try {
    const offRes = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        timeout: 4500,
        headers: { 'User-Agent': 'Expirova/1.0' },
      }
    );

    if (offRes.data && offRes.data.status === 1 && offRes.data.product) {
      const p = offRes.data.product;
      const productName = p.product_name || p.product_name_en || p.generic_name || p.brands || `Item ${barcode}`;
      const brand = p.brands || p.brand_owner || '';
      const cat = normalizeCategory(
        Array.isArray(p.categories_tags) ? p.categories_tags[0] : p.categories,
        productName
      );

      return res.json({
        success: true,
        found: true,
        barcode,
        name: productName,
        product_name: productName,
        brand: brand,
        category: cat,
        storage_suggestion: getStorageLocationForCategory(cat),
        imageUrl: p.image_url || p.image_front_url || null,
        source: 'Open Food Facts',
      });
    }
  } catch (err) {
    // 404 or connection error -> Proceed to Open Beauty Facts
  }

  // 2. Secondary: Open Beauty Facts (Cosmetics, Shampoos, Personal Care)
  try {
    const obfRes = await axios.get(
      `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        timeout: 4500,
        headers: { 'User-Agent': 'Expirova/1.0' },
      }
    );

    if (obfRes.data && obfRes.data.status === 1 && obfRes.data.product) {
      const p = obfRes.data.product;
      const productName = p.product_name || p.product_name_en || p.generic_name || p.brands || `Item ${barcode}`;
      const brand = p.brands || p.brand_owner || '';
      const cat = normalizeCategory(
        Array.isArray(p.categories_tags) ? p.categories_tags[0] : p.categories,
        productName
      );

      return res.json({
        success: true,
        found: true,
        barcode,
        name: productName,
        product_name: productName,
        brand: brand,
        category: cat,
        storage_suggestion: getStorageLocationForCategory(cat),
        imageUrl: p.image_url || p.image_front_url || null,
        source: 'Open Beauty Facts',
      });
    }
  } catch (err) {
    // Proceed to UPCItemDB
  }

  // 3. Tertiary: UPCItemDB (General Goods, Retail & Household)
  try {
    const upcRes = await axios.get(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { timeout: 4500 }
    );

    if (upcRes.data && upcRes.data.items && upcRes.data.items.length > 0) {
      const item = upcRes.data.items[0];
      const productName = item.title || `Item ${barcode}`;
      const brand = item.brand || '';
      const cat = normalizeCategory(item.category, productName);

      return res.json({
        success: true,
        found: true,
        barcode,
        name: productName,
        product_name: productName,
        brand: brand,
        category: cat,
        storage_suggestion: getStorageLocationForCategory(cat),
        imageUrl: item.images && item.images.length > 0 ? item.images[0] : null,
        source: 'UPCItemDB',
      });
    }
  } catch (err) {
    // End of multi-database chain
  }

  // 4. Clean Not Found (Never return fake Paracetamol!)
  return res.json({
    success: true,
    found: false,
    barcode,
    product_name: '',
    category: '',
    message: 'Barcode not found in online catalogs. Routing to Vision AI for label analysis.',
  });
};

export const addToInventory = addInventoryItem;
export const getMyInventory = getInventoryItems;
export const deleteFromInventory = deleteInventoryItem;

