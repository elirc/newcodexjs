import { Router } from 'express';
import * as controller from '../controllers/recipeController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

export const recipeRoutes = Router();

recipeRoutes.get('/categories', asyncHandler(controller.categories));
recipeRoutes.get('/recipes', optionalAuth, asyncHandler(controller.index));
recipeRoutes.get('/recipes/mine', requireAuth, asyncHandler(controller.mine));
recipeRoutes.get('/recipes/favorites', requireAuth, asyncHandler(controller.favorites));
recipeRoutes.get('/recipes/:id', optionalAuth, asyncHandler(controller.show));
recipeRoutes.post('/recipes', requireAuth, asyncHandler(controller.create));
recipeRoutes.put('/recipes/:id', requireAuth, asyncHandler(controller.update));
recipeRoutes.delete('/recipes/:id', requireAuth, asyncHandler(controller.destroy));
recipeRoutes.post('/recipes/:id/favorite', requireAuth, asyncHandler(controller.favorite));
