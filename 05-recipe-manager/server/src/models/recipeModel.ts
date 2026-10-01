import type { Knex } from 'knex';
import { db } from '../config/db.js';
import type { RecipeInput } from '../types/domain.js';

/** Lists categories for filters and recipe forms. */
export async function listCategories() {
  return db('categories').orderBy('name');
}

/** Lists public recipes with optional search, category, and favorite state. */
export async function listPublicRecipes(filters: { search?: string; category?: string; userId?: number }) {
  const query = db('recipes as r')
    .join('users as u', 'u.id', 'r.user_id')
    .leftJoin('recipe_categories as rc', 'rc.recipe_id', 'r.id')
    .leftJoin('categories as c', 'c.id', 'rc.category_id')
    .where('r.is_public', true)
    .groupBy('r.id', 'u.username', 'u.display_name')
    .select(
      'r.*',
      'u.username as author_username',
      'u.display_name as author_name',
      db.raw("COALESCE(json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL), '[]') as categories")
    )
    .orderBy('r.created_at', 'desc');

  if (filters.search) query.andWhereILike('r.title', `%${filters.search}%`);
  if (filters.category) query.andWhere('c.slug', filters.category);
  if (filters.userId) {
    query.select(db.raw('EXISTS (SELECT 1 FROM favorites f WHERE f.recipe_id = r.id AND f.user_id = ?) as is_favorite', [filters.userId]));
  } else {
    query.select(db.raw('false as is_favorite'));
  }
  return query;
}

/** Finds a recipe with nested ingredients, steps, categories, and visibility metadata. */
export async function findRecipeDetail(id: number, userId?: number) {
  const recipe = await db('recipes as r')
    .join('users as u', 'u.id', 'r.user_id')
    .select('r.*', 'u.username as author_username', 'u.display_name as author_name')
    .where('r.id', id)
    .first();
  if (!recipe) return undefined;
  const [ingredients, steps, categories, favorite] = await Promise.all([
    db('ingredients').where({ recipe_id: id }).orderBy('sort_order'),
    db('steps').where({ recipe_id: id }).orderBy('step_number'),
    db('categories as c').join('recipe_categories as rc', 'rc.category_id', 'c.id').where('rc.recipe_id', id).select('c.*').orderBy('c.name'),
    userId ? db('favorites').where({ recipe_id: id, user_id: userId }).first() : undefined
  ]);
  return { ...recipe, ingredients, steps, categories, is_favorite: Boolean(favorite) };
}

/** Lists recipes owned by a user for their dashboard. */
export async function listRecipesByOwner(userId: number) {
  return db('recipes').where({ user_id: userId }).orderBy('created_at', 'desc');
}

/** Lists recipes a user has favorited. */
export async function listFavoriteRecipes(userId: number) {
  return db('recipes as r')
    .join('favorites as f', 'f.recipe_id', 'r.id')
    .where('f.user_id', userId)
    .andWhere('r.is_public', true)
    .select('r.*', db.raw('true as is_favorite'))
    .orderBy('f.created_at', 'desc');
}

/** Inserts or replaces a recipe graph in a transaction for atomic nested writes. */
export async function saveRecipeGraph(
  trx: Knex.Transaction,
  userId: number,
  input: RecipeInput,
  recipeId?: number
): Promise<number> {
  const row = {
    user_id: userId,
    title: input.title.trim(),
    description: input.description ?? null,
    image_url: input.imageUrl ?? null,
    prep_time_minutes: input.prepTimeMinutes ?? null,
    cook_time_minutes: input.cookTimeMinutes ?? null,
    servings: input.servings ?? null,
    difficulty: input.difficulty,
    is_public: input.isPublic,
    updated_at: trx.fn.now()
  };
  const id = recipeId
    ? Number((await trx('recipes').where({ id: recipeId, user_id: userId }).update(row).returning('id'))[0].id)
    : Number((await trx('recipes').insert(row).returning('id'))[0].id);

  await trx('ingredients').where({ recipe_id: id }).delete();
  await trx('steps').where({ recipe_id: id }).delete();
  await trx('recipe_categories').where({ recipe_id: id }).delete();

  if (input.ingredients.length) {
    await trx('ingredients').insert(
      input.ingredients.map((ingredient, index) => ({
        recipe_id: id,
        quantity: ingredient.quantity ?? null,
        unit: ingredient.unit ?? null,
        name: ingredient.name.trim(),
        sort_order: index + 1
      }))
    );
  }
  if (input.steps.length) {
    await trx('steps').insert(
      input.steps.map((step, index) => ({
        recipe_id: id,
        step_number: index + 1,
        instruction: step.instruction.trim(),
        image_url: step.imageUrl ?? null
      }))
    );
  }
  if (input.categoryIds.length) {
    await trx('recipe_categories').insert(input.categoryIds.map((categoryId) => ({ recipe_id: id, category_id: categoryId })));
  }
  return id;
}

/** Finds a recipe owner id for authorization checks. */
export async function findRecipeOwner(recipeId: number): Promise<{ user_id: number; is_public: boolean } | undefined> {
  return db('recipes').select('user_id', 'is_public').where({ id: recipeId }).first();
}

/** Deletes a recipe and lets database cascades clean dependent rows. */
export async function deleteRecipe(recipeId: number): Promise<void> {
  await db('recipes').where({ id: recipeId }).delete();
}

/** Toggles a favorite relation and returns the new favorited state. */
export async function toggleFavorite(userId: number, recipeId: number): Promise<boolean> {
  const existing = await db('favorites').where({ user_id: userId, recipe_id: recipeId }).first();
  if (existing) {
    await db('favorites').where({ user_id: userId, recipe_id: recipeId }).delete();
    return false;
  }
  await db('favorites').insert({ user_id: userId, recipe_id: recipeId });
  return true;
}
