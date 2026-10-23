import jwt from 'jsonwebtoken';
import { dbGet } from '../config/sqliteDb.js';
import { getJwtSecret } from '../config/jwtConfig.js';

export const requireSqliteAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No authentication token provided. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await dbGet('SELECT id, email, name, phone, role, avatar_url, expiry_alerts, email_notifications, reminder_timing, created_at FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User account no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token is invalid or has expired.',
      error: err.message,
    });
  }
};
