import type { Request, Response } from 'express';
import * as recipeService from '../services/recipeService.js';
import { sendSuccess } from '../utils/response.js';

/** Lists public recipes with optional search and category filters. */
export async function index(req: Request, res: Response): Promise<void> {
  const recipes = await recipeService.browseRecipes({
    search: req.query.search as string | undefined,
    category: req.query.category as string | undefined,
    userId: req.user?.id
  });
  sendSuccess(res, { recipes });
}

/** Returns one recipe detail by numeric id. */
export async function show(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { recipe: await recipeService.getRecipe(Number(req.params.id), req.user?.id) });
}

/** Creates a nested recipe graph for the current user. */
export async function create(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { recipe: await recipeService.createRecipeForUser(req.user!.id, req.body) }, 201);
}

/** Updates a nested recipe graph for its owner. */
export async function update(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { recipe: await recipeService.updateRecipeForUser(req.user!.id, Number(req.params.id), req.body) });
}

/** Deletes a recipe owned by the current user. */
export async function destroy(req: Request, res: Response): Promise<void> {
  await recipeService.deleteRecipeForUser(req.user!.id, Number(req.params.id));
  sendSuccess(res, { deleted: true });
}

/** Lists recipes owned by the current user. */
export async function mine(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { recipes: await recipeService.getMyRecipes(req.user!.id) });
}

/** Lists recipes favorited by the current user. */
export async function favorites(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { recipes: await recipeService.getFavoriteRecipes(req.user!.id) });
}

/** Toggles favorite state for one recipe. */
export async function favorite(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await recipeService.toggleRecipeFavorite(req.user!.id, Number(req.params.id)));
}

/** Lists all recipe categories. */
export async function categories(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { categories: await recipeService.getCategories() });
}
