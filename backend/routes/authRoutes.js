import express from 'express';
import { register, login, googleAuth, getMe, updateProfile } from '../controllers/userAuthController.js';
import { requireSqliteAuth } from '../middleware/sqliteAuthMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', requireSqliteAuth, getMe);
router.put('/profile', requireSqliteAuth, updateProfile);

export default router;