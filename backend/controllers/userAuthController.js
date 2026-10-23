import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../config/sqliteDb.js';
import { getJwtSecret } from '../config/jwtConfig.js';

const generateToken = (id, email) => {
  return jwt.sign({ id, email }, getJwtSecret(), { expiresIn: '30d' });
};

// @desc    Register a new user in SQLite
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, fullName, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const displayName = fullName || name || trimmedEmail.split('@')[0];

    // Check if user already exists
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user into SQLite
    const result = await dbRun(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [trimmedEmail, password_hash, displayName]
    );

    const token = generateToken(result.lastID, trimmedEmail);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: {
        id: result.lastID,
        email: trimmedEmail,
        name: displayName,
      },
      token,
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: err.message,
    });
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Lookup user
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please check your credentials or click Sign Up.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user.id, user.email);

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
      },
      token,
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: err.message,
    });
  }
};

// @desc    One-click Google / Gmail Auth
// @route   POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const displayName = name || trimmedEmail.split('@')[0];

    let user = await dbGet('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
    if (!user) {
      const placeholderHash = await bcrypt.hash(googleId || `gmail_${Date.now()}`, 10);
      const result = await dbRun(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        [trimmedEmail, placeholderHash, displayName]
      );
      user = { id: result.lastID, email: trimmedEmail, name: displayName };
    }

    const token = generateToken(user.id, user.email);
    return res.json({
      success: true,
      message: 'Authenticated successfully with Google.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || displayName,
      },
      token,
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication error.', error: err.message });
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, role, avatar_url, expiry_alerts, email_notifications, reminder_timing } = req.body;

    const existing = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedPhone = phone !== undefined ? phone.trim() : (existing.phone || '');
    const updatedRole = role !== undefined ? role.trim() : (existing.role || 'Personal Account');
    const updatedAvatar = avatar_url !== undefined ? avatar_url : (existing.avatar_url || '');
    const updatedExpiryAlerts = expiry_alerts !== undefined ? (expiry_alerts ? 1 : 0) : (existing.expiry_alerts ?? 1);
    const updatedEmailNotifs = email_notifications !== undefined ? (email_notifications ? 1 : 0) : (existing.email_notifications ?? 1);
    const updatedReminderTiming = reminder_timing !== undefined ? reminder_timing : (existing.reminder_timing || '14, 7, 3, 1 day');

    await dbRun(
      `UPDATE users SET 
        name = ?, 
        phone = ?, 
        role = ?, 
        avatar_url = ?, 
        expiry_alerts = ?, 
        email_notifications = ?, 
        reminder_timing = ? 
       WHERE id = ?`,
      [
        updatedName,
        updatedPhone,
        updatedRole,
        updatedAvatar,
        updatedExpiryAlerts,
        updatedEmailNotifs,
        updatedReminderTiming,
        userId,
      ]
    );

    const updatedUser = await dbGet(
      'SELECT id, email, name, phone, role, avatar_url, expiry_alerts, email_notifications, reminder_timing, created_at FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: err.message,
    });
  }
};
