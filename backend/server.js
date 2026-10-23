import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { initSqliteDatabase } from './config/sqliteDb.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import { lookupBarcode } from './controllers/inventoryController.js';
import initCronJobs from './services/cronService.js';
import initExpirationDaemon from './services/expirationDaemon.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize Databases
connectDB(); // MongoDB (existing legacy/OCR fallback if configured)
initSqliteDatabase(); // Relational SQLite Database (Users & Products Schema)

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets (e.g. standalone scanner.html)
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Expirova API & Scanner</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; background: #f8fafc;">
        <h2>Expirova Smart Inventory Backend Running</h2>
        <p>API Status: <strong>Online</strong></p>
        <p><a href="/scanner.html" style="display:inline-block; padding: 10px 20px; background: #0d5f94; color: white; border-radius: 8px; text-decoration: none;">Launch Smart Barcode Scanner App &rarr;</a></p>
      </body>
    </html>
  `);
});

// API Routes
app.get('/api/lookup-barcode', lookupBarcode);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Expirova backend is live at http://localhost:${PORT}`);
  console.log(`📱 Smart Barcode Scanner HTML UI: http://localhost:${PORT}/scanner.html`);

  // Start Cron Jobs & Continuous Expiration Daemon
  initCronJobs();
  initExpirationDaemon();
});
