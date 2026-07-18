import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(controller.register));
authRoutes.post('/login', asyncHandler(controller.login));
authRoutes.post('/logout', asyncHandler(controller.logout));
authRoutes.post('/refresh', asyncHandler(controller.refresh));
authRoutes.get('/me', requireAuth, asyncHandler(controller.me));
