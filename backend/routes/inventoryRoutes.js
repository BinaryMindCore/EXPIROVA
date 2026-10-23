import express from 'express';
import { requireSqliteAuth } from '../middleware/sqliteAuthMiddleware.js';
import {
  addToInventory,
  getMyInventory,
  deleteFromInventory,
  lookupBarcode,
} from '../controllers/inventoryController.js';

const router = express.Router();

// Barcode Lookup from Open Food Facts API (Proxy)
router.get('/lookup/:barcode', lookupBarcode);
router.get('/lookup-barcode', lookupBarcode);

// Protected Inventory Routes
router.post('/add', requireSqliteAuth, addToInventory);
router.get('/', requireSqliteAuth, getMyInventory);
router.delete('/:id', requireSqliteAuth, deleteFromInventory);

export default router;
