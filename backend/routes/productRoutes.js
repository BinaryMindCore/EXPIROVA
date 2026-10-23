import express from "express";
import multer from "multer";

import { protect } from "../middleware/authMiddleware.js";

import {
  addProduct,
  getProducts,
  updateProductStatus,
  deleteProduct,
  scanMedicine,
} from "../controllers/productController.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});


  router.route("/")
  .post(addProduct)
  .get(getProducts);

router.post(
  "/scan",
  upload.single("image"),
  scanMedicine
);

router
  .route("/:id")
  .put(protect, updateProductStatus)
  .delete(protect, deleteProduct);

export default router;