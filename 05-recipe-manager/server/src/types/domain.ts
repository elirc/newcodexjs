export type User = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type RecipeInput = {
  title: string;
  description?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isPublic: boolean;
  ingredients: Array<{ quantity?: string; unit?: string; name: string }>;
  steps: Array<{ instruction: string; imageUrl?: string }>;
  categoryIds: number[];
};
