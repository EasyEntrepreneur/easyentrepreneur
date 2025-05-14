import express from 'express';
import { getUserInfo } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authenticateToken';

const userRoutes = express.Router();

// ✅ Route protégée : nécessite un token JWT valide
userRoutes.get('/me', authenticateToken, getUserInfo);

export default userRoutes;
