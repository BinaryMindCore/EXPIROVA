import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  process.env.DB_PATH,
  path.resolve(__dirname, '../expirova.db'),
  path.resolve(__dirname, '../../expirova.db'),
  path.resolve(process.cwd(), 'expirova.db'),
  path.resolve(process.cwd(), 'backend/expirova.db'),
].filter(Boolean);

const dbPath = candidatePaths.find((p) => fs.existsSync(p)) || path.resolve(__dirname, '../expirova.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`📦 SQLite Database connected: ${dbPath}`);
  }
});

// Initialize Schema
export const initSqliteDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Users Table
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) console.error('Error creating users table:', err.message);
        }
      );

      // 2. Products Table
      db.run(
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          barcode TEXT,
          name TEXT NOT NULL,
          category TEXT,
          location TEXT DEFAULT 'General Storage',
          mfg_date DATETIME,
          expiry_date DATETIME NOT NULL,
          day_prior_alert_sent INTEGER DEFAULT 0,
          last_3hr_alert DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        (err) => {
          if (err) {
            console.error('Error creating products table:', err.message);
            return reject(err);
          }
          // Migration: Add location column if missing
          db.run(`ALTER TABLE products ADD COLUMN location TEXT DEFAULT 'General Storage'`, () => {});
          // Migrations for users table (name, phone, role, avatar_url, preferences)
          db.run(`ALTER TABLE users ADD COLUMN name TEXT`, () => {});
          db.run(`ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''`, () => {});
          db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Personal Account'`, () => {});
          db.run(`ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''`, () => {});
          db.run(`ALTER TABLE users ADD COLUMN expiry_alerts INTEGER DEFAULT 1`, () => {});
          db.run(`ALTER TABLE users ADD COLUMN email_notifications INTEGER DEFAULT 1`, () => {});
          db.run(`ALTER TABLE users ADD COLUMN reminder_timing TEXT DEFAULT '14, 7, 3, 1 day'`, () => {});
          console.log('✅ SQLite Schema initialized (users with profile & preferences, products with location).');
          resolve();
        }
      );
    });
  });
};

// Promisified Helpers for SQLite
export const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export default db;
