import { api } from './api';
import type { Category, Recipe } from '../types/recipe';

/** Fetches public recipes using optional query filters. */
export async function fetchRecipes(params: { search?: string; category?: string }) {
  const { data } = await api.get('/recipes', { params });
  return data.data.recipes as Recipe[];
}

/** Fetches one recipe detail by id. */
export async function fetchRecipe(id: string) {
  const { data } = await api.get(`/recipes/${id}`);
  return data.data.recipe as Recipe;
}

/** Fetches recipes owned by the signed-in user. */
export async function fetchMine() {
  const { data } = await api.get('/recipes/mine');
  return data.data.recipes as Recipe[];
}

/** Fetches recipes favorited by the signed-in user. */
export async function fetchFavorites() {
  const { data } = await api.get('/recipes/favorites');
  return data.data.recipes as Recipe[];
}

/** Fetches category options for filters and forms. */
export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data.data.categories as Category[];
}

/** Persists a new recipe with nested ingredients and steps. */
export async function createRecipe(payload: unknown) {
  const { data } = await api.post('/recipes', payload);
  return data.data.recipe as Recipe;
}

/** Toggles a recipe favorite for the current user. */
export async function toggleFavorite(id: number) {
  const { data } = await api.post(`/recipes/${id}/favorite`);
  return data.data as { isFavorite: boolean };
}
