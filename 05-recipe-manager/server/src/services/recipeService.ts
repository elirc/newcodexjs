import { db } from '../config/db.js';
import {
  deleteRecipe,
  findRecipeDetail,
  findRecipeOwner,
  listCategories,
  listFavoriteRecipes,
  listPublicRecipes,
  listRecipesByOwner,
  saveRecipeGraph,
  toggleFavorite
} from '../models/recipeModel.js';
import type { RecipeInput } from '../types/domain.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';

/** Normalizes a nested recipe payload into the shape expected by the model layer. */
function parseRecipeInput(body: Record<string, unknown>): RecipeInput {
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
  const steps = Array.isArray(body.steps) ? body.steps : [];
  if (!body.title || typeof body.title !== 'string') throw new ValidationError('Title is required');
  if (!ingredients.length) throw new ValidationError('At least one ingredient is required');
  if (!steps.length) throw new ValidationError('At least one step is required');
  return {
    title: body.title,
    description: typeof body.description === 'string' ? body.description : undefined,
    imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
    prepTimeMinutes: body.prepTimeMinutes ? Number(body.prepTimeMinutes) : undefined,
    cookTimeMinutes: body.cookTimeMinutes ? Number(body.cookTimeMinutes) : undefined,
    servings: body.servings ? Number(body.servings) : undefined,
    difficulty: (body.difficulty as RecipeInput['difficulty']) ?? 'medium',
    isPublic: body.isPublic !== false,
    ingredients: ingredients.map((item) => item as RecipeInput['ingredients'][number]).filter((item) => item.name),
    steps: steps.map((item) => item as RecipeInput['steps'][number]).filter((item) => item.instruction),
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(Number).filter(Boolean) : []
  };
}

/** Returns public recipes with optional favorite state for signed-in users. */
export async function browseRecipes(filters: { search?: string; category?: string; userId?: number }) {
  return listPublicRecipes(filters);
}

/** Returns a recipe detail after applying private/owner visibility rules. */
export async function getRecipe(id: number, userId?: number) {
  const recipe = await findRecipeDetail(id, userId);
  if (!recipe) throw new NotFoundError('Recipe not found');
  if (!recipe.is_public && recipe.user_id !== userId) throw new ForbiddenError('This recipe is private');
  return recipe;
}

/** Creates a recipe owned by the authenticated user. */
export async function createRecipeForUser(userId: number, body: Record<string, unknown>) {
  const input = parseRecipeInput(body);
  const recipeId = await db.transaction((trx) => saveRecipeGraph(trx, userId, input));
  return getRecipe(recipeId, userId);
}

/** Updates a recipe after confirming the authenticated user owns it. */
export async function updateRecipeForUser(userId: number, recipeId: number, body: Record<string, unknown>) {
  const owner = await findRecipeOwner(recipeId);
  if (!owner) throw new NotFoundError('Recipe not found');
  if (owner.user_id !== userId) throw new ForbiddenError('Only the owner can edit this recipe');
  const input = parseRecipeInput(body);
  await db.transaction((trx) => saveRecipeGraph(trx, userId, input, recipeId));
  return getRecipe(recipeId, userId);
}

/** Deletes a recipe after confirming ownership. */
export async function deleteRecipeForUser(userId: number, recipeId: number) {
  const owner = await findRecipeOwner(recipeId);
  if (!owner) throw new NotFoundError('Recipe not found');
  if (owner.user_id !== userId) throw new ForbiddenError('Only the owner can delete this recipe');
  await deleteRecipe(recipeId);
}

/** Returns recipes owned by the current user. */
export async function getMyRecipes(userId: number) {
  return listRecipesByOwner(userId);
}

/** Returns recipes favorited by the current user. */
export async function getFavoriteRecipes(userId: number) {
  return listFavoriteRecipes(userId);
}

/** Toggles favorite state for a public recipe. */
export async function toggleRecipeFavorite(userId: number, recipeId: number) {
  const owner = await findRecipeOwner(recipeId);
  if (!owner) throw new NotFoundError('Recipe not found');
  if (!owner.is_public && owner.user_id !== userId) throw new ForbiddenError('Cannot favorite a private recipe');
  return { isFavorite: await toggleFavorite(userId, recipeId) };
}

/** Returns all category records. */
export async function getCategories() {
  return listCategories();
}
