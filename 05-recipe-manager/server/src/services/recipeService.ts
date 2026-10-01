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
export function parseRecipeInput(body: Record<string, unknown>): RecipeInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Recipe must be an object');
  function text(value: unknown, field: string, limit: number, required = false): string | undefined {
    if (value == null && !required) return undefined;
    if (typeof value !== 'string' || value.trim().length > limit || (required && !value.trim()))
      throw new ValidationError(`${field} must be ${required ? 'non-empty ' : ''}text, at most ${limit} characters`);
    return value.trim();
  }
  function positive(value: unknown, field: string): number | undefined {
    if (value == null || value === '') return undefined;
    if ((typeof value !== 'number' && typeof value !== 'string') || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647)
      throw new ValidationError(`${field} must be a positive integer`);
    return Number(value);
  }
  function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Ingredients and steps must be objects');
    return value as Record<string, unknown>;
  }
  if (!Array.isArray(body.ingredients) || body.ingredients.length < 1 || body.ingredients.length > 100)
    throw new ValidationError('Provide 1 to 100 ingredients');
  if (!Array.isArray(body.steps) || body.steps.length < 1 || body.steps.length > 200)
    throw new ValidationError('Provide 1 to 200 steps');
  const difficulty = body.difficulty ?? 'medium';
  if (typeof difficulty !== 'string' || !['easy','medium','hard'].includes(difficulty)) throw new ValidationError('Difficulty must be easy, medium or hard');
  if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') throw new ValidationError('isPublic must be a boolean');
  if (body.categoryIds !== undefined && !Array.isArray(body.categoryIds)) throw new ValidationError('categoryIds must be an array');
  const categoryIds = [...new Set((body.categoryIds as unknown[] ?? []).map((id) => {
    const value = positive(id, 'Category id');
    if (!value) throw new ValidationError('Category ids must be positive integers');
    return value;
  }))];
  return {
    title: text(body.title, 'Title', 255, true)!,
    description: text(body.description, 'Description', 100000),
    imageUrl: text(body.imageUrl, 'Image URL', 500),
    prepTimeMinutes: positive(body.prepTimeMinutes, 'Prep time'),
    cookTimeMinutes: positive(body.cookTimeMinutes, 'Cook time'),
    servings: positive(body.servings, 'Servings'),
    difficulty: difficulty as RecipeInput['difficulty'], isPublic: body.isPublic === true, // omitted means private: the safe default in an ownership course
    ingredients: body.ingredients.map((value) => {
      const item = object(value);
      return { name: text(item.name,'Ingredient name',200,true)!, quantity: text(item.quantity,'Quantity',50), unit: text(item.unit,'Unit',30) };
    }),
    steps: body.steps.map((value) => {
      const item = object(value);
      return { instruction: text(item.instruction,'Step instruction',100000,true)!, imageUrl: text(item.imageUrl,'Step image URL',500) };
    }), categoryIds,
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
  await db.transaction(async (trx) => {
    // Lock and authorize inside the same transaction as the nested replacement.
    const owner = await trx('recipes').where({ id: recipeId }).forUpdate().first();
    if (!owner) throw new NotFoundError('Recipe not found');
    if (owner.user_id !== userId) throw new ForbiddenError('Only the owner can edit this recipe');
    const input = parseRecipeInput(body);
    await saveRecipeGraph(trx, userId, input, recipeId);
  });
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
