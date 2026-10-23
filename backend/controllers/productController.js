import fs from "fs";
import path from "path";
import Product from "../models/Product.js";
import { extractMedicineData } from "../services/geminiService.js";


// @desc    Add a new product or scanned medicine
// @route   POST /api/products
// @access  Private
export const addProduct = async (req, res, next) => {
  const { productName, category, barcode, expiryDate, daysBeforeNotification } = req.body;

  try {
    const product = await Product.create({
      userId: req.user._id, // Injected automatically by authMiddleware
      productName,
      category,
      barcode,
      expiryDate,
      daysBeforeNotification,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active products/medicines for logged-in user
// @route   GET /api/products
// @access  Private
export const getProducts = async (
  req,
  res,
  next
) => {
  try {
    const products =
      await Product.find()
        .sort({ expiryDate: 1 });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product status (e.g., mark as "Consumed", "Wasted", "Active")
// @route   PUT /api/products/:id
// @access  Private
export const updateProductStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Verify ownership
    if (product.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized to update this item');
    }

    product.status = status || product.status;
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product from tracking entirely
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Verify ownership
    if (product.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized to delete this item');
    }

    await product.deleteOne();
    res.json({ message: 'Product removed from tracking' });
  } catch (error) {
    next(error);
  }
};
export const scanMedicine = async (req, res, next) => {
  let tempFilePath = null;
  let isTempCreated = false;

  try {
    if (req.file) {
      tempFilePath = req.file.path;
    } else if (req.body && (req.body.imageBase64 || req.body.image)) {
      const base64Str = req.body.imageBase64 || req.body.image;
      const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      tempFilePath = path.join(uploadsDir, `scan_${Date.now()}.png`);
      fs.writeFileSync(tempFilePath, buffer);
      isTempCreated = true;
    }

    if (!tempFilePath || !fs.existsSync(tempFilePath)) {
      return res.status(400).json({
        success: false,
        detected: false,
        message: "No image file or imageBase64 payload received.",
      });
    }

    const data = await extractMedicineData(tempFilePath);

    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {}

    if (!data || data.detected === false) {
      return res.status(200).json({
        success: false,
        detected: false,
        message: data?.message || "No recognizable product or packaging text found in this photo. Please ensure good lighting and clear view of label.",
      });
    }

    return res.status(200).json({
      success: true,
      detected: true,
      product_name: data.product_name,
      productName: data.product_name,
      brand: data.brand || "",
      category: data.category || "Personal Care",
      barcode: data.barcode || null,
      expiry_date: data.expiry_date || null,
      expiryDate: data.expiry_date || null,
      storage_suggestion: data.storage_suggestion || "Bathroom Shelf",
      confidence: data.confidence || 0.95,
      confidence_score: data.confidence || 0.95,
      engine: data.engine || "Multimodal Vision AI",
    });
  } catch (error) {
    console.error("Product scan processing error:", error);
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {}
    return res.status(500).json({
      success: false,
      detected: false,
      message: "Error processing image: " + error.message,
    });
  }
};
